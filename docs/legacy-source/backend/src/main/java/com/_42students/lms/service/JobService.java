package com._42students.lms.service;

import com._42students.lms.dto.response.JobImportantDateEventDTO;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for Job management and applications
 * NEW FLOW: Target → Apply → Screen → Decide
 * 
 * PHILOSOPHY:
 * - Targeting decides who can SEE & APPLY (HARD - visibility gate)
 * - Screening decides who looks STRONG (post-apply evaluation)
 * - Humans decide who gets HIRED (recruiter decision)
 * 
 * NO hard eligibility rejection before apply.
 */
public interface JobService {
    
    /**
     * Get all active jobs for a learner's organization
     * SECURITY FIX: Organization-scoped to prevent cross-organization data leaks
     * 
     * @param learnerId Learner ID (used to determine organization)
     * @return List of active jobs in learner's organization
     */
    List<Job> getAllActiveJobsForLearnerOrganization(Integer learnerId);
    
    /**
     * @deprecated Use getAllActiveJobsForLearnerOrganization instead
     * This method returns jobs from all organizations (security risk)
     */
    @Deprecated
    List<Job> getAllActiveJobs();
    
    /**
     * Get job by ID
     * @param jobId Job ID
     * @return Job entity
     */
    Job getJobById(Integer jobId);
    
    /**
     * Get jobs visible to a learner
     * Visibility based ONLY on:
     * - Organization match
     * - Targeting hierarchy (Department/Program/Batch/Class)
     * - Job active flag
     * - Application deadline not passed
     * 
     * DO NOT check: Skills, GPA, Degree, Specialization
     * 
     * @param learnerId Learner ID
     * @return List of visible jobs
     */
    List<Job> getVisibleJobsForLearner(Integer learnerId);
    
    /**
     * Check if a job is visible to a learner
     * Based ONLY on targeting + active + deadline
     * 
     * @param learnerId Learner ID
     * @param jobId Job ID
     * @return Visibility result
     */
    VisibilityResult checkJobVisibility(Integer learnerId, Integer jobId);
    
    /**
     * Apply to a job
     * NO eligibility checks - if visible, can apply
     * 
     * Validations:
     * - Job is visible to learner
     * - Job is active
     * - Deadline not passed
     * - No duplicate application (DB constraint)
     * 
     * After apply:
     * - Application created with status "APPLIED"
     * - Source set to "INTERNAL" for LMS student applications
     * - Resume URL stored if provided (or falls back to learner profile resume)
     * - Screening runs asynchronously
     * 
     * @param learnerId Learner ID
     * @param jobId Job ID
     * @param resumeUrl Optional resume URL (if null, uses learner's profile resume if available)
     * @return Created JobApplication entity
     * @throws IllegalArgumentException if job not visible, not active, or deadline passed
     */
    JobApplication applyToJob(Integer learnerId, Integer jobId, String resumeUrl);
    
    /**
     * Get all applications for a learner
     * 
     * @param learnerId Learner ID
     * @return List of job applications
     */
    List<JobApplication> getLearnerApplications(Integer learnerId);

    /**
     * Get all applications for a learner with next upcoming interview attached (Gap #3).
     * 
     * @param learnerId Learner ID
     * @return List of applications with nextInterview populated when available
     */
    List<com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO> getLearnerApplicationsWithInterviews(Integer learnerId);
    
    /**
     * Get application by ID
     * 
     * @param applicationId Application ID
     * @return JobApplication entity
     */
    JobApplication getApplicationById(Integer applicationId);

    /**
     * Check if learner has already applied to a job (non-deleted application).
     *
     * @param learnerId Learner ID
     * @param jobId Job ID
     * @return true if an active application exists
     */
    boolean hasApplied(Integer learnerId, Integer jobId);

    /**
     * Get application by learner and job if it exists (non-deleted).
     *
     * @param learnerId Learner ID
     * @param jobId Job ID
     * @return Optional of JobApplication
     */
    java.util.Optional<JobApplication> getApplicationByLearnerAndJob(Integer learnerId, Integer jobId);

    /**
     * Legacy compatibility path: withdraw the learner's current active application for a job.
     * New clients should use {@link #withdrawApplicationById(Integer, Integer)} so the selected
     * application identity is explicit rather than inferred from (learnerId, jobId).
     */
    JobApplication withdrawApplication(Integer learnerId, Integer jobId);

