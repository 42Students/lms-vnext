package com._42students.lms.controller;

import com._42students.lms.dto.response.Response;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Publishing every graded submission for one assignment at once.
 *
 * <p>Grading is inherently per student — someone reads each submission and types a score. Handing
 * the results back is not: an admin who has finished marking sixty submissions had to click
 * publish sixty times, once per row, with no way to tell part-way through how many were left. The
 * quiz side already had the whole-quiz equivalent (publishQuizGrades); assignments did not.
 *
 * <p>Deliberately NOT @Transactional across the loop. Each publish commits on its own, so one
 * ungradable or inaccessible submission cannot roll back the fifty-nine that succeeded — the same
 * rule every other bulk path in this codebase follows, and the reason this reports per-row
 * failures rather than a single count.
 *
 * <p>Ungraded submissions are skipped rather than failed. "Publish everything I have marked" is
 * the actual intent, and a class always has a few submissions still outstanding; treating those as
 * errors would make the result look broken every single time.
 */
@RestController
@RequestMapping("/api/v1/admin/assignments")
@Slf4j
@Api(tags = "Admin Assignment Grade Publishing")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminAssignmentPublishController extends BaseController {

    /** One class's worth of submissions; large enough for any real cohort, bounded against abuse. */
    private static final int MAX_SUBMISSIONS = 1000;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private com._42students.lms.repository.StudentAssignmentRepository studentAssignmentRepository;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService audit;

    @PostMapping("/{lessonContentId}/publish-grades")
    @ApiOperation(value = "Publish every graded submission for an assignment",
            notes = "Skips submissions that have not been graded yet, and those already published. "
                    + "Each publish commits independently; failures are reported per submission.")
    public ResponseEntity<Response<Map<String, Object>>> publishAll(
            @PathVariable Integer lessonContentId,
            HttpServletRequest httpRequest) {
        if (lessonContentId == null || lessonContentId <= 0) {
            return bad("lessonContentId must be a positive integer");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        // SA-ASSIGN-001/002: this used to load up to 1000 submissions for an arbitrary
        // lessonContentId with no upfront check at all, relying entirely on each row's own
        // publishGrade() call to reject it -- which meant an unauthorized caller still learned
        // every submission's studentId (and the rejection reason) via the "failed" list before a
        // single row was actually blocked. Authorize the whole lesson content once, first.
        assignmentService.ensureCanViewOrGradeAssignment(lessonContentId);

        Page<StudentAssignment> page = studentAssignmentRepository
                .findByLessonContentIdOrderByCreatedAtDesc(lessonContentId, PageRequest.of(0, MAX_SUBMISSIONS));
        List<StudentAssignment> submissions = page.getContent();

        int published = 0;
        int skippedUngraded = 0;
        int alreadyPublished = 0;
        List<Map<String, Object>> failed = new ArrayList<>();

        for (StudentAssignment sa : submissions) {
            if (sa.isGradePublished()) {
                alreadyPublished++;
                continue;
            }
            if (sa.getGraded() != 1) {
                skippedUngraded++;
                continue;
            }
            try {
                // Routed through the normal single-submission path so it inherits that method's
                // access check, publisher-spoofing guard, audit row and notification unchanged.
                assignmentService.publishGrade(sa.getId(), principal.getId() != null ? principal.getId() : 0);
                published++;
            } catch (Exception e) {
                log.warn("Bulk grade publish: skipped submission {}: {}", sa.getId(), e.getMessage());
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("studentAssignmentId", sa.getId());
                row.put("studentId", sa.getStudentId());
                row.put("reason", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
                failed.add(row);
            }
        }

        if (audit != null && published > 0) {
            audit.log(httpRequest, "ASSIGNMENT_GRADES_PUBLISH_ALL", "lesson_contents",
                    String.valueOf(lessonContentId), null, null,
                    Map.of("published", String.valueOf(published),
                            "skippedUngraded", String.valueOf(skippedUngraded),
                            "failed", String.valueOf(failed.size())));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("published", published);
        result.put("skippedUngraded", skippedUngraded);
        result.put("alreadyPublished", alreadyPublished);
        result.put("failed", failed);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                "Published " + published + " grade(s)", result), HttpStatus.OK);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
