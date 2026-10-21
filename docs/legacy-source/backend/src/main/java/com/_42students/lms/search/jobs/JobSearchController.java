package com._42students.lms.search.jobs;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Job;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import org.springframework.security.access.AccessDeniedException;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Job Search Controller
 *
 * Provides ultra-fast job search using in-memory cache.
 * Supports fuzzy matching, synonym expansion, and multi-field search.
 */
@RestController
@RequestMapping("/api/v2/jobs")
@Slf4j
@Api(tags = "Job Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class JobSearchController {

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
    private JobSearchCache jobSearchCache;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private JobRepository jobRepository;

    private UserPrincipal requirePrincipal() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return principal;
    }

    private Integer resolveOrgId(UserPrincipal principal, Integer requestedOrganizationId, HttpServletRequest request) {
        Integer authOrgId = null;
        if (request != null) {
            try {
                authOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
            } catch (Exception ignored) {}
        }
        boolean isSuper = principal != null && accessControlService.isSuperAdmin(principal);
        boolean isGlobalSuper = isSuper && principal.getCollegeId() == null && principal.getOrganizationId() == null;

        if (isSuper && principal.getOrganizationId() != null) {
            return principal.getOrganizationId();
        }
        if (isSuper && principal.getOrganizationId() == null && principal.getCollegeId() != null && scopeResolutionService != null) {
            Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
            if (orgId != null) return orgId;
        }
        if (isGlobalSuper && requestedOrganizationId != null) {
            return requestedOrganizationId;
        }
        return authOrgId;
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search jobs (in-memory)",
                  notes = "Ultra-fast job search using in-memory cache. Supports fuzzy matching and synonyms. " +
                          "SECURITY: Organization-scoped - searches only within requester's organization.")
    public ResponseEntity<Response<List<JobSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "software developer")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Learner ID (optional - used to determine organization for security)")
            @RequestParam(required = false) Integer learnerId,
            @ApiParam(value = "Filter by department ID (optional - within organization)")
            @RequestParam(required = false) Integer deptId,
            @ApiParam(value = "Filter by program ID (optional - within organization)")
            @RequestParam(required = false) Integer programId,
            @ApiParam(value = "Filter by job type (optional)")
            @RequestParam(required = false) String jobType,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        long start = System.currentTimeMillis();

        // SECURITY FIX: Determine organization ID from authenticated context or learnerId
        Integer organizationId = null;
        
        // Try authenticated context first (for admin users)
        organizationId = resolveOrgId(principal, null, request);
        
        // If not in auth context, try learnerId (for learner users) — validate access so caller cannot use another learner's ID
        if (organizationId == null && learnerId != null) {
            accessControlService.requireAccessLearner(principal, learnerId);
            Learner learner = learnerRepository.findById(learnerId).orElse(null);
            if (learner != null) {
                ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);
                organizationId = scope.getOrganizationId();
            }
        }
        
        // SECURITY FIX: If still no organization, reject request (prevent cross-org leaks)
        if (organizationId == null) {
            log.warn("Job search attempted without organization context (learnerId: {})", learnerId);
            return new ResponseEntity<>(
                    new Response<>("error", "Organization context required for job search. Provide learnerId or ensure authentication.", null),
                    HttpStatus.FORBIDDEN);
        }

        accessControlService.requireAccessOrganization(principal, organizationId);

        // SECURITY FIX: All searches are now scoped to organization (organizationId is guaranteed non-null here)
        // Start with organization-scoped jobs, then apply additional filters
        List<JobSearchDTO> results = jobSearchCache.getByOrganizationId(organizationId, 1000); // Get more to filter/search within
        
        // Apply additional filters if provided (within organization scope)
        if (deptId != null) {
            results = results.stream()
                .filter(job -> job.getTargetDepartmentId() != null && job.getTargetDepartmentId().equals(deptId))
                .collect(java.util.stream.Collectors.toList());
        }
        
        if (programId != null) {
            results = results.stream()
                .filter(job -> job.getTargetProgramId() != null && job.getTargetProgramId().equals(programId))
                .collect(java.util.stream.Collectors.toList());
        }
        
        if (jobType != null) {
            results = results.stream()
                .filter(job -> job.getJobType() != null && jobType.equalsIgnoreCase(job.getJobType()))
                .collect(java.util.stream.Collectors.toList());
        }
        
        // Apply search query filter if provided
        if (query != null && !query.trim().isEmpty()) {
            results = results.stream()
                .filter(job -> {
                    String searchText = job.getSearchableText().toLowerCase();
                    return searchText.contains(query.toLowerCase());
                })
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
        } else {
            // Limit results if no query
            results = results.stream().limit(limit).collect(java.util.stream.Collectors.toList());
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Job search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Jobs retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular jobs", notes = "Returns most commonly accessed jobs for the requester's organization")
    public ResponseEntity<Response<List<JobSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization context required. Provide organizationId or ensure authentication.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> popular = jobSearchCache.getPopularByOrganization(orgId, limit);
        return ResponseEntity.ok(
            new Response<>("success", "Popular jobs retrieved", popular)
        );
    }

    @GetMapping("/organizations")
    @ApiOperation(value = "Get all organizations", notes = "Returns list of all organizations")
    public ResponseEntity<Response<List<String>>> getOrganizations() {
        requirePrincipal();
        // For now, return hardcoded organization types
        // In Phase 4, this would come from an Organizations table
        List<String> organizations = java.util.Arrays.asList("42Learn", "External Companies");

        return ResponseEntity.ok(
            new Response<>("success", "Organizations retrieved", organizations)
        );
    }

    @GetMapping("/organization/{organizationId}")
    @ApiOperation(value = "Get jobs by organization", notes = "Returns all jobs for an organization. Caller must have access to that organization.")
    public ResponseEntity<Response<List<JobSearchDTO>>> getByOrganization(
            @PathVariable Integer organizationId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, null);
        if (orgId == null || !orgId.equals(organizationId)) {
            return new ResponseEntity<>(new Response<>("error", "Organization mismatch", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, organizationId);
        List<JobSearchDTO> jobs = jobSearchCache.getByOrganizationId(organizationId, limit);
        return ResponseEntity.ok(
            new Response<>("success", "Jobs retrieved", jobs)
        );
    }

    @GetMapping("/department/{deptId}")
    @ApiOperation(value = "Get jobs by department", notes = "Returns all jobs targeted at a department within the requester's organization")
    public ResponseEntity<Response<List<JobSearchDTO>>> getByDepartment(
            @PathVariable Integer deptId,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Organization context required.", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> jobs = jobSearchCache.getByDepartmentIdAndOrganization(deptId, orgId, limit);
        return ResponseEntity.ok(new Response<>("success", "Jobs retrieved", jobs));
    }

    @GetMapping("/program/{programId}")
    @ApiOperation(value = "Get jobs by program", notes = "Returns all jobs targeted at a program within the requester's organization")
    public ResponseEntity<Response<List<JobSearchDTO>>> getByProgram(
            @PathVariable Integer programId,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Organization context required.", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> jobs = jobSearchCache.getByProgramIdAndOrganization(programId, orgId, limit);
        return ResponseEntity.ok(new Response<>("success", "Jobs retrieved", jobs));
    }

    @GetMapping("/job-type/{jobType}")
    @ApiOperation(value = "Get jobs by type", notes = "Returns jobs of specific type within the requester's organization")
    public ResponseEntity<Response<List<JobSearchDTO>>> getByJobType(
            @PathVariable String jobType,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Organization context required.", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> jobs = jobSearchCache.getByJobTypeAndOrganization(jobType, orgId, limit);
        return ResponseEntity.ok(new Response<>("success", "Jobs retrieved", jobs));
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get job types (categories)",
            notes = "Returns job types only from the requester's organization.")
    public ResponseEntity<Response<List<String>>> getCategories(
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization context required.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<String> categories = jobSearchCache.getByOrganizationId(orgId, 10000).stream()
                .map(JobSearchDTO::getJobType)
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{jobType}")
    @ApiOperation(value = "Get jobs by category (job type)", notes = "Returns jobs in a specific category within the requester's organization")
    public ResponseEntity<Response<List<JobSearchDTO>>> getByCategory(
            @PathVariable String jobType,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {

        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Organization context required.", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> jobs = jobSearchCache.getByCategoryAndOrganization(jobType, orgId, limit);
        return ResponseEntity.ok(new Response<>("success", "Jobs retrieved", jobs));
    }

    @PostMapping("/{jobId}/select")
    @ApiOperation(value = "Record job selection", notes = "Track job access for popularity ranking. Caller must have access to the job (same org/college).")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer jobId,
            HttpServletRequest request) {
        UserPrincipal principal = requirePrincipal();
        try {
            Job job = jobRepository.findActiveJobById(jobId)
                    .orElseThrow(() -> new IllegalArgumentException("Job not found or not active"));
            boolean canAccess = (job.getOrganizationId() != null && accessControlService.canAccessOrganization(principal, job.getOrganizationId()))
                    || (job.getCollegeId() != null && accessControlService.canAccessCollege(principal, job.getCollegeId()));
            if (!canAccess) {
                throw new AccessDeniedException("Access denied to this job");
            }
            jobSearchCache.recordUsage(jobId);
            return ResponseEntity.ok(
                new Response<>("success", "Selection recorded", null)
            );
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get job search statistics (org-scoped)")
    public ResponseEntity<Response<Map<String, Object>>> getStats(
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(
                new Response<>("error", "Organization context required for stats. Provide organizationId or ensure authentication.", null),
                HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> orgJobs = jobSearchCache.getByOrganizationId(orgId, 10000);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobs", orgJobs.size());
        stats.put("jobTypes", orgJobs.stream().map(JobSearchDTO::getJobType).filter(java.util.Objects::nonNull).distinct().count());
        stats.put("organizationId", orgId);

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{jobTitle}")
    @ApiOperation(value = "Check if job exists (within requester's organization)")
    public ResponseEntity<Response<Boolean>> exists(
            @PathVariable String jobTitle,
            @RequestParam(required = false) Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, organizationId, request);
        if (orgId == null) {
            return new ResponseEntity<>(
                new Response<>("error", "Organization context required.", null),
                HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, orgId);
        List<JobSearchDTO> orgJobs = jobSearchCache.getByOrganizationId(orgId, 10000);
        boolean existsInOrg = orgJobs.stream()
            .anyMatch(j -> jobTitle != null && jobTitle.equalsIgnoreCase(j.getJobTitle()));
        return ResponseEntity.ok(
            new Response<>("success", "Checked", existsInOrg)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh job cache", notes = "Reload jobs from database (admin)")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        accessControlService.requireSuperAdmin(principal);
        jobSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


