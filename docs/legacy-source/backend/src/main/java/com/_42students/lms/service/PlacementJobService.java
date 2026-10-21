package com._42students.lms.service;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for organization-scoped placement job management.
 * Used from the admin UI for org/college scoped job management.
 */
public interface PlacementJobService {

    /**
     * Get all jobs for the organization
     * @param organizationId Organization ID
     * @return List of jobs
     */
    List<Job> getJobsForOrganization(Integer organizationId);

    /**
     * Get job by ID (must belong to the organization)
     * @param jobId Job ID
     * @param organizationId Organization ID
     * @return Job entity
     */
    Job getJobById(Integer jobId, Integer organizationId);

    /**
     * Create a new job for the organization
     * @param job Job entity
     * @param organizationId Organization ID
     * @param createdBy Admin user ID who created the job
     * @return Created job
     */
    Job createJob(Job job, Integer organizationId, Integer createdBy);

    /**
     * Update an existing job (must belong to the organization)
     * @param jobId Job ID
     * @param job Updated job data
     * @param organizationId Organization ID
     * @return Updated job
     */
    Job updateJob(Integer jobId, Job job, Integer organizationId);

    /**
     * Open/close a job
     * @param jobId Job ID
     * @param isActive True to open, false to close
     * @param organizationId Organization ID
     * @return Updated job
     */
    Job setJobStatus(Integer jobId, Boolean isActive, Integer organizationId);

    /**
     * Soft delete a job (must belong to the organization). Unlike AdminJobServiceImpl's
     * college-scoped equivalent, this is not blocked for org-wide (collegeId == null) jobs —
     * this is the only surface that can delete them, since a college-scoped admin is never
     * allowed to delete a job shared across the whole organization.
     * @param jobId Job ID
     * @param organizationId Organization ID
     */
    void deleteJob(Integer jobId, Integer organizationId);

    /**
     * Get all applications for a job (must belong to the organization).
     * @param jobId Job ID
     * @param organizationId Organization ID
     * @return List of applications (sorted by screening score desc, then appliedAt desc)
     */
    List<JobApplication> getApplicationsForJob(Integer jobId, Integer organizationId);

    /**
     * Get applications for a job with pagination and optional filters (org-scoped).
     * Sorting: screening overallScore DESC, appliedAt DESC.
     * @param jobId Job ID
     * @param organizationId Organization ID
     * @param pageable Page and size (default size 20, max 100)
     * @param applicationStatus Optional filter by status
     * @param minScore Optional minimum screening overall score
     * @param maxScore Optional maximum screening overall score
     * @param appliedAfter Optional filter applications applied after this time
     * @param appliedBefore Optional filter applications applied before this time
     * @param source Optional filter by application source
     * @param programId Optional filter by learner programId
     * @param classId Optional filter by learner classId
     * @param departmentId Optional filter by learner's program department (program.deptId)
     * @param batchId Optional filter by learner's class batchId
     * @param search Optional search in learner first name, last name, email
     * @param skills Optional filter by learner having any of these skill names (case-insensitive)
     * @return Page of applications
     */
    Page<JobApplication> getApplicationsForJobPaginated(Integer jobId, Integer organizationId, Pageable pageable,
                                                        String applicationStatus, Double minScore, Double maxScore,
                                                        LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                        String source, Integer programId, Integer classId,
                                                        Integer departmentId, Integer batchId, String search,
                                                        List<String> skills);

