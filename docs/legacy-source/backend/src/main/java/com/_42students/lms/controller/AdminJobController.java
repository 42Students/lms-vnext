package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.model.User;
import com._42students.lms.repository.UserDao;
import com._42students.lms.service.AdminJobService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Controller for Admin (college-scoped) job management.
 * Access: collegeId is validated via AccessControlService (super-admin or college admin for that college).
 */
@RestController
@RequestMapping("/api/v1/admin/jobs")
@Slf4j
@Api(tags = "Admin Job Management APIs (College-Scoped)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminJobController extends BaseController {

    @Autowired
    private AdminJobService adminJobService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private UserDao userDao;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private FeatureFlagService featureFlagService;

    @Autowired(required = false)
    private com._42students.lms.service.ScreeningService screeningService;

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    private static boolean isInvalidCollegeId(Integer collegeId) {
        return collegeId == null || collegeId <= 0;
    }

    /**
     * Resolve job context (collegeId) for deep links - Phase 6, Gap 19.1.
     * When URL has jobId but no collegeId, call this to derive collegeId from the job.
     */
    @GetMapping("/{jobId}/context")
    @ApiOperation(value = "Resolve job context", notes = "Returns collegeId for deep links. User must have access to the job.")
    public ResponseEntity<Response<Map<String, Object>>> getJobContext(
            @PathVariable Integer jobId,
            HttpServletRequest request) {
        try {
            com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("error", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            Map<String, Object> context = adminJobService.resolveJobContext(jobId);
            Integer collegeId = (Integer) context.get("collegeId");
            Integer organizationId = (Integer) context.get("organizationId");
            if (collegeId != null) {
                requireScopedSuperadminCollegeWithinScope(principal, collegeId);
                accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
            } else if (organizationId != null) {
                accessControlService.requireAccessOrganization(principal, organizationId);
            } else {
                return new ResponseEntity<>(new Response<>("error", "Job has no college or organization context", null), HttpStatus.BAD_REQUEST);
            }
            return new ResponseEntity<>(new Response<>("success", "Context resolved", context), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    @ApiOperation(value = "Get all jobs for college", notes = "Returns all jobs for the given collegeId.")
    public ResponseEntity<Response<List<Job>>> getAllJobs(@RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            List<Job> jobs = adminJobService.getAllJobs(collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Jobs fetched successfully", jobs),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching jobs for college {}: ", collegeId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch jobs: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/search")
    @ApiOperation(value = "Browse all drives, paginated", notes = "Server-side paginated/filtered/searched job list for the 'All Drives' view - unlike GET /, which loads the whole college history unbounded.")
    public ResponseEntity<Response<Map<String, Object>>> searchAllJobs(
            @RequestParam Integer collegeId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "postedDate") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Map<String, Object> payload = adminJobService.getAllJobsPaginated(collegeId, page, size, status, search, sortBy, sortDir);
            return new ResponseEntity<>(
                    new Response<>("success", "Jobs fetched successfully", payload),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error searching jobs for college {}: ", collegeId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch jobs: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{jobId}")
    @ApiOperation(value = "Get job by ID", notes = "Returns job details. Job must belong to the given college.")
    public ResponseEntity<Response<Job>> getJobById(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Job job = adminJobService.getJobById(jobId, collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job fetched successfully", job),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch job: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    @ApiOperation(value = "Create job", notes = "Creates a new job for the given college.")
    public ResponseEntity<Response<Job>> createJob(
            @Valid @RequestBody Job job,
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer createdBy) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            // Always use server-side user ID for audit; ignore client-supplied createdBy
            Integer creatorId = securityContextUtil.getAuthenticatedUserId(null);
            if (creatorId == null) {
                creatorId = (principal != null && principal.getId() != null) ? principal.getId() : 0;
            }
            Job createdJob = adminJobService.createJob(job, collegeId, creatorId);
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

    @PutMapping("/{jobId}")
    @ApiOperation(value = "Update job", notes = "Updates an existing job. Job must belong to the given college.")
    public ResponseEntity<Response<Job>> updateJob(
            @PathVariable Integer jobId,
            @Valid @RequestBody Job job,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Job updatedJob = adminJobService.updateJob(jobId, job, collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Job updated successfully", updatedJob),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // Concurrent-edit version conflict — kept as its own catch (rather than falling into
            // the generic 500 below) so the frontend can reliably detect a 409 and offer "reload"
            // instead of a generic error toast.
            return new ResponseEntity<>(
                    new Response<>("error", e.getReason(), null),
                    e.getStatus());
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Concurrent write lost the optimistic-lock race at save() time (the manual version
            // check above only catches a stale client-supplied version; a genuine race between
            // that check and jobRepository.save() still relies on JPA's own @Version check).
            // Surface a clean, retryable 409 instead of letting it fall into the generic catch
            // below as an opaque 500. Matches GlobalExceptionHandler's handler for this exception
            // type, which never gets a chance to run here since this local catch(Exception) would
            // otherwise intercept it first. Same gap already fixed for the JobApplication status
            // endpoints in this controller.
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

    @PostMapping("/bulk-status")
    @ApiOperation(value = "Bulk open/close drives", notes = "Sets isActive for multiple drives at once (max 100). Body: jobIds (array), isActive (boolean).")
    public ResponseEntity<Response<Map<String, Object>>> bulkUpdateJobStatus(
            @RequestParam Integer collegeId,
            @RequestBody Map<String, Object> requestBody) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Object idsObj = requestBody != null ? requestBody.get("jobIds") : null;
            Boolean isActive = requestBody != null ? (Boolean) requestBody.get("isActive") : null;
            if (idsObj == null || isActive == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "jobIds and isActive are required", null),
                        HttpStatus.BAD_REQUEST);
            }
            List<Integer> jobIds = new java.util.ArrayList<>();
            for (Object o : (List<?>) idsObj) {
                if (o instanceof Number) jobIds.add(((Number) o).intValue());
            }
            if (jobIds.isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "jobIds must be a non-empty array of numbers", null),
                        HttpStatus.BAD_REQUEST);
            }
            Map<String, Object> result = adminJobService.bulkUpdateJobStatus(collegeId, jobIds, isActive);
            return new ResponseEntity<>(
                    new Response<>("success", "Drives updated", result),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error bulk-updating drive status for college {}: ", collegeId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update drives: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Extending a drive's application deadline as a single, discrete action.
     *
     * <p>applicationDeadline is derived, not stored directly — Job.applicationDeadline is
     * recomputed on every update from the matching entry in importantDates
     * (deriveApplicationDeadlineFromImportantDates), so a naive "set the field and save" quick
     * action would appear to work and then silently revert on the very next save, because the old
     * importantDates entry is still there and wins. This finds that entry (or creates one if the
     * drive somehow has none) and moves it, so the two stay in agreement.
     *
     * <p>The full edit form could always do this — applicationDeadline is one of importantDates'
     * entries — but only by opening the whole form, finding the row, and re-entering a date. This
     * is the one-click version of the same change.
     */
    @PostMapping("/{jobId}/extend-deadline")
    @ApiOperation(value = "Extend a drive's application deadline",
            notes = "Updates the 'Application deadline' entry in importantDates, which applicationDeadline is derived from.")
    public ResponseEntity<Response<Job>> extendDeadline(
            @PathVariable Integer jobId,
            @RequestBody Map<String, String> requestBody,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            String newDeadlineRaw = requestBody != null ? requestBody.get("newDeadline") : null;
            if (newDeadlineRaw == null || newDeadlineRaw.trim().isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "newDeadline is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            java.time.LocalDateTime newDeadline;
            try {
                newDeadline = java.time.LocalDateTime.parse(newDeadlineRaw.trim().replace(" ", "T"));
            } catch (Exception e) {
                return new ResponseEntity<>(
                        new Response<>("error", "newDeadline must be an ISO date-time", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (newDeadline.isBefore(java.time.LocalDateTime.now())) {
                return new ResponseEntity<>(
                        new Response<>("error", "The new deadline must be in the future", null),
                        HttpStatus.BAD_REQUEST);
            }
            Job updatedJob = adminJobService.extendApplicationDeadline(jobId, collegeId, newDeadline);
            return new ResponseEntity<>(
                    new Response<>("success", "Deadline extended", updatedJob),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error extending deadline for job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to extend deadline", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{jobId}/status")
    @ApiOperation(value = "Set job status (open/close)", notes = "Opens or closes a job for the given college.")
    public ResponseEntity<Response<Job>> setJobStatus(
            @PathVariable Integer jobId,
            @RequestBody Map<String, Boolean> requestBody,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Boolean isActive = requestBody != null ? requestBody.get("isActive") : null;
            if (isActive == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "isActive field is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            Job job = adminJobService.getJobById(jobId, collegeId);
            job.setIsActive(isActive);
            Job updatedJob = adminJobService.updateJob(jobId, job, collegeId);
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

    @GetMapping("/{jobId}/applications")
    @ApiOperation(value = "Get applications for job", notes = "Returns applications with pagination and filters. Job must belong to the given college.")
    public ResponseEntity<Response<Map<String, Object>>> getApplications(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false) String applicationStatus,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) String search) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            int safePage = page < 0 ? DEFAULT_PAGE : page;
            int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
            Pageable pageable = PageRequest.of(safePage, safeSize);
            Page<JobApplication> pageResult = adminJobService.getJobApplicationsPaginated(
                    jobId, collegeId, pageable, applicationStatus, minScore, maxScore, appliedAfter, appliedBefore,
                    source, departmentId, programId, batchId, search);
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("content", pageResult.getContent());
            payload.put("totalElements", pageResult.getTotalElements());
            payload.put("totalPages", pageResult.getTotalPages());
            payload.put("number", pageResult.getNumber());
            payload.put("size", pageResult.getSize());
            // Resolve statusUpdatedBy user IDs to names for display (5.1)
            java.util.Set<Integer> updaterIds = new java.util.HashSet<>();
            for (JobApplication a : pageResult.getContent()) {
                if (a.getStatusUpdatedBy() != null) updaterIds.add(a.getStatusUpdatedBy());
            }
            java.util.Map<String, String> userNames = new java.util.HashMap<>();
            for (Integer uid : updaterIds) {
                try {
                    User u = userDao.findById(uid != null ? uid.longValue() : 0L).orElse(null);
                    if (u != null && u.getName() != null && !u.getName().trim().isEmpty()) {
                        userNames.put(String.valueOf(uid), u.getName().trim());
                    } else if (u != null && u.getUserName() != null && !u.getUserName().trim().isEmpty()) {
                        userNames.put(String.valueOf(uid), u.getUserName().trim());
                    }
                } catch (Exception ignored) { /* skip invalid IDs */ }
            }
            payload.put("statusUpdatedByNames", userNames);
            return new ResponseEntity<>(
                    new Response<>("success", "Applications fetched successfully", payload),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching applications for job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch applications: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{jobId}/applications/bulk-status")
    @ApiOperation(value = "Bulk update application status", notes = "Updates status for multiple applications (max 100). Body: applicationIds (array), newStatus (string).")
    public ResponseEntity<Response<Map<String, Object>>> bulkUpdateApplicationStatus(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId,
            @RequestBody Map<String, Object> requestBody) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Object idsObj = requestBody != null ? requestBody.get("applicationIds") : null;
            Object newStatusObj = requestBody != null ? requestBody.get("newStatus") : null;
            // SECURITY: requestBody is a raw Map<String, Object> deserialized straight from client
            // JSON — a malicious/malformed request can send any JSON type for these fields (e.g.
            // applicationIds as a string/object instead of an array, or newStatus as a number/array
            // instead of a string). Blind (String)/(List<?>) casts below used to throw an unguarded
            // ClassCastException that fell through to the generic catch(Exception) and surfaced as
            // an opaque 500, instead of the clean 400 every other malformed-input case here returns.
            // No status mutation occurs before this check either way, but validate the JSON types
            // explicitly so the error path is consistent and doesn't leak a raw exception message.
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
            Integer updaterId = securityContextUtil.getAuthenticatedUserId(null);
            if (updaterId == null) {
                updaterId = (principal != null && principal.getId() != null) ? principal.getId() : 0;
            }
            String assessmentUrl = requestBody != null && requestBody.get("assessmentUrl") != null
                    ? requestBody.get("assessmentUrl").toString().trim() : null;
            if (assessmentUrl != null && assessmentUrl.isEmpty()) assessmentUrl = null;
            Object saveAssessmentObj = requestBody != null ? requestBody.get("saveAssessmentUrlToJob") : null;
            Boolean saveAssessmentUrlToJob = saveAssessmentObj == null
                    ? Boolean.TRUE
                    : Boolean.valueOf(saveAssessmentObj.toString());
            String rejectionReason = requestBody != null && requestBody.get("rejectionReason") != null
                    ? requestBody.get("rejectionReason").toString().trim() : null;
            if (rejectionReason != null && rejectionReason.isEmpty()) rejectionReason = null;
            Map<String, Object> result = adminJobService.bulkUpdateApplicationStatus(
                    jobId, collegeId, applicationIds, newStatus.trim(), updaterId, assessmentUrl,
                    saveAssessmentUrlToJob, rejectionReason);
            return new ResponseEntity<>(
                    new Response<>("success", "Bulk status update completed", result),
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

    @GetMapping("/{jobId}/applications/{applicationId}")
    @ApiOperation(value = "Get application by ID", notes = "Returns one application scoped to the job and college, independent of the current list filter.")
    public ResponseEntity<Response<JobApplication>> getApplication(
            @PathVariable Integer jobId,
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            JobApplication application = adminJobService.getJobApplication(applicationId, jobId, collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Application retrieved", application),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching application {} for job {}: ", applicationId, jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch application", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{jobId}/applications/{applicationId}/status")
    @ApiOperation(value = "Update application status", notes = "Updates application status. Job must belong to the given college.")
    public ResponseEntity<Response<JobApplication>> updateApplicationStatus(
            @PathVariable Integer jobId,
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer updatedBy,
            @RequestBody Map<String, Object> requestBody) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            String newStatus = requestBody != null && requestBody.get("applicationStatus") != null
                    ? requestBody.get("applicationStatus").toString() : null;
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return new ResponseEntity<>(
                        new Response<>("error", "applicationStatus is required", null),
                        HttpStatus.BAD_REQUEST);
            }
            String assessmentUrl = requestBody != null && requestBody.get("assessmentUrl") != null
                    ? requestBody.get("assessmentUrl").toString().trim() : null;
            if (assessmentUrl != null && assessmentUrl.isEmpty()) assessmentUrl = null;
            Object saveAssessmentObj = requestBody != null ? requestBody.get("saveAssessmentUrlToJob") : null;
            Boolean saveAssessmentUrlToJob = saveAssessmentObj == null
                    ? Boolean.TRUE
                    : Boolean.valueOf(saveAssessmentObj.toString());
            String rejectionReason = requestBody != null && requestBody.get("rejectionReason") != null
                    ? requestBody.get("rejectionReason").toString().trim() : null;
            if (rejectionReason != null && rejectionReason.isEmpty()) rejectionReason = null;
            // Always use server-side user ID for audit; ignore client-supplied updatedBy
            Integer updaterId = securityContextUtil.getAuthenticatedUserId(null);
            if (updaterId == null) {
                updaterId = (principal != null && principal.getId() != null) ? principal.getId() : 0;
            }
            JobApplication updated = adminJobService.updateApplicationStatus(
                    applicationId, newStatus.trim(), jobId, collegeId, updaterId, assessmentUrl,
                    saveAssessmentUrlToJob, rejectionReason);
            return new ResponseEntity<>(
                    new Response<>("success", "Application status updated successfully", updated),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Concurrent write lost the optimistic-lock race (e.g. two admins, or an admin and a
            // learner-triggered cascade, updating the same application at once) — surface a clean,
            // retryable 409 instead of letting it fall into the generic catch below as an opaque
            // 500. Matches GlobalExceptionHandler's handler for this exception type, which never
            // gets a chance to run here since this local catch(Exception) would otherwise
            // intercept it first. Same gap as JobController.respondToOffer/withdrawApplication.
            log.warn("Optimistic lock conflict updating application {} status: {}", applicationId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "This record was modified by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error updating application {} status: ", applicationId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to update status: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(value = "/{jobId}/applications/export", produces = "text/csv; charset=UTF-8")
    @ApiOperation(value = "Export applications as CSV", notes = "Returns CSV file for job applications. Job must belong to the given college.")
    public ResponseEntity<byte[]> exportApplicationsCsv(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId,
            @RequestParam(required = false) String applicationStatus,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) String search) {
        if (isInvalidCollegeId(collegeId)) {
            return ResponseEntity.badRequest().body(new byte[0]);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            byte[] csv = adminJobService.exportApplicationsAsCsv(jobId, collegeId, applicationStatus, source, departmentId, programId, batchId, search);
            String filename = "applications-job-" + jobId + ".csv";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(csv.length);
            return new ResponseEntity<>(csv, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error exporting applications for job {}: ", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new byte[0]);
        }
    }

    @GetMapping("/{jobId}/applications/{applicationId}/history")
    @ApiOperation(value = "Get application status history", notes = "Returns timeline of status changes. Gap 8.2. Job must belong to the given college.")
    public ResponseEntity<Response<List<JobApplicationStatusHistory>>> getApplicationHistory(
            @PathVariable Integer jobId,
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            List<JobApplicationStatusHistory> history = adminJobService.getApplicationHistory(applicationId, jobId, collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "History retrieved", history),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching history for application {}: ", applicationId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch history: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PatchMapping("/{jobId}/applications/{applicationId}/notes")
    @ApiOperation(value = "Update application internal notes", notes = "Updates internal notes for an application. Job must belong to the given college.")
    public ResponseEntity<Response<JobApplication>> updateApplicationNotes(
            @PathVariable Integer jobId,
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId,
            @RequestBody Map<String, Object> requestBody) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            String internalNotes = requestBody != null && requestBody.get("internalNotes") != null
                    ? requestBody.get("internalNotes").toString().trim() : null;
            if (internalNotes != null && internalNotes.isEmpty()) internalNotes = null;
            // SECURITY: requestBody is a raw Map<String, Object> from client JSON — a crafted
            // request can send version as a non-number (e.g. a string/object/array), which would
            // throw an unguarded ClassCastException on the blind (Number) cast below, surfacing as
            // an opaque 500 instead of a clean 400. Same class of bug already fixed on the
            // applicationIds/newStatus fields on the bulk-status endpoints in this controller.
            if (requestBody != null && requestBody.get("version") != null && !(requestBody.get("version") instanceof Number)) {
                return new ResponseEntity<>(
                        new Response<>("error", "version must be a number", null),
                        HttpStatus.BAD_REQUEST);
            }
            Long version = requestBody != null && requestBody.get("version") != null
                    ? ((Number) requestBody.get("version")).longValue() : null;
            JobApplication updated = adminJobService.updateApplicationNotes(applicationId, internalNotes, jobId, collegeId, version);
            return new ResponseEntity<>(
                    new Response<>("success", "Internal notes updated successfully", updated),
                    HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getReason(), null),
                    e.getStatus());
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
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

    @PatchMapping("/{jobId}/applications/{applicationId}/offer-letter")
    @ApiOperation(value = "Attach offer letter", notes = "Attaches an offer-letter document URL to an OFFERED/HIRED application.")
    public ResponseEntity<Response<JobApplication>> attachOfferLetter(
            @PathVariable Integer jobId,
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId,
            @RequestBody Map<String, Object> requestBody) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            String offerLetterUrl = requestBody != null && requestBody.get("offerLetterUrl") != null
                    ? requestBody.get("offerLetterUrl").toString() : null;
            JobApplication updated = adminJobService.attachOfferLetter(applicationId, offerLetterUrl, jobId, collegeId);
            return new ResponseEntity<>(new Response<>("success", "Offer letter attached", updated), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error attaching offer letter for application {}: ", applicationId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to attach offer letter: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Hiring metrics for dashboard (Phase 5 - Gap 15.1, 15.3). College-scoped.
     * Optional filters: jobId, appliedAfter, appliedBefore, departmentId, programId, batchId, classId.
     */
    @GetMapping("/metrics")
    @ApiOperation(value = "Hiring metrics", notes = "Returns counts by status and avgTimeToShortlistMs. Supports department/batch/program/class filters.")
    public ResponseEntity<Response<Map<String, Object>>> getHiringMetrics(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) Integer classId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Map<String, Object> data = adminJobService.getHiringMetrics(jobId, collegeId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId, classId);
            return new ResponseEntity<>(new Response<>("success", "Metrics retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Hiring funnel for visualization (Phase 5 - Gap 15.2, 15.3). College-scoped.
     */
    @GetMapping("/funnel")
    @ApiOperation(value = "Hiring funnel", notes = "Returns ordered stages with counts for funnel chart. Supports department/batch/program/class filters.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getHiringFunnel(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId,
            @RequestParam(required = false) Integer classId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            List<Map<String, Object>> data = adminJobService.getHiringFunnel(jobId, collegeId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId, classId);
            return new ResponseEntity<>(new Response<>("success", "Funnel retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Company-wise hiring report (Phase 5 - Gap 15.4). College-scoped.
     */
    @GetMapping("/company-report")
    @ApiOperation(value = "Company-wise hiring report", notes = "Returns per-company/per-job application counts. Supports department/batch/program filters.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getCompanyWiseReport(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appliedBefore,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            List<Map<String, Object>> data = adminJobService.getCompanyWiseHiringReport(collegeId, appliedAfter, appliedBefore,
                    departmentId, programId, batchId);
            return new ResponseEntity<>(new Response<>("success", "Company report retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Read-only visibility into old REJECTED/WITHDRAWN applications, so the placement team can
     * see what data is aging before deciding whether/when to purge it. Deliberately NOT an
     * auto-purge job — an actual retention window (how long, what "anonymize" means, any legal
     * requirement) is a policy decision, not something to invent and silently execute.
     */
    @GetMapping("/data-retention-report")
    @ApiOperation(value = "Stale application data report", notes = "Lists REJECTED/WITHDRAWN applications older than the given threshold (default 365 days). Read-only — does not delete anything.")
    public ResponseEntity<Response<Map<String, Object>>> getDataRetentionReport(
            @RequestParam Integer collegeId,
            @RequestParam(required = false, defaultValue = "365") Integer olderThanDays) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Map<String, Object> data = adminJobService.getDataRetentionReport(collegeId, olderThanDays == null ? 365 : olderThanDays);
            return new ResponseEntity<>(new Response<>("success", "Data retention report retrieved", data), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * The Drives landing page's "needs attention" queue — a small, capped, cross-drive summary
     * so an admin sees what's urgent without opening every drive one at a time.
     */
    @GetMapping("/needs-attention")
    @ApiOperation(value = "Needs-attention queue", notes = "Cross-drive summary: stale applications, unscheduled interviews, missing offer letters, closing-soon drives with weak conversion.")
    public ResponseEntity<Response<Map<String, Object>>> getNeedsAttentionSummary(@RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Needs-attention summary retrieved", adminJobService.getNeedsAttentionSummary(collegeId)), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching needs-attention summary for college {}: ", collegeId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch summary: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * "Where does this student stand?" — every placement application (any job) for one student
     * in one call, instead of opening every job one at a time to piece it together.
     */
    @GetMapping("/students/{learnerId}/placement-summary")
    @ApiOperation(value = "Student placement summary", notes = "Every application (any job) for one student, with next-interview attached per application.")
    public ResponseEntity<Response<List<com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO>>> getStudentPlacementSummary(
            @PathVariable Integer learnerId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            return new ResponseEntity<>(new Response<>("success", "Placement summary retrieved", adminJobService.getStudentPlacementSummary(learnerId, collegeId)), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching placement summary for learner {}: ", learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch placement summary: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{jobId}/delete-impact")
    @ApiOperation(value = "Preview job deletion impact", notes = "Returns affected applications, learners and open interviews before soft deletion.")
    public ResponseEntity<Response<Map<String, Object>>> getJobDeletionImpact(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Map<String, Object> impact = adminJobService.getJobDeletionImpact(jobId, collegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Deletion impact retrieved", impact),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error previewing deletion impact for job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to preview job deletion impact", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{jobId}")
    @ApiOperation(value = "Delete job", notes = "Soft deletes a job. Job must belong to the given college.")
    public ResponseEntity<Response<String>> deleteJob(
            @PathVariable Integer jobId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            adminJobService.deleteJob(jobId, collegeId);
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

    // P3 in the audit: ApplicationScreening has 15 fields (matchedSkills, missingSkills,
    // educationScore, skillScore, overallScore, screeningMethod, screeningStatus,
    // screeningMetadata, excludedAttributes, etc.) with only screeningScore/isPartialScore
    // mirrored onto JobApplication for the list view. The detail was never reachable, and
    // rescreenApplication existed in ScreeningService with no controller at all -- calling it
    // required a debugger, not an HTTP request.
    @GetMapping("/applications/{applicationId}/screening")
    @ApiOperation(value = "Get full screening detail for an application", notes = "Returns null if the application hasn't been screened yet.")
    public ResponseEntity<Response<com._42students.lms.model.ApplicationScreening>> getApplicationScreening(
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId) || screeningService == null) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Integer organizationId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
            com._42students.lms.model.ApplicationScreening screening = screeningService.getScreening(applicationId, organizationId);
            return new ResponseEntity<>(new Response<>("OK", "Screening detail", screening), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error getting screening for application {}: ", applicationId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to load screening detail", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/applications/{applicationId}/rescreen")
    @ApiOperation(value = "Re-screen an application", notes = "Recomputes the screening result, e.g. after a resume update or screening-logic change.")
    public ResponseEntity<Response<com._42students.lms.model.ApplicationScreening>> rescreenApplication(
            @PathVariable Integer applicationId,
            @RequestParam Integer collegeId) {
        if (isInvalidCollegeId(collegeId) || screeningService == null) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.placements.enabled", collegeId);
        try {
            Integer organizationId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
            com._42students.lms.model.ApplicationScreening screening = screeningService.rescreenApplication(applicationId, organizationId);
            return new ResponseEntity<>(new Response<>("OK", "Application re-screened", screening), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error re-screening application {}: ", applicationId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to re-screen application", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void requireScopedSuperadminCollegeWithinScope(com._42students.lms.security.UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode
        if (scopeResolutionService == null) return;

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
        if (resolvedOrgId != null && principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }
}


