package com._42students.lms.security;

import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight principal object for JWT authentication.
 * Contains essential user information extracted from tokens.
 */
@Data
@NoArgsConstructor
public class UserPrincipal {

    private Integer id;
    private String userType;        // LEARNER, FACULTY or recruiter (see PrincipalType)
    private String facultyType;     // null for learner, e.g. ADMIN, HOD, TEACHER for faculty
    private Integer organizationId;
    private Integer collegeId;
    private Integer tokenVersion;

    /**
     * Explicit platform-root capability. This must come from a signed authentication flow,
     * never from an ordinary database id. Keeping it separate from id prevents a record with
     * id=0 (or any future id convention) from silently acquiring platform-wide authority.
     */
    private boolean superAdmin;

    // Set only for an impersonation session (see SuperAdminUserAdminController.impersonate) — the
    // real superadmin's id/type, carried alongside the target user's own identity above so
    // /impersonate/end can restore it, and so every audit log entry written during the session
    // (AdminAuditLogService reads these via SecurityContextUtil) records who was really acting,
    // not just who they were acting as. Deliberately NOT part of the constructor below — kept as
    // a manually-written 6-arg constructor (not @AllArgsConstructor) specifically so every
    // existing `new UserPrincipal(id, userType, facultyType, orgId, collegeId, tokenVersion)`
    // call site across the codebase keeps compiling unchanged; set via the plain setter instead.
    private Integer impersonatorId;
    private String impersonatorType;
    private Integer impersonatorOrgId;
    private Integer impersonatorCollegeId;

    public UserPrincipal(Integer id, String userType, String facultyType, Integer organizationId, Integer collegeId, Integer tokenVersion) {
        this.id = id;
        this.userType = userType;
        this.facultyType = facultyType;
        this.organizationId = organizationId;
        this.collegeId = collegeId;
        this.tokenVersion = tokenVersion;
    }

    /**
     * Create UserPrincipal from a Faculty entity
     */
    public static UserPrincipal fromFaculty(Faculty faculty) {
        return new UserPrincipal(
            faculty.getId(),
            faculty.getUserType() != null ? faculty.getUserType() : "FACULTY",
            faculty.getFacultyType() != null ? faculty.getFacultyType().name() : null,
            faculty.getOrganizationId(),
            faculty.getCollegeId(),
            faculty.getTokenVersion() != null ? faculty.getTokenVersion() : 0
        );
    }
    
    /**
     * Create UserPrincipal from a Learner entity
     */
    public static UserPrincipal fromLearner(Learner learner) {
        return new UserPrincipal(
            learner.getId(),
            learner.getUserType() != null ? learner.getUserType() : "LEARNER",
            null, // Learners don't have facultyType
            learner.getOrganizationId(),
            learner.getCollegeId(),
            learner.getTokenVersion() != null ? learner.getTokenVersion() : 0
        );
    }
    
    /**
     * Create UserPrincipal from either Faculty or Learner
     */
    public static UserPrincipal fromUser(Object user) {
        if (user instanceof Faculty) {
            return fromFaculty((Faculty) user);
        } else if (user instanceof Learner) {
            return fromLearner((Learner) user);
        }
        throw new IllegalArgumentException("User must be Faculty or Learner");
    }
    
    /**
     * Check if user is a learner
     */
    public boolean isLearner() {
        return "LEARNER".equalsIgnoreCase(userType);
    }
    
    /**
     * Check if user is a faculty
     */
    public boolean isFaculty() {
        return "FACULTY".equalsIgnoreCase(userType);
    }

    /**
     * Check if user is a recruiter (industry recruiter). recruiter is never a faculty or learner; a recruiter principal
     * is fenced to /api/v1/recruiter/** by RecruiterFenceFilter. collegeId is the selected college, or null in
     * Global mode, and is re-verified against recruiter_college_access on every request.
     */
    public boolean isRecruiter() {
        return com._42students.lms.model.Recruiter.isUserType(userType);
    }

    /**
     * Create UserPrincipal for a recruiter identity with the selected college (null = Global).
     */
    public static UserPrincipal forRecruiter(com._42students.lms.model.Recruiter recruiter, Integer organizationId, Integer collegeId) {
        return new UserPrincipal(
            recruiter.getId(),
            com._42students.lms.model.Recruiter.USER_TYPE,
            null,
            organizationId,
            collegeId,
            recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0
        );
    }

    /**
     * Create UserPrincipal for super-admin (Vasan panel at /vasan) when no Faculty/Learner exists in DB.
     * Uses id=0, FACULTY, ADMIN so JWT and /vasan access work. Super-admin can act on any college/org.
     * Admin UI supports organization- and college-scoped management.
     */
    public static UserPrincipal forSuperAdmin() {
        UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        principal.setSuperAdmin(true);
        return principal;
    }

    /**
     * Super-admin with an explicit active scope (used by /vasan so org/college scoped APIs
     * can derive context from JWT instead of passing query params everywhere).
     */
    public static UserPrincipal forSuperAdminScoped(Integer organizationId, Integer collegeId) {
        UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", organizationId, collegeId, 0);
        principal.setSuperAdmin(true);
        return principal;
    }
}

