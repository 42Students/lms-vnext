package com._42students.lms.controller;

import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Read-only, any-authenticated-role view of the current user's own college's module flags —
 * used by the frontend to decide whether to show Projects/Placements nav links. The mutating
 * side lives in SuperAdminFeatureController (superadmin-only).
 */
@RestController
@RequestMapping("/api/v1/features")
public class FeatureFlagController {

    private final SecurityContextUtil securityContextUtil;
    private final com._42students.lms.service.ModuleAccessResolver moduleAccessResolver;

    public FeatureFlagController(SecurityContextUtil securityContextUtil,
                                 com._42students.lms.service.ModuleAccessResolver moduleAccessResolver) {
        this.securityContextUtil = securityContextUtil;
        this.moduleAccessResolver = moduleAccessResolver;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.tpo.PlacementEligibilityService placementEligibility;

    @GetMapping("/mine")
    public ResponseEntity<?> mine() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Resolved through the full hierarchy for a learner (learner → class → batch → program →
        // department → college → org → global) and college-only for everyone else, so the nav a
        // student sees matches exactly what the API will let them through — see
        // ModuleAccessResolver. Response shape is unchanged.
        Map<String, com._42students.lms.service.ModuleAccessResolver.Resolution> resolved =
                moduleAccessResolver.resolveAll(moduleAccessResolver.chainForPrincipal(principal));
        // Every module in the catalog, plus the two original keys by their old names so any
        // caller still reading projectsEnabled/placementsEnabled keeps working untouched.
        Map<String, Boolean> modules = new java.util.LinkedHashMap<>();
        for (String module : com._42students.lms.service.ModuleFeatureCatalog.moduleKeys()) {
            com._42students.lms.service.ModuleAccessResolver.Resolution r = resolved.get(module);
            modules.put(module, r == null || r.enabled);
        }
        // A student uses placements only once they are Eligible (batch, class or their own decision); until then the module
        // is simply not there for them (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).
        if (principal != null && principal.isLearner() && Boolean.TRUE.equals(modules.get("placements")) && placementEligibility != null) {
            modules.put("placements", placementEligibility.learnerInPlacements(principal.getId(), principal.getCollegeId()));
        }
        Map<String, Object> flags = new java.util.LinkedHashMap<>();
        flags.put("projectsEnabled", Boolean.TRUE.equals(modules.get("projects")));
        flags.put("placementsEnabled", Boolean.TRUE.equals(modules.get("placements")));
        flags.put("modules", modules);
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), flags), HttpStatus.OK);
    }
}
