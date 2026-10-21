package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.PagedApplicationsResponse;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.PlacementJobService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import org.springframework.validation.annotation.Validated;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Controller for organization-scoped placement job management.
 * Used from /vasan (admin UI) for org/college scoped job management. Secured by ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin/placement/jobs")
@Slf4j
@Api(tags = "Placement Job Management APIs (Organization-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@Validated
public class PlacementJobController extends BaseController {

    @Autowired
    private PlacementJobService placementJobService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    // Required, not optional. Every guard on this controller reads
    // "if (accessControlService != null) accessControlService.requireAccessOrganization(...)", so a
    // missing bean silently skipped the org check on a surface that exposes job CRUD, application
    // status, bulk status, notes, CSV export and offer-letter/resume access. A security control
    // must not sit behind a null check — if it cannot be injected the app should fail to start.
    @Autowired
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private Environment environment;

    @Autowired
    private FeatureFlagService featureFlagService;

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    private Integer resolveOrganizationId(UserPrincipal principal, HttpServletRequest request, Integer requestedOrgId) {
        Integer authOrgId = null;
        if (principal == null) {
            try {
                authOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
            } catch (Exception ignored) {}
            return authOrgId;
        }
        boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
        boolean isGlobalSuper = isSuper && principal.getOrganizationId() == null && principal.getCollegeId() == null;

        if (isSuper && principal.getOrganizationId() != null) {
            return principal.getOrganizationId();
        }
        if (isSuper && principal.getOrganizationId() == null && principal.getCollegeId() != null && scopeResolutionService != null) {
            Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
            if (orgId != null) return orgId;
        }
        if (isGlobalSuper && requestedOrgId != null) {
            return requestedOrgId;
        }
        try {
            authOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        } catch (Exception ignored) {}
        return authOrgId;
    }

    private void requireOrgAccess(UserPrincipal principal, Integer organizationId) {
        if (principal == null) throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        // This whole controller is the org-scoped placement surface — the frontend only ever
        // calls it for a superadmin/org-level context, never for a plain college-scoped admin
        // (HiringDashboard.js/etc. branch to the college-scoped AdminJobController endpoints
        // whenever collegeId is set). AccessControlService.canAccessOrganization deliberately
        // resolves a college-scoped ADMIN/FACULTY-ADMIN's parent org and grants org-wide access
        // — correct for genuinely org-level features, but every method on this surface (job
        // CRUD, application status, bulk status, notes, CSV export, offer-letter/resume access)
        // then filters ONLY by organizationId with no collegeId check anywhere in
        // PlacementJobServiceImpl. That let a college-scoped admin who reached this controller
        // view and mutate every OTHER college's jobs and applications in the org, not just
        // their own — unlike the sibling AdminJobController surface, which correctly restricts
        // them. Block that class of principal here, at the single choke point every endpoint
        // already calls, rather than retrofitting a collegeId check into 17 service methods.
        boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
        if (!isSuper && principal.getOrganizationId() == null && principal.getCollegeId() != null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "College-scoped admins must use the college-scoped placements API for job/application management.");
        }
        if (accessControlService != null) {
            accessControlService.requireAccessOrganization(principal, organizationId);
        }
    }

    /**
     * Get all jobs for the admin's organization
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @GetMapping
    @ApiOperation(value = "Get all jobs for organization",
                  notes = "Returns all jobs for the admin's organization, including drafts and closed jobs. Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<List<Job>>> getJobsForOrganization(HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            List<Job> jobs = placementJobService.getJobsForOrganization(organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Jobs retrieved successfully", jobs),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching jobs: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch jobs: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get job by ID
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @GetMapping("/{jobId}")
    @ApiOperation(value = "Get job by ID",
                  notes = "Returns job details. Job must belong to the admin's organization. Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<Job>> getJobById(
            @PathVariable Integer jobId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            Job job = placementJobService.getJobById(jobId, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job retrieved successfully", job),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create a new job (Dev Only - accepts path variables for test data generation)
     * SECURITY: Only enabled when "dev" profile is active; otherwise returns 403.
     */
    @PostMapping("/organization/{organizationId}/created-by/{createdBy}")
    @ApiOperation(value = "Create job (dev only)",
                  notes = "Creates a new job with explicit organization and user IDs. Only available when spring.profiles.active includes 'dev'.")
    public ResponseEntity<Response<Job>> createJobDev(
            @PathVariable Integer organizationId,
            @PathVariable Integer createdBy,
            @Valid @RequestBody Job job) {
        if (environment == null || !Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            return new ResponseEntity<>(
                    new Response<>("error", "This endpoint is only available in dev profile", null),
                    HttpStatus.FORBIDDEN);
        }
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("error", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
            Integer effectiveOrgId = resolveOrganizationId(principal, null, organizationId);
            if (effectiveOrgId == null || !Objects.equals(effectiveOrgId, organizationId)) {
                return new ResponseEntity<>(new Response<>("error", "Organization mismatch", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            log.warn("DEV ENDPOINT USED: Creating job for organization {} by user {} (path variables)", organizationId, createdBy);
            Job createdJob = placementJobService.createJob(job, organizationId, createdBy);
            return new ResponseEntity<>(
                    new Response<>("success", "Job created successfully", createdJob),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.error("Business validation error creating job: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error creating job: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to create job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create a new job
     * SECURITY: Organization ID and user ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @PostMapping
    @ApiOperation(value = "Create a new job",
                  notes = "Creates a new job for the admin's organization. Organization ID and user ID are derived from authenticated user context.")
    public ResponseEntity<Response<Job>> createJob(
            @Valid @RequestBody Job job,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            Integer createdBy = securityContextUtil.getAuthenticatedUserId(request);

            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            if (createdBy == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "User ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            Job createdJob = placementJobService.createJob(job, organizationId, createdBy);
            return new ResponseEntity<>(
                    new Response<>("success", "Job created successfully", createdJob),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.error("Business validation error creating job: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error creating job: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to create job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update an existing job
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @PutMapping("/{jobId}")
    @ApiOperation(value = "Update job",
                  notes = "Updates an existing job. Job must belong to the admin's organization. Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<Job>> updateJob(
            @PathVariable Integer jobId,
            @Valid @RequestBody Job job,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            Job updatedJob = placementJobService.updateJob(jobId, job, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job updated successfully", updatedJob),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // Concurrent-edit version conflict from the manual client-version-vs-DB check in
            // PlacementJobServiceImpl.updateJob — kept as its own catch (rather than falling into
            // the generic 500 below) so the frontend can reliably detect a 409 and offer "reload"
            // instead of a generic error toast. Mirrors AdminJobController.updateJob.
            return new ResponseEntity<>(
                    new Response<>("error", e.getReason(), null),
                    e.getStatus());
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Concurrent write lost the optimistic-lock race at save() time (the manual version
            // check above only catches a stale client-supplied version; a genuine race between
            // that check and jobRepository.save() still relies on JPA's own @Version check).
            // Surface a clean, retryable 409 instead of letting it fall into the generic catch
            // below as an opaque 500. Mirrors AdminJobController.updateJob and the JobApplication
            // status endpoints in this controller.
            log.warn("Optimistic lock conflict updating job {}: {}", jobId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "This job was updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error updating job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a job (soft delete). Job must belong to the admin's organization.
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored).
     * This is the only delete path for org-wide (collegeId == null) jobs — the college-scoped
     * AdminJobController's delete endpoint explicitly refuses to delete those.
     */
    @DeleteMapping("/{jobId}")
    @ApiOperation(value = "Delete job",
                  notes = "Soft deletes a job. Job must belong to the admin's organization. Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<String>> deleteJob(
            @PathVariable Integer jobId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            placementJobService.deleteJob(jobId, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job deleted successfully", null),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error deleting job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to delete job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Open/close a job
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @PostMapping("/{jobId}/status")
    @ApiOperation(value = "Set job status (open/close)",
                  notes = "Opens or closes a job. Job must belong to the admin's organization. Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<Job>> setJobStatus(
            @PathVariable Integer jobId,
            @RequestBody Map<String, Boolean> requestBody,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            if (requestBody == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Request body is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            Object isActiveObj = requestBody.get("isActive");
            if (isActiveObj == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "isActive field is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (!(isActiveObj instanceof Boolean)) {
                return new ResponseEntity<>(
                        new Response<>("error", "isActive must be a boolean", null),
                        HttpStatus.BAD_REQUEST);
            }
            Boolean isActive = (Boolean) isActiveObj;
            Job updatedJob = placementJobService.setJobStatus(jobId, isActive, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job status updated successfully", updatedJob),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error updating job status {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update job status: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    /**
     * Get applications for a job with optional pagination and filters.
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored).
     * Backward compatible: if page/size not sent, returns first 20 (page=0, size=20).
     */
    @GetMapping("/{jobId}/applications")
    @ApiOperation(value = "Get applications for a job",
                  notes = "Returns applications for a job with pagination (totalElements, totalPages in data) and optional filters. Job must belong to the admin's organization.")
    public ResponseEntity<Response<PagedApplicationsResponse>> getApplicationsForJob(
            @PathVariable Integer jobId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false) String applicationStatus,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer classId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> skills,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            int safePage = page < 0 ? DEFAULT_PAGE : page;
            int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
            Pageable pageable = PageRequest.of(safePage, safeSize);
            Page<JobApplication> pageResult = placementJobService.getApplicationsForJobPaginated(
                    jobId, organizationId, pageable, applicationStatus, minScore, maxScore, appliedAfter, appliedBefore,
                    source, programId, classId, departmentId, batchId, search, skills);
            PagedApplicationsResponse paged = PagedApplicationsResponse.builder()
                    .content(pageResult.getContent())
                    .totalElements(pageResult.getTotalElements())
                    .totalPages(pageResult.getTotalPages())
                    .size(pageResult.getSize())
                    .number(pageResult.getNumber())
                    .first(pageResult.isFirst())
                    .last(pageResult.isLast())
                    .build();
            return new ResponseEntity<>(
                    new Response<>("success", "Applications retrieved successfully", paged),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching applications for job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch applications: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update internal notes for an application.
     * SECURITY: Organization ID from authenticated context.
     */
    @PatchMapping("/applications/{applicationId}/notes")
    @ApiOperation(value = "Update application internal notes",
                  notes = "Sets internal notes for the application. Organization ID from authenticated context.")
    public ResponseEntity<Response<JobApplication>> updateApplicationNotes(
            @PathVariable Integer applicationId,
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            // SECURITY: requestBody is a raw Map<String, Object> deserialized straight from client
            // JSON — a crafted request can send any JSON type here (e.g. internalNotes as a
            // number/object/array instead of a string, or version as a string instead of a number).
            // The previous blind (String)/(Number) casts threw an unguarded ClassCastException that
            // fell through to the generic catch(Exception) below and surfaced as an opaque 500,
            // instead of a clean 400 — the same class of bug already fixed on the bulk/single
            // applicationStatus endpoints in this controller. Validate the JSON types explicitly.
            if (requestBody != null && requestBody.get("internalNotes") != null && !(requestBody.get("internalNotes") instanceof String)) {
                return new ResponseEntity<>(
                        new Response<>("error", "internalNotes must be a string", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (requestBody != null && requestBody.get("version") != null && !(requestBody.get("version") instanceof Number)) {
                return new ResponseEntity<>(
                        new Response<>("error", "version must be a number", null),
                        HttpStatus.BAD_REQUEST);
            }
            String internalNotes = requestBody != null && requestBody.containsKey("internalNotes")
                    ? (String) requestBody.get("internalNotes") : null;
            // Item 1 of the placements re-audit: optimistic-lock version, mirroring
            // AdminJobController.updateApplicationNotes exactly.
            Long version = requestBody != null && requestBody.get("version") != null
                    ? ((Number) requestBody.get("version")).longValue() : null;
            JobApplication updated = placementJobService.updateApplicationNotes(applicationId, internalNotes, organizationId, version);
            return new ResponseEntity<>(
                    new Response<>("success", "Notes updated successfully", updated),
                    HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // Manual stale-version detection from the service.
            return new ResponseEntity<>(
                    new Response<>("error", e.getReason(), null),
                    e.getStatus());
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Genuine race after the manual check: @Version detects the second writer at flush.
            log.warn("Optimistic lock conflict updating notes for application {}: {}", applicationId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "These notes were updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error updating notes for application {}: ", applicationId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update notes: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Bulk update application status (shortlist, reject, etc.). Max 100 per request.
     * SECURITY: Organization ID and user ID from authenticated context.
     */
    @PostMapping("/applications/bulk-status")
    @ApiOperation(value = "Bulk update application status",
                  notes = "Updates status for multiple applications (max 100). Body: applicationIds (array), newStatus (string).")
    public ResponseEntity<Response<Map<String, Object>>> bulkUpdateApplicationStatus(
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            Integer updatedBy = securityContextUtil.getAuthenticatedUserId(request);
            if (organizationId == null || updatedBy == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization or user context not found", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            if (requestBody == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Request body is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            Object idsObj = requestBody.get("applicationIds");
            Object newStatusObj = requestBody.get("newStatus");
            // SECURITY: same hardening as AdminJobController.bulkUpdateApplicationStatus — this is
            // a raw Map<String, Object> from client JSON, so a crafted request can send any JSON
            // type here (applicationIds as a non-array, newStatus as a non-string). The previous
            // blind (String)/(List<?>) casts threw an unguarded ClassCastException that fell
            // through to the generic catch(Exception) and returned an opaque 500 instead of a
            // clean 400. No status mutation happens before this point either way.
            if (idsObj != null && !(idsObj instanceof List)) {
                return new ResponseEntity<>(
                        new Response<>("error", "applicationIds must be an array", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (newStatusObj != null && !(newStatusObj instanceof String)) {
                return new ResponseEntity<>(
                        new Response<>("error", "newStatus must be a string", null),
                        HttpStatus.BAD_REQUEST);
            }
            String newStatus = (String) newStatusObj;
            if (idsObj == null || newStatus == null || newStatus.trim().isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "applicationIds and newStatus are required", null),
                        HttpStatus.BAD_REQUEST);
            }
            List<?> idsList = (List<?>) idsObj;
            if (idsList.size() > 100) {
                return new ResponseEntity<>(
                        new Response<>("error", "Maximum 100 applications per bulk update", null),
                        HttpStatus.BAD_REQUEST);
            }
            List<Integer> applicationIds = new java.util.ArrayList<>();
            for (Object o : idsList) {
                if (o instanceof Number) applicationIds.add(((Number) o).intValue());
            }
            if (applicationIds.isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "applicationIds must be a non-empty array of numbers", null),
                        HttpStatus.BAD_REQUEST);
            }
            String rejectionReason = requestBody.get("rejectionReason") != null
                    ? requestBody.get("rejectionReason").toString().trim() : null;
            if (rejectionReason != null && rejectionReason.isEmpty()) rejectionReason = null;
            String assessmentUrl = requestBody.get("assessmentUrl") != null
                    ? requestBody.get("assessmentUrl").toString().trim() : null;
            if (assessmentUrl != null && assessmentUrl.isEmpty()) assessmentUrl = null;
            Map<String, Object> result = placementJobService.bulkUpdateApplicationStatus(
                    applicationIds, newStatus.trim(), organizationId, updatedBy, assessmentUrl, rejectionReason);
            @SuppressWarnings("unchecked")
            List<?> failedItems = (List<?>) result.get("failed");
            String message = (failedItems != null && !failedItems.isEmpty())
                    ? "Bulk status update completed with " + failedItems.size() + " failure(s)"
                    : "Bulk status update completed";
            return new ResponseEntity<>(
                    new Response<>("success", message, result),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error in bulk status update: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Bulk update failed: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update application status (move through pipeline)
     * SECURITY: Organization ID and user ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @PostMapping("/applications/{applicationId}/status")
    @ApiOperation(value = "Update application status",
                  notes = "Moves application through pipeline. Valid statuses: SHORTLISTED, INTERVIEW, OFFERED, REJECTED, HIRED. Organization ID and user ID are derived from authenticated user context.")
    public ResponseEntity<Response<JobApplication>> updateApplicationStatus(
            @PathVariable Integer applicationId,
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            if (applicationId == null || applicationId <= 0) {
                return new ResponseEntity<>(new Response<>("error", "applicationId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            Integer updatedBy = securityContextUtil.getAuthenticatedUserId(request);

            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            if (updatedBy == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "User ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }

            if (requestBody == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Request body is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            Object newStatusObj = requestBody.get("newStatus");
            // SECURITY: same hardening as the bulk endpoints above — reject a non-string newStatus
            // (e.g. a JSON number/array/object) with a clean 400 instead of an unguarded
            // ClassCastException surfacing as a 500. No status mutation happens before this point.
            if (newStatusObj != null && !(newStatusObj instanceof String)) {
                return new ResponseEntity<>(
                        new Response<>("error", "newStatus must be a string", null),
                        HttpStatus.BAD_REQUEST);
            }
            String newStatus = (String) newStatusObj;
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "newStatus field is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            String rejectionReason = requestBody.get("rejectionReason") != null
                    ? requestBody.get("rejectionReason").toString().trim() : null;
            if (rejectionReason != null && rejectionReason.isEmpty()) rejectionReason = null;
            String assessmentUrl = requestBody.get("assessmentUrl") != null
                    ? requestBody.get("assessmentUrl").toString().trim() : null;
            if (assessmentUrl != null && assessmentUrl.isEmpty()) assessmentUrl = null;

            JobApplication updatedApplication = placementJobService.updateApplicationStatus(
                    applicationId, newStatus.trim(), organizationId, updatedBy, assessmentUrl, rejectionReason);
            return new ResponseEntity<>(
                    new Response<>("success", "Application status updated successfully", updatedApplication),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Concurrent write lost the optimistic-lock race — surface a clean, retryable 409
            // instead of letting it fall into the generic catch below as an opaque 500. Matches
            // GlobalExceptionHandler's handler for this exception type, which never gets a chance
            // to run here since this local catch(Exception) would otherwise intercept it first.
            // Same gap as JobController.respondToOffer/withdrawApplication and
            // AdminJobController.updateApplicationStatus.
            log.warn("Optimistic lock conflict updating application {} status: {}", applicationId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "This record was modified by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error updating application status {}: ", applicationId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update application status: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Export applications as CSV. Optional jobId: if provided, export for that job only; else all for org.
     * SECURITY: Organization ID from authenticated context.
     */
    @GetMapping(value = "/applications/export", produces = "text/csv; charset=UTF-8")
    @ApiOperation(value = "Export applications as CSV",
                  notes = "Returns CSV file. Use ?jobId= to export for a single job, or omit for all org applications. " +
                          "When jobId is provided, applicationStatus/source/departmentId/programId/batchId/search filter the export the same way they filter the on-screen table.")
    public ResponseEntity<byte[]> exportApplicationsCsv(
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) String applicationStatus,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        try {
            if (jobId != null && jobId <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new byte[0]);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new byte[0]);
            }
            requireOrgAccess(principal, organizationId);
            byte[] csv = placementJobService.exportApplicationsAsCsv(jobId, organizationId, applicationStatus, source,
                    departmentId, programId, batchId, search);
            String filename = jobId != null ? "applications-job-" + jobId + ".csv" : "applications-export.csv";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(csv.length);
            return new ResponseEntity<>(csv, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error exporting applications: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new byte[0]);
        }
    }

    /**
     * Get application status history (timeline). Gap 8.2.
     * SECURITY: Organization-scoped.
     */
    @GetMapping("/applications/{applicationId}/history")
    @ApiOperation(value = "Get application status history", notes = "Returns timeline of status changes. Org-scoped.")
    public ResponseEntity<Response<List<JobApplicationStatusHistory>>> getApplicationHistory(
            @PathVariable Integer applicationId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(new Response<>("error", "Organization context required", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            List<JobApplicationStatusHistory> history = placementJobService.getApplicationHistory(applicationId, organizationId);
            return new ResponseEntity<>(new Response<>("success", "History retrieved", history), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get resume preview URL for an application (for dashboard inline preview or link).
     * SECURITY: Organization-scoped.
     */
    @GetMapping("/applications/{applicationId}/resume-preview")
    @ApiOperation(value = "Get resume preview URL", notes = "Returns URL for the application's resume. Use in iframe or new tab.")
    public ResponseEntity<Response<Map<String, Object>>> getResumePreview(
            @PathVariable Integer applicationId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(new Response<>("error", "Organization context required", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            Map<String, Object> data = placementJobService.getResumePreviewUrl(applicationId, organizationId);
            return new ResponseEntity<>(new Response<>("success", "Resume URL retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Hiring metrics for dashboard. Optional jobId, date range, and department/batch/program/class filters (Phase 5 - 15.1, 15.3).
     */
    @GetMapping("/applications/metrics")
    @ApiOperation(value = "Hiring metrics", notes = "Returns counts by status and optional avgTimeToShortlistMs. Supports department/batch/program/class filters.")
    public ResponseEntity<Response<Map<String, Object>>> getHiringMetrics(
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) Integer classId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(new Response<>("error", "Organization context required", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            Map<String, Object> data = placementJobService.getHiringMetrics(jobId, organizationId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId, classId);
            return new ResponseEntity<>(new Response<>("success", "Metrics retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Funnel counts for visualization (Applied → Shortlisted → Interview → Offered → Hired). Phase 5 - 15.2, 15.3.
     */
    @GetMapping("/applications/funnel")
    @ApiOperation(value = "Hiring funnel", notes = "Returns ordered stages with counts for funnel chart. Supports department/batch/program/class filters.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getHiringFunnel(
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) Integer classId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(new Response<>("error", "Organization context required", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            List<Map<String, Object>> data = placementJobService.getHiringFunnel(jobId, organizationId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId, classId);
            return new ResponseEntity<>(new Response<>("success", "Funnel retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Company-wise hiring report (Phase 5 - Gap 15.4). Org-scoped.
     */
    @GetMapping("/applications/company-report")
    @ApiOperation(value = "Company-wise hiring report", notes = "Returns per-company/per-job application counts. Supports department/batch/program filters.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getCompanyWiseReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(new Response<>("error", "Organization context required", null), HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);
            List<Map<String, Object>> data = placementJobService.getCompanyWiseHiringReport(organizationId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId);
            return new ResponseEntity<>(new Response<>("success", "Company report retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get all applications for organization
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     */
    @GetMapping("/applications")
    @ApiOperation(value = "Get all applications for organization",
                  notes = "Returns a bounded page of applications for the admin's organization (default 20, max 100 per page). Organization ID is derived from authenticated user context.")
    public ResponseEntity<Response<PagedApplicationsResponse>> getAllApplicationsForOrganization(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer organizationId = resolveOrganizationId(principal, request, null);
            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }
            requireOrgAccess(principal, organizationId);

            // Previously returned every non-deleted application the org has ever received in one
            // unbounded response — bounded here the same way the per-job listing already is.
            int safePage = page < 0 ? DEFAULT_PAGE : page;
            int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
            Pageable pageable = PageRequest.of(safePage, safeSize);
            Page<JobApplication> pageResult = placementJobService.getAllApplicationsForOrganizationPaginated(organizationId, pageable);
            PagedApplicationsResponse paged = PagedApplicationsResponse.builder()
                    .content(pageResult.getContent())
                    .totalElements(pageResult.getTotalElements())
                    .totalPages(pageResult.getTotalPages())
                    .size(pageResult.getSize())
                    .number(pageResult.getNumber())
                    .first(pageResult.isFirst())
                    .last(pageResult.isLast())
                    .build();
            return new ResponseEntity<>(
                    new Response<>("success", "Applications retrieved successfully", paged),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching applications: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch applications: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


