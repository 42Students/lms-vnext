package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.UserSession;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.TokenVersionService;
import com._42students.lms.service.UserSessionService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Reversible Student/Faculty account suspension — the missing middle ground between "edit" and
 * "hard delete" that Students.js/Faculty.js only offered before (see the admin panel gap audit).
 * Reachable by both college admin and superadmin (requirePerformAdminActionForCollege), unlike
 * SuperAdminUserAdminController.setFacultyAdminStatus which is superadmin-only and scoped to
 * faculty-admin accounts specifically — this is for ordinary Learner/Faculty accounts.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@Slf4j
@Api(tags = "Admin User Lifecycle APIs (Suspend/Reactivate)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminUserLifecycleController extends BaseController {

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private TokenVersionService tokenVersionService;

    @Autowired(required = false)
    private UserSessionService userSessionService;

    @Autowired(required = false)
    private AdminAuditLogService auditLogService;

    @Autowired(required = false)
    private ProjectMemberRepository projectMemberRepository;

    @Autowired(required = false)
    private ProjectWorkspaceRepository projectWorkspaceRepository;

    private static boolean isLearner(String userType) {
        return "LEARNER".equalsIgnoreCase(userType);
    }

    @PutMapping("/{userType}/{userId}/suspend")
    @Transactional
    @ApiOperation(value = "Suspend a Student/Faculty account", notes = "Reversible — see /reactivate. Revokes all active sessions and bumps token version so any already-issued token is rejected immediately.")
    public ResponseEntity<?> suspend(@PathVariable String userType, @PathVariable Integer userId,
                                      @RequestBody(required = false) Map<String, Object> body,
                                      HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        String reason = body != null && body.get("reason") != null ? String.valueOf(body.get("reason")).trim() : null;

        if (isLearner(userType)) {
            Learner learner = learnerRepository.findById(userId).orElse(null);
            if (learner == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            Integer collegeId = resolveCollegeId(learner);
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            learner.setSuspendedAt(LocalDateTime.now());
            learner.setSuspensionReason(reason);
            learnerRepository.save(learner);
            invalidateSessions(userId, "LEARNER", principal);
            audit(httpRequest, "LEARNER_SUSPEND", userId, collegeId, reason);
            return ResponseEntity.ok(Map.of("user", learner));
        }

        Faculty faculty = facultyRepository.findById(userId).orElse(null);
        if (faculty == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        Integer collegeId = faculty.getCollegeId();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        // ADMIN and TPO accounts are super-admin-managed (ProtectedFacultyRoles).
        com._42students.lms.access.ProtectedFacultyRoles.requireCanManage(
                accessControlService.isSuperAdmin(principal), faculty);

        // Same guard as SuperAdminUserAdminController.setFacultyAdminStatus — don't let a mentor
        // vanish out from under active project workspaces without a reassignment first.
        if (projectMemberRepository != null && projectWorkspaceRepository != null) {
            List<Integer> mentoredProjectIds = projectMemberRepository.findProjectIdsForUser(userId, "FACULTY");
            long activeMentoredCount = mentoredProjectIds == null || mentoredProjectIds.isEmpty()
                    ? 0
                    : projectWorkspaceRepository.findActiveByIds(mentoredProjectIds).stream()
                        .filter(project -> !"ARCHIVED".equalsIgnoreCase(String.valueOf(project.getStatus())))
                        .count();
            if (activeMentoredCount > 0) {
                String guardMessage = "Cannot suspend this faculty member: they mentor " + activeMentoredCount
                        + " active project workspace(s). Reassign those projects to another mentor first.";
                return ResponseEntity.status(409).body(Map.of("error", guardMessage, "message", guardMessage));
            }
        }

        faculty.setSuspendedAt(LocalDateTime.now());
        faculty.setSuspensionReason(reason);
        facultyRepository.save(faculty);
        invalidateSessions(userId, "FACULTY", principal);
        audit(httpRequest, "FACULTY_SUSPEND", userId, collegeId, reason);
        return ResponseEntity.ok(Map.of("user", faculty));
    }

    @PutMapping("/{userType}/{userId}/reactivate")
    @Transactional
    @ApiOperation(value = "Reactivate a suspended Student/Faculty account")
    public ResponseEntity<?> reactivate(@PathVariable String userType, @PathVariable Integer userId,
                                         HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();

        if (isLearner(userType)) {
            Learner learner = learnerRepository.findById(userId).orElse(null);
            if (learner == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            Integer collegeId = resolveCollegeId(learner);
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            learner.setSuspendedAt(null);
            learner.setSuspensionReason(null);
            learnerRepository.save(learner);
            audit(httpRequest, "LEARNER_REACTIVATE", userId, collegeId, null);
            return ResponseEntity.ok(Map.of("user", learner));
        }

        Faculty faculty = facultyRepository.findById(userId).orElse(null);
        if (faculty == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        Integer collegeId = faculty.getCollegeId();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        // ADMIN and TPO accounts are super-admin-managed (ProtectedFacultyRoles).
        com._42students.lms.access.ProtectedFacultyRoles.requireCanManage(
                accessControlService.isSuperAdmin(principal), faculty);
        faculty.setSuspendedAt(null);
        faculty.setSuspensionReason(null);
        facultyRepository.save(faculty);
        audit(httpRequest, "FACULTY_REACTIVATE", userId, collegeId, null);
        return ResponseEntity.ok(Map.of("user", faculty));
    }

    private Integer resolveCollegeId(Learner learner) {
        if (scopeResolutionService != null) {
            Integer resolved = scopeResolutionService.resolveLearnerToCollegeId(learner.getId());
            if (resolved != null) return resolved;
        }
        return null;
    }

    private void invalidateSessions(int userId, String userType, UserPrincipal principal) {
        try {
            if (tokenVersionService != null) {
                if ("LEARNER".equals(userType)) tokenVersionService.incrementTokenVersionForLearner(userId);
                else tokenVersionService.incrementTokenVersionForFaculty(userId);
            }
        } catch (Exception e) {
            log.warn("Could not bump token version for {}:{} on suspend: {}", userType, userId, e.getMessage());
        }
        try {
            if (userSessionService != null) {
                List<UserSession> sessions = userSessionService.getActiveSessions(userId, userType);
                // Pass the real admin's identity (not hardcoded 0/"FACULTY") so the AC-05 AUDIT log
                // in UserSessionServiceImpl correctly attributes who revoked the session — mirrors
                // SuperAdminUserAdminController.revokeAllSessions, which already does this.
                Integer revokerId = principal != null ? principal.getId() : 0;
                String revokerType = principal != null ? principal.getUserType() : "FACULTY";
                for (UserSession s : sessions) {
                    try {
                        userSessionService.adminRevokeSession(s.getJti(), revokerId, revokerType);
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            log.warn("Could not revoke sessions for {}:{} on suspend: {}", userType, userId, e.getMessage());
        }
    }

    private void audit(HttpServletRequest httpRequest, String actionKey, Integer userId, Integer collegeId, String reason) {
        if (auditLogService == null) return;
        // Typed by the table the id belongs to, like LEARNER_UPDATE / FACULTY_UPDATE: the generic
        // "user" type let a learner and a faculty with the same id share one audit trail.
        String entityType = actionKey.startsWith("LEARNER") ? "learner" : "faculty";
        auditLogService.log(httpRequest, actionKey, entityType, String.valueOf(userId), null, collegeId,
                reason != null ? Map.of("reason", reason) : Map.of());
    }
}
