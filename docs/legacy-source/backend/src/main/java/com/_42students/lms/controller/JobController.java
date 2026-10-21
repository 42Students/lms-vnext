package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ApplyToJobRequest;
import com._42students.lms.dto.response.JobImportantDateEventDTO;
import com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.service.JobApplicationStatusHistoryService;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.JobService;
import com._42students.lms.service.LearnerSavedJobService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controller for Job management and applications
 * NEW FLOW: Target → Apply → Screen → Decide
 * 
 * PHILOSOPHY:
 * - Targeting decides who can SEE & APPLY (HARD - visibility gate)
 * - Screening decides who looks STRONG (post-apply evaluation)
 * - Humans decide who gets HIRED (recruiter decision)
 *
 * SCOPING: All endpoints that take learnerId validate with requireAccessLearner.
 * getJobById/getApplicationById validate that the principal can access the job/application scope.
 */
@RestController
@RequestMapping("/api/v1/jobs")
@Slf4j
@Api(tags = "Jobs APIs")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class JobController extends BaseController {

    @Autowired
    private JobService jobService;

    @Autowired(required = false)
    private JobApplicationStatusHistoryService statusHistoryService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private LearnerSavedJobService learnerSavedJobService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private RateLimitingService rateLimitingService;

    @Autowired
    private FeatureFlagService featureFlagService;

    /** Registration, the drive's rules and the held-offer rules, checked before a student applies (night audit 13 Oct 2026). */
    @Autowired(required = false)
    private com._42students.lms.service.tpo.ApplyGate applyGate;

    @Autowired(required = false)
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    /**
     * Get all active jobs for a learner's organization
     * SECURITY FIX: Organization-scoped - only returns jobs from learner's organization
     * 
     * @param learnerId Learner ID (required for organization scoping)
     * @return List of active jobs in learner's organization
     */
    @GetMapping("/active/{learnerId}")
    @ApiOperation(value = "Get all active jobs for learner's organization",
                  notes = "Returns active jobs from the learner's organization. Use page/size for pagination (JP-11).")
    public ResponseEntity<Response<List<Job>>> getAllActiveJobs(
            @PathVariable Integer learnerId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "50") int size) {
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only access their own jobs feed", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        try {
            // SECURITY FIX: Get learner to determine organization
            List<Job> allJobs = jobService.getAllActiveJobsForLearnerOrganization(learnerId);
            // JP-11: paginate in-memory (DB-level pagination requires future refactor of JobService)
            int pageSize = Math.min(Math.max(size, 1), 100);
            // Use long arithmetic: an extreme page must return an empty page, not overflow
            // to a negative subList index and turn a valid request into HTTP 500.
            long fromIdx = (long) Math.max(page, 0) * pageSize;
            List<Job> jobs = fromIdx >= allJobs.size() ? java.util.Collections.emptyList()
                    : allJobs.subList((int) fromIdx, (int) Math.min(fromIdx + pageSize, allJobs.size()));
            return new ResponseEntity<>(
                    new Response<>("success", "Active jobs retrieved successfully", jobs),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            log.error("Error: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching active jobs: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch jobs. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get visible jobs for a learner
     * Visibility based ONLY on:
     * - Organization match
     * - Targeting hierarchy (Department/Program/Batch/Class)
     * - Job active flag
     * - Application deadline not passed
     * 
     * NO eligibility checks (skills, GPA, degree, specialization)
     * 
     * @param learnerId Learner ID
     * @return List of visible jobs
     */
    @GetMapping("/visible/{learnerId}")
    @ApiOperation(value = "Get visible jobs for learner", 
                  notes = "Returns jobs visible to learner based on targeting. No eligibility checks.")
    public ResponseEntity<Response<List<Job>>> getVisibleJobs(@PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        try {
            List<Job> visibleJobs = jobService.getVisibleJobsForLearner(learnerId);
            return new ResponseEntity<>(
                    new Response<>("success", "Visible jobs retrieved successfully", visibleJobs),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching visible jobs for learner {}: ", learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch visible jobs. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all active jobs with visibility status for a learner
     * SECURITY FIX: Only shows jobs from learner's organization
     * 
     * @param learnerId Learner ID
     * @return List of jobs from learner's organization with visibility status
     */
    @GetMapping("/all/{learnerId}")
    @ApiOperation(value = "Get all jobs with visibility status", 
                  notes = "Returns all active jobs from learner's organization with visibility status.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getAllJobsWithVisibility(@PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        try {
            // SECURITY FIX: Get jobs only from learner's organization (not all organizations)
            List<Job> allJobs = jobService.getAllActiveJobsForLearnerOrganization(learnerId);
            
            // Enrich with visibility info
            List<Map<String, Object>> enrichedJobs = allJobs.stream().map(job -> {
                Map<String, Object> jobMap = new HashMap<>();
                jobMap.put("id", job.getId());
                jobMap.put("jobTitle", job.getJobTitle());
                jobMap.put("companyName", job.getCompanyName());
                jobMap.put("jobDescription", job.getJobDescription());
                jobMap.put("jobType", job.getJobType());
                jobMap.put("location", job.getLocation());
                jobMap.put("candidatePreferences", job.getCandidatePreferences());
                // These five were missing entirely — the listing page's default "Deadline
                // soonest" sort, "Closing in 7 days" facet, "Highest CTC" sort, "posted X ago"
                // text, and closed/expired badge all silently no-op without them (the detail
                // page fetches the full entity separately, so only the list view was affected).
                jobMap.put("companyLogo", job.getCompanyLogo());
                jobMap.put("ctcRange", job.getCtcRange());
                jobMap.put("postedDate", job.getPostedDate());
                jobMap.put("applicationDeadline", job.getApplicationDeadline());
                jobMap.put("isActive", job.getIsActive());
                jobMap.put("importantDates", job.getImportantDates());

                // Check visibility
                JobService.VisibilityResult visibility = jobService.checkJobVisibility(learnerId, job.getId());
                jobMap.put("isVisible", visibility.isVisible());
                jobMap.put("visibilityReason", visibility.getReason());
                jobMap.put("canApply", visibility.isVisible()); // If visible, can apply
                
                return jobMap;
            }).collect(Collectors.toList());
            
            return new ResponseEntity<>(
                    new Response<>("success", "Jobs retrieved successfully", enrichedJobs),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching jobs for learner {}: ", learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch jobs. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 4.1: this path segment promised eligibility filtering it never performed (it silently
     * returned pure visibility results, `isEligible` hardcoded `true` for every job returned) --
     * a path segment is a contract, and a Swagger deprecation note is not enough for an external
     * consumer (a report, an integration) reading "/eligible/" as "meets the criteria". Verified
     * unused by both the web frontend and mobile app before retiring it (their wrapper functions
     * called it but were themselves called by no component). Returns 410 Gone with a pointer to
     * the replacement rather than silently 404ing, so anything still calling this finds out why.
     */
    @GetMapping("/eligible/{learnerId}")
    @ApiOperation(value = "[REMOVED] Use /visible/{learnerId} instead", notes = "Retired 2026-09 -- never performed eligibility filtering, returned pure visibility results under a misleading name.")
    @Deprecated
    public ResponseEntity<Response<Object>> getEligibleJobs(@PathVariable Integer learnerId) {
        return new ResponseEntity<>(
                new Response<>("error", "This endpoint has been removed. Use GET /api/v1/jobs/visible/{learnerId} instead.", null),
                HttpStatus.GONE);
    }

    /**
     * Get job by ID.
     * For learner principals: enforces visibility (targeting) — returns 403 if job is not visible to the learner.
     */
    @GetMapping("/{jobId}")
    @ApiOperation(value = "Get job by ID", 
                  notes = "Returns job details by ID. For learners, job must be visible (targeting) or 403 is returned.")
    public ResponseEntity<Response<Job>> getJobById(@PathVariable Integer jobId) {
        try {
            if (jobId == null || jobId <= 0) {
                return new ResponseEntity<>(new Response<>("error", "jobId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            Job job = jobService.getJobById(jobId);
            com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            requireAccessJob(principal, job);
            // Enforce visibility for learner: do not expose job details if not visible to this learner
            if (principal != null && principal.isLearner()) {
                JobService.VisibilityResult visibility = jobService.checkJobVisibility(principal.getId(), jobId);
                if (!visibility.isVisible()) {
                    log.warn("Learner {} attempted to access non-visible job {}", principal.getId(), jobId);
                    throw new AccessDeniedException("Job is not visible to you: " + visibility.getReason());
                }
            }
            return new ResponseEntity<>(
                    new Response<>("success", "Job retrieved successfully", job),
                    HttpStatus.OK);
        } catch (AccessDeniedException e) {
            log.warn("Access denied to job {}: {}", jobId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            log.error("Job not found: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching job {}: ", jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch job. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get job with visibility status for a learner
     * 
     * @param jobId Job ID
     * @param learnerId Learner ID
     * @return Job details with visibility info
     */
    @GetMapping("/{jobId}/visibility/{learnerId}")
    @ApiOperation(value = "Get job with visibility status", 
                  notes = "Returns job details with visibility check for the learner. If visible, learner can apply.")
    public ResponseEntity<Response<Map<String, Object>>> getJobWithVisibility(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        if (jobId == null || jobId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "jobId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only access their own visibility checks", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        try {
            JobService.VisibilityResult visibility = jobService.checkJobVisibility(learnerId, jobId);

            Map<String, Object> result = new HashMap<>();
            if (!visibility.isVisible()) {
                result.put("job", null);
                result.put("isVisible", false);
                result.put("visibilityReason", visibility.getReason());
                result.put("canApply", false);
                return new ResponseEntity<>(
                        new Response<>("success", "Job is not available to this learner", result),
                        HttpStatus.OK);
            }

            Job job = jobService.getJobById(jobId);
            requireAccessJob(principal, job);
            result.put("job", job);
            result.put("isVisible", true);
            result.put("visibilityReason", visibility.getReason());
            result.put("canApply", true);

            return new ResponseEntity<>(
                    new Response<>("success", "Job retrieved successfully", result),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            log.error("Error: {}", e.getMessage());
            boolean notFound = e.getMessage() != null && (e.getMessage().toLowerCase().contains("not found") || e.getMessage().contains("Job not found"));
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error fetching job {} for learner {}: ", jobId, learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch job. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 4.1: same retirement as getEligibleJobs above -- "eligibility" in the path never meant
     * criteria-based eligibility, only visibility. Verified unused by web/mobile before retiring.
     */
    @GetMapping("/{jobId}/eligibility/{learnerId}")
    @ApiOperation(value = "[REMOVED] Use /{jobId}/visibility/{learnerId} instead", notes = "Retired 2026-09 -- never performed eligibility filtering, returned pure visibility results under a misleading name.")
    @Deprecated
    public ResponseEntity<Response<Object>> getJobWithEligibility(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        return new ResponseEntity<>(
                new Response<>("error", "This endpoint has been removed. Use GET /api/v1/jobs/" + jobId + "/visibility/" + learnerId + " instead.", null),
                HttpStatus.GONE);
    }

    /**
     * Apply to a job
     * NO eligibility checks - if visible, can apply
     * 
     * Validations:
     * - Job is visible to learner (targeting)
     * - Job is active
     * - Deadline not passed
     * - No duplicate application (DB constraint)
     * 
     * After apply:
     * - Application created with status "APPLIED"
     * - Source set to "INTERNAL" for LMS student applications
     * - Resume URL stored if provided (or falls back to learner profile resume)
     * - Screening runs automatically
     * 
     * @param learnerId Learner ID
     * @param jobId Job ID
     * @param request Optional body with resumeUrl (preferred over query param for security)
     * @param resumeUrlLegacy Optional query param (deprecated; prefer request body)
     * @return Created JobApplication
     */
    @PostMapping("/{jobId}/apply/{learnerId}")
    @ApiOperation(value = "Apply to a job", 
                  notes = "Learner applies to a job. Provide resumeUrl in request body when available. Source set to INTERNAL. One application per job.")
    public ResponseEntity<Response<JobApplication>> applyToJob(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId,
            @Valid @RequestBody(required = false) ApplyToJobRequest request,
            @RequestParam(required = false) String resumeUrlLegacy) {
        if (jobId == null || jobId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "jobId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only apply as themselves", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        // A student applying for themselves goes through the same gate the drive page shows: the older checks below never asked
        // about registration, the drive's rules or the college's held-offer rules.
        if (applyGate != null && learnerRepository != null && principal != null && principal.isLearner()) {
            com._42students.lms.model.Job gateJob = jobRepository.findById(jobId).orElse(null);
            com._42students.lms.model.Learner gateLearner = learnerRepository.findById(learnerId).orElse(null);
            if (gateJob != null && gateLearner != null) {
                com._42students.lms.service.tpo.ApplyGate.Answer gate = applyGate.check(gateJob, gateLearner);
                if (!gate.open()) {
                    return new ResponseEntity<>(new Response<>("error", gate.reason(), null), HttpStatus.BAD_REQUEST);
                }
            }
        }
        // JP-08: rate-limit job applications to 10 per learner per hour
        if (rateLimitingService != null) {
            String key = "job_apply:" + learnerId;
            if (rateLimitingService.isRateLimited(key, 10, 3600)) {
                return new ResponseEntity<>(
                        new Response<>("error", "Too many applications submitted. Please wait before applying to more jobs.", null),
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimitingService.recordAttempt(key, 10, 3600);
        }
        String resumeUrl = (request != null && request.getResumeUrl() != null && !request.getResumeUrl().trim().isEmpty())
                ? request.getResumeUrl().trim()
                : (resumeUrlLegacy != null && !resumeUrlLegacy.trim().isEmpty() ? resumeUrlLegacy.trim() : null);
        try {
            log.info("Learner {} applying to job {} with resume: {}", learnerId, jobId, resumeUrl != null ? "provided" : "none");
            JobApplication application = jobService.applyToJob(learnerId, jobId, resumeUrl);
            return new ResponseEntity<>(
                    new Response<>("success", "Application submitted successfully. Screening will be completed shortly.", application),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            log.error("Cannot apply to job: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (DataIntegrityViolationException e) {
            log.warn("Duplicate application attempt for learner {} job {}: {}", learnerId, jobId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "You have already applied to this job", null),
                    HttpStatus.CONFLICT);
        } catch (com._42students.lms.exceptions.CustomException e) {
            // applyToJob's per-minute limit throws this with 429; the catch-all below turned it into a 500 "Failed to apply".
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), e.getReturnStatus());
        } catch (Exception e) {
            log.error("Error applying to job {} for learner {}: ", jobId, learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to apply. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all applications for a learner
     * 
     * @param learnerId Learner ID
     * @return List of job applications
     */
    @GetMapping("/applications/{learnerId}")
    @ApiOperation(value = "Get learner's job applications with next interview", 
                  notes = "Returns all job applications for a learner, with nextInterview attached per application when available (Gap #3).")
    public ResponseEntity<Response<List<LearnerApplicationWithInterviewsDTO>>> getLearnerApplications(@PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        try {
            List<LearnerApplicationWithInterviewsDTO> applications = jobService.getLearnerApplicationsWithInterviews(learnerId);
            return new ResponseEntity<>(
                    new Response<>("success", "Applications retrieved successfully", applications),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching applications for learner {}: ", learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch applications. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get application by ID
     * 
     * @param applicationId Application ID
     * @return JobApplication details
     */
    @GetMapping("/applications/details/{applicationId}")
    @ApiOperation(value = "Get application by ID", 
                  notes = "Returns job application details by ID.")
    public ResponseEntity<Response<JobApplication>> getApplicationById(@PathVariable Integer applicationId) {
        try {
            JobApplication application = jobService.getApplicationById(applicationId);
            com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Integer learnerId = application.getLearner() != null ? application.getLearner().getId() : null;
            if (learnerId != null) {
                accessControlService.requireAccessLearner(principal, learnerId);
            } else {
                // Application with no learner: require access to application's organization
                Integer orgId = application.getOrganizationId() != null ? application.getOrganizationId() : (application.getJob() != null ? application.getJob().getOrganizationId() : null);
                if (orgId != null) {
                    accessControlService.requireAccessOrganization(principal, orgId);
                } else {
                    throw new AccessDeniedException("Access denied to this application");
                }
            }
            return new ResponseEntity<>(
                    new Response<>("success", "Application retrieved successfully", application),
                    HttpStatus.OK);
        } catch (AccessDeniedException e) {
            // BUGFIX: this endpoint was missing the AccessDeniedException catch present on the
            // sibling job/save endpoints in this controller, so a legitimate 403 (wrong learner
            // or wrong org trying to view someone else's application) fell through to the
            // generic catch(Exception) below and surfaced as an opaque 500 instead of 403.
            log.warn("Access denied to application {}: {}", applicationId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            log.error("Application not found: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching application {}: ", applicationId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch application. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get application status history (timeline). Gap 8.2.
     * Access: learner for own application, or org admin for applications in their org.
     */
    @GetMapping("/applications/{applicationId}/history")
    @ApiOperation(value = "Get application status history",
                  notes = "Returns timeline of status changes. Access: learner for own app, org admin for their org.")
    public ResponseEntity<Response<java.util.List<JobApplicationStatusHistory>>> getApplicationHistory(@PathVariable Integer applicationId) {
        try {
            JobApplication application = jobService.getApplicationById(applicationId);
            com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (application.getLearner() == null) {
                throw new AccessDeniedException("Access denied");
            }
            Integer learnerId = application.getLearner().getId();
            accessControlService.requireAccessLearner(principal, learnerId);
            java.util.List<JobApplicationStatusHistory> history = statusHistoryService != null
                    ? statusHistoryService.getHistoryForApplication(applicationId)
                    : java.util.Collections.emptyList();
            return new ResponseEntity<>(
                    new Response<>("success", "History retrieved", history),
                    HttpStatus.OK);
        } catch (AccessDeniedException e) {
            // Never turn a denied application-history lookup into HTTP 500.
            return new ResponseEntity<>(new Response<>("error", "Access denied", null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Error fetching history for application {}: ", applicationId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch history. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check if learner has already applied to this job.
     *
     * @param jobId Job ID
     * @param learnerId Learner ID
     * @return Map with applied (boolean) and optional applicationId
     */
    @GetMapping("/{jobId}/applied/{learnerId}")
    @ApiOperation(value = "Check if learner has applied", 
                  notes = "Returns whether the learner has an active application for this job.")
    public ResponseEntity<Response<Map<String, Object>>> checkIfApplied(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        try {
            boolean applied = jobService.hasApplied(learnerId, jobId);
            Map<String, Object> data = new HashMap<>();
            data.put("applied", applied);
            if (applied) {
                jobService.getApplicationByLearnerAndJob(learnerId, jobId).ifPresent(a -> {
                    data.put("applicationId", a.getId());
                    data.put("applicationStatus", a.getApplicationStatus());
                });
            }
            return new ResponseEntity<>(
                    new Response<>("success", "Check completed", data),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error checking application status for learner {} job {}: ", learnerId, jobId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to check. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Preferred withdrawal endpoint: identifies the exact application row being acted on.
     * This removes the ambiguity of the legacy (jobId, learnerId) route and aligns withdrawal
     * with every other application-level action.
     */
    @PostMapping("/applications/{applicationId}/withdraw/{learnerId}")
    @ApiOperation(value = "Withdraw an application",
                  notes = "Withdraws one explicit application owned by the learner. Allowed from active non-terminal states, subject to the scheduled-round request rule. OFFERED converges to an offer decline.")
    public ResponseEntity<Response<Object>> withdrawApplicationById(
            @PathVariable Integer applicationId,
            @PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        return executeWithdrawal(
                learnerId,
                "application " + applicationId,
                () -> jobService.withdrawApplicationById(learnerId, applicationId));
    }

    /**
     * Legacy compatibility endpoint. New clients use /applications/{applicationId}/withdraw/{learnerId}.
     */
    @PostMapping("/{jobId}/withdraw/{learnerId}")
    @ApiOperation(value = "Withdraw application by job (legacy)",
                  notes = "Compatibility route. Resolves the learner's current application for the job and applies the same withdrawal state machine.")
    public ResponseEntity<Response<Object>> withdrawApplication(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        return executeWithdrawal(
                learnerId,
                "job " + jobId,
                () -> jobService.withdrawApplication(learnerId, jobId));
    }

    private ResponseEntity<Response<Object>> executeWithdrawal(
            Integer learnerId,
            String target,
            java.util.function.Supplier<JobApplication> operation) {
        // Rate-limit both the new application-id path and the compatibility path through one
        // shared gate so callers cannot double their allowance by alternating routes.
        if (rateLimitingService != null) {
            String key = "job_withdraw:" + learnerId;
            if (rateLimitingService.isRateLimited(key, 20, 3600)) {
                return new ResponseEntity<>(
                        new Response<>("error", "Too many withdrawals submitted. Please wait before trying again.", null),
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimitingService.recordAttempt(key, 20, 3600);
        }
        try {
            JobApplication application = operation.get();
            return new ResponseEntity<>(
                    new Response<>("success", "Application withdrawn successfully", application),
                    HttpStatus.OK);
        } catch (com._42students.lms.exceptions.WithdrawRequiresRequestException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), java.util.Map.of("code", "WITHDRAW_NEEDS_REQUEST")),
                    HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            log.warn("Cannot withdraw {} for learner {}: {}", target, learnerId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            log.warn("Optimistic lock conflict withdrawing {} for learner {}: {}", target, learnerId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "This record was modified by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error withdrawing {} for learner {}: ", target, learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to withdraw. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Student V1 §"Offers get their own table": what accepting this offer would do to every
     * other active application, before the student commits to accepting — withdrawn, kept open
     * under the college's rules, or another pending offer that would be declined.
     */
    @GetMapping("/applications/{applicationId}/offer-accept-preview/{learnerId}")
    @ApiOperation(value = "Preview the accept-offer cascade", notes = "Read-only: shows what accepting would do to the learner's other applications, without changing anything.")
    public ResponseEntity<Response<JobService.OfferAcceptPreview>> previewOfferAccept(
            @PathVariable Integer applicationId,
            @PathVariable Integer learnerId) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        try {
            JobService.OfferAcceptPreview preview = jobService.previewOfferAccept(learnerId, applicationId);
            return new ResponseEntity<>(new Response<>("success", "Preview generated", preview), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error previewing offer accept for application {} learner {}: ", applicationId, learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to preview. Please try again.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Learner accepts or declines an offer. Only valid while the application is OFFERED.
     */
    @PostMapping("/applications/{applicationId}/offer-response/{learnerId}")
    @ApiOperation(value = "Respond to an offer", notes = "Accepts (-> HIRED) or declines (-> REJECTED) an OFFERED application.")
    public ResponseEntity<Response<JobApplication>> respondToOffer(
            @PathVariable Integer applicationId,
            @PathVariable Integer learnerId,
            @RequestBody Map<String, Object> body) {
        accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), learnerId);
        Object acceptRaw = body != null ? body.get("accept") : null;
        if (!(acceptRaw instanceof Boolean)) {
            return new ResponseEntity<>(new Response<>("error", "accept (boolean) is required", null), HttpStatus.BAD_REQUEST);
        }
        try {
            JobApplication application = jobService.respondToOffer(learnerId, applicationId, (Boolean) acceptRaw);
            return new ResponseEntity<>(
                    new Response<>("success", ((Boolean) acceptRaw) ? "Offer accepted" : "Offer declined", application),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Concurrent write lost the optimistic-lock race (e.g. two accept/decline or
            // accept/withdraw requests landing on the same application at once) — surface a clean,
            // retryable 409 instead of letting it fall into the generic catch below as an opaque
            // 500. Matches GlobalExceptionHandler's handler for this exception type, which never
            // gets a chance to run here since this local catch(Exception) would otherwise
            // intercept it first.
            log.warn("Optimistic lock conflict responding to offer for application {} learner {}: {}", applicationId, learnerId, e.getMessage());
            return new ResponseEntity<>(
                    new Response<>("error", "This record was modified by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error responding to offer for application {} learner {}: ", applicationId, learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to respond. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 8.5 / 21.2.6: Save (bookmark) a job for a learner.
     */
    @PostMapping("/{jobId}/save/{learnerId}")
    @ApiOperation(value = "Save job for later", notes = "Bookmarks the job for the learner. Idempotent.")
    public ResponseEntity<Response<Map<String, Object>>> saveJob(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        if (jobId == null || jobId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "jobId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only save jobs for themselves", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        if (learnerSavedJobService == null) {
            return new ResponseEntity<>(new Response<>("error", "Saved jobs not configured", null), HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            Job job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return new ResponseEntity<>(new Response<>("error", "Job not found", null), HttpStatus.NOT_FOUND);
            }
            requireAccessJob(securityContextUtil.getAuthenticatedUserPrincipal(), job);
            // requireAccessJob only checks org membership, not the hierarchical targeting rules
            // that gate whether this specific learner is allowed to see this job at all — without
            // this, a learner could bookmark a job the targeting rules were meant to hide from
            // them (job ids are easy to enumerate), then read its full details back via the
            // saved-jobs list, which applies no visibility filter of its own.
            JobService.VisibilityResult visibility = jobService.checkJobVisibility(learnerId, jobId);
            if (!visibility.isVisible()) {
                return new ResponseEntity<>(new Response<>("error", "This job is not available for your profile", null), HttpStatus.FORBIDDEN);
            }
            learnerSavedJobService.saveJob(learnerId, jobId);
            Map<String, Object> data = new HashMap<>();
            data.put("saved", true);
            return new ResponseEntity<>(new Response<>("success", "Job saved", data), HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error saving job {} for learner {}: ", jobId, learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to save. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 8.5 / 21.2.6: Unsave a job for a learner.
     */
    @DeleteMapping("/{jobId}/unsave/{learnerId}")
    @ApiOperation(value = "Unsave job", notes = "Removes the bookmark for the learner.")
    public ResponseEntity<Response<Map<String, Object>>> unsaveJob(
            @PathVariable Integer jobId,
            @PathVariable Integer learnerId) {
        if (jobId == null || jobId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "jobId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only unsave jobs for themselves", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        if (learnerSavedJobService == null) {
            return new ResponseEntity<>(new Response<>("error", "Saved jobs not configured", null), HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            learnerSavedJobService.unsaveJob(learnerId, jobId);
            Map<String, Object> data = new HashMap<>();
            data.put("saved", false);
            return new ResponseEntity<>(new Response<>("success", "Job removed from saved", data), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error unsaving job {} for learner {}: ", jobId, learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to unsave. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 8.5 / 21.2.6: Get saved job IDs for a learner (for bookmark state on job cards).
     */
    @GetMapping("/saved-ids/{learnerId}")
    @ApiOperation(value = "Get saved job IDs", notes = "Returns job IDs the learner has bookmarked. For UI bookmark state.")
    public ResponseEntity<Response<Set<Integer>>> getSavedJobIds(@PathVariable Integer learnerId) {
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only access their own saved jobs", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        if (learnerSavedJobService == null) {
            return new ResponseEntity<>(new Response<>("success", "No saved jobs", Set.of()), HttpStatus.OK);
        }
        try {
            Set<Integer> ids = learnerSavedJobService.getSavedJobIds(learnerId).stream()
                    // A bookmark can outlive the visibility state that allowed it to be created:
                    // targeting can change, a deadline can pass, or a job can be closed. Re-run
                    // the SAME learner visibility gate on read so a stale bookmark never becomes
                    // a side channel for a job the learner is no longer allowed to see.
                    .filter(jobId -> isSavedJobVisibleToLearner(learnerId, jobId))
                    .collect(Collectors.toSet());
            return new ResponseEntity<>(new Response<>("success", "Saved job IDs retrieved", ids), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching saved job IDs for learner {}: ", learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 8.5 / 21.2.6: Get saved jobs for a learner.
     */
    @GetMapping("/saved/{learnerId}")
    @ApiOperation(value = "Get saved jobs", notes = "Returns jobs the learner has bookmarked.")
    public ResponseEntity<Response<List<Job>>> getSavedJobs(@PathVariable Integer learnerId) {
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only access their own saved jobs", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        if (learnerSavedJobService == null) {
            return new ResponseEntity<>(new Response<>("success", "No saved jobs", List.of()), HttpStatus.OK);
        }
        try {
            List<Job> jobs = learnerSavedJobService.getSavedJobs(learnerId).stream()
                    .filter(savedJob -> savedJob != null && isSavedJobVisibleToLearner(learnerId, savedJob.getId()))
                    .collect(Collectors.toList());
            return new ResponseEntity<>(new Response<>("success", "Saved jobs retrieved", jobs), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching saved jobs for learner {}: ", learnerId, e);
            return new ResponseEntity<>(new Response<>("error", "Failed to fetch. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Saved-job reads must obey the current visibility policy, not only the policy that happened
     * to be true when the bookmark was created. Treat a now-missing job as invisible; unexpected
     * infrastructure failures still propagate to the endpoint's normal 500 path rather than
     * silently returning a partial list.
     */
    private boolean isSavedJobVisibleToLearner(Integer learnerId, Integer jobId) {
        try {
            JobService.VisibilityResult visibility = jobService.checkJobVisibility(learnerId, jobId);
            return visibility != null && visibility.isVisible();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get job important-date events for admin calendar (Interview Calendar).
     * Resolves college or organization from authenticated context. Date range required.
     */
    @GetMapping("/calendar-dates")
    @ApiOperation(value = "Get job important dates for admin calendar",
                  notes = "Returns job important-date events in the given range. College or organization from auth context.")
    public ResponseEntity<Response<List<JobImportantDateEventDTO>>> getCalendarDatesForAdmin(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null || principal.isLearner()) {
                return new ResponseEntity<>(new Response<>("error", "Only faculty/admin may access admin job calendar", null), HttpStatus.FORBIDDEN);
            }
            if (start == null || end == null) {
                return new ResponseEntity<>(new Response<>("error", "start and end are required", null), HttpStatus.BAD_REQUEST);
            }
            if (start.isAfter(end)) {
                return new ResponseEntity<>(new Response<>("error", "start must be before or equal to end", null), HttpStatus.BAD_REQUEST);
            }
            Integer collegeId = securityContextUtil.getAuthenticatedCollegeId(request);
            Integer organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);
            List<JobImportantDateEventDTO> events = jobService.getImportantDateEventsForAdmin(collegeId, organizationId, start, end);
            return new ResponseEntity<>(
                    new Response<>("success", "Calendar dates retrieved successfully", events),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching calendar dates: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch calendar dates. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get job important-date events for learner career calendar.
     * Only jobs visible to the learner are included.
     */
    @GetMapping("/calendar-dates/learner/{learnerId}")
    @ApiOperation(value = "Get job important dates for learner career calendar",
                  notes = "Returns job important-date events in the given range for jobs visible to the learner.")
    public ResponseEntity<Response<List<JobImportantDateEventDTO>>> getCalendarDatesForLearner(
            @PathVariable Integer learnerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            return new ResponseEntity<>(new Response<>("error", "Learners may only access their own career calendar", null), HttpStatus.FORBIDDEN);
        }
        if (start == null || end == null) {
            return new ResponseEntity<>(new Response<>("error", "start and end are required", null), HttpStatus.BAD_REQUEST);
        }
        if (start.isAfter(end)) {
            return new ResponseEntity<>(new Response<>("error", "start must be before or equal to end", null), HttpStatus.BAD_REQUEST);
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        try {
            List<JobImportantDateEventDTO> events = jobService.getImportantDateEventsForLearner(learnerId, start, end);
            return new ResponseEntity<>(
                    new Response<>("success", "Calendar dates retrieved successfully", events),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching calendar dates for learner {}: ", learnerId, e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch calendar dates. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Ensures the principal can access this job (org-scoped or college-scoped).
     * For admin/faculty: checks canAccessOrganization or canAccessCollege.
     * For learners: uses ResolvedLearnerScope for hierarchy resolution.
     */
    private void requireAccessJob(UserPrincipal principal, Job job) {
        if (job.getOrganizationId() != null
                && accessControlService.canAccessOrganization(principal, job.getOrganizationId())) {
            return;
        }
        if (job.getCollegeId() != null
                && accessControlService.canAccessCollege(principal, job.getCollegeId())) {
            return;
        }
        if (principal != null && principal.isLearner() && principal.getId() != null) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
            if (scope.hasOrganization() && scope.getOrganizationId().equals(job.getOrganizationId())) {
                return;
            }
        }
        throw new AccessDeniedException("Access denied to this job");
    }
}



