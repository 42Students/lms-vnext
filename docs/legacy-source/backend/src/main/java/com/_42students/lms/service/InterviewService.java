package com._42students.lms.service;

import com._42students.lms.model.Interview;
import com._42students.lms.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service for Interview scheduling and management
 * Phase 5: Organization-scoped interview scheduling
 */
public interface InterviewService {
    
    /**
     * Schedule a new interview
     * Admin (placement) can schedule from /vasan or college admin.
     * Application must be at least SHORTLISTED
     *
     * @param interview Interview entity with details
     * @param organizationId Organization ID (from admin context)
     * @param createdBy Admin user ID
     * @return Created interview
     */
    Interview scheduleInterview(Interview interview, Integer organizationId, Integer createdBy);
    
    /**
     * Get all interviews for an organization
     * 
     * @param organizationId Organization ID
     * @return List of interviews
     */
    List<Interview> getInterviewsForOrganization(Integer organizationId);

    /**
     * Get interviews for organization with optional pagination (Gap #17).
     */
    Page<Interview> getInterviewsForOrganization(Integer organizationId, Pageable pageable);

    /**
     * Get all interviews for a college (college-scoped admin).
     * Returns interviews whose job belongs to the given college.
     *
     * @param collegeId College ID (from principal)
     * @return List of interviews
     */
    List<Interview> getInterviewsForCollege(Integer collegeId);

    /**
     * Get interviews for college with optional pagination (Gap #17).
     */
    Page<Interview> getInterviewsForCollege(Integer collegeId, Pageable pageable);

    /**
     * Get interviews for a job application.
     * Must belong to the organization. If principal is a learner, they may only access their own application's interviews.
     *
     * @param applicationId Application ID
     * @param organizationId Organization ID
     * @param principal Authenticated user (optional); if learner, enforces ownership
     * @return List of interviews
     */
    List<Interview> getInterviewsForApplication(Integer applicationId, Integer organizationId, UserPrincipal principal);
    
    /**
     * Get interviews for a learner
     * Must belong to learner's organization
     * 
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return List of interviews
     */
    List<Interview> getInterviewsForLearner(Integer learnerId, Integer organizationId);
    
    /**
     * Get interviews for a learner with pagination.
     */
    Page<Interview> getInterviewsForLearner(Integer learnerId, Integer organizationId, Pageable pageable);

    /**
     * Get upcoming interviews for a learner
     *
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return List of upcoming interviews
     */
    List<Interview> getUpcomingInterviewsForLearner(Integer learnerId, Integer organizationId);
    
    /**
     * Get interview by ID
     * Must belong to organization
     * 
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @return Interview entity
     */
    Interview getInterviewById(Integer interviewId, Integer organizationId);
    
    /**
     * Update interview details
     * Admin can update
     * 
     * @param interviewId Interview ID
     * @param interview Updated interview data
     * @param organizationId Organization ID
     * @return Updated interview
     */
    Interview updateInterview(Integer interviewId, Interview interview, Integer organizationId);
    
    /**
     * Cancel an interview
     * Admin can cancel
     * 
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @return Cancelled interview
     */
    Interview cancelInterview(Integer interviewId, Integer organizationId);
    
    /**
     * Confirm interview (Learner action)
     * 
     * @param interviewId Interview ID
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return Confirmed interview
     */
    Interview confirmInterview(Integer interviewId, Integer learnerId, Integer organizationId);
    
    /**
     * Request reschedule (Learner action)
     * 
     * @param interviewId Interview ID
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return Interview with reschedule requested
     */
    Interview requestReschedule(Integer interviewId, Integer learnerId, Integer organizationId);

    /**
     * Student V1 §7: same as {@link #requestReschedule(Integer, Integer, Integer)}, but actually
     * carries the learner's reason/note/preferred-windows to the placement cell instead of
     * discarding it. {@code requestDetails} is stored as-is (already validated/shaped by the
     * controller) and is admin-facing only — never returned to any learner endpoint.
     */
    Interview requestReschedule(Integer interviewId, Integer learnerId, Integer organizationId, Object requestDetails);

    /** Learner declines an interview outright (distinct from requesting a reschedule). */
    Interview declineInterview(Integer interviewId, Integer learnerId, Integer organizationId);

    /**
     * Mark interview as completed (Admin action after round is done).
     *
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @param completedBy Admin user ID
     * @return Updated interview with COMPLETED status
     */
    Interview markCompleted(Integer interviewId, Integer organizationId, Integer completedBy);

    /**
     * Cancel a learner's reschedule request, reverting status back to SCHEDULED (Learner action).
     *
     * @param interviewId Interview ID
     * @param learnerId Learner ID
     * @param organizationId Organization ID
     * @return Updated interview with SCHEDULED status
     */
    Interview cancelRescheduleRequest(Integer interviewId, Integer learnerId, Integer organizationId);

    /**
     * Submit interview feedback (Admin after round completion).
     * Interview must be in COMPLETED or NO_SHOW status.
     *
     * @param interviewId Interview ID
     * @param organizationId Organization ID
     * @param rating 1-5 (optional)
     * @param comments Free text (optional)
     * @param recommendAction PROCEED_NEXT_ROUND | HIRE | REJECT | HOLD (optional)
     * @param submittedBy Admin user ID
     * @return Updated interview with feedback
     */
    Interview submitFeedback(Integer interviewId, Integer organizationId, Integer rating, String comments, String recommendAction, Integer submittedBy);

    /**
     * Audit + notify for an interview that was cancelled as a side effect of its parent
     * JobApplication's status changing elsewhere (JobServiceImpl/AdminJobServiceImpl/
     * PlacementJobServiceImpl's cancelNonTerminalInterviewsForApplication[Locked] cascade helpers)
     * rather than through {@link #cancelInterview}. Those cascade sites flip interviewStatus to
     * CANCELLED and save directly via InterviewRepository — they never went through
     * cancelInterview, so the candidate previously got no interview-specific notification (only
     * the application-level status-change notification, which does not necessarily mention that
     * their specific scheduled interview was cancelled) and the action was never audit-logged.
     * Intended to be called after the caller's own transaction commits (mirrors every other
     * notification dispatch in InterviewServiceImpl).
     *
     * @param interviewId   the already-cancelled interview's id
     * @param previousStatus the interview's interviewStatus before this cascade cancelled it
     */
    void notifyInterviewCancelledByCascade(Integer interviewId, String previousStatus);

    /** Distinct interviewer names used in an organization, for the schedule form's suggest control. */
    java.util.List<String> getInterviewerNames(Integer organizationId);
}



