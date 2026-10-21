package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.CourseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Course;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
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
 * Part B in the super-admin audit: Courses were missing "any bulk operation". Taking a semester's
 * worth of courses offline meant opening and saving each one, which is both slow and the kind of
 * repetition that gets a course missed.
 *
 * <p>Deliberately NOT @Transactional at the bulk level. Each course's update runs in
 * {@code CourseService.updateCourse}'s own transaction, so a failure on one course can never roll
 * back the ones that already succeeded — the same rule AdminJobServiceImpl.bulkUpdateJobStatus
 * and the learner/faculty CSV imports follow, and the reason those carry a per-row failed list.
 *
 * <p>Access is re-checked per course rather than once for the college: a bulk request is just a
 * list of ids from the client, so authorising the batch as a whole would let a crafted payload
 * carry an id the caller cannot touch.
 */
@RestController
@RequestMapping("/api/v1/admin/courses")
@Slf4j
@Api(tags = "Admin Course Bulk Operations")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminCourseBulkController extends BaseController {

    private static final int BULK_COURSE_MAX_DEFAULT = 100;

    @Autowired
    private CourseService courseService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    @Data
    public static class BulkCourseStatusRequest {
        private List<Integer> courseIds;
        /** Any subset may be set; a null field is left alone on every course in the batch. */
        private Boolean active;
        private Boolean enabled;
        /** 1 = listed to learners, 0 = hidden. */
        private Integer allowedForDisplay;
    }

    /** Shares the platform-wide bulk cap with the other bulk endpoints so the two can't drift. */
    private int bulkMax() {
        return appSettingsService != null ? appSettingsService.getBulkStatusMax() : BULK_COURSE_MAX_DEFAULT;
    }

    @PostMapping("/bulk-status")
    @ApiOperation(value = "Bulk update course status and visibility",
            notes = "Sets any combination of active, enabled and allowedForDisplay across many courses. "
                    + "Each course is updated independently and failures are reported per course, so one "
                    + "inaccessible course does not undo the rest.")
    public ResponseEntity<Response<Map<String, Object>>> bulkUpdateStatus(
            @RequestBody BulkCourseStatusRequest body,
            HttpServletRequest httpRequest) {
        if (body == null || body.getCourseIds() == null || body.getCourseIds().isEmpty()) {
            return bad("courseIds is required and must not be empty");
        }
        if (body.getCourseIds().size() > bulkMax()) {
            return bad("Maximum " + bulkMax() + " courses per bulk update");
        }
        if (body.getActive() == null && body.getEnabled() == null && body.getAllowedForDisplay() == null) {
            return bad("Set at least one of active, enabled or allowedForDisplay");
        }
        if (body.getAllowedForDisplay() != null
                && body.getAllowedForDisplay() != 0 && body.getAllowedForDisplay() != 1) {
            return bad("allowedForDisplay must be 0 or 1");
        }

        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }

        int updated = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        for (Integer courseId : body.getCourseIds()) {
            try {
                if (courseId == null || courseId <= 0) {
                    throw new IllegalArgumentException("Invalid course id");
                }
                accessControlService.requireAccessCourse(principal, courseId);
                Course existing = courseService.fetchCourse(courseId);
                if (existing == null) {
                    throw new IllegalArgumentException("Course not found");
                }
                // Only the flags being changed are sent. CourseServiceImpl.setCourseFields leaves a
                // null field untouched, which is exactly what makes a partial update safe here --
                // building a full DTO from the entity would risk writing back a stale copy of every
                // other column, including the metaData blob.
                CourseDTO dto = new CourseDTO();
                dto.setActive(body.getActive() != null ? body.getActive() : existing.getActive());
                dto.setEnabled(body.getEnabled() != null ? body.getEnabled() : existing.getEnabled());
                if (body.getAllowedForDisplay() != null) {
                    dto.setAllowedForDisplay(body.getAllowedForDisplay());
                }
                courseService.updateCourse(courseId, dto);
                updated++;
            } catch (Exception e) {
                log.warn("Bulk course status update: skipped course {}: {}", courseId, e.getMessage());
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("courseId", courseId);
                row.put("reason", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
                failed.add(row);
            }
        }

        if (audit != null && updated > 0) {
            audit.log(httpRequest, "COURSE_BULK_STATUS_UPDATE", "course", null, null, null,
                    Map.of("requested", String.valueOf(body.getCourseIds().size()),
                            "updated", String.valueOf(updated),
                            "failed", String.valueOf(failed.size())));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("requested", body.getCourseIds().size());
        result.put("updatedCount", updated);
        result.put("failed", failed);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Updated " + updated + " of " + body.getCourseIds().size() + " course(s)", result), HttpStatus.OK);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
