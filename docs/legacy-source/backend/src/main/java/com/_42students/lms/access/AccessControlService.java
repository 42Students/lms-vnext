package com._42students.lms.access;

import com._42students.lms.model.Interview;
import com._42students.lms.model.Notification;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Single entry point for scope and access checks.
 * All rules live here; controllers never bypass.
 *
 * Role/mode reference (for AI and developers): See project-root LMS_ROLES_AND_VASAN_MODES.md.
 * - Admin = LMS admin role (FACULTY+ADMIN or userType ADMIN); only role that can manage jobs/placement.
 * - Super-admin = an explicitly authenticated platform-root principal; can act on any college/org; used for Vasan panel (/vasan).
 * - Super-admin LMS mode = in /vasan, mode where super-admin selects a college and manages LMS data for it.
 * - Super-admin manages all colleges/orgs via /vasan.
 */
@Service
@Slf4j
public class AccessControlService {

    private final ScopeResolutionService scopeResolutionService;
    private final FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private AccessControlAuditLogger auditLogger;

    // Field-injected rather than added to the constructor on purpose: several @WebMvcTest slices
    // @Import this service and only mock its current constructor dependencies, so a third required
    // constructor arg would break those contexts. Optional + null-checked keeps them loading.
    @Autowired(required = false)
    private SemesterCourseRepository semesterCourseRepository;

    /**
     * Current learner audience for a course. Unlike the old program-wide curriculum fallback,
     * this is semester-aware and includes explicit teaching overrides and live elective-backed
     * classes through the canonical class/course predicate.
     */
    private boolean isCourseInLearnerCurrentAudience(UserPrincipal principal, Integer courseId) {
        if (principal == null || principal.getId() == null || scopeResolutionService == null) return false;
        try {
            for (Integer classId : scopeResolutionService.resolveLearnerToClassIds(principal.getId())) {
                if (classId != null && scopeResolutionService.isClassCurrentlyEligibleForCourse(classId, courseId)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.debug("Current audience access resolution failed for learner {} course {}", principal.getId(), courseId, e);
            return false;
        }
    }

    /** Optional so the constructor-built unit tests are unaffected; wired by Spring in the app. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.electives.ElectiveOfferingRepository electiveOfferingRepository;

    public AccessControlService(ScopeResolutionService scopeResolutionService,
                                FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository) {
        this.scopeResolutionService = scopeResolutionService;
        this.facultyTeachingAssignmentRepository = facultyTeachingAssignmentRepository;
    }

    /**
     * Super-admin: id 0, no college/org in principal. Only role that can act on any college/org.
     * Used for Vasan panel (/vasan). See LMS_ROLES_AND_VASAN_MODES.md.
     */
    /**
     * Teaching scope for sensitive operational reads (discussions, classroom chat, submissions and their statistics,
     * class-specific lesson-content metrics and grades). requireAccessCourse/requireAccessClass are browse checks: they
     * only prove the course or class belongs to the caller's college. An ordinary faculty member must also actively
     * teach it: the exact course+class when the data is class-specific, the course in any class when it is course-wide,
     * and anything in the class for legacy class-only rows. Admins (userType ADMIN, facultyType ADMIN) and super admins
     * keep college-wide access; learners are unaffected here (they are scoped to their own class by the browse checks).
     * Call it after the browse checks, which still decide tenant scope and not-found.
     */
    public void requireTeachingScope(UserPrincipal principal, Integer courseId, Integer classId) {
        if (principal == null) throw new AccessDeniedException("Authentication required");
        if (!principal.isFaculty() || isSuperAdmin(principal) || "ADMIN".equalsIgnoreCase(principal.getFacultyType())) return;
        Integer facultyId = principal.getId();
        boolean hasCourse = courseId != null && courseId > 0;
        boolean hasClass = classId != null && classId > 0;
        boolean teaches;
        if (facultyId == null || facultyId <= 0 || (!hasCourse && !hasClass)) {
            teaches = false;
        } else if (hasCourse && hasClass) {
            teaches = facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(facultyId, courseId, classId, true);
        } else if (hasCourse) {
            teaches = facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndIsActive(facultyId, courseId, true);
        } else {
            teaches = facultyTeachingAssignmentRepository.existsByFacultyIdAndClassIdAndIsActive(facultyId, classId, true);
        }
        if (!teaches) throw new AccessDeniedException("You do not teach this course or class");
    }

    public boolean isSuperAdmin(UserPrincipal principal) {
        return principal != null && principal.isSuperAdmin();
    }

    /**
     * Global super-admin: id 0 AND no org/college scope set in JWT.
     * This is the ONLY mode allowed to see/act across all tenants.
     */
    public boolean isGlobalSuperAdmin(UserPrincipal principal) {
        return isSuperAdmin(principal) && principal.getOrganizationId() == null && principal.getCollegeId() == null;
    }

    /**
     * Scoped super-admin: id 0 with orgId and/or collegeId set in JWT.
     * Used by /vasan after calling /api/v1/auth/superadmin/scope.
     */
    public boolean isScopedSuperAdmin(UserPrincipal principal) {
        return isSuperAdmin(principal) && !isGlobalSuperAdmin(principal);
    }

    /**
     * Can the principal access data for this college?
     * Super-admin: any non-null collegeId. College ADMIN / FACULTY / LEARNER: only principal's college.
     */
    public boolean canAccessCollege(UserPrincipal principal, Integer collegeId) {
        if (principal == null) return false;
        // "null collegeId" is ambiguous; only global super-admin may access global resources.
        if (collegeId == null) return isGlobalSuperAdmin(principal);

        // Global super-admin can access any college.
        if (isGlobalSuperAdmin(principal)) return true;

        // Scoped super-admin must be limited to the selected org/college scope.
        if (isScopedSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            if (scopedCollegeId != null) {
                return scopedCollegeId.equals(collegeId);
            }
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedOrgId != null && scopeResolutionService != null) {
                Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                return scopedOrgId.equals(collegeOrgId);
            }
            return false;
        }

        Integer principalCollege = principal.getCollegeId();
        if (principalCollege == null) return false;
        return principalCollege.equals(collegeId);
    }

    /**
     * Can the principal access data for this organization?
     * Super-admin: any non-null org. Admin (placement from /vasan): principal's org when set.
     * College admin: principal has collegeId but not organizationId; resolve org from college and allow if it matches.
     * Only ADMIN: userType ADMIN or FACULTY with facultyType ADMIN.
     */
    public boolean canAccessOrganization(UserPrincipal principal, Integer organizationId) {
        if (principal == null) return false;
        if (organizationId == null) return false;
        if (isGlobalSuperAdmin(principal)) return true;
        if (isScopedSuperAdmin(principal)) {
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedOrgId == null && principal.getCollegeId() != null && scopeResolutionService != null) {
                scopedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
            }
            return scopedOrgId != null && scopedOrgId.equals(organizationId);
        }
        Integer principalOrg = principal.getOrganizationId();
        // College-scoped admin: resolve org from collegeId when principal has no org set
        if (principalOrg == null && principal.getCollegeId() != null && scopeResolutionService != null) {
            principalOrg = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
        }
        if (principalOrg == null) return false;
        if (!principalOrg.equals(organizationId)) return false;
        return "ADMIN".equalsIgnoreCase(principal.getUserType())
                || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
    }

