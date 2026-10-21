package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Interview;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.InterviewService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Controller for Interview scheduling and management
 * Phase 5: Organization-scoped interview scheduling
 */
@RestController
@RequestMapping("/api/v1/interviews")
@Slf4j
@Api(tags = "Interview APIs")
public class InterviewController extends BaseController {

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired(required = false)
    private RateLimitingService rateLimitingService;

    @Autowired
    private FeatureFlagService featureFlagService;

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.placements.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    /** Parse organization path segment: "null" or blank -> null, otherwise Integer. */
    private static Integer parseOrganizationIdPath(String organizationId) {
        if (organizationId == null || organizationId.isBlank() || "null".equalsIgnoreCase(organizationId.trim())) {
            return null;
        }
        try {
            return Integer.parseInt(organizationId.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Resolve organization ID for a learner from hierarchy.
     */
    private Integer resolveLearnerOrganizationId(Integer learnerId) {
        if (learnerId == null) return null;
        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
        return scope.getOrganizationId();
    }

    /**
     * SECURITY: AccessControlService.canAccessOrganization/requireAccessOrganization deliberately
     * resolves a college-scoped admin's (FACULTY with facultyType=ADMIN, collegeId set,
     * organizationId null) parent organization and grants org-wide access — correct for genuinely
     * org-level features. But getInterviewById/updateInterview/cancelInterview/
     * markInterviewCompleted/submitInterviewFeedback below authorize ONLY via that org-wide check,
     * and the underlying InterviewServiceImpl lookups filter only by organizationId, never
     * collegeId — so a college-scoped admin could read/mutate interviews belonging to OTHER
     * colleges in the same organization. This is the additional per-request guard: when the
     * principal is college-scoped (collegeId present), verify the interview's underlying job
     * actually belongs to that college before proceeding. A college admin may also carry an
     * organizationId, so organizationId presence alone must never widen their resource scope.
     * Mirrors the collegeId-OR-null-collegeId-with-matching-org fallback that the sibling
     * getInterviewsForOrganization/getInterviewsForCollege list endpoint already applies via
     * InterviewRepository#findByJobCollegeIdOrOrganizationId, so legitimate access to a job that
     * has an org but no collegeId set is preserved. Defensive: if the interview/job can't be
     * resolved, deny rather than silently allow.
     */
    private void requireCollegeScopedAccessToInterview(UserPrincipal principal, Integer interviewId, Integer organizationId) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        if (accessControlService.isSuperAdmin(principal)) {
            // SECURITY: requireAccessOrganization only enforces org-level access; a college- or
            // org-PINNED super-admin (requireScopedSuperadminCollegeWithinScope's target) is not
            // otherwise constrained on this path, so resolve the interview's job college here and
            // apply the same scope check getInterviewsForOrganization already applies for its
            // collegeId query-param branch. If the interview/job can't be resolved, fall through
            // (jobCollegeId stays null -> no-op) and let the service layer report not-found.
            Interview interviewForSuperadminScope = interviewRepository.findById(interviewId).orElse(null);
            Job jobForSuperadminScope = (interviewForSuperadminScope != null && interviewForSuperadminScope.getJob() != null)
                    ? jobRepository.findById(interviewForSuperadminScope.getJob().getId()).orElse(null)
                    : null;
            requireScopedSuperadminCollegeWithinScope(principal, jobForSuperadminScope != null ? jobForSuperadminScope.getCollegeId() : null);
            return;
        }
        Integer principalCollegeId = principal.getCollegeId();
        if (principalCollegeId == null) {
            return; // genuinely org-level admin: no college scope to narrow after org authorization
        }
        Interview interview = interviewRepository.findById(interviewId).orElse(null);
        if (interview == null || interview.getJob() == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to this interview");
        }
        Job job = jobRepository.findById(interview.getJob().getId()).orElse(null);
        if (job == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to this interview");
        }
        boolean matchesCollege = principalCollegeId.equals(job.getCollegeId());
        boolean matchesOrgFallback = job.getCollegeId() == null
                && organizationId != null && organizationId.equals(job.getOrganizationId());
        if (!matchesCollege && !matchesOrgFallback) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied. This interview belongs to a different college.");
        }
    }

    /**
     * SECURITY: mirrors requireCollegeScopedAccessToInterview's college-comparison logic, but
     * applied to the JOB an interview is being scheduled against (or an application's underlying
     * job) rather than an existing interview. scheduleInterview creates a brand-new interview, so
     * there is no existing interview row to check college scope against yet — without this, a
     * college-scoped admin could schedule interviews (or read application-scoped interview lists)
     * for jobs belonging to OTHER colleges in the same organization, since
     * requireAccessOrganization above only enforces org-level access, which for a college-scoped
     * admin resolves up to their parent org. Defensive: if the job can't be resolved, deny.
     */
    private void requireCollegeScopedAccessToJob(UserPrincipal principal, Job job, Integer organizationId) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        if (accessControlService.isSuperAdmin(principal)) {
            // SECURITY: requireAccessOrganization only enforces org-level access; a college- or
            // org-PINNED super-admin is not otherwise constrained on this path. Apply the same
            // scope check getInterviewsForOrganization already applies for its collegeId
            // query-param branch. If job is null (not found), jobCollegeId is null -> no-op, and
            // the service layer will report not-found as before.
            requireScopedSuperadminCollegeWithinScope(principal, job != null ? job.getCollegeId() : null);
            return;
        }
        Integer principalCollegeId = principal.getCollegeId();
        if (principalCollegeId == null) {
            return; // genuinely org-level admin: no college scope to narrow after org authorization
        }
        if (job == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied. Job not found.");
        }
        boolean matchesCollege = principalCollegeId.equals(job.getCollegeId());
        boolean matchesOrgFallback = job.getCollegeId() == null
                && organizationId != null && organizationId.equals(job.getOrganizationId());
        if (!matchesCollege && !matchesOrgFallback) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied. This job belongs to a different college.");
        }
    }

    private void requireScopedSuperadminCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode

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

    /**
     * Schedule a new interview (admin / placement)
     * SECURITY: Organization ID and user ID derived from authenticated context (UNTRUSTED frontend input ignored)
     *
     * @param interview Interview data
     * @param request HTTP request for extracting authenticated user context
     * @return Created interview
     */
    @PostMapping
    @ApiOperation(value = "Schedule a new interview",
                  notes = "Admin schedules an interview. Application must be at least SHORTLISTED. Organization ID and user ID are derived from authenticated user context.")
    public ResponseEntity<Response<Interview>> scheduleInterview(
            @Valid @RequestBody Interview interview,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            // SECURITY: Derive organization ID and user ID from authenticated context - NEVER trust frontend
            Integer organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);
            Integer createdBy = securityContextUtil.getAuthenticatedUserId(request);

            // Super-admin: no college/org in JWT; derive org from the job in the interview request
            if (organizationId == null && principal != null && accessControlService.isSuperAdmin(principal)) {
                if (interview == null || interview.getJob() == null || interview.getJob().getId() <= 0) {
                    return new ResponseEntity<>(
                            new Response<>("error", "Job ID is required to schedule interview", null),
                            HttpStatus.BAD_REQUEST);
                }
                Job job = jobRepository.findById(interview.getJob().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Job not found"));
                organizationId = job.getOrganizationId();
                if (organizationId == null) {
                    return new ResponseEntity<>(
                            new Response<>("error", "Job has no organization context", null),
                            HttpStatus.BAD_REQUEST);
                }
            }

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

            // The organization id may be resolved indirectly from a college-scoped JWT. That
            // proves the tenant, but NOT that the caller is an admin: a normal faculty principal
            // can also carry an organization id. Enforce the actual admin organization boundary
            // before the college/job-specific guard below.
            accessControlService.requireAccessOrganization(principal, organizationId);

            // SECURITY: college-scoped admin must not be able to schedule interviews against a job
            // belonging to a different college in the same organization (see
            // requireCollegeScopedAccessToJob javadoc above). Resolve the job being scheduled
            // against and verify college scope before the interview is actually created.
            if (interview != null && interview.getJob() != null && interview.getJob().getId() > 0) {
                Job jobForScheduling = jobRepository.findById(interview.getJob().getId()).orElse(null);
                requireCollegeScopedAccessToJob(principal, jobForScheduling, organizationId);
            }

            Interview scheduledInterview = interviewService.scheduleInterview(interview, organizationId, createdBy);
            return new ResponseEntity<>(
                    new Response<>("success", "Interview scheduled successfully", scheduledInterview),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get all interviews for organization (admin) or for college (college-scoped admin).
     * SECURITY: When principal has collegeId, returns only interviews whose job belongs to that college.
     * Otherwise uses organizationId from authenticated context. No frontend input trusted.
     *
     * @param request HTTP request for extracting authenticated user context
     * @return List of interviews
     */
    /**
     * Interviewer names already in use, for a suggest-as-you-type control on the schedule form.
     *
     * <p>Interviewers are free text on purpose — an interviewer is frequently an external
     * recruiter rather than a Faculty row — but the server-side double-booking check matches on
     * that name, so a retype like "R. Sharma" instead of "Rahul Sharma" silently disables the
     * check for that person. Offering the existing spellings is what makes the check reliable.
     *
     * <p>Scoped to the caller's own organization, and returns names only: nothing here reveals who
     * a given interviewer met or when.
     */
    @GetMapping("/interviewers")
    @ApiOperation(value = "Distinct interviewer names in the caller's organization",
                  notes = "Backs the interviewer suggest control on the schedule form so admins reuse an "
                        + "existing spelling instead of creating a near-duplicate that defeats double-booking detection.")
    public ResponseEntity<Response<?>> getInterviewerNames(HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        Integer organizationId = principal.getOrganizationId();
        if (organizationId == null) {
            // A global super-admin has no single organization to scope to; an empty list keeps the
            // control working as a plain text input rather than leaking every tenant's names.
            return new ResponseEntity<>(new Response<>("success", "No organization scope",
                    java.util.Collections.emptyList()), HttpStatus.OK);
        }
        return new ResponseEntity<>(new Response<>("success", "Interviewer names retrieved",
                interviewService.getInterviewerNames(organizationId)), HttpStatus.OK);
    }

    @GetMapping
    @ApiOperation(value = "Get all interviews for organization or college",
                  notes = "College admin: returns interviews for their college. Org admin: returns for their organization. Super-admin: may pass collegeId query param. Optional page, size for pagination (Gap #17).")
    public ResponseEntity<Response<?>> getInterviewsForOrganization(
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        Pageable pageable = (page != null && size != null && page >= 0 && size > 0)
                ? PageRequest.of(page, Math.min(size, 500))
                : null;
        // College-scoped admin: filter by college first (no cross-college leakage)
        Integer effectiveCollegeId = securityContextUtil.getAuthenticatedCollegeId(request);
        if (effectiveCollegeId == null && collegeId != null && accessControlService.isSuperAdmin(principal)) {
            requireScopedSuperadminCollegeWithinScope(principal, collegeId);
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            effectiveCollegeId = collegeId;
        }
        if (effectiveCollegeId != null) {
            if (pageable != null) {
                Page<Interview> interviewsPage = interviewService.getInterviewsForCollege(effectiveCollegeId, pageable);
                return new ResponseEntity<>(
                        new Response<>("success", "Interviews retrieved successfully", interviewsPage),
                        HttpStatus.OK);
            }
            List<Interview> interviews = interviewService.getInterviewsForCollege(effectiveCollegeId);
            return new ResponseEntity<>(
                    new Response<>("success", "Interviews retrieved successfully", interviews),
                    HttpStatus.OK);
        }
        // Org-level admin: use organization ID
        Integer organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);
        if (organizationId == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization or college ID not found in authenticated context", null),
                    HttpStatus.FORBIDDEN);
        }
        if (pageable != null) {
            Page<Interview> interviewsPage = interviewService.getInterviewsForOrganization(organizationId, pageable);
            return new ResponseEntity<>(
                    new Response<>("success", "Interviews retrieved successfully", interviewsPage),
                    HttpStatus.OK);
        }
        List<Interview> interviews = interviewService.getInterviewsForOrganization(organizationId);
        return new ResponseEntity<>(
                new Response<>("success", "Interviews retrieved successfully", interviews),
                HttpStatus.OK);
    }

    /**
     * Get interviews for a job application (admin)
     * SECURITY: Organization ID derived from authenticated context (UNTRUSTED frontend input ignored)
     * 
     * @param applicationId Application ID
     * @param request HTTP request for extracting authenticated user context
     * @return List of interviews
     */
    @GetMapping("/application/{applicationId}")
    @ApiOperation(value = "Get interviews for application",
                  notes = "Returns all interviews for a job application. Organization ID is derived from authenticated user context. Learners must use learner-specific endpoints.")
    public ResponseEntity<Response<List<Interview>>> getInterviewsForApplication(
            @PathVariable Integer applicationId,
            HttpServletRequest request) {
        try {
            if (applicationId == null || applicationId <= 0) {
                return new ResponseEntity<>(new Response<>("error", "applicationId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            // SECURITY: Learners must use /learner/{learnerId} endpoints, not the org-level application endpoint
            if (principal != null && principal.isLearner()) {
                // Verify learner owns this application before allowing access
                JobApplication application = jobApplicationRepository.findById(applicationId)
                        .orElseThrow(() -> new IllegalArgumentException("Application not found"));
                if (application.getLearner() == null || !java.util.Objects.equals(application.getLearner().getId(), principal.getId())) {
                    return new ResponseEntity<>(
                            new Response<>("error", "Access denied. You can only view interviews for your own applications.", null),
                            HttpStatus.FORBIDDEN);
                }
            }
            // SECURITY: Derive organization ID from authenticated context - NEVER trust frontend
            Integer organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);

            // Super-admin: no college/org in JWT; derive org from the application's job
            if (organizationId == null && accessControlService.isSuperAdmin(principal)) {
                JobApplication application = jobApplicationRepository.findById(applicationId)
                        .orElseThrow(() -> new IllegalArgumentException("Application not found"));
                organizationId = application.getOrganizationId();
                if (organizationId == null && application.getJob() != null) {
                    organizationId = application.getJob().getOrganizationId();
                }
                if (organizationId == null) {
                    return new ResponseEntity<>(
                            new Response<>("error", "Application has no organization context", null),
                            HttpStatus.FORBIDDEN);
                }
                accessControlService.requireAccessOrganization(principal, organizationId);
            }

            if (organizationId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization ID not found in authenticated context", null),
                        HttpStatus.FORBIDDEN);
            }

            // SECURITY: college-scoped admin must not be able to read interviews for an application
            // whose job belongs to a different college in the same organization (mirrors the same
            // gap fixed on getInterviewById/updateInterview/etc via requireCollegeScopedAccessToInterview).
            if (principal != null && !principal.isLearner()) {
                JobApplication applicationForScopeCheck = jobApplicationRepository.findById(applicationId)
                        .orElseThrow(() -> new IllegalArgumentException("Application not found"));
                Job jobForScopeCheck = applicationForScopeCheck.getJob();
                requireCollegeScopedAccessToJob(principal, jobForScopeCheck, organizationId);
            }

            List<Interview> interviews = interviewService.getInterviewsForApplication(applicationId, organizationId, principal);
            return new ResponseEntity<>(
                    new Response<>("success", "Interviews retrieved successfully", interviews),
                    HttpStatus.OK);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get interviews for a learner
     * 
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return List of interviews
     */
    @GetMapping("/learner/{learnerId}/organization/{organizationId}")
    @ApiOperation(value = "Get interviews for learner",
                  notes = "Returns all interviews for a learner. Optional page/size for pagination.")
    public ResponseEntity<Response<?>> getInterviewsForLearner(
            @PathVariable Integer learnerId,
            @PathVariable String organizationId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (learnerId == null || learnerId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "learnerId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        Integer orgId = parseOrganizationIdPath(organizationId);
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            if (!learnerId.equals(principal.getId())) {
                return new ResponseEntity<>(
                        new Response<>("error", "Learners can only view their own interviews", null),
                        HttpStatus.FORBIDDEN);
            }
            Integer effectiveOrgId = resolveLearnerOrganizationId(principal.getId());
            if (effectiveOrgId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Learner profile is missing organization. Please contact support.", null),
                        HttpStatus.BAD_REQUEST);
            }
            orgId = effectiveOrgId;
        } else {
            accessControlService.requireAccessLearner(principal, learnerId);
            orgId = resolveLearnerOrganizationId(learnerId);
            if (orgId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Could not resolve organization for this learner.", null),
                        HttpStatus.BAD_REQUEST);
            }
        }
        try {
            Pageable pageable = (page != null && size != null && page >= 0 && size > 0)
                    ? PageRequest.of(page, Math.min(size, 200)) : null;
            if (pageable != null) {
                Page<Interview> interviewsPage = interviewService.getInterviewsForLearner(learnerId, orgId, pageable);
                // SECURITY: same reasoning as confirmInterview/etc. below — return the learner-safe
                // DTO, not the raw entity. This list endpoint (unlike the four action endpoints)
                // previously serialized the raw Interview, leaking notes, and — via
                // JOIN FETCH i.job/i.jobApplication/i.learner — the full nested job application
                // including screeningScore/isPartialScore, both explicitly documented as
                // never-surfaced-to-candidates on LearnerApplicationView above.
                Page<LearnerApplicationWithInterviewsDTO.LearnerInterviewView> safePage =
                        interviewsPage.map(LearnerApplicationWithInterviewsDTO.LearnerInterviewView::from);
                return new ResponseEntity<>(
                        new Response<>("success", "Interviews retrieved successfully", safePage),
                        HttpStatus.OK);
            }
            List<Interview> interviews = interviewService.getInterviewsForLearner(learnerId, orgId);
            List<LearnerApplicationWithInterviewsDTO.LearnerInterviewView> safeInterviews = interviews.stream()
                    .map(LearnerApplicationWithInterviewsDTO.LearnerInterviewView::from)
                    .collect(Collectors.toList());
            return new ResponseEntity<>(
                    new Response<>("success", "Interviews retrieved successfully", safeInterviews),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get upcoming interviews for a learner
     * 
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return List of upcoming interviews
     */
    @GetMapping("/learner/{learnerId}/upcoming/organization/{organizationId}")
    @ApiOperation(value = "Get upcoming interviews for learner", 
                  notes = "Returns upcoming interviews for a learner.")
    public ResponseEntity<Response<List<LearnerApplicationWithInterviewsDTO.LearnerInterviewView>>> getUpcomingInterviewsForLearner(
            @PathVariable Integer learnerId,
            @PathVariable String organizationId) {
        Integer orgId = parseOrganizationIdPath(organizationId);
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            if (!learnerId.equals(principal.getId())) {
                return new ResponseEntity<>(
                        new Response<>("error", "Learners can only view their own interviews", null),
                        HttpStatus.FORBIDDEN);
            }
            Integer effectiveOrgId = resolveLearnerOrganizationId(principal.getId());
            if (effectiveOrgId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Learner profile is missing organization. Please contact support.", null),
                        HttpStatus.BAD_REQUEST);
            }
            orgId = effectiveOrgId;
        } else {
            accessControlService.requireAccessLearner(principal, learnerId);
            orgId = resolveLearnerOrganizationId(learnerId);
            if (orgId == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Could not resolve organization for this learner.", null),
                        HttpStatus.BAD_REQUEST);
            }
        }
        List<Interview> interviews = interviewService.getUpcomingInterviewsForLearner(learnerId, orgId);
        // SECURITY: same fix as getInterviewsForLearner above — return the learner-safe DTO.
        List<LearnerApplicationWithInterviewsDTO.LearnerInterviewView> safeInterviews = interviews.stream()
                .map(LearnerApplicationWithInterviewsDTO.LearnerInterviewView::from)
                .collect(Collectors.toList());
        return new ResponseEntity<>(
                new Response<>("success", "Upcoming interviews retrieved successfully", safeInterviews),
                HttpStatus.OK);
    }

    /**
     * Get interview by ID
     * 
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @return Interview details
     */
    @GetMapping("/{interviewId}/organization/{organizationId}")
    @ApiOperation(value = "Get interview by ID",
                  notes = "Returns interview details. Learners must use the /learner/{learnerId} endpoints instead.")
    public ResponseEntity<Response<Interview>> getInterviewById(
            @PathVariable Integer interviewId,
            @PathVariable Integer organizationId) {
        if (interviewId == null || interviewId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "interviewId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        if (organizationId == null || organizationId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "organizationId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            return new ResponseEntity<>(
                    new Response<>("error", "Access denied. Use the learner interview endpoints.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, organizationId);
        requireCollegeScopedAccessToInterview(principal, interviewId, organizationId);
        try {
            Interview interview = interviewService.getInterviewById(interviewId, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Interview retrieved successfully", interview),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Update interview (admin)
     *
     * @param interviewId Interview ID
     * @param interview Updated interview data
     * @param organizationId Organization ID
     * @return Updated interview
     */
    @PutMapping("/{interviewId}/organization/{organizationId}")
    @ApiOperation(value = "Update interview",
                  notes = "Admin updates interview details.")
    public ResponseEntity<Response<Interview>> updateInterview(
            @PathVariable Integer interviewId,
            // No @Valid here (unlike scheduleInterview): this is a partial update and
            // Interview.scheduledDate carries @NotNull, which would wrongly force every PUT to
            // resend a scheduledDate even when only e.g. notes/location are being changed. The
            // service layer already does its own null-gated partial-update validation for every
            // field that is actually provided.
            @RequestBody Interview interview,
            @PathVariable Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            return new ResponseEntity<>(
                    new Response<>("error", "Access denied. Learners cannot update interviews.", null),
                    HttpStatus.FORBIDDEN);
        }
        // Verify path org matches JWT org for non-super-admin (prevents cross-org writes)
        Integer jwtOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        if (jwtOrgId != null && !jwtOrgId.equals(organizationId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization mismatch. You can only update interviews in your own organization.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, organizationId);
        requireCollegeScopedAccessToInterview(principal, interviewId, organizationId);
        try {
            Interview updatedInterview = interviewService.updateInterview(interviewId, interview, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Interview updated successfully", updatedInterview),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (ObjectOptimisticLockingFailureException e) {
            return new ResponseEntity<>(
                    new Response<>("error", "This interview was updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Cancel interview (admin)
     *
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @return Cancelled interview
     */
    @PostMapping("/{interviewId}/cancel/organization/{organizationId}")
    @ApiOperation(value = "Cancel interview",
                  notes = "Admin cancels an interview.")
    public ResponseEntity<Response<Interview>> cancelInterview(
            @PathVariable Integer interviewId,
            @PathVariable Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            return new ResponseEntity<>(
                    new Response<>("error", "Access denied. Learners cannot cancel interviews via this endpoint.", null),
                    HttpStatus.FORBIDDEN);
        }
        Integer jwtOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        if (jwtOrgId != null && !jwtOrgId.equals(organizationId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization mismatch. You can only cancel interviews in your own organization.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, organizationId);
        requireCollegeScopedAccessToInterview(principal, interviewId, organizationId);
        try {
            Interview cancelledInterview = interviewService.cancelInterview(interviewId, organizationId);
            return new ResponseEntity<>(
                    new Response<>("success", "Interview cancelled successfully", cancelledInterview),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (ObjectOptimisticLockingFailureException e) {
            return new ResponseEntity<>(
                    new Response<>("error", "This interview was updated by someone else (e.g. candidate confirmed). Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Confirm interview (Learner action)
     * 
     * @param interviewId Interview ID
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return Confirmed interview
     */
    @PostMapping("/{interviewId}/confirm/learner/{learnerId}/organization/{organizationId}")
    @ApiOperation(value = "Confirm interview",
                  notes = "Learner confirms an interview. Organization is resolved from the interview (path orgId ignored).")
    public ResponseEntity<Response<LearnerApplicationWithInterviewsDTO.LearnerInterviewView>> confirmInterview(
            @PathVariable Integer interviewId,
            @PathVariable Integer learnerId,
            @PathVariable String organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner() && !java.util.Objects.equals(learnerId, principal.getId())) {
            return new ResponseEntity<>(
                    new Response<>("error", "Learners can only confirm their own interviews", null),
                    HttpStatus.FORBIDDEN);
        }
        // SECURITY: Resolve org from interview (resource), not from path. Eager load learner for access check.
        Interview interview = interviewRepository.findByIdWithLearner(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (Boolean.TRUE.equals(interview.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        Integer orgId = interview.getOrganizationId();
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        if (principal != null && principal.isLearner()) {
            accessControlService.requireLearnerCanActOnOwnInterview(principal, interview);
        } else {
            accessControlService.requireAccessOrganization(principal, orgId);
            // SECURITY: org check alone resolves a college-scoped admin up to their parent org —
            // without this, a College-C1 admin could confirm an interview belonging to College-C2
            // in the same org. Mirrors the guard on getInterviewById/updateInterview/etc.
            requireCollegeScopedAccessToInterview(principal, interviewId, orgId);
        }
        try {
            Interview confirmedInterview = interviewService.confirmInterview(interviewId, learnerId, orgId);
            // SECURITY: return the learner-safe DTO, not the raw entity — Interview.notes is
            // admin-internal (no @JsonIgnore, since admin-facing endpoints like getInterviewById/
            // updateInterview legitimately need it) and was previously leaking to this
            // learner-facing action response. Mirrors LearnerApplicationWithInterviewsDTO's
            // existing field allowlist.
            return new ResponseEntity<>(
                    new Response<>("success", "Interview confirmed successfully",
                            LearnerApplicationWithInterviewsDTO.LearnerInterviewView.from(confirmedInterview)),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (ObjectOptimisticLockingFailureException e) {
            return new ResponseEntity<>(
                    new Response<>("error", "This interview was updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage() != null ? e.getMessage() : "Access denied to this interview", null),
                    HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Mark interview as completed (Admin action).
     * Only SCHEDULED or CONFIRMED interviews can be marked complete.
     */
    @PostMapping("/{interviewId}/complete/organization/{organizationId}")
    @ApiOperation(value = "Mark interview as completed",
                  notes = "Admin marks an interview as completed after the round has taken place.")
    public ResponseEntity<Response<Interview>> markInterviewCompleted(
            @PathVariable Integer interviewId,
            @PathVariable Integer organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner()) {
            return new ResponseEntity<>(
                    new Response<>("error", "Access denied. Learners cannot mark interviews as completed.", null),
                    HttpStatus.FORBIDDEN);
        }
        Integer jwtOrgId = securityContextUtil.getAuthenticatedOrganizationId(request);
        if (jwtOrgId != null && !jwtOrgId.equals(organizationId)) {
            return new ResponseEntity<>(
                    new Response<>("error", "Organization mismatch. You can only complete interviews in your own organization.", null),
                    HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, organizationId);
        requireCollegeScopedAccessToInterview(principal, interviewId, organizationId);
        Integer completedBy = securityContextUtil.getAuthenticatedUserId(request);
        try {
            Interview completed = interviewService.markCompleted(interviewId, organizationId, completedBy);
            return new ResponseEntity<>(
                    new Response<>("success", "Interview marked as completed", completed),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (ObjectOptimisticLockingFailureException e) {
            return new ResponseEntity<>(
                    new Response<>("error", "This interview was updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Cancel reschedule request (Learner action).
     * Reverts RESCHEDULE_REQUESTED back to SCHEDULED.
     * Organization is resolved from the interview resource (path orgId ignored for security).
     */
    @PostMapping("/{interviewId}/cancel-reschedule-request/learner/{learnerId}/organization/{organizationId}")
    @ApiOperation(value = "Cancel reschedule request",
                  notes = "Learner cancels their own reschedule request. Organization is resolved from the interview (path orgId ignored).")
    public ResponseEntity<Response<LearnerApplicationWithInterviewsDTO.LearnerInterviewView>> cancelRescheduleRequest(
            @PathVariable Integer interviewId,
            @PathVariable Integer learnerId,
            @PathVariable String organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner() && !java.util.Objects.equals(learnerId, principal.getId())) {
            return new ResponseEntity<>(
                    new Response<>("error", "Learners can only cancel their own reschedule requests", null),
                    HttpStatus.FORBIDDEN);
        }
        // SECURITY: Resolve org from interview resource, not from path
        Interview interview = interviewRepository.findByIdWithLearner(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (Boolean.TRUE.equals(interview.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        Integer orgId = interview.getOrganizationId();
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        if (principal.isLearner()) {
            accessControlService.requireLearnerCanActOnOwnInterview(principal, interview);
        } else {
            accessControlService.requireAccessOrganization(principal, orgId);
            // SECURITY: see confirmInterview above — org check alone is not college-scoped.
            requireCollegeScopedAccessToInterview(principal, interviewId, orgId);
        }
        // Rate-limit the same way requestReschedule is limited above — this is the other half of
        // the SCHEDULED <-> RESCHEDULE_REQUESTED toggle cycle, so it needs the same cap to be
        // effective (limiting only one direction of the cycle would not actually bound it).
        if (rateLimitingService != null) {
            String key = "interview_reschedule:" + learnerId;
            if (rateLimitingService.isRateLimited(key, 20, 3600)) {
                return new ResponseEntity<>(
                        new Response<>("error", "Too many reschedule requests submitted. Please wait before trying again.", null),
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimitingService.recordAttempt(key, 20, 3600);
        }
        try {
            Interview updated = interviewService.cancelRescheduleRequest(interviewId, learnerId, orgId);
            // SECURITY: see confirmInterview above — return the learner-safe DTO, not the raw entity.
            return new ResponseEntity<>(
                    new Response<>("success", "Reschedule request cancelled successfully",
                            LearnerApplicationWithInterviewsDTO.LearnerInterviewView.from(updated)),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage() != null ? e.getMessage() : "Access denied", null),
                    HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Submit interview feedback (Admin, after round completion).
     * SECURITY: Organization ID and user ID from authenticated context.
     */
    @PostMapping("/{interviewId}/feedback")
    @ApiOperation(value = "Submit interview feedback",
                  notes = "Admin submits feedback after interview round. Body: rating (1-5), comments (string), recommendAction (string enum: PROCEED_NEXT_ROUND, HIRE, REJECT, HOLD).")
    public ResponseEntity<Response<Interview>> submitInterviewFeedback(
            @PathVariable Integer interviewId,
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            // Explicit admin-only guard — learners must never submit feedback
            if (principal == null || principal.isLearner()) {
                return new ResponseEntity<>(
                        new Response<>("error", "Access denied. Only admins can submit interview feedback.", null),
                        HttpStatus.FORBIDDEN);
            }
            Integer organizationId = securityContextUtil.getAuthenticatedOrganizationId(request);
            Integer submittedBy = securityContextUtil.getAuthenticatedUserId(request);

            // Super-admin: derive org from the interview record
            if (organizationId == null && accessControlService.isSuperAdmin(principal)) {
                Interview interview = interviewRepository.findById(interviewId)
                        .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
                organizationId = interview.getOrganizationId();
                if (organizationId == null) {
                    return new ResponseEntity<>(
                            new Response<>("error", "Interview has no organization context", null),
                            HttpStatus.FORBIDDEN);
                }
            }

            if (organizationId == null || submittedBy == null) {
                return new ResponseEntity<>(
                        new Response<>("error", "Organization or user context not found", null),
                        HttpStatus.FORBIDDEN);
            }
            // Do not treat the mere presence of an organization id as proof that the caller is
            // an admin. AccessControlService enforces both tenant membership AND the ADMIN role;
            // the college-specific resource check then narrows a college admin to their college.
            accessControlService.requireAccessOrganization(principal, organizationId);
            requireCollegeScopedAccessToInterview(principal, interviewId, organizationId);
            // SECURITY: requestBody is a raw Map<String, Object> deserialized straight from client
            // JSON — a crafted request can send any JSON type for these fields (e.g. rating as a
            // string/object/array instead of a number, or comments as a number/object/array instead
            // of a string). The previous blind (Number)/(String) casts threw an unguarded
            // ClassCastException that fell through to the generic catch(Exception) below and
            // surfaced as an opaque 500, instead of a clean 400 — the same class of bug already
            // fixed on the bulk/single applicationStatus endpoints. Validate the JSON types
            // explicitly before touching them.
            if (requestBody != null && requestBody.get("rating") != null && !(requestBody.get("rating") instanceof Number)) {
                return new ResponseEntity<>(
                        new Response<>("error", "rating must be a number", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (requestBody != null && requestBody.get("comments") != null && !(requestBody.get("comments") instanceof String)) {
                return new ResponseEntity<>(
                        new Response<>("error", "comments must be a string", null),
                        HttpStatus.BAD_REQUEST);
            }
            Integer rating = requestBody != null && requestBody.containsKey("rating") && requestBody.get("rating") != null
                    ? ((Number) requestBody.get("rating")).intValue() : null;
            String comments = requestBody != null && requestBody.containsKey("comments") ? (String) requestBody.get("comments") : null;
            String recommendAction = null;
            if (requestBody != null && requestBody.containsKey("recommendAction")) {
                Object r = requestBody.get("recommendAction");
                if (r != null) recommendAction = r.toString().trim().toUpperCase();
            }
            Interview updated = interviewService.submitFeedback(interviewId, organizationId, rating, comments, recommendAction, submittedBy);
            return new ResponseEntity<>(
                    new Response<>("success", "Feedback submitted successfully", updated),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (ObjectOptimisticLockingFailureException e) {
            return new ResponseEntity<>(
                    new Response<>("error", "This interview was updated by someone else. Please refresh and try again.", null),
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Request reschedule (Learner action)
     * 
     * @param interviewId Interview ID
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return Interview with reschedule requested
     */
    @PostMapping("/{interviewId}/request-reschedule/learner/{learnerId}/organization/{organizationId}")
    @ApiOperation(value = "Request reschedule",
                  notes = "Learner requests to reschedule an interview. Organization is resolved from the interview (path orgId ignored).")
    public ResponseEntity<Response<LearnerApplicationWithInterviewsDTO.LearnerInterviewView>> requestReschedule(
            @PathVariable Integer interviewId,
            @PathVariable Integer learnerId,
            @PathVariable String organizationId,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner() && !java.util.Objects.equals(learnerId, principal.getId())) {
            return new ResponseEntity<>(
                    new Response<>("error", "Learners can only request reschedule for their own interviews", null),
                    HttpStatus.FORBIDDEN);
        }
        // SECURITY: Resolve org from interview (resource), not from path. Eager load learner for access check.
        Interview interview = interviewRepository.findByIdWithLearner(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (Boolean.TRUE.equals(interview.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        Integer orgId = interview.getOrganizationId();
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        if (principal.isLearner()) {
            accessControlService.requireLearnerCanActOnOwnInterview(principal, interview);
        } else {
            accessControlService.requireAccessOrganization(principal, orgId);
            // SECURITY: see confirmInterview above — org check alone is not college-scoped.
            requireCollegeScopedAccessToInterview(principal, interviewId, orgId);
        }
        // Rate-limit reschedule requests the same way job applications/withdrawals are limited
        // (JP-08 pattern) — requestReschedule and cancelRescheduleRequest form the same kind of
        // unbounded toggle cycle as apply/withdraw (SCHEDULED -> RESCHEDULE_REQUESTED ->
        // SCHEDULED -> ...), with nothing else in either endpoint capping how many times a learner
        // can flip an interview back and forth. Neither endpoint previously had any rate limit.
        if (rateLimitingService != null) {
            String key = "interview_reschedule:" + learnerId;
            if (rateLimitingService.isRateLimited(key, 20, 3600)) {
                return new ResponseEntity<>(
                        new Response<>("error", "Too many reschedule requests submitted. Please wait before trying again.", null),
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimitingService.recordAttempt(key, 20, 3600);
        }
        // Student V1 §7: the learner's reason/note/preferred windows, sanitized and reshaped into
        // a plain, trusted map before it's stored — never the client's raw body verbatim.
        Map<String, Object> requestDetails = null;
        if (body != null) {
            Map<String, Object> clean = new java.util.LinkedHashMap<>();
            Object reasonRaw = body.get("reason");
            if (reasonRaw != null) {
                String reason = InputSanitizer.sanitize(String.valueOf(reasonRaw).trim());
                if (reason != null && !reason.isEmpty()) clean.put("reason", reason.length() > 100 ? reason.substring(0, 100) : reason);
            }
            Object noteRaw = body.get("note");
            if (noteRaw != null) {
                String note = InputSanitizer.sanitizePreserveNewlines(String.valueOf(noteRaw).trim());
                if (note != null && !note.isEmpty()) clean.put("note", note.length() > 1000 ? note.substring(0, 1000) : note);
            }
            Object windowsRaw = body.get("windows");
            if (windowsRaw instanceof java.util.List) {
                java.util.List<Map<String, String>> windows = new java.util.ArrayList<>();
                for (Object w : (java.util.List<?>) windowsRaw) {
                    if (!(w instanceof Map)) continue;
                    Map<?, ?> wm = (Map<?, ?>) w;
                    Object day = wm.get("day");
                    Object band = wm.get("band");
                    if (day == null && band == null) continue;
                    Map<String, String> clean2 = new java.util.LinkedHashMap<>();
                    if (day != null) clean2.put("day", InputSanitizer.sanitize(String.valueOf(day).trim()));
                    if (band != null) clean2.put("band", InputSanitizer.sanitize(String.valueOf(band).trim()));
                    windows.add(clean2);
                    if (windows.size() >= 3) break; // matches the frontend's own 3-window form
                }
                if (!windows.isEmpty()) clean.put("windows", windows);
            }
            if (!clean.isEmpty()) requestDetails = clean;
        }
        try {
            Interview rescheduleRequested = interviewService.requestReschedule(interviewId, learnerId, orgId, requestDetails);
            // SECURITY: see confirmInterview above — return the learner-safe DTO, not the raw entity.
            return new ResponseEntity<>(
                    new Response<>("success", "Reschedule requested successfully",
                            LearnerApplicationWithInterviewsDTO.LearnerInterviewView.from(rescheduleRequested)),
                    HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage() != null ? e.getMessage() : "Access denied to this interview", null),
                    HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Learner declines an interview outright (distinct from requesting a reschedule) — signals
     * to the placement team that the candidate no longer wants to interview at all.
     */
    @PostMapping("/{interviewId}/decline/learner/{learnerId}/organization/{organizationId}")
    @ApiOperation(value = "Decline interview",
                  notes = "Learner declines an interview. Organization is resolved from the interview (path orgId ignored).")
    public ResponseEntity<Response<Object>> declineInterview(
            @PathVariable Integer interviewId,
            @PathVariable Integer learnerId,
            @PathVariable String organizationId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(
                    new Response<>("error", "Authentication required", null),
                    HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner() && !java.util.Objects.equals(learnerId, principal.getId())) {
            return new ResponseEntity<>(
                    new Response<>("error", "Learners can only decline their own interviews", null),
                    HttpStatus.FORBIDDEN);
        }
        Interview interview = interviewRepository.findByIdWithLearner(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (Boolean.TRUE.equals(interview.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        Integer orgId = interview.getOrganizationId();
        if (orgId == null) {
            return new ResponseEntity<>(new Response<>("error", "Interview not found", null), HttpStatus.NOT_FOUND);
        }
        if (principal.isLearner()) {
            accessControlService.requireLearnerCanActOnOwnInterview(principal, interview);
        } else {
            accessControlService.requireAccessOrganization(principal, orgId);
            // SECURITY: see confirmInterview above — org check alone is not college-scoped.
            requireCollegeScopedAccessToInterview(principal, interviewId, orgId);
        }
        try {
            Interview declined = interviewService.declineInterview(interviewId, learnerId, orgId);
            // SECURITY: see confirmInterview above — return the learner-safe DTO, not the raw entity.
            return new ResponseEntity<>(
                    new Response<>("success", "Interview declined",
                            LearnerApplicationWithInterviewsDTO.LearnerInterviewView.from(declined)),
                    HttpStatus.OK);
        } catch (com._42students.lms.exceptions.WithdrawRequiresRequestException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), java.util.Map.of("code", "WITHDRAW_NEEDS_REQUEST")),
                    HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(
                    new Response<>("error", e.getMessage() != null ? e.getMessage() : "Access denied to this interview", null),
                    HttpStatus.FORBIDDEN);
        }
    }
}