    /**
     * Update application status (move through pipeline)
     * @param applicationId Application ID
     * @param newStatus New status (SHORTLISTED, INTERVIEW, OFFERED, REJECTED, HIRED)
     * @param organizationId Organization ID
     * @param updatedBy Admin/recruiter user ID who updated the status
     * @return Updated application
     */
    /**
     * Update application status.
     * @param rejectionReason Optional; when newStatus is REJECTED, stored and passed to notification
     */
    JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer organizationId, Integer updatedBy, String assessmentUrl, String rejectionReason);

    /**
     * Get all applications for the organization
     * @param organizationId Organization ID
     * @return List of applications
     */
    List<JobApplication> getAllApplicationsForOrganization(Integer organizationId);

    /**
     * Paginated org-wide applications listing — the endpoint this backs previously returned every
     * application ever submitted to the org in one unbounded response; this bounds it.
     */
    Page<JobApplication> getAllApplicationsForOrganizationPaginated(Integer organizationId, Pageable pageable);

    /**
     * Update internal notes for an application (org-scoped).
     * @param applicationId Application ID
     * @param internalNotes Notes text (null or empty to clear)
     * @param organizationId Organization ID
     * @return Updated application
     */
    JobApplication updateApplicationNotes(Integer applicationId, String internalNotes, Integer organizationId, Long version);

    /**
     * Bulk update application status (shortlist, reject, etc.).
     * @param applicationIds Application IDs (max 100 per request)
     * @param newStatus New status
     * @param organizationId Organization ID
     * @param updatedBy User ID
     * @param rejectionReason Optional; when newStatus is REJECTED, applied to all updated applications
     * @return Count of updated applications and list of updated applications
     */
    java.util.Map<String, Object> bulkUpdateApplicationStatus(List<Integer> applicationIds, String newStatus, Integer organizationId, Integer updatedBy, String assessmentUrl, String rejectionReason);

    /**
     * Export applications for a job (or all for org if jobId null) as CSV bytes.
     * When jobId is provided, applies the same filters as the on-screen paginated applications
     * table (see getApplicationsForJobPaginated) — matching AdminJobServiceImpl's export, which
     * previously this org-scoped export ignored entirely, always exporting the unfiltered list.
     * @param jobId Optional job ID (null = all applications for org)
     * @param organizationId Organization ID
     * @param applicationStatus Optional status filter
     * @param source Optional source filter
     * @param departmentId Optional department filter
     * @param programId Optional program filter
     * @param batchId Optional batch filter
     * @param search Optional name/email search
     * @return CSV file content as UTF-8 bytes
     */
    byte[] exportApplicationsAsCsv(Integer jobId, Integer organizationId, String applicationStatus, String source,
                                    Integer departmentId, Integer programId, Integer batchId, String search);

    /**
     * Get resume preview URL for an application (for dashboard embed/link). Org-scoped.
     * @param applicationId Application ID
     * @param organizationId Organization ID
     * @return Map with "url" (and optionally "expiresIn" if presigned)
     */
    java.util.Map<String, Object> getResumePreviewUrl(Integer applicationId, Integer organizationId);

    /**
     * Get application status history (timeline). Gap 8.2. Org-scoped.
     * @param applicationId Application ID
     * @param organizationId Organization ID (validates application belongs to org)
     * @return List of status change entries, ordered by changedAt ascending
     */
    List<JobApplicationStatusHistory> getApplicationHistory(Integer applicationId, Integer organizationId);

    /**
     * Hiring metrics for dashboard. Optional jobId and date range. Phase 5 - 15.3: department/batch/program/class filters.
     * @param jobId Optional; null = whole org
     * @param organizationId Organization ID
     * @param from Optional appliedAt from (inclusive)
     * @param to Optional appliedAt to (inclusive)
     * @param departmentId Optional filter by learner's program department
     * @param programId Optional filter by learner program
     * @param batchId Optional filter by learner's class batch
     * @param classId Optional filter by learner's class
     * @return Map: totalApplications, applied, shortlisted, interview, offered, rejected, hired, avgTimeToShortlistMs (if computable)
     */
    java.util.Map<String, Object> getHiringMetrics(Integer jobId, Integer organizationId, LocalDateTime from, LocalDateTime to,
                                                   Integer departmentId, Integer programId, Integer batchId, Integer classId);

    /**
     * Hiring funnel for visualization. Phase 5 - 15.3: department/batch/program/class filters.
     * Cumulative "ever reached this stage" semantics (from JobApplicationStatusHistory), NOT the
     * same as getHiringMetrics's current-status snapshot: an application that reached INTERVIEW and
     * was later REJECTED still counts in the INTERVIEW bucket here, even though it counts as
     * "rejected" in the metrics snapshot. Each later stage's count is a subset of every earlier
     * stage's count (a true monotonic funnel), which the current-status breakdown is not.
     * @param jobId Optional; null = whole org
     * @param organizationId Organization ID
     * @param from Optional appliedAt from
     * @param to Optional appliedAt to
     * @param departmentId Optional filter by learner's program department
     * @param programId Optional filter by learner program
     * @param batchId Optional filter by learner's class batch
     * @param classId Optional filter by learner's class
     * @return List of { stage, count } in funnel order (cumulative, not current-status)
     */
    java.util.List<java.util.Map<String, Object>> getHiringFunnel(Integer jobId, Integer organizationId, LocalDateTime from, LocalDateTime to,
                                                                   Integer departmentId, Integer programId, Integer batchId, Integer classId);

    /**
     * Company-wise hiring report (Phase 5 - Gap 15.4). Org-scoped.
     * @param organizationId Organization ID
     * @param from Optional appliedAt from
     * @param to Optional appliedAt to
     * @param departmentId Optional filter by learner's program department
     * @param programId Optional filter by learner program
     * @param batchId Optional filter by learner's class batch
     * @return List of { companyName, jobId, jobTitle, applied, shortlisted, assessment, interview, offered, hired, rejected }
     */
    java.util.List<java.util.Map<String, Object>> getCompanyWiseHiringReport(Integer organizationId, LocalDateTime from, LocalDateTime to,
                                                                             Integer departmentId, Integer programId, Integer batchId);
}

