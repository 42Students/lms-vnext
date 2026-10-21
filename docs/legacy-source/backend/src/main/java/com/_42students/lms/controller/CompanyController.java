package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Company;
import com._42students.lms.model.Job;
import com._42students.lms.service.CompanyService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * Admin (college-scoped) company management — create a recruiting company once (name, logo,
 * contact details) and reuse it across job postings instead of retyping the same information for
 * every drive from the same recruiter. Access model mirrors AdminJobController, including its
 * module.placements.enabled guard — see {@link #guardFeature}.
 */
@RestController
@RequestMapping("/api/v1/admin/companies")
@Slf4j
@Api(tags = "Admin Company Management APIs (College-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class CompanyController extends BaseController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private FeatureFlagService featureFlagService;

    /**
     * Companies is a tab of the Placements module, so it has to answer to the Placements toggle
     * like the rest of it. AdminJobController, InterviewController and PlacementJobController all
     * carried this guard; this controller did not, so with Placements disabled for a college the
     * nav hid the tab while the whole company master list stayed readable — and creatable,
     * editable and deletable — to anyone who called the API or reached the page by URL.
     */
    @ModelAttribute
    public void guardFeature(javax.servlet.http.HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled",
                    securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    private static boolean isInvalidCollegeId(Integer collegeId) {
        return collegeId == null || collegeId <= 0;
    }

    // Copied from AdminJobController — kept private/duplicated rather than extracted to a shared
    // base, matching how the rest of the admin controllers in this codebase already do it.
    private void requireScopedSuperadminCollegeWithinScope(com._42students.lms.security.UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (scopeResolutionService == null) return;

        if (principal.getCollegeId() != null) {
            if (!java.util.Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (resolvedOrgId != null && principal.getOrganizationId() != null && !java.util.Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

    @GetMapping
    @ApiOperation(value = "List companies", notes = "Returns all companies for the given collegeId, with driveCount/lastActiveAt. includeDeleted also returns soft-deleted companies.")
    public ResponseEntity<Response<List<Company>>> getAllCompanies(
            @RequestParam Integer collegeId,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Companies fetched", companyService.getAllCompaniesWithStats(collegeId, includeDeleted)), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching companies for college {}: ", collegeId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch companies: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{companyId}")
    @ApiOperation(value = "Get company by id")
    public ResponseEntity<Response<Company>> getCompanyById(@PathVariable Integer companyId, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Company fetched", companyService.getCompanyById(companyId, collegeId)), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{companyId}/jobs")
    @ApiOperation(value = "List a company's job postings", notes = "Every job linked to this company, with application counts — the company's drive history.")
    public ResponseEntity<Response<List<Job>>> getJobsForCompany(@PathVariable Integer companyId, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Jobs fetched", companyService.getJobsForCompany(companyId, collegeId)), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{companyId}/stats")
    @ApiOperation(value = "Company hiring stats", notes = "Total drives run, total applications, total hired — across every job linked to this company.")
    public ResponseEntity<Response<Map<String, Object>>> getCompanyStats(@PathVariable Integer companyId, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Stats fetched", companyService.getCompanyStats(companyId, collegeId)), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping
    @ApiOperation(value = "Create company")
    public ResponseEntity<Response<Company>> createCompany(@Valid @RequestBody Company company, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Company created = companyService.createCompany(company, collegeId);
            return new ResponseEntity<>(new Response<>("success", "Company created", created), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>("error", e.getReason(), null), e.getStatus());
        } catch (Exception e) {
            log.error("Error creating company: ", e);
            return new ResponseEntity<>(new Response<>("error", "Failed to create company: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{companyId}")
    @ApiOperation(value = "Update company")
    public ResponseEntity<Response<Company>> updateCompany(@PathVariable Integer companyId, @RequestBody Company company, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Company updated = companyService.updateCompany(companyId, company, collegeId, accessControlService.isSuperAdmin(principal));
            return new ResponseEntity<>(new Response<>("success", "Company updated", updated), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>("error", e.getReason(), null), e.getStatus());
        } catch (Exception e) {
            log.error("Error updating company {}: ", companyId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to update company: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{companyId}/restore")
    @ApiOperation(value = "Restore a soft-deleted company", notes = "Undoes a delete - the only recovery path since the list view has no other way back.")
    public ResponseEntity<Response<Company>> restoreCompany(@PathVariable Integer companyId, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Company restored", companyService.restoreCompany(companyId, collegeId, accessControlService.isSuperAdmin(principal))), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>("error", e.getReason(), null), e.getStatus());
        } catch (Exception e) {
            log.error("Error restoring company {}: ", companyId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to restore company: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{companyId}")
    @ApiOperation(value = "Delete company", notes = "Soft-deletes a company. Blocked while it has active job postings linked to it.")
    public ResponseEntity<Response<String>> deleteCompany(@PathVariable Integer companyId, @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            companyService.deleteCompany(companyId, collegeId, accessControlService.isSuperAdmin(principal));
            return new ResponseEntity<>(new Response<>("success", "Company deleted", null), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error deleting company {}: ", companyId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to delete company: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