    /**
     * Can the principal access this learner's data?
     * Learner: only self. Faculty/Admin: if they can access learner's college. Super-admin: any.
     */
    public boolean canAccessLearner(UserPrincipal principal, Integer learnerId) {
        if (principal == null || learnerId == null) return false;
        if (isGlobalSuperAdmin(principal)) return true;
        if (isScopedSuperAdmin(principal)) {
            Integer learnerCollegeId = scopeResolutionService.resolveLearnerToCollegeId(learnerId);
            if (learnerCollegeId == null) return false;
            return canAccessCollege(principal, learnerCollegeId);
        }
        if (principal.isLearner()) {
            return principal.getId() != null && principal.getId().equals(learnerId);
        }
        Integer learnerCollegeId = scopeResolutionService.resolveLearnerToCollegeId(learnerId);
        if (learnerCollegeId == null) return false;
        return canAccessCollege(principal, learnerCollegeId);
    }

    /**
     * Can the principal perform admin action for this college?
     * Super-admin: any non-null collegeId. College ADMIN: only their college.
     */
    public boolean canPerformAdminActionForCollege(UserPrincipal principal, Integer collegeId) {
        if (principal == null) return false;
        // Global superadmin is checked BEFORE the null-collegeId guard: they are allowed to act on
        // any college, so an unresolvable collegeId (e.g. a course whose college lookup fails)
        // must not lock them out of operations they are unconditionally entitled to. Every other
        // role still fails closed on a null collegeId below.
        if (isGlobalSuperAdmin(principal)) return true;
        if (collegeId == null) return false;
        if (isScopedSuperAdmin(principal)) return canAccessCollege(principal, collegeId);
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && "ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
            Integer principalCollege = principal.getCollegeId();
            return principalCollege != null && principalCollege.equals(collegeId);
        }
        return false;
    }

    public boolean canAccessDepartment(UserPrincipal principal, Integer deptId) {
        if (principal == null || deptId == null) return false;
        Integer collegeId = scopeResolutionService.resolveDepartmentToCollegeId(deptId);
        return collegeId != null && canAccessCollege(principal, collegeId);
    }

    public boolean canAccessProgram(UserPrincipal principal, Integer programId) {
        if (principal == null || programId == null) return false;
        if (principal.isLearner()) {
            Integer learnerProgramId = scopeResolutionService.resolveLearnerToProgramId(principal.getId());
            return programId.equals(learnerProgramId);
        }
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(programId);
        return collegeId != null && canAccessCollege(principal, collegeId);
    }

    public boolean canAccessProgram(UserPrincipal principal, Long programId) {
        if (principal == null || programId == null) return false;
        // SECURITY: must mirror the Integer overload above. Without this, a learner passing
        // through this overload (used by the /api/v2 search controllers, which only require
        // authentication — any role) would be able to access ANY program in their own college
        // via requireAccessProgram(principal, Long), not just the program they are actually
        // enrolled in, bypassing the learner-scoping this class enforces everywhere else.
        if (principal.isLearner()) {
            Integer learnerProgramId = scopeResolutionService.resolveLearnerToProgramId(principal.getId());
            return learnerProgramId != null && programId.equals(Long.valueOf(learnerProgramId));
        }
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(programId);
        return collegeId != null && canAccessCollege(principal, collegeId);
    }

    public boolean canAccessClass(UserPrincipal principal, Integer classId) {
        if (principal == null || classId == null) return false;
        if (principal.isLearner()) {
            // Own section plus the group-backed classes of their electives (a set of one for
            // learners without electives, so nothing changes for them).
            return scopeResolutionService.resolveLearnerToClassIds(principal.getId()).contains(classId);
        }
        Integer collegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        return collegeId != null && canAccessCollege(principal, collegeId);
    }

    public boolean canAccessBatch(UserPrincipal principal, Long batchId) {
        if (principal == null || batchId == null) return false;
        // Learners are scoped to their OWN batch, mirroring canAccessClass/canAccessProgram.
        // This method previously had no learner branch at all — it fell straight through to a
        // bare college match, so any learner could pass requireAccessBatch for EVERY batch in
        // their college. Combined with BatchController's promote/update endpoints (which gate on
        // nothing else), that let a student promote an entire unrelated cohort to the next
        // semester. The mutating endpoints are now role-gated in WebSecurityConfig as well; this
        // closes the read side and removes the anomaly among the canAccessX family.
        if (principal.isLearner()) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
            Integer learnerBatchId = scope != null ? scope.getBatchId() : null;
            return learnerBatchId != null && batchId.equals(Long.valueOf(learnerBatchId));
        }
        Integer collegeId = scopeResolutionService.resolveBatchToCollegeId(batchId);
        // Note: collegeId can be null for an orphaned batch with no programId (BatchRequestDTO
        // makes programId @NotNull so this can't be created via the API today, but the schema
        // allows it). Delegate straight to canAccessCollege rather than short-circuiting on
        // collegeId != null, so this follows the same "null collegeId is ambiguous; only global
        // super-admin may access" precedent canAccessCollege already applies everywhere else,
        // instead of hard-denying even the global super-admin escape hatch.
        return canAccessCollege(principal, collegeId);
    }

    /**
     * Can the principal access this faculty's schedule/data?
     * Same faculty (principal.getId() == facultyId), super-admin, or admin/faculty with same college.
     */
    public boolean canAccessFacultySchedule(UserPrincipal principal, int facultyId) {
        if (principal == null) return false;
        // Numeric IDs belong to separate learner and faculty tables. Only a typed faculty
        // principal can satisfy the self exception; everyone else must pass tenant scope.
        if (principal.isFaculty() && principal.getId() != null && principal.getId().equals(facultyId)) return true;
        if (isGlobalSuperAdmin(principal)) return true;
        if (isScopedSuperAdmin(principal)) {
            Integer facultyCollegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
            if (facultyCollegeId == null) return false;
            return canAccessCollege(principal, facultyCollegeId);
        }
        Integer facultyCollegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
        if (facultyCollegeId == null) return false;
        return canAccessCollege(principal, facultyCollegeId);
    }

    /**
     * Can a learner confirm or request reschedule for their own interview?
     * Learners do not have organization-level access; they may act only on interviews assigned to them.
     */
    public boolean canLearnerActOnOwnInterview(UserPrincipal principal, Interview interview) {
        if (principal == null || interview == null) return false;
        if (!principal.isLearner()) return false;
        if (principal.getId() == null) return false;
        if (interview.getLearner() == null) return false;
        // Null-safe comparison: Learner.getId() returns int, principal.getId() is Integer
        return java.util.Objects.equals(principal.getId(), interview.getLearner().getId());
    }

    /**
     * Can the principal access this course?
     * Learners: only if their class has an active teaching assignment for this course (they see class-specific contents).
     * Faculty/admin: if they have college access (generic course/syllabus view).
     */
    public boolean canAccessCourse(UserPrincipal principal, Integer courseId) {
        if (principal == null || courseId == null) return false;
        if (isGlobalSuperAdmin(principal)) return true;
        if (isScopedSuperAdmin(principal)) {
            Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
            return courseCollegeId != null && canAccessCollege(principal, courseCollegeId);
        }
        if (principal.isLearner()) {
            // One rule for every learner surface: current batch semester OR active teaching
            // override OR live elective-backed class. This closes the old "course exists in any
            // semester of my program" leak while keeping unstaffed current curriculum visible.
            return isCourseInLearnerCurrentAudience(principal, courseId);
        }
        Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        return collegeId != null && canAccessCollege(principal, collegeId);
    }

    /**
     * Server-authoritative content targeting check. Controllers/services use this before assigning
     * NEW class scope; historical records that keep their existing class are handled separately.
     */
    public boolean isClassCurrentlyEligibleForCourse(Integer classId, Integer courseId) {
        return scopeResolutionService != null
                && scopeResolutionService.isClassCurrentlyEligibleForCourse(classId, courseId);
    }

    public void requireCurrentCourseAudienceClass(Integer classId, Integer courseId) {
        if (!isClassCurrentlyEligibleForCourse(classId, courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Selected class is not currently eligible for this course");
        }
    }

    /** All current home/elective-backed audience classes for a learner principal. */
    public java.util.List<Integer> resolveLearnerAudienceClassIds(UserPrincipal principal) {
        if (principal == null || !principal.isLearner() || principal.getId() == null || scopeResolutionService == null) {
            return java.util.List.of();
        }
        return scopeResolutionService.resolveLearnerToClassIds(principal.getId());
    }

    // --- require*: throw AccessDeniedException if not allowed ---

    public void requireLearnerCanActOnOwnInterview(UserPrincipal principal, Interview interview) {
        boolean allowed = canLearnerActOnOwnInterview(principal, interview);
        if (auditLogger != null) auditLogger.log(principal, "requireLearnerCanActOnOwnInterview", "interview", interview != null ? interview.getId() : null, allowed, allowed ? "own_interview" : "denied");
        if (!allowed) {
            log.debug("Access denied: learner cannot act on this interview");
            throw new AccessDeniedException("Access denied to this interview");
        }
    }

    public void requireAccessCollege(UserPrincipal principal, Integer collegeId) {
        boolean allowed = canAccessCollege(principal, collegeId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessCollege", "college", collegeId, allowed, allowed ? "same_or_super_admin" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access college {}", collegeId);
            throw new AccessDeniedException("Access denied to this college");
        }
    }

    public void requireAccessOrganization(UserPrincipal principal, Integer organizationId) {
        boolean allowed = canAccessOrganization(principal, organizationId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessOrganization", "organization", organizationId, allowed, allowed ? "same_or_super_admin" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access organization {}", organizationId);
            throw new AccessDeniedException("Access denied to this organization");
        }
    }

    public void requireAccessLearner(UserPrincipal principal, Integer learnerId) {
        boolean allowed = canAccessLearner(principal, learnerId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessLearner", "learner", learnerId, allowed, allowed ? "self_or_scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access learner {}", learnerId);
            throw new AccessDeniedException("Access denied to this learner");
        }
    }

    public void requirePerformAdminActionForCollege(UserPrincipal principal, Integer collegeId) {
        boolean allowed = canPerformAdminActionForCollege(principal, collegeId);
        if (auditLogger != null) auditLogger.log(principal, "requirePerformAdminActionForCollege", "college", collegeId, allowed, allowed ? "admin_or_super_admin" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot perform admin action for college {}", collegeId);
            throw new AccessDeniedException("Access denied for this college");
        }
    }

    public void requireAccessDepartment(UserPrincipal principal, Integer deptId) {
        boolean allowed = canAccessDepartment(principal, deptId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessDepartment", "department", deptId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access department {}", deptId);
            throw new AccessDeniedException("Access denied to this department");
        }
    }

    public void requireAccessProgram(UserPrincipal principal, Integer programId) {
        boolean allowed = canAccessProgram(principal, programId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessProgram", "program", programId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access program {}", programId);
            throw new AccessDeniedException("Access denied to this program");
        }
    }

    public void requireAccessProgram(UserPrincipal principal, Long programId) {
        boolean allowed = canAccessProgram(principal, programId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessProgram", "program", programId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access program {}", programId);
            throw new AccessDeniedException("Access denied to this program");
        }
    }

    public void requireAccessClass(UserPrincipal principal, Integer classId) {
        if (principal == null || classId == null) {
            if (auditLogger != null) auditLogger.log(principal, "requireAccessClass", "class", classId, false, "null_principal_or_class");
            throw new AccessDeniedException("Access denied to this class");
        }
        Integer collegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        if (collegeId == null) {
            if (auditLogger != null) auditLogger.log(principal, "requireAccessClass", "class", classId, false, "not_found_or_deleted");
            log.debug("Class not found: {}", classId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found");
        }
        boolean allowed = canAccessClass(principal, classId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessClass", "class", classId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access class {}", classId);
            throw new AccessDeniedException("Access denied to this class");
        }
    }

    public void requireAccessBatch(UserPrincipal principal, Long batchId) {
        boolean allowed = canAccessBatch(principal, batchId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessBatch", "batch", batchId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access batch {}", batchId);
            throw new AccessDeniedException("Access denied to this batch");
        }
    }

    /**
     * Throws if principal may not access this faculty's schedule (e.g. calendar, taught hours).
     */
    public void requireAccessFacultySchedule(UserPrincipal principal, int facultyId) {
        boolean allowed = canAccessFacultySchedule(principal, facultyId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessFacultySchedule", "faculty", facultyId, allowed, allowed ? "self_or_scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access faculty schedule {}", facultyId);
            throw new AccessDeniedException("Access denied to this faculty schedule");
        }
    }

    public void requireAccessCourse(UserPrincipal principal, Integer courseId) {
        if (principal == null || courseId == null) {
            if (auditLogger != null) auditLogger.log(principal, "requireAccessCourse", "course", courseId, false, "null_principal_or_course");
            throw new AccessDeniedException("Access denied to this course");
        }
        Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (collegeId == null) {
            if (auditLogger != null) auditLogger.log(principal, "requireAccessCourse", "course", courseId, false, "not_found_or_deleted");
            log.debug("Course not found: {}", courseId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        boolean allowed = canAccessCourse(principal, courseId);
        if (auditLogger != null) auditLogger.log(principal, "requireAccessCourse", "course", courseId, allowed, allowed ? "scope" : "denied");
        if (!allowed) {
            log.debug("Access denied: principal cannot access course {}", courseId);
            throw new AccessDeniedException("Access denied to this course");
        }
    }

    /**
     * Throws if principal is not super-admin.
     */
    public void requireSuperAdmin(UserPrincipal principal) {
        boolean allowed = isSuperAdmin(principal);
        if (auditLogger != null) auditLogger.log(principal, "requireSuperAdmin", "system", null, allowed, allowed ? "super_admin" : "denied");
        if (!allowed) {
            log.debug("Access denied: super-admin required");
            throw new AccessDeniedException("Super-admin access required");
        }
    }

    /**
     * Throws if principal may not access this notification. Uses notification's class or course scope.
     */
    public void requireAccessNotification(UserPrincipal principal, Notification notification) {
        if (principal == null || notification == null) {
            if (auditLogger != null) auditLogger.log(principal, "requireAccessNotification", "notification", notification != null ? notification.getId() : null, false, "null");
            throw new AccessDeniedException("Access denied to this notification");
        }
        if (notification.getClassId() > 0) {
            requireAccessClass(principal, notification.getClassId());
            return;
        }
        if (notification.getCourseId() > 0) {
            requireAccessCourse(principal, notification.getCourseId());
            return;
        }
        if (auditLogger != null) auditLogger.log(principal, "requireAccessNotification", "notification", notification.getId(), false, "no_scope");
        log.debug("Access denied: notification has no scope");
        throw new AccessDeniedException("Access denied to this notification");
    }
}