    /**
     * Withdraw one explicit application owned by the learner. The service re-loads the row under
     * a pessimistic lock, validates learner ownership, applies the same state-machine rules as the
     * legacy path, soft-deletes true withdrawals, and cancels any non-terminal interviews.
     */
    JobApplication withdrawApplicationById(Integer learnerId, Integer applicationId);

    /**
     * Learner accepts or declines an offer. Only valid while the application is OFFERED —
     * accepting moves it to HIRED, declining moves it to REJECTED (with a system-attributed
     * rejection reason) so the placement team sees a captured response either way instead of
     * the status sitting at OFFERED indefinitely with no record of what the candidate decided.
     */
    JobApplication respondToOffer(Integer learnerId, Integer applicationId, boolean accept);

    /**
     * Student V1 §"Offers get their own table": what accepting this offer would actually do to
     * every other active application, split into the three groups the accept-confirm screen
     * shows — withdrawn, kept open (the college's rules — a Dream drive or a big enough pay
     * uplift — still admit it), and other pending offers that would be declined. Read-only:
     * mirrors {@code respondToOffer}'s own cascade classification exactly, but never mutates
     * anything, so it is safe to call before the student has committed to accepting.
     */
    OfferAcceptPreview previewOfferAccept(Integer learnerId, Integer applicationId);

    class OfferAcceptPreview {
        public final List<Map<String, Object>> withdrawn = new java.util.ArrayList<>();
        public final List<Map<String, Object>> staysOpen = new java.util.ArrayList<>();
        public final List<Map<String, Object>> otherPendingDeclined = new java.util.ArrayList<>();
    }

    /**
     * Visibility result class
     */
    class VisibilityResult {
        private boolean visible;
        private String reason;
        
        public VisibilityResult(boolean visible, String reason) {
            this.visible = visible;
            this.reason = reason;
        }
        
        public boolean isVisible() {
            return visible;
        }
        
        public String getReason() {
            return reason;
        }
    }
    
    /**
     * @deprecated Use {@link #getVisibleJobsForLearner} instead.
     *
     * <p><b>This method does NOT filter by eligibility, despite its name.</b> It delegates
     * straight to visibility (targeting: org/college/department/program/batch/class). The
     * previous Javadoc claimed it "filters by eligibility which blocks visibility", which was
     * never true of the implementation and actively misled callers into assuming CGPA, degree,
     * specialisation and graduation-year criteria were applied here. They are not applied
     * anywhere — see the class comment on JobServiceImpl.
     */
    @Deprecated
    List<Job> getEligibleJobsForLearner(Integer learnerId);
    
    /**
     * Get job important-date events for admin calendar (organization or college scoped).
     * Returns events in the given date range.
     *
     * @param collegeId College ID (if non-null, jobs for this college)
     * @param organizationId Organization ID (used when collegeId is null)
     * @param start Range start (inclusive)
     * @param end Range end (inclusive)
     * @return List of events for calendar
     */
    List<JobImportantDateEventDTO> getImportantDateEventsForAdmin(Integer collegeId, Integer organizationId, LocalDateTime start, LocalDateTime end);

    /**
     * Get job important-date events for learner career calendar (only jobs visible to the learner).
     *
     * @param learnerId Learner ID
     * @param start Range start (inclusive)
     * @param end Range end (inclusive)
     * @return List of events for calendar
     */
    List<JobImportantDateEventDTO> getImportantDateEventsForLearner(Integer learnerId, LocalDateTime start, LocalDateTime end);

    /**
     * Student V1 §8 Calendar: the same "jobs visible on the Jobs page, plus every job applied
     * to" union {@link #getImportantDateEventsForLearner} uses, as plain job ids — for callers
     * (e.g. StudentCalendarService) that need to scope a different query (job_round talks) to
     * exactly the same set of jobs, without a second hand-written copy of that visibility union.
     */
    List<Integer> getCalendarJobIdsForLearner(Integer learnerId);

    /**
     * @deprecated Use checkJobVisibility instead
     * Eligibility checks are removed - only targeting matters for visibility
     */
    @Deprecated
    EligibilityResult checkLearnerEligibility(Integer learnerId, Integer jobId);
    
    /**
     * @deprecated Eligibility result - replaced by VisibilityResult
     */
    @Deprecated
    class EligibilityResult {
        private boolean eligible;
        private String reason;
        
        public EligibilityResult(boolean eligible, String reason) {
            this.eligible = eligible;
            this.reason = reason;
        }
        
        public boolean isEligible() {
            return eligible;
        }
        
        public String getReason() {
            return reason;
        }
    }
}



