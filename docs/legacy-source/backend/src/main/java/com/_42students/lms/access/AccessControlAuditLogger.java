package com._42students.lms.access;

import com._42students.lms.security.UserPrincipal;

/**
 * Structured audit logging for access control decisions.
 * Production implementations should write to a secure, append-only audit store.
 */
public interface AccessControlAuditLogger {

    /**
     * Log an access control decision.
     *
     * @param userId     principal user id (null if unauthenticated)
     * @param userType   principal user type (FACULTY, LEARNER, etc.)
     * @param action     e.g. "requireAccessCollege", "requireAccessLearner"
     * @param resourceType e.g. "college", "learner", "class"
     * @param resourceId resource identifier (may be null for list operations)
     * @param allowed    true if access was granted, false if denied
     * @param reason     optional reason (e.g. "super_admin", "same_college", "denied")
     */
    void log(Integer userId, String userType, String action, String resourceType, Object resourceId, boolean allowed, String reason);

    /**
     * Convenience: log from principal and outcome.
     */
    default void log(UserPrincipal principal, String action, String resourceType, Object resourceId, boolean allowed, String reason) {
        log(principal != null ? principal.getId() : null,
                principal != null ? principal.getUserType() : null,
                action, resourceType, resourceId, allowed, reason);
    }
}

