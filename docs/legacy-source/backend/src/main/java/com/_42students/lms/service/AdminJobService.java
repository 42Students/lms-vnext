package com._42students.lms.service;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.model.Learner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AdminJobService {
    
    List<Job> getAllJobs(Integer collegeId);

    /**
     * The "All Drives" browse-everything view — server-side paginated/filtered/searched, unlike
     * {@link #getAllJobs}, which loads a college's entire job history unbounded. Needed once a
     * college has run hundreds of drives across multiple placement seasons.
     * @param status "all" | "draft" | "active" | "closed"
     * @param search matches job title or company name (case-insensitive substring)
     * @param sortBy "postedDate" | "applicationDeadline"
     * @param sortDir "asc" | "desc"
     * @return Map with content (List&lt;Job&gt;), totalElements, totalPages, number, size
     */
    Map<String, Object> getAllJobsPaginated(Integer collegeId, int page, int size, String status, String search,
                                             String sortBy, String sortDir);

    /**
     * Bulk open/close multiple drives at once (max 100 per request) - mirrors the existing
     * application bulk-status pattern. Needed once a college is cleaning up dozens of expired
     * drives at the end of a season instead of closing them one at a time.
     * @return Map with updatedCount, failed (list of {jobId, reason})
     */
    Map<String, Object> bulkUpdateJobStatus(Integer collegeId, List<Integer> jobIds, boolean isActive);
    
    Job getJobById(Integer jobId, Integer collegeId);
    
    Job createJob(Job job, Integer collegeId, Integer createdBy);
    
    Job updateJob(Integer jobId, Job job, Integer collegeId);

    /**
     * Moves (or creates) the "Application deadline" entry in importantDates and re-derives
     * Job.applicationDeadline from it, so the two stay in agreement — see the derivation note on
     * Job.applicationDeadline for why setting the field directly is not enough.
     */
    Job extendApplicationDeadline(Integer jobId, Integer collegeId, java.time.LocalDateTime newDeadline);
    
    void deleteJob(Integer jobId, Integer collegeId);

    /** Preview the learner/interview impact before a job is soft-deleted. */
    Map<String, Object> getJobDeletionImpact(Integer jobId, Integer collegeId);
    
    List<Learner> getEligibleLearners(Job job, Integer collegeId);
    
    List<JobApplication> getJobApplications(Integer jobId, Integer collegeId);

    /**
     * Fetch one application by its own identity, scoped to the expected job and college.
     * Used by admin detail surfaces that must refresh a record even when a status mutation
     * moves it out of the currently-filtered applications page.
     */
    JobApplication getJobApplication(Integer applicationId, Integer jobId, Integer collegeId);

    Page<JobApplication> getJobApplicationsPaginated(Integer jobId, Integer collegeId, Pageable pageable,
                                                     String applicationStatus, Double minScore, Double maxScore,
                                                     LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                     String source, Integer departmentId, Integer programId, Integer batchId, String search);
    
    Long getApplicationCount(Integer jobId, Integer collegeId);
    
    Job getJobBySlug(String slug);

    Map<String, Object> resolveJobContext(Integer jobId);

    /**
     * Update application status (college-scoped)
     * @param applicationId Application ID
     * @param newStatus New status (APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED)
     * @param jobId Job ID (must belong to college)
     * @param collegeId College ID
     * @param updatedBy User ID who updated
     * @param assessmentUrl Optional; when newStatus is ASSESSMENT, updates job.assessmentUrl if provided
     * @param rejectionReason Optional; when newStatus is REJECTED, stored and passed to notification
     * @return Updated JobApplication
     */
    JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer jobId, Integer collegeId, Integer updatedBy, String assessmentUrl, String rejectionReason);

    /**
     * Same status update with explicit assessment-link persistence policy.
     * saveAssessmentUrlToJob=false stores the link on this application only.
     */
    JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer jobId, Integer collegeId,
                                           Integer updatedBy, String assessmentUrl, Boolean saveAssessmentUrlToJob,
                                           String rejectionReason);

    /**
     * Bulk update application status (max 100 per request). College-scoped via jobId.
     * @param jobId Job ID (must belong to college)
     * @param collegeId College ID
     * @param applicationIds Application IDs to update
     * @param newStatus New status
     * @param updatedBy User ID
     * @param assessmentUrl Optional; when newStatus is ASSESSMENT, updates job.assessmentUrl if provided
     * @param rejectionReason Optional; when newStatus is REJECTED, applied to all updated applications
     * @return Map with updatedCount, applications list, and failed (list of {applicationId, reason})
     */
    Map<String, Object> bulkUpdateApplicationStatus(Integer jobId, Integer collegeId, List<Integer> applicationIds, String newStatus, Integer updatedBy, String assessmentUrl, String rejectionReason);

    /** Bulk counterpart with explicit application-only vs job-default assessment-link behavior. */
    Map<String, Object> bulkUpdateApplicationStatus(Integer jobId, Integer collegeId, List<Integer> applicationIds,
                                                    String newStatus, Integer updatedBy, String assessmentUrl,
                                                    Boolean saveAssessmentUrlToJob, String rejectionReason);

    /**
     * Update internal notes for an application (college-scoped).
     * Application must belong to the given job which must belong to the college.
     *
     * @param applicationId Application ID
     * @param internalNotes Notes text (null or empty to clear)
     * @param jobId Job ID (must belong to college)
     * @param collegeId College ID
     * @return Updated JobApplication
     */
    JobApplication updateApplicationNotes(Integer applicationId, String internalNotes, Integer jobId, Integer collegeId, Long version);

    JobApplication attachOfferLetter(Integer applicationId, String offerLetterUrl, Integer jobId, Integer collegeId);

    /** Read-only: counts + a capped sample of REJECTED/WITHDRAWN applications older than the threshold. */
    Map<String, Object> getDataRetentionReport(Integer collegeId, int olderThanDays);

    /**
     * Every placement application (any job) for one student, with next-interview attached per
     * application — "where does this student stand?" used to mean opening every job one at a
     * time; this answers it in one call.
     */
    List<com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO> getStudentPlacementSummary(Integer learnerId, Integer collegeId);

    /**
     * The Drives landing page's "needs attention" queue — a small, capped, cross-drive summary
     * (stale applications, unscheduled interviews, missing offer letters, closing-soon drives
     * with weak conversion) so an admin sees what's actually urgent without opening every drive
     * one at a time. Each category is capped at 5 sample items plus a total count.
     */
    Map<String, Object> getNeedsAttentionSummary(Integer collegeId);

    /**
     * Export applications for a job as CSV (college-scoped).
     * @param jobId Job ID
     * @param collegeId College ID
     * @return CSV bytes (UTF-8)
     */
    byte[] exportApplicationsAsCsv(Integer jobId, Integer collegeId, String applicationStatus, String source,
                                    Integer departmentId, Integer programId, Integer batchId, String search);

    /**
     * Get application status history (timeline). Gap 8.2. College-scoped.
     * @param applicationId Application ID
     * @param jobId Job ID (must belong to college)
     * @param collegeId College ID
     * @return List of status change entries, ordered by changedAt ascending
     */
    List<JobApplicationStatusHistory> getApplicationHistory(Integer applicationId, Integer jobId, Integer collegeId);

    /**
     * Hiring metrics for dashboard (Phase 5 - Gap 15.1). College-scoped.
     * @param jobId Optional - filter to single job
     * @param collegeId College ID
     * @param appliedAfter Optional date filter (appliedAt >=)
     * @param appliedBefore Optional date filter (appliedAt <=)
     * @param departmentId Optional - filter by learner's program department
     * @param programId Optional - filter by learner program
     * @param batchId Optional - filter by learner's class batch
     * @param classId Optional - filter by learner's class
     * @return Map with totalApplications, applied, shortlisted, assessment, interview, offered, rejected, hired, avgTimeToShortlistMs
     */
    Map<String, Object> getHiringMetrics(Integer jobId, Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                         Integer departmentId, Integer programId, Integer batchId, Integer classId);

    /**
     * Hiring funnel for visualization (Phase 5 - Gap 15.2). College-scoped.
     * @param jobId Optional - filter to single job
     * @param collegeId College ID
     * @param appliedAfter Optional date filter
     * @param appliedBefore Optional date filter
     * @param departmentId Optional - filter by learner's program department
     * @param programId Optional - filter by learner program
     * @param batchId Optional - filter by learner's class batch
     * @param classId Optional - filter by learner's class
     * @return Ordered list of stages with counts: APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, HIRED
     */
    List<Map<String, Object>> getHiringFunnel(Integer jobId, Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                               Integer departmentId, Integer programId, Integer batchId, Integer classId);

    /**
     * Company-wise hiring report (Phase 5 - Gap 15.4). College-scoped.
     * @param collegeId College ID
     * @param appliedAfter Optional date filter
     * @param appliedBefore Optional date filter
     * @param departmentId Optional - filter by learner's program department
     * @param programId Optional - filter by learner program
     * @param batchId Optional - filter by learner's class batch
     * @return List of { companyName, jobId, jobTitle, applied, shortlisted, assessment, interview, offered, hired, rejected }
     */
    List<Map<String, Object>> getCompanyWiseHiringReport(Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                           Integer departmentId, Integer programId, Integer batchId);
}

