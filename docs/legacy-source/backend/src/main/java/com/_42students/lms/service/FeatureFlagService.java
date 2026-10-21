package com._42students.lms.service;

import com._42students.lms.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * On/off switches for optional modules (Projects / Placements).
 *
 * <p>Storage is generic AppSettingsService rows. Resolution is delegated to
 * {@link ModuleAccessResolver}, which walks the full academic hierarchy
 * (learner → class → batch → program → department → college → organization → global) for a learner
 * principal, and college → organization → global for everyone else — the latter being exactly the
 * behaviour this class had when the flags were college-only.
 */
@Service
public class FeatureFlagService {

    private final AppSettingsService appSettingsService;
    private final ModuleAccessResolver moduleAccessResolver;

    public FeatureFlagService(AppSettingsService appSettingsService, ModuleAccessResolver moduleAccessResolver) {
        this.appSettingsService = appSettingsService;
        this.moduleAccessResolver = moduleAccessResolver;
    }

    /** Legacy compatibility entry point. Use the same inherited decision as all other guards. */
    public boolean isEnabled(String moduleKey, Integer collegeId) {
        String module = ModuleFeatureCatalog.moduleForSettingKey(moduleKey);
        // Retired Courses and other non-optional keys must never become availability toggles.
        if (module == null) return true;
        ModuleAccessResolver.Resolution resolution = moduleAccessResolver.resolveAll(
                moduleAccessResolver.chainForCollege(collegeId, null)).get(module);
        return resolution != null && resolution.enabled;
    }

    /**
     * For an admin operating on an explicitly identified college, evaluate that COLLEGE's
     * canonical chain (the resolver derives the organization from the college record), not
     * the super-admin's unscoped principal or an optional query parameter. Call this only
     * AFTER the endpoint's normal target-college authorization.
     */
    public void requireEnabledForCollege(String moduleKey, Integer collegeId) {
        String module = ModuleFeatureCatalog.moduleForSettingKey(moduleKey);
        if (module == null) throw new IllegalArgumentException("Unknown optional module: " + moduleKey);
        if (collegeId == null || collegeId <= 0) throw new IllegalArgumentException("Target collegeId is required");
        ModuleAccessResolver.Resolution resolution = moduleAccessResolver.resolveAll(
                moduleAccessResolver.chainForCollege(collegeId, null)).get(module);
        if (resolution == null || !resolution.enabled) {
            throw new AccessDeniedException("FEATURE_DISABLED");
        }
    }

    public void requireEnabled(String moduleKey, UserPrincipal principal, HttpServletRequest request) {
        if (!isEnabledForPrincipal(moduleKey, principal, request)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "FEATURE_DISABLED");
        }
    }

    /**
     * Full hierarchical resolution for whoever is making the request.
     *
     * <p>A learner resolves through their own hierarchy, so a module can be switched off for one
     * student, class, batch, program or department without touching the rest of the college.
     * Everyone else (faculty, mentors, admins) resolves college → organization → global against the
     * college {@link #resolveCollegeId} picks — which keeps the existing admin behaviour intact,
     * including a global super-admin acting on a specific college via {@code ?collegeId=}.
     */
    public boolean isEnabledForPrincipal(String moduleKey, UserPrincipal principal, HttpServletRequest request) {
        String module = ModuleFeatureCatalog.moduleForSettingKey(moduleKey);
        if (module == null) {
            // Not a catalog module — nothing to gate on, so don't invent a restriction.
            return true;
        }
        List<ModuleAccessResolver.ScopeRef> chain;
        if (principal != null && principal.isLearner()) {
            chain = moduleAccessResolver.chainForPrincipal(principal);
        } else {
            chain = moduleAccessResolver.chainForCollege(
                    resolveCollegeId(principal, request),
                    principal != null ? principal.getOrganizationId() : null);
        }
        ModuleAccessResolver.Resolution resolution = moduleAccessResolver.resolveAll(chain).get(module);
        return resolution != null && resolution.enabled;
    }

    /**
     * A principal locked to one college (a normal learner/faculty, or a superadmin who has scoped
     * themselves to a single college) ALWAYS checks their own college — a client-supplied
     * collegeId param is only trusted when the principal has no fixed college of their own (a
     * global or org-scoped superadmin managing many colleges, e.g. AdminProjectController's
     * ?collegeId= target). Otherwise a learner at a disabled college could add an arbitrary
     * ?collegeId=<other, enabled college> to a request and dodge FEATURE_DISABLED entirely, even
     * though the real data-access check downstream would still correctly reject/ignore that param
     * for actual data scoping — the feature gate itself must not be bypassable that way.
     */
    private Integer resolveCollegeId(UserPrincipal principal, HttpServletRequest request) {
        if (principal != null && principal.getCollegeId() != null) {
            return principal.getCollegeId();
        }
        String param = request != null ? request.getParameter("collegeId") : null;
        if (param != null && !param.isBlank()) {
            try {
                return Integer.valueOf(param.trim());
            } catch (NumberFormatException ignored) {
                // no usable collegeId anywhere — treat as unscoped (enabled)
            }
        }
        return null;
    }
}
