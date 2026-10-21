package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.QuizResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.QuizService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * College-scoped quiz oversight for admin/superadmin — every quiz across a college regardless of
 * authoring faculty. The plain /api/v1/quizzes GET can't serve this: for a faculty-type principal
 * (which every admin JWT also is) it always resolves via findByFacultyId(principal.getId()),
 * which is empty for a global super-admin (id 0, owns no quizzes) and only self-authored for a
 * college admin.
 *
 * Deliberately its own controller under /api/v1/admin/quizzes — matching every other admin
 * oversight endpoint added this pass (AdminAttendanceController, AdminAssignmentController) —
 * rather than a sibling route nested under /api/v1/quizzes, which used to sit directly alongside
 * the existing /api/v1/quizzes/{quizId} pattern.
 */
@RestController
@RequestMapping("/api/v1/admin/quizzes")
@Slf4j
@Api(tags = "Admin Quiz Oversight APIs (College-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminQuizController extends BaseController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private static boolean isInvalidCollegeId(Integer collegeId) {
        return collegeId == null || collegeId <= 0;
    }

    // Same shape as AdminAttendanceController/AdminJobController's helper of the same name.
    private void requireScopedSuperadminCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (scopeResolutionService == null) return;

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        // SA-QUIZ-001: an unresolvable collegeId (deleted/nonexistent/lookup failure) made
        // resolvedOrgId null, which skipped this check entirely instead of denying -- fail-open
        // on exactly the input an attacker controls. Not currently exploitable end-to-end only
        // because requirePerformAdminActionForCollege's own canAccessCollege() independently fails
        // closed on the same case right after this method returns; this brings the two in line so
        // neither depends on the other for the fail-closed behavior.
        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

    @GetMapping
    @ApiOperation(value = "Quizzes for a college, any faculty", notes = "Deliberately not status-filtered, since moderation needs to see drafts too, not just published quizzes.")
    public ResponseEntity<Response<PageResponseDTO<QuizResponseDTO>>> listQuizzes(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            PageResponseDTO<QuizResponseDTO> result = quizService.listQuizzesForAdmin(
                    collegeId, courseId, page == null ? 0 : page, size == null ? 20 : size, principal);
            return new ResponseEntity<>(new Response<>("success", "Quizzes fetched successfully", result), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching admin quizzes for college {}: ", collegeId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch quizzes", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
