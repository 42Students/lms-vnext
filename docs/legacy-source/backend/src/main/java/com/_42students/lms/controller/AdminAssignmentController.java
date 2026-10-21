package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.SubmissionStatsDTO;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * College-scoped assignment oversight for admin/superadmin. Lists every assignment across the
 * college (not per-faculty like the faculty-facing AssignmentsContent page), with submission
 * stats attached per assignment — grading itself still happens via the existing
 * AssignmentController endpoints (fetchSubmissions/updatePoints/publishGrade), which already work
 * for an ADMIN-typed faculty (see AssignmentController.publishGrade's own admin bypass) — this
 * controller only adds the missing "list across the whole college" capability.
 */
@RestController
@RequestMapping("/api/v1/admin/assignments")
@Slf4j
@Api(tags = "Admin Assignment Oversight APIs (College-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminAssignmentController extends BaseController {

    // Mirrors the cap AssignmentController.fetchSubmissions/bulk already use, so one oversight
    // page load can't trigger an unbounded number of per-assignment stats queries.
    private static final int MAX_ASSIGNMENTS = 100;

    @Autowired
    private LessonContentsRepository lessonContentsRepository;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private static boolean isInvalidCollegeId(Integer collegeId) {
        return collegeId == null || collegeId <= 0;
    }

    private void requireScopedSuperadminCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return;
        if (scopeResolutionService == null) return;

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }
        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (resolvedOrgId != null && principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

    @GetMapping
    @ApiOperation(value = "List assignments across the college, with submission stats", notes = "Optionally narrow to one course. Server-paginated (like the quiz oversight endpoint) so a college with more assignments than fit on one page doesn't get silently truncated.")
    public ResponseEntity<Response<PageResponseDTO<Map<String, Object>>>> listAssignments(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer classId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            int safePage = page == null ? 0 : Math.max(page, 0);
            int safeSize = size == null || size <= 0 ? 20 : Math.min(size, MAX_ASSIGNMENTS);
            Pageable pageable = PageRequest.of(safePage, safeSize);
            if (classId != null && classId > 0) {
                accessControlService.requireAccessClass(principal, classId);
            }
            Page<LessonContents> assignmentPage = lessonContentsRepository.findAssignmentsByCollegePaged(collegeId, courseId, classId, pageable);

            List<Map<String, Object>> result = new ArrayList<>();
            for (LessonContents lc : assignmentPage.getContent()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", lc.getId());
                row.put("title", lc.getContentTitle());
                row.put("courseId", lc.getCourseId());
                // The edit form requires a lesson and locks that selector for existing assignments.
                // Without lessonId, opening Edit shows an uneditable empty required field.
                row.put("lessonId", lc.getLessonId());
                row.put("description", lc.getContentDataDTO() != null ? lc.getContentDataDTO().getHtmlContent() : null);
                row.put("classId", lc.getClassId());
                row.put("facultyId", lc.getFacultyId());
                row.put("points", lc.getPoints());
                row.put("deadline", lc.getDeadline());
                row.put("updatedAt", lc.getUpdatedAt());
                try {
                    SubmissionStatsDTO stats = assignmentService.getSubmissionStats(lc.getId());
                    row.put("stats", stats);
                } catch (Exception e) {
                    // A single assignment's stats failing (e.g. a stale/orphaned class reference)
                    // must not blank out the whole oversight list.
                    log.warn("Could not compute submission stats for lessonContentId {}: {}", lc.getId(), e.getMessage());
                    row.put("stats", null);
                }
                result.add(row);
            }
            PageResponseDTO<Map<String, Object>> pageResponse = PageResponseDTO.<Map<String, Object>>builder()
                    .content(result)
                    .totalElements(assignmentPage.getTotalElements())
                    .totalPages(assignmentPage.getTotalPages())
                    .size(assignmentPage.getSize())
                    .number(assignmentPage.getNumber())
                    .first(assignmentPage.isFirst())
                    .last(assignmentPage.isLast())
                    .build();
            return new ResponseEntity<>(new Response<>("success", "Assignments fetched successfully", pageResponse), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error listing admin assignments for college {}: ", collegeId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch assignments", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
