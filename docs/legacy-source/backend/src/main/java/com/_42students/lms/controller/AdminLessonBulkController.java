package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.LessonDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Lesson;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Courses / Lessons: any bulk operation — no row selection on either screen" in the college-admin
 * audit. The Courses half shipped as AdminCourseBulkController; this is the Lessons half, and
 * deliberately mirrors it exactly rather than inventing a second shape for the same idea.
 *
 * <p>Status only — no bulk delete. Deleting a lesson also permanently destroys its uploaded files
 * from object storage (see the typed-confirmation modal on Lessons.js, added for audit finding
 * D2). That is the most destructive action in the console and the one thing that should stay a
 * deliberate, one-at-a-time act; offering it behind a checkbox column would be a mistake.
 *
 * <p>Not @Transactional at the bulk level: each lesson updates in its own transaction, so one
 * failure can never roll back the lessons that already succeeded — hence the per-row failed list.
 */
@RestController
@RequestMapping("/api/v1/admin/lessons")
@Slf4j
@Api(tags = "Admin Lesson Bulk Operations")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminLessonBulkController extends BaseController {

    private static final int BULK_LESSON_MAX_DEFAULT = 100;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    @Data
    public static class BulkLessonStatusRequest {
        private List<Integer> lessonIds;
        /** Either may be set; a null field is left alone on every lesson in the batch. */
        private Boolean active;
        private Boolean enabled;
    }

    private int bulkMax() {
        return appSettingsService != null ? appSettingsService.getBulkStatusMax() : BULK_LESSON_MAX_DEFAULT;
    }

    @PostMapping("/bulk-status")
    @ApiOperation(value = "Bulk update lesson status",
            notes = "Sets active and/or enabled across many lessons. Each lesson is updated independently "
                    + "and failures are reported per lesson, so one inaccessible lesson does not undo the rest.")
    public ResponseEntity<Response<Map<String, Object>>> bulkUpdateStatus(
            @RequestBody BulkLessonStatusRequest body,
            HttpServletRequest httpRequest) {
        if (body == null || body.getLessonIds() == null || body.getLessonIds().isEmpty()) {
            return bad("lessonIds is required and must not be empty");
        }
        if (body.getLessonIds().size() > bulkMax()) {
            return bad("Maximum " + bulkMax() + " lessons per bulk update");
        }
        if (body.getActive() == null && body.getEnabled() == null) {
            return bad("Set at least one of active or enabled");
        }

        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }

        int updated = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        for (Integer lessonId : body.getLessonIds()) {
            try {
                if (lessonId == null || lessonId <= 0) {
                    throw new IllegalArgumentException("Invalid lesson id");
                }
                Lesson existing = lessonService.fetchCourseId(lessonId);
                if (existing == null) {
                    throw new IllegalArgumentException("Lesson not found");
                }
                // A bulk request is a list of ids from the client, so each lesson's own course is
                // re-checked rather than authorising the batch as a whole — otherwise a crafted
                // payload could carry an id the caller cannot touch.
                accessControlService.requireAccessCourse(principal, existing.getCourseId());

                LessonDTO dto = new LessonDTO();
                dto.setActive(body.getActive() != null ? body.getActive() : existing.isActive());
                dto.setEnabled(body.getEnabled() != null ? body.getEnabled() : existing.isEnabled());
                dto.setLessonName(existing.getLessonName());
                dto.setCourseId(existing.getCourseId());
                dto.setSequence(existing.getSequence());
                lessonService.updateLesson(lessonId, dto);
                updated++;
            } catch (Exception e) {
                log.warn("Bulk lesson status update: skipped lesson {}: {}", lessonId, e.getMessage());
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("lessonId", lessonId);
                row.put("reason", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
                failed.add(row);
            }
        }

        if (audit != null && updated > 0) {
            audit.log(httpRequest, "LESSON_BULK_STATUS_UPDATE", "lesson", null, null, null,
                    Map.of("requested", String.valueOf(body.getLessonIds().size()),
                            "updated", String.valueOf(updated),
                            "failed", String.valueOf(failed.size())));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("requested", body.getLessonIds().size());
        result.put("updatedCount", updated);
        result.put("failed", failed);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Updated " + updated + " of " + body.getLessonIds().size() + " lesson(s)", result), HttpStatus.OK);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
