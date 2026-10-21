package com._42students.lms.util;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

/**
 * Security Context Utility
 * SECURITY: Derives role, organization, and user identity from authenticated context.
 * NEVER trusts frontend-provided role/org/userId - these are UNTRUSTED.
 * 
 * TRUST BOUNDARY:
 * - BACKEND ONLY: Role, organization, and userId MUST be derived from server-side authentication
 * - FRONTEND: All role/org/userId in requests are UNTRUSTED and MUST be ignored
 * - VALIDATION: All services MUST validate organization ownership before operations
 */
@Component
@Slf4j
public class SecurityContextUtil {

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    /**
     * Get authenticated user ID from security context
     * 
     * @param request HTTP request (for session-based auth if needed)
     * @return User ID from authenticated context, or null if not authenticated
     */
    /**
     * Get authenticated user principal from JWT (UserPrincipal).
     * @return UserPrincipal if present, else null
     */
    public UserPrincipal getAuthenticatedUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return (UserPrincipal) principal;
            }
        }
        return null;
    }

    public Integer getAuthenticatedUserId(HttpServletRequest request) {
        // Try JWT principal first (UserPrincipal)
        UserPrincipal principal = getAuthenticatedUserPrincipal();
        if (principal != null) {
            return principal.getId();
        }
        // Try Spring Security context for other principal types
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object authPrincipal = authentication.getPrincipal();
            
            // If principal is a User object, extract ID
            if (authPrincipal instanceof org.springframework.security.core.userdetails.UserDetails) {
                // TODO: Extract user ID from UserDetails if stored there
                log.warn("UserDetails principal type - user ID extraction not yet implemented");
            }
            
            // Try session-based auth as fallback
            if (request != null) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    Object userId = session.getAttribute("userId");
                    if (userId instanceof Integer) {
                        return (Integer) userId;
                    } else if (userId instanceof String) {
                        try {
                            return Integer.parseInt((String) userId);
                        } catch (NumberFormatException e) {
                            log.warn("Invalid userId in session: {}", userId);
                        }
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Get authenticated user's organization ID from security context.
     * With JWT, this comes from UserPrincipal (Faculty.organizationId). Session is fallback for legacy auth.
     *
     * @param request HTTP request (for session-based auth fallback)
     * @return Organization ID from authenticated context, or null if not authenticated or not set
     */
    public Integer getAuthenticatedOrganizationId(HttpServletRequest request) {
        UserPrincipal principal = getAuthenticatedUserPrincipal();
        if (principal != null && principal.getOrganizationId() != null) {
            return principal.getOrganizationId();
        }
        if (principal != null && scopeResolutionService != null) {
            if (principal.isLearner()) {
                ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
                if (scope.getOrganizationId() != null) return scope.getOrganizationId();
            } else if (principal.getCollegeId() != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
                if (orgId != null) return orgId;
            }
        }
        // Fallback: session-based auth
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && request != null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                Object organizationId = session.getAttribute("organizationId");
                if (organizationId instanceof Integer) {
                    return (Integer) organizationId;
                } else if (organizationId instanceof String) {
                    try {
                        return Integer.parseInt((String) organizationId);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid organizationId in session: {}", organizationId);
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get authenticated user's college ID from security context.
     * Used for college-scoped admin: when set, APIs may filter data by this college.
     *
     * @param request HTTP request (for session-based auth fallback)
     * @return College ID from authenticated context, or null if not set
     */
    public Integer getAuthenticatedCollegeId(HttpServletRequest request) {
        UserPrincipal principal = getAuthenticatedUserPrincipal();
        if (principal != null && principal.getCollegeId() != null) {
            return principal.getCollegeId();
        }
        if (principal != null && principal.isLearner() && scopeResolutionService != null) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
            if (scope.getCollegeId() != null) return scope.getCollegeId();
        }
        if (request != null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                Object collegeId = session.getAttribute("collegeId");
                if (collegeId instanceof Integer) return (Integer) collegeId;
                if (collegeId instanceof String) {
                    try { return Integer.parseInt((String) collegeId); }
                    catch (NumberFormatException e) { log.warn("Invalid collegeId in session: {}", collegeId); }
                }
            }
        }
        return null;
    }

    /**
     * Get authenticated user's role from security context
     * 
     * @return Role string from authenticated context, or null if not authenticated
     */
    public String getAuthenticatedUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .filter(auth -> auth.startsWith("ROLE_"))
                    .map(auth -> auth.replace("ROLE_", ""))
                    .findFirst()
                    .orElse(null);
        }
        
        return null;
    }

    /**
     * Check if user is authenticated
     * 
     * @return true if user is authenticated
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }

    /**
     * Require authentication - throws exception if not authenticated
     * 
     * @throws SecurityException if user is not authenticated
     */
    public void requireAuthentication() {
        if (!isAuthenticated()) {
            throw new SecurityException("Authentication required");
        }
    }

    /**
     * Require specific role - throws exception if user doesn't have role
     * 
     * @param requiredRole Required role (e.g., "ADMIN", "LEARNER")
     * @throws SecurityException if user doesn't have required role
     */
    public void requireRole(String requiredRole) {
        requireAuthentication();
        String userRole = getAuthenticatedUserRole();
        if (userRole == null || !userRole.equalsIgnoreCase(requiredRole)) {
            throw new SecurityException("Required role: " + requiredRole + ", but user has: " + userRole);
        }
    }
}


