package com._42students.lms.search.applications;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/job-applications")
@Slf4j
@Api(tags = "Job Application Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class JobApplicationSearchController {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.FeatureFlagService featureFlagService;

    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.util.SecurityContextUtil moduleGuardSecurityContextUtil;

    // Feature guard, matching every other placements surface. These v2 search endpoints had none:
    // they are currently protected only by an organization-access check that happens to deny
    // learners, which is a different mechanism that could change independently of this one.
    @org.springframework.web.bind.annotation.ModelAttribute
    public void guardFeature(javax.servlet.http.HttpServletRequest request) {
        // The cache refresh is platform maintenance (super admin only, checked in refresh()): a global super admin has no
        // college or organization to resolve the module against, so the guard refused it with FEATURE_DISABLED.
        com._42students.lms.security.UserPrincipal principal = moduleGuardSecurityContextUtil.getAuthenticatedUserPrincipal();
        if (request.getRequestURI().endsWith("/refresh") && principal != null && accessControlService.isSuperAdmin(principal)) {
            return;
        }
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled",
                    moduleGuardSecurityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }
    @Autowired
    private JobApplicationSearchCache cache;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;
    
    @GetMapping("/search")
    public ResponseEntity<Response<List<JobApplicationSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // SECURITY: Superadmin with scoped JWT must not query other orgs via param.
        Integer orgId;
        if (principal != null && accessControlService.isSuperAdmin(principal) && principal.getOrganizationId() != null) {
            orgId = principal.getOrganizationId();
        } else if (principal != null && accessControlService.isSuperAdmin(principal) && organizationId != null) {
            orgId = organizationId; // GLOBAL superadmin only
        } else {
            orgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        }
        if (orgId == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization context required for job application search.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobApplicationSearchDTO> results = cache.searchWithinOrganization(orgId, query, limit);
        return ResponseEntity.ok(new Response<>("success", "Applications retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats(
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // SECURITY: Superadmin with scoped JWT must not query other orgs via param.
        Integer orgId;
        if (principal != null && accessControlService.isSuperAdmin(principal) && principal.getOrganizationId() != null) {
            orgId = principal.getOrganizationId();
        } else if (principal != null && accessControlService.isSuperAdmin(principal) && organizationId != null) {
            orgId = organizationId; // GLOBAL superadmin only
        } else {
            orgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        }
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Organization context required.", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalApplications", cache.countWithinOrganization(orgId));
        return ResponseEntity.ok(new Response<>("success", "Stats retrieved", stats));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        accessControlService.requireSuperAdmin(principal);
        cache.refresh();
        return ResponseEntity.ok(new Response<>("success", "Cache refreshed", null));
    }
}


