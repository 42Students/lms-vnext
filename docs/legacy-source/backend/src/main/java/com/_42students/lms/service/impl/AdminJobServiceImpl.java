package com._42students.lms.service.impl;

import com._42students.lms.event.ApplicationStatusChangedEvent;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.service.PlacementJobService;
import com._42students.lms.service.AdminJobService;
import com._42students.lms.util.JobApplicationStatusValidator;
import com._42students.lms.util.JobSlugGenerator;
import com._42students.lms.util.TextSanitizer;
import com._42students.lms.util.JobVisibilityCache;
import com._42students.lms.util.PlacementDateTimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdminJobServiceImpl implements AdminJobService {

    // Self-injected proxy, used only so bulkUpdateApplicationStatus's per-item call to
    // updateApplicationStatus goes through Spring's transactional proxy (and therefore actually
    // gets its own REQUIRES_NEW transaction) instead of a bare self-invocation, which bypasses
    // AOP entirely and would silently run every item in whatever transaction the caller is
    // already in. @Lazy avoids an eager circular-construction issue on startup.
    @Autowired
    @org.springframework.context.annotation.Lazy
    private AdminJobService self;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    // Used only to fire the interview-specific cancellation notification/audit log when this
    // class's cancelNonTerminalInterviewsForApplicationLocked cascade cancels an interview as a
    // side effect of an admin-driven application status change — see
    // InterviewService.notifyInterviewCancelledByCascade's javadoc.
    // required=false: this class must keep working in test contexts that don't wire InterviewService.
    @Autowired(required = false)
    private com._42students.lms.service.InterviewService interviewService;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private _ClassRepository classRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private JobSlugGenerator jobSlugGenerator;

    @Autowired
    private com._42students.lms.util.JobNotificationHelper jobNotificationHelper;

    @Autowired(required = false)
    private JobVisibilityCache jobVisibilityCache;

    @Autowired(required = false)
    private com._42students.lms.search.jobs.JobSearchCache jobSearchCache;

    @Autowired(required = false)
    private ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    private com._42students.lms.service.JobApplicationStatusHistoryService statusHistoryService;

    @Autowired(required = false)
    private JobApplicationStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private PlacementJobService placementJobService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService adminAuditLogService;

    @Autowired(required = false)
    private com._42students.lms.service.NotificationService notificationService;

    @Autowired(required = false)
    private com._42students.lms.repository.CompanyRepository companyRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.CollegeCompanyRepository collegeCompanyRepository;

    @Autowired(required = false)
    private com._42students.lms.service.JobService jobService;

    // When a job is linked to a reusable Company record, that record is the source of truth for
    // name/logo — this keeps companyName/companyLogo (what every existing consumer actually
    // reads) in sync with the company the admin picked, rather than trusting whatever the client
    // happened to send in those two free-text fields alongside a companyId.
    private void applyCompanyLink(Job job, Integer collegeId) {
        if (job.getCompanyId() == null || companyRepository == null) return;
        // findById().ifPresent(...) used to silently no-op when companyId didn't match any row,
        // leaving the job saved with a dangling companyId and whatever companyName/companyLogo
        // happened to be in the request (often null) — the one case this method didn't reject
        // even though every other invalid-link case (deleted company, wrong college) does.
        // lockById (PESSIMISTIC_WRITE), not plain findById: serializes against
        // CompanyServiceImpl.deleteCompany, which takes the same lock before its "zero active
        // jobs" check. Without it, this link could commit in the window between that check and
        // the company's soft-delete write, leaving this job pointed at a now-deleted company —
        // Company has no @Version for the usual optimistic-lock retry to catch it instead.
        Company company = companyRepository.lockById(job.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + job.getCompanyId()));
        if (Boolean.TRUE.equals(company.getIsDeleted())) {
            throw new IllegalArgumentException("This company has been deleted and can no longer be linked to a job.");
        }
        // Companies are shared (recruiter phase 1, V202): "belongs here" means this college has it in its own list.
        boolean belongs = collegeCompanyRepository != null && collegeCompanyRepository.findByCollegeIdAndCompanyId(collegeId, company.getId())
                .map(link -> !Boolean.TRUE.equals(link.getIsDeleted())).orElse(false);
        if (!belongs) {
            throw new IllegalArgumentException("Company does not belong to the specified college");
        }
        job.setCompanyName(company.getName());
        job.setCompanyLogo(company.getLogoUrl());
    }


    @Override
    public List<Job> getAllJobs(Integer collegeId) {
        log.info("Fetching all jobs for college ID: {}", collegeId);
        List<Job> jobs;
        Integer orgId = collegeRepository.findById(collegeId)
                .map(College::getOrgId)
                .orElse(null);
        if (orgId != null) {
            jobs = jobRepository.findByCollegeIdOrOrg(collegeId, orgId);
        } else {
            jobs = jobRepository.findByCollegeIdAndIsDeletedFalse(collegeId);
        }
        List<Job> filtered = jobs.stream()
                .filter(job -> !"EXTERNAL_ONLY".equals(job.getVisibilityType())) // Exclude EXTERNAL_ONLY jobs from LMS
                .sorted((a, b) -> {
                    if (a.getPostedDate() != null && b.getPostedDate() != null) {
                        return b.getPostedDate().compareTo(a.getPostedDate());
                    }
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
        applyApplicationCounts(filtered);
        return filtered;
    }

    @Override
    public Map<String, Object> getAllJobsPaginated(Integer collegeId, int page, int size, String status, String search,
                                                     String sortBy, String sortDir) {
        Integer orgId = collegeRepository.findById(collegeId)
                .map(College::getOrgId)
                .orElse(null);

        StringBuilder where = new StringBuilder("(j.isDeleted = false OR j.isDeleted IS NULL) AND (j.visibilityType <> 'EXTERNAL_ONLY' OR j.visibilityType IS NULL)");
        Map<String, Object> params = new HashMap<>();
        if (orgId != null) {
            where.append(" AND (j.collegeId = :collegeId OR j.organizationId = :orgId)");
            params.put("orgId", orgId);
        } else {
            where.append(" AND j.collegeId = :collegeId");
        }
        params.put("collegeId", collegeId);

        if ("draft".equalsIgnoreCase(status)) {
            where.append(" AND j.isDraft = true");
        } else if ("active".equalsIgnoreCase(status)) {
            where.append(" AND (j.isDraft = false OR j.isDraft IS NULL) AND j.isActive = true");
        } else if ("closed".equalsIgnoreCase(status)) {
            where.append(" AND (j.isDraft = false OR j.isDraft IS NULL) AND j.isActive = false");
        }
        if (search != null && !search.trim().isEmpty()) {
            where.append(" AND (LOWER(j.jobTitle) LIKE :search ESCAPE '\\\\' OR LOWER(j.companyName) LIKE :search ESCAPE '\\\\')");
            params.put("search", "%" + escapeLikeWildcards(search.trim().toLowerCase(java.util.Locale.ROOT)) + "%");
        }

        String countJpql = "SELECT COUNT(j) FROM Job j WHERE " + where;
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        params.forEach(countQuery::setParameter);
        long total = countQuery.getSingleResult();

        String sortField = "applicationDeadline".equals(sortBy) ? "j.applicationDeadline" : "j.postedDate";
        String direction = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        String dataJpql = "SELECT j FROM Job j WHERE " + where + " ORDER BY " + sortField + " " + direction + ", j.createdAt DESC";
        TypedQuery<Job> dataQuery = entityManager.createQuery(dataJpql, Job.class);
        params.forEach(dataQuery::setParameter);
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        dataQuery.setFirstResult(safePage * safeSize);
        dataQuery.setMaxResults(safeSize);
        List<Job> content = dataQuery.getResultList();
        applyApplicationCounts(content);

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil(total / (double) safeSize));
        result.put("number", safePage);
        result.put("size", safeSize);
        return result;
    }

    private static final int BULK_JOB_STATUS_MAX_DEFAULT = 100;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Was a hardcoded 100, duplicated verbatim in PlacementJobServiceImpl -- an admin could not
    // raise it for a one-off large operation without a redeploy. Both now read the same GLOBAL
    // setting, so the two copies can't drift apart.
    private int bulkJobStatusMax() {
        return appSettingsService != null ? appSettingsService.getBulkStatusMax() : BULK_JOB_STATUS_MAX_DEFAULT;
    }

    @Override
    public Map<String, Object> bulkUpdateJobStatus(Integer collegeId, List<Integer> jobIds, boolean isActive) {
        if (jobIds == null || jobIds.isEmpty()) {
            throw new IllegalArgumentException("jobIds is required and must not be empty");
        }
        if (jobIds.size() > bulkJobStatusMax()) {
            throw new IllegalArgumentException("Maximum " + bulkJobStatusMax() + " drives per bulk update");
        }
        int updatedCount = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        // invalidateJobCaches triggers JobSearchCache.refresh(), an unscoped full platform-wide
        // reload (all departments/programs/active jobs + full index rebuild). Calling it once per
        // job here (up to BULK_JOB_STATUS_MAX times) turned one bulk request into up to 100 full
        // cache rebuilds. Instead, invalidate at most once, after the loop, only if at least one
        // job actually updated — using the last successfully-updated job's organizationId (all
        // jobs in a bulk request are scoped to the same collegeId/organization already).
        Integer lastUpdatedOrgId = null;
        for (Integer jobId : jobIds) {
            try {
                Job job = getJobById(jobId, collegeId);
                job.setIsActive(isActive);
                Job updatedJob = updateJobInternal(jobId, job, collegeId);
                lastUpdatedOrgId = updatedJob.getOrganizationId();
                updatedCount++;
            } catch (Exception e) {
                log.warn("Bulk drive status update: skipped job {}: {}", jobId, e.getMessage());
                Map<String, Object> failEntry = new HashMap<>();
                failEntry.put("jobId", jobId);
                failEntry.put("reason", e.getMessage() != null ? e.getMessage() : "Unknown error");
                failed.add(failEntry);
            }
        }
        if (updatedCount > 0) {
            invalidateJobCaches(lastUpdatedOrgId);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updatedCount);
        result.put("failed", failed);
        return result;
    }

    private void applyApplicationCounts(List<Job> jobs) {
        if (jobs == null || jobs.isEmpty()) return;
        List<Integer> jobIds = jobs.stream().map(Job::getId).filter(Objects::nonNull).collect(Collectors.toList());
        if (jobIds.isEmpty()) return;
        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : jobApplicationRepository.countByJobIds(jobIds)) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) continue;
            counts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }
        for (Job job : jobs) {
            long count = counts.getOrDefault(job.getId(), 0L);
            job.setApplicationCount(count);
            job.setApplicantCount(count);
        }
    }

    @Override
    public Job getJobById(Integer jobId, Integer collegeId) {
        return getJobById(jobId, collegeId, false);
    }

    // allowDeleted=true is for the applications-viewing endpoints (list/paginated/CSV
    // export/history) — a soft-deleted job used to make ALL of those throw "Job has been
    // deleted", so an admin lost all access to that job's applications the moment it was
    // soft-deleted, even though every other soft-deleted entity in this module stays
    // queryable by admins (see item 133: a learner's own application detail still resolves
    // fine after their job is deleted). Job-level mutation (edit/delete/status-change) still
    // goes through the strict getJobById(jobId, collegeId) overload above and correctly
    // continues to reject a deleted job.
    private Job getJobById(Integer jobId, Integer collegeId, boolean allowDeleted) {
        log.info("Fetching job ID: {} for college ID: {}", jobId, collegeId);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with ID: " + jobId));

        // Match by collegeId directly, or when job has no collegeId, match by organization (same as getInterviewsForCollege)
        boolean belongsToCollege = false;
        if (job.getCollegeId() != null && job.getCollegeId().equals(collegeId)) {
            belongsToCollege = true;
        } else if (job.getCollegeId() == null && job.getOrganizationId() != null) {
            College college = collegeRepository.findById(collegeId).orElse(null);
            if (college != null && job.getOrganizationId().equals(college.getOrgId())) {
                belongsToCollege = true;
            }
        }
        if (!belongsToCollege) {
            throw new IllegalArgumentException("Job does not belong to the specified college");
        }

        if (job.getIsDeleted() && !allowDeleted) {
            throw new IllegalArgumentException("Job has been deleted");
        }

        return job;
    }

    /**
     * Check if a job belongs to the given college (by collegeId or by org when job has null collegeId).
     * Same logic as getJobById validation.
     */
    private boolean jobBelongsToCollege(Job job, Integer collegeId) {
        if (job == null || collegeId == null) return false;
        if (job.getCollegeId() != null && job.getCollegeId().equals(collegeId)) return true;
        if (job.getCollegeId() == null && job.getOrganizationId() != null) {
            College college = collegeRepository.findById(collegeId).orElse(null);
            return college != null && job.getOrganizationId().equals(college.getOrgId());
        }
        return false;
    }

    // getJobById/jobBelongsToCollege intentionally treat a null-collegeId (org-wide) job as
    // readable by every college under the same organization, so a college admin can still see
    // and review applications for an org-wide drive. But that same fallback must NOT extend to
    // mutating the job itself (edit/delete/status) — a single college admin has no authority
    // over a resource shared with sibling colleges. Call this before any Job-level write.
    private void requireCollegeOwnedJob(Job job) {
        if (job.getCollegeId() == null) {
            throw new IllegalArgumentException("This job is shared across the organization and can only be edited or deleted by an organization-level admin, not a single college admin.");
        }
    }

    // Candidate previously got no interview-specific notification for this cascade path — only
    // the (already-dispatched-elsewhere via sendJobApplicationStatusNotifications) application-level
    // status-change notification, which does not necessarily mention that their specific scheduled
    // interview was cancelled (e.g. an admin moving INTERVIEW -> SHORTLISTED to re-screen). See
    // InterviewService.notifyInterviewCancelledByCascade's javadoc. Deferred to after-commit,
    // mirroring sendJobApplicationStatusNotifications above, so it never fires for a cancellation
    // that ends up rolled back.
    private void notifyInterviewCascadeCancelledAfterCommit(Integer interviewId, String previousStatus) {
        if (interviewService == null) return;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                        @Override
                        public void afterCommit() {
                            interviewService.notifyInterviewCancelledByCascade(interviewId, previousStatus);
                        }
                    });
        } else {
            interviewService.notifyInterviewCancelledByCascade(interviewId, previousStatus);
        }
    }

    // CONCURRENCY FIX (round 4 audit; also used by updateApplicationStatus's REJECTED/
    // leaving-interview-stage cascade as of self-review round 3): rejecting an application, or
    // moving it out of the interview stage, used to leave any already-SCHEDULED/CONFIRMED/
    // RESCHEDULE_REQUESTED interview dangling — it kept appearing on calendars/reminders for a
    // candidate no longer active at that stage, and the learner could still confirm/reschedule
    // it. This is the locking counterpart of what used to be a separate, plain
    // cancelNonTerminalInterviewsForApplication helper (removed — every caller in this class now
    // goes through this one). See InterviewRepository.findNonTerminalByJobApplicationIdForUpdate
    // for why a plain (non-locking) lookup can miss an interview a concurrent scheduleInterview
    // call just committed under REPEATABLE READ — the exact same gap self-review round 2
    // (aca46a4) found and fixed for InterviewServiceImpl's REJECT-feedback cascade; this class's
    // updateApplicationStatus cascade had the identical gap and was simply missed by that pass.
    // Locking here does not introduce a new deadlock risk: updateApplicationStatus's caller
    // (self-invocation via the transactional proxy) already holds no other Interview-adjacent
    // lock ahead of this point in Application-then-Interview order, matching every other caller
    // of this method (withdrawOtherActiveApplicationsOnHire locks the Application first, then
    // calls this).
    private void cancelNonTerminalInterviewsForApplicationLocked(JobApplication application) {
        for (Interview interview : interviewRepository.findNonTerminalByJobApplicationIdForUpdate(application.getId())) {
            String previousStatus = interview.getInterviewStatus();
            interview.setInterviewStatus("CANCELLED");
            interviewRepository.save(interview);
            notifyInterviewCascadeCancelledAfterCommit(interview.getId(), previousStatus);
        }
    }

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.JobTypeService jobTypeService;

    /** Whether offers of this drive count as placed, from the college's job types (Settings > Job types), as the TPO form sets it. */
    private void applyCountsAsPlaced(Job job, Integer collegeId) {
        if (jobTypeService == null || job.getJobType() == null || job.getJobType().isBlank()) return;
        job.setCountsAsPlaced(jobTypeService.countsAsPlaced(collegeId, job.getJobType()));
    }

    @Override
    @Transactional
    public Job createJob(Job job, Integer collegeId, Integer createdBy) {
        // LOG-INJECTION FIX (round 4 audit, stress-test of the existing HTML-escaping fixes):
        // this log line (and the slug-collision log.error/log.info further down) used to log
        // job.getJobTitle() BEFORE sanitizeJobInputs ran (that call used to sit right before
        // jobRepository.save(), near the end of this method) — i.e. the raw, un-escaped
        // client-supplied title. HTML-escaping never neutralizes newlines anyway, so this was a
        // log-forging gap independent of the round-2/3 XSS-escaping fixes: a jobTitle containing
        // an embedded "\n" plus fabricated text (e.g. a fake "ERROR: security breach" log line)
        // would be written verbatim into the application log by any of these statements. Moved
        // sanitizeJobInputs to run first, immediately on entry, so every log statement in this
        // method only ever sees the sanitized/truncated value. See TextSanitizer.sanitizeAndTruncate.
        sanitizeJobInputs(job);

        log.info("Creating new job: {} for college ID: {}", job.getJobTitle(), collegeId);

        // A client-supplied non-zero id makes JPA's isNew() check treat this as an existing
        // row and merge() into it instead of inserting a new one, silently overwriting whatever
        // row already has that id (possibly belonging to a different college/organization).
        job.setId(0);
        // isNew() for a @Version-annotated entity actually checks version == null, not id — a
        // client-supplied non-null version would still route this through merge() even with
        // id reset above, defeating the protection.
        job.setVersion(null);

        // Validate college exists and resolve organization from it
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new IllegalArgumentException("College not found with ID: " + collegeId));
        
        // Resolve organization ID from the college's own org_id (not hardcoded)
        // This ensures jobs are scoped to the same organization that learners resolve to
        Integer organizationId = college.getOrgId();
        if (organizationId == null) {
            throw new IllegalStateException("College " + collegeId + " has no org_id set. Set college.org_id to create jobs in the correct organization.");
        }
        
        // Set required fields (10.1 / 21.2.7: draft state)
        job.setCollegeId(collegeId);
        job.setOrganizationId(organizationId);
        job.setCreatedBy(createdBy);
        job.setPostedDate(PlacementDateTimeUtils.nowUtc());
        job.setIsDeleted(false);
        boolean asDraft = Boolean.TRUE.equals(job.getIsDraft());
        job.setIsDraft(asDraft);
        job.setIsActive(!asDraft);  // Draft = inactive for learners
        
        // Set default visibility type if not provided
        if (job.getVisibilityType() == null || job.getVisibilityType().trim().isEmpty()) {
            job.setVisibilityType("INTERNAL_ONLY");
        }
        
        // Validate visibility type
        String visibilityType = job.getVisibilityType();
        if (!"INTERNAL_ONLY".equals(visibilityType) 
                && !"HYBRID".equals(visibilityType) 
                && !"EXTERNAL_ONLY".equals(visibilityType)) {
            throw new IllegalArgumentException("Invalid visibility type: " + visibilityType + ". Must be INTERNAL_ONLY, HYBRID, or EXTERNAL_ONLY");
        }
        
        // Generate slug for HYBRID and EXTERNAL_ONLY jobs
        if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
            if (job.getJobSlug() == null || job.getJobSlug().trim().isEmpty()) {
                // Generate unique slug
                String slug;
                int attempts = 0;
                do {
                    slug = jobSlugGenerator.generateSlug();
                    attempts++;
                }                 while (jobRepository.existsByJobSlug(slug) && attempts < 50);
                
                if (attempts >= 50) {
                    log.error("Job slug collision: failed to generate unique slug after 50 attempts for job title: {}", job.getJobTitle());
                    throw new IllegalArgumentException("Unable to generate a unique external link for this job. Please try again or contact support.");
                }
                job.setJobSlug(slug);
                log.info("Generated job slug: {} for job: {}", slug, job.getJobTitle());
            }
        }
        
        // Backend validation: EXTERNAL_ONLY cannot have targeting fields
        if ("EXTERNAL_ONLY".equals(visibilityType)) {
            if (job.getTargetDepartmentId() != null || job.getTargetProgramId() != null || 
                job.getTargetBatchId() != null || job.getTargetClassId() != null) {
                throw new IllegalArgumentException("EXTERNAL_ONLY jobs cannot have targeting fields. All targeting fields must be null.");
            }
        }
        
        // For EXTERNAL_ONLY jobs, targeting fields are not required
        if ("EXTERNAL_ONLY".equals(visibilityType)) {
            // Clear targeting fields as they're not used for external-only jobs
            job.setTargetDepartmentId(null);
            job.setTargetProgramId(null);
            job.setTargetBatchId(null);
            job.setTargetClassId(null);
        }
        
        // Derive applicationDeadline from importantDates when present (label "Application deadline" case-insensitive)
        deriveApplicationDeadlineFromImportantDates(job);

        // Validate application deadline (cannot be in past)
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Application deadline cannot be in the past");
        }

        // 1.3 / 21.3.5: Validate assessmentDeadline on create when provided
        if (job.getAssessmentDeadline() != null) {
            LocalDateTime ad = job.getAssessmentDeadline();
            if (ad.isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
                throw new IllegalArgumentException("Assessment deadline cannot be in the past");
            }
            LocalDateTime appDeadline = job.getApplicationDeadline();
            if (appDeadline != null && ad.isBefore(appDeadline)) {
                throw new IllegalArgumentException("Assessment deadline must be after application deadline");
            }
        }

        // Phase 6 - 19.8: Validate assessmentUrl on create when provided
        if (job.getAssessmentUrl() != null && !job.getAssessmentUrl().trim().isEmpty()) {
            String url = job.getAssessmentUrl().trim();
            if (url.length() > 2048) {
                throw new IllegalArgumentException("Assessment URL must be at most 2048 characters");
            }
            if (!url.matches("^https?://.+")) {
                throw new IllegalArgumentException("Assessment URL must be a valid http or https link");
            }
        }

        // (sanitizeJobInputs now runs on entry — see the log-injection fix at the top of this method)
        applyCompanyLink(job, collegeId);
        applyCountsAsPlaced(job, collegeId);

        // Validate targeting hierarchy BEFORE save (fail-fast - no orphan rows on validation failure)
        validateTargetingHierarchy(job);

        Job savedJob = jobRepository.save(job);
        invalidateJobCaches(savedJob.getOrganizationId());
        // Completes the drive lifecycle in the Activity Log: without this, a drive's audit trail
        // began at its first edit, so a drive created and deleted between two edits appeared
        // nowhere at all.
        if (adminAuditLogService != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("jobTitle", savedJob.getJobTitle());
            adminAuditLogService.log(null, "JOB_CREATED", "Job", String.valueOf(savedJob.getId()),
                    savedJob.getOrganizationId(), savedJob.getCollegeId(), payload);
        }
        log.info("Job created successfully with ID: {}", savedJob.getId());
        return savedJob;
    }

    @Override
    @Transactional
    public Job updateJob(Integer jobId, Job job, Integer collegeId) {
        Job updatedJob = updateJobInternal(jobId, job, collegeId);
        invalidateJobCaches(updatedJob.getOrganizationId());
        return updatedJob;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Job extendApplicationDeadline(Integer jobId, Integer collegeId, java.time.LocalDateTime newDeadline) {
        Job job = getJobById(jobId, collegeId);
        requireCollegeOwnedJob(job);

        Object raw = job.getImportantDates();
        List<Object> entries;
        if (raw instanceof List) {
            // Copy rather than mutate the list Hibernate is tracking in place, so a failure
            // partway through building the new value never leaves the entity half-changed.
            entries = new ArrayList<>((List<Object>) raw);
        } else {
            entries = new ArrayList<>();
        }

        boolean found = false;
        String isoDeadline = newDeadline.toString();
        for (int i = 0; i < entries.size(); i++) {
            Object item = entries.get(i);
            if (!(item instanceof Map)) continue;
            Map<String, Object> map = new java.util.LinkedHashMap<>((Map<String, Object>) item);
            Object label = map.get("label");
            if (label != null && "application deadline".equalsIgnoreCase(label.toString().trim())) {
                map.put("date", isoDeadline);
                entries.set(i, map);
                found = true;
                // First-wins is the same convention deriveApplicationDeadlineFromImportantDates
                // uses when reading; moving only the first matching entry keeps the two in step
                // rather than moving every duplicate and hiding a pre-existing data-quality issue.
                break;
            }
        }
        if (!found) {
            // No importantDates entry existed for this drive at all — the field being null is
            // exactly the case this action exists to fix, so create the entry rather than
            // rejecting the request.
            Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("label", "Application deadline");
            entry.put("date", isoDeadline);
            entries.add(entry);
        }

        job.setImportantDates(entries);
        // Routed through the normal update path so the derivation, the version check and the
        // application-count warning all apply exactly as they do for a full edit — this is a
        // targeted change to one field, not a different update mechanism.
        Job updatedJob = updateJobInternal(jobId, job, collegeId);
        invalidateJobCaches(updatedJob.getOrganizationId());
        return updatedJob;
    }

    // Same as updateJob but leaves cache invalidation to the caller. bulkUpdateJobStatus uses
    // this to update up to BULK_JOB_STATUS_MAX jobs and invalidate the (unscoped, full
    // platform-wide) JobSearchCache exactly once after the whole batch, instead of once per job.
    private Job updateJobInternal(Integer jobId, Job job, Integer collegeId) {
        log.info("Updating job ID: {} for college ID: {}", jobId, collegeId);

        Job existingJob = getJobById(jobId, collegeId);
        requireCollegeOwnedJob(existingJob);

        // The edit form always re-sends every field it loaded, so two admins editing the same
        // job concurrently used to silently clobber each other with no conflict signal — the
        // second save would overwrite the first admin's change back to stale values. The form
        // now round-trips the job's @Version it was loaded with; reject the save if it's stale.
        if (job.getVersion() != null && !job.getVersion().equals(existingJob.getVersion())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This job was updated by someone else. Please refresh and try again.");
        }

        // Check if job has existing applications - warn about impact. countByJobId is a single
        // indexed COUNT(*) — the previous findByJobId().stream().count() loaded (and eagerly
        // joined learner+job for) every application on the job just to produce this log line.
        long applicationCount = jobApplicationRepository.countByJobId(jobId);

        if (applicationCount > 0) {
            log.warn("Updating job ID: {} which has {} existing application(s). Changes may affect applicants.", 
                    jobId, applicationCount);
        }
        
        // Track changes for audit logging
        Map<String, String> changes = new HashMap<>();
        
        // Update fields with change tracking
        if (!Objects.equals(existingJob.getJobTitle(), job.getJobTitle())) {
            changes.put("jobTitle", existingJob.getJobTitle() + " → " + job.getJobTitle());
            existingJob.setJobTitle(job.getJobTitle());
        }
        // Tracked separately so applyCompanyLink below only re-validates the linked Company when
        // the admin is actually changing/setting it — not on every unrelated field edit (e.g.
        // fixing a typo, extending a deadline), which previously broke once the currently-linked
        // Company was soft-deleted, even though this edit never touched the company link.
        boolean companyIdChanged = !Objects.equals(existingJob.getCompanyId(), job.getCompanyId());
        if (companyIdChanged) {
            changes.put("companyId", existingJob.getCompanyId() + " → " + job.getCompanyId());
            existingJob.setCompanyId(job.getCompanyId());
        }
        // Company is the source of truth for companyName/companyLogo once a job is linked
        // (companyId set) — applyCompanyLink below re-derives both fields from the Company
        // record whenever the link is (re)established. Applying the client's raw companyName/
        // companyLogo here too used to let an admin directly edit a LINKED job's name and have
        // it silently accepted (and never re-synced, since applyCompanyLink only runs when
        // companyId itself changes), permanently diverging that one job from its own Company's
        // actual name. Only honor direct edits for unlinked (free-text) jobs, where there is no
        // Company record to be the source of truth in the first place.
        if (existingJob.getCompanyId() == null) {
            if (!Objects.equals(existingJob.getCompanyName(), job.getCompanyName())) {
                changes.put("companyName", existingJob.getCompanyName() + " → " + job.getCompanyName());
                existingJob.setCompanyName(job.getCompanyName());
            }
            if (!Objects.equals(existingJob.getCompanyLogo(), job.getCompanyLogo())) {
                changes.put("companyLogo", "changed");
                existingJob.setCompanyLogo(job.getCompanyLogo());
            }
        }
        if (!Objects.equals(existingJob.getJobDescription(), job.getJobDescription())) {
            changes.put("jobDescription", "updated");
            existingJob.setJobDescription(job.getJobDescription());
        }
        if (!Objects.equals(existingJob.getJobResponsibilities(), job.getJobResponsibilities())) {
            changes.put("jobResponsibilities", "updated");
            existingJob.setJobResponsibilities(job.getJobResponsibilities());
        }
        if (!Objects.equals(existingJob.getJobType(), job.getJobType())) {
            changes.put("jobType", existingJob.getJobType() + " → " + job.getJobType());
            existingJob.setJobType(job.getJobType());
            applyCountsAsPlaced(existingJob, existingJob.getCollegeId());
        }
        if (!Objects.equals(existingJob.getLocation(), job.getLocation())) {
            changes.put("location", existingJob.getLocation() + " → " + job.getLocation());
            existingJob.setLocation(job.getLocation());
        }
        if (!Objects.equals(existingJob.getCtcRange(), job.getCtcRange())) {
            changes.put("ctcRange", existingJob.getCtcRange() + " → " + job.getCtcRange());
            existingJob.setCtcRange(job.getCtcRange());
        }
        
        // The screeningVersion lock below only guarded the version LABEL, not the criteria data
        // itself — an admin could freely edit candidatePreferences (the actual matching
        // criteria) while applications already scored under the old criteria kept the same
        // version tag, making the "prevents mixed-logic scoring" guarantee illusory: the
        // shortlist view would rank already-screened and newly-screened applicants together as
        // if scored on the same basis, with no way to tell they weren't.
        //
        // Moved above the importantDates/deadline block (was originally below it) so this raw
        // assignment happens before sanitizeJobInputs runs — see the log-injection fix comment
        // there for why.
        if (job.getCandidatePreferences() != null && !job.getCandidatePreferences().equals(existingJob.getCandidatePreferences())) {
            if (applicationCount > 0) {
                throw new IllegalArgumentException("Cannot change eligibility/matching preferences: this job already has " + applicationCount + " application(s) scored against the current criteria. Create a new drive instead.");
            }
            existingJob.setCandidatePreferences(job.getCandidatePreferences());
        }
        if (job.getEvaluationConfig() != null) existingJob.setEvaluationConfig(job.getEvaluationConfig());

        // Copy the raw importantDates onto existingJob now, but defer deriving
        // applicationDeadline from it until after sanitizeJobInputs below — see that comment.
        LocalDateTime previousDeadline = existingJob.getApplicationDeadline();
        if (job.getImportantDates() != null) {
            existingJob.setImportantDates(job.getImportantDates());
        }

        // LOG-INJECTION FIX (round 4 audit, stress-test of the existing HTML-escaping fixes):
        // sanitizeJobInputs used to run at the very end of this method (see below), but the
        // slug-generation log.error/log.info further down logs existingJob.getJobTitle() — which
        // at that point still held the RAW, un-sanitized client value copied in above. HTML-
        // escaping never neutralizes newlines anyway, so this was reachable even after the
        // round-2/3 escaping fixes: a jobTitle with an embedded "\n" plus fabricated log text
        // (e.g. a fake "ERROR: security breach" line) would be written verbatim into the log
        // stream before sanitizeJobInputs ever touched the field. Moved up to run immediately
        // after all client-supplied text fields (jobTitle/companyName/jobDescription/
        // jobResponsibilities/jobType/location/ctcRange/importantDates/candidatePreferences,
        // all copied above) have been applied to existingJob, so every log statement from here
        // on only ever sees the sanitized value. See TextSanitizer.sanitizeAndTruncate.
        //
        // ROUND 5 FOLLOW-UP: deriveApplicationDeadlineFromImportantDates (called right below)
        // can itself log.warn() the job's title and the raw importantDates label/date values
        // (the "multiple Application deadline entries" and "unparseable date" warnings a few
        // hundred lines down). It used to be called from further up this method — before this
        // sanitizeJobInputs call — which reopened the exact same before-sanitization
        // log-injection shape the round-4 fix above closed for the slug-collision logs, just via
        // this helper instead. candidatePreferences/evaluationConfig/importantDates assignment
        // was reordered above so it still lands on existingJob before this call, and the actual
        // deadline derivation now runs after it.
        sanitizeJobInputs(existingJob);

        if (job.getImportantDates() != null) {
            deriveApplicationDeadlineFromImportantDates(existingJob);
            LocalDateTime newDeadline = existingJob.getApplicationDeadline();
            if (!Objects.equals(previousDeadline, newDeadline)) {
                if (newDeadline != null && newDeadline.isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
                    throw new IllegalArgumentException("Application deadline cannot be in the past");
                }
                if (applicationCount > 0 && newDeadline != null && previousDeadline != null && newDeadline.isBefore(previousDeadline)) {
                    log.warn("Shortening deadline for job {} with {} applications. This may affect applicants.", jobId, applicationCount);
                }
                changes.put("applicationDeadline",
                        (previousDeadline != null ? previousDeadline.toString() : "null") + " → " + (newDeadline != null ? newDeadline.toString() : "null"));
            }
        }

        // 10.1 / 21.2.7: isDraft and isActive (Publish/Unpublish). createJob couples these
        // (isActive = !isDraft) but a partial update payload used to set them fully
        // independently — {isActive:true} alone (e.g. via POST /{jobId}/status, which only
        // ever sends isActive) left a stale isDraft=true untouched, and vice versa. No
        // learner-visibility leak results (every learner-facing query filters isDraft in SQL
        // independently of isActive), but it corrupts the admin's own draft/active/closed
        // status bucketing — a job in that state shows as "draft" forever and can never be
        // seen as "active" even after the admin believes they published it. Re-couple: setting
        // isActive=true un-drafts the job (matches "opening" it); setting isDraft=true
        // deactivates it (a draft can never be active). isActive=false with isDraft
        // untouched/false is the normal, un-coupled "close this published job" case.
        //
        // BUG FIX (round 22 audit, lifecycle boolean-combination sweep): the re-coupling below
        // used to branch on existingJob's MERGED post-assignment state
        // (`if (existingJob.getIsActive())...` / `if (existingJob.getIsDraft())...`), not on what
        // this request actually asked for. That made {isDraft: true} alone a silent no-op on an
        // already-active job: existingJob.isActive was still true from before (this request never
        // touched it), so the "isActive==true -> isDraft=false" branch fired AFTER the explicit
        // isDraft=true assignment and immediately reverted it back to false — an admin trying to
        // pull a published job back to draft via {isDraft:true} saw the job stay active/published
        // with no error. Branch on the CLIENT'S explicit request instead (incomingActive/
        // incomingDraft), with isActive:true taking precedence when both are sent true in the same
        // request (matches the original tie-break order), so the coupling is deterministic and
        // independent of whatever isDraft/isActive happened to already be persisted.
        Boolean incomingIsDraft = job.getIsDraft();
        Boolean incomingIsActive = job.getIsActive();
        if (incomingIsDraft != null) existingJob.setIsDraft(incomingIsDraft);
        if (incomingIsActive != null) existingJob.setIsActive(incomingIsActive);
        if (Boolean.TRUE.equals(incomingIsActive)) {
            existingJob.setIsDraft(false);
        } else if (Boolean.TRUE.equals(incomingIsDraft)) {
            existingJob.setIsActive(false);
        }

        // Phase 6 - 19.8: Persist assessmentUrl from Job form on update (was missing)
        if (job.getAssessmentUrl() != null) {
            String url = job.getAssessmentUrl().trim();
            if (url.isEmpty()) {
                existingJob.setAssessmentUrl(null);
            } else {
                if (url.length() > 2048) {
                    throw new IllegalArgumentException("Assessment URL must be at most 2048 characters");
                }
                if (!url.matches("^https?://.+")) {
                    throw new IllegalArgumentException("Assessment URL must be a valid http or https link");
                }
                existingJob.setAssessmentUrl(url);
            }
        }

        // 1.3 / 21.3.5: Persist assessmentDeadline - deadline for completing assessment
        if (job.getAssessmentDeadline() != null) {
            LocalDateTime ad = job.getAssessmentDeadline();
            if (ad.isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
                throw new IllegalArgumentException("Assessment deadline cannot be in the past");
            }
            LocalDateTime appDeadline = existingJob.getApplicationDeadline();
            if (appDeadline != null && ad.isBefore(appDeadline)) {
                throw new IllegalArgumentException("Assessment deadline must be after application deadline");
            }
            existingJob.setAssessmentDeadline(ad);
        } else {
            existingJob.setAssessmentDeadline(null);
        }

        // HARDENING: Lock screening version when job has at least one application
        if (job.getScreeningVersion() != null && !job.getScreeningVersion().trim().isEmpty()) {
            String newVersion = job.getScreeningVersion().trim();
            if (!newVersion.equals(existingJob.getScreeningVersion())) {
                if (applicationCount > 0) {
                    throw new IllegalArgumentException("Cannot change screening version: this job already has " + applicationCount + " application(s). Screening version cannot be updated after the first application.");
                }
                existingJob.setScreeningVersion(newVersion);
            }
        }
        
        // Update visibility type
        if (job.getVisibilityType() != null) {
            String visibilityType = job.getVisibilityType();
            if (!"INTERNAL_ONLY".equals(visibilityType) 
                    && !"HYBRID".equals(visibilityType) 
                    && !"EXTERNAL_ONLY".equals(visibilityType)) {
                throw new IllegalArgumentException("Invalid visibility type: " + visibilityType);
            }
            existingJob.setVisibilityType(visibilityType);
            
            // Generate slug if needed for HYBRID or EXTERNAL_ONLY
            if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
                if (existingJob.getJobSlug() == null || existingJob.getJobSlug().trim().isEmpty()) {
                    String slug;
                    int attempts = 0;
                    do {
                        slug = jobSlugGenerator.generateSlug();
                        attempts++;
                    }                     while (jobRepository.existsByJobSlug(slug) && attempts < 50);
                    
                    if (attempts >= 50) {
                        log.error("Job slug collision: failed to generate unique slug after 50 attempts for job id: {}", existingJob.getId());
                        throw new IllegalArgumentException("Unable to generate a unique external link for this job. Please try again or contact support.");
                    }
                    existingJob.setJobSlug(slug);
                    log.info("Generated job slug: {} for job: {}", slug, existingJob.getJobTitle());
                }
            }
            
            // External application flow removed: allow slug changes (still validated for uniqueness elsewhere).
            
            // Backend validation: EXTERNAL_ONLY cannot have targeting fields
            if ("EXTERNAL_ONLY".equals(visibilityType)) {
                existingJob.setTargetDepartmentId(null);
                existingJob.setTargetProgramId(null);
                existingJob.setTargetBatchId(null);
                existingJob.setTargetClassId(null);
                
                // Validate that no targeting fields are set
                if (job.getTargetDepartmentId() != null || job.getTargetProgramId() != null || 
                    job.getTargetBatchId() != null || job.getTargetClassId() != null) {
                    throw new IllegalArgumentException("EXTERNAL_ONLY jobs cannot have targeting fields. All targeting fields must be null.");
                }
            }
            
            // Validate: HYBRID/EXTERNAL_ONLY must have slug
            if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
                if (existingJob.getJobSlug() == null || existingJob.getJobSlug().trim().isEmpty()) {
                    throw new IllegalArgumentException(visibilityType + " jobs must have a job slug. Slug generation failed.");
                }
            }
        }
        
        // Update targeting (only if not EXTERNAL_ONLY)
        if (!"EXTERNAL_ONLY".equals(existingJob.getVisibilityType())) {
            existingJob.setTargetDepartmentId(job.getTargetDepartmentId());
            existingJob.setTargetProgramId(job.getTargetProgramId());
            existingJob.setTargetBatchId(job.getTargetBatchId());
            existingJob.setTargetClassId(job.getTargetClassId());
            
            // Validate targeting hierarchy
            validateTargetingHierarchy(existingJob);
        }

        // (sanitizeJobInputs now runs earlier — see the log-injection fix above)
        // Only re-validate the Company link when it's actually changing — see companyIdChanged
        // above. Otherwise a job whose already-linked Company was later soft-deleted would fail
        // to save on ANY edit, not just ones that touch the company link.
        if (companyIdChanged) {
            applyCompanyLink(existingJob, collegeId);
        }

        Job updatedJob = jobRepository.save(existingJob);
        // `changes` was built above purely for this log line and then discarded — unlike
        // JobApplication status transitions, which get a persisted history row per change, a job
        // edit (CTC range, deadline, description, company name...) left no record of what it
        // looked like before, even for jobs learners had already applied under.
        if (adminAuditLogService != null && !changes.isEmpty()) {
            Map<String, Object> payload = new HashMap<>(changes);
            adminAuditLogService.log(null, "JOB_UPDATED", "Job", String.valueOf(updatedJob.getId()),
                    updatedJob.getOrganizationId(), updatedJob.getCollegeId(), payload);
        }
        log.info("Job updated successfully with ID: {}", updatedJob.getId());
        return updatedJob;
    }

    private void invalidateJobCaches(Integer organizationId) {
        if (organizationId != null && jobVisibilityCache != null) {
            jobVisibilityCache.invalidateForOrganization(organizationId);
        }
        if (jobSearchCache != null) {
            jobSearchCache.refresh();
        }
    }

    @Override
    public Map<String, Object> getJobDeletionImpact(Integer jobId, Integer collegeId) {
        Job job = getJobById(jobId, collegeId);
        requireCollegeOwnedJob(job);
        List<JobApplication> applications = jobApplicationRepository.findByJobId(jobId);
        long activeApplications = applications.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .count();
        long affectedLearners = applications.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .map(JobApplication::getLearner)
                .filter(Objects::nonNull)
                .map(Learner::getId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        long openInterviews = applications.stream()
                .flatMap(a -> interviewRepository.findByJobApplicationId(a.getId()).stream())
                .filter(i -> i != null && ("SCHEDULED".equalsIgnoreCase(i.getInterviewStatus())
                        || "CONFIRMED".equalsIgnoreCase(i.getInterviewStatus())
                        || "RESCHEDULE_REQUESTED".equalsIgnoreCase(i.getInterviewStatus())))
                .count();

        Map<String, Object> impact = new HashMap<>();
        impact.put("jobId", jobId);
        impact.put("jobTitle", job.getJobTitle());
        impact.put("activeApplicationCount", activeApplications);
        impact.put("affectedLearnerCount", affectedLearners);
        impact.put("openInterviewCount", openInterviews);
        impact.put("applicationsPreserved", true);
        impact.put("learnersWillBeNotified", affectedLearners > 0);
        return impact;
    }

    @Override
    @Transactional
    public void deleteJob(Integer jobId, Integer collegeId) {
        log.info("Deleting job ID: {} for college ID: {}", jobId, collegeId);

        Job job = getJobById(jobId, collegeId);
        requireCollegeOwnedJob(job);

        List<JobApplication> affectedApplications = jobApplicationRepository.findByJobId(jobId);
        long activeApplicationCount = affectedApplications.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .count();
        if (activeApplicationCount > 0) {
            log.warn("Soft-deleting job {} which has {} active application(s). Applications will remain but the job will no longer appear in listings.",
                    jobId, activeApplicationCount);
        }

        // Snapshot notification recipients while associations are available inside the transaction.
        // Dispatch only after commit so a rolled-back delete never tells a learner the drive vanished.
        List<Map<String, Integer>> notificationRecipients = affectedApplications.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .filter(a -> a.getLearner() != null && a.getLearner().getId() > 0)
                .map(a -> {
                    Map<String, Integer> row = new HashMap<>();
                    row.put("learnerId", a.getLearner().getId());
                    row.put("classId", a.getLearner().getClassId());
                    row.put("applicationId", a.getId());
                    return row;
                })
                .collect(Collectors.toList());

        // CASCADE FIX: cancel all non-terminal interviews under the deleted drive.
        for (JobApplication application : affectedApplications) {
            cancelNonTerminalInterviewsForApplicationLocked(application);
        }

        // Use direct JPQL update to avoid re-validating all entity fields on save
        jobRepository.softDeleteById(jobId);
        invalidateJobCaches(job.getOrganizationId());
        // Editing a drive was audited as JOB_UPDATED, but deleting the same drive was not — it
        // left only the log lines above, which the Activity Log page cannot read. Removing a drive
        // that learners have already applied under is the less recoverable of the two.
        if (adminAuditLogService != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("jobTitle", job.getJobTitle());
            payload.put("activeApplications", activeApplicationCount);
            adminAuditLogService.log(null, "JOB_DELETED", "Job", String.valueOf(jobId),
                    job.getOrganizationId(), job.getCollegeId(), payload);
        }
        if (notificationService != null && !notificationRecipients.isEmpty()) {
            Runnable notifyLearners = () -> {
                for (Map<String, Integer> recipient : notificationRecipients) {
                    try {
                        notificationService.createNotification(
                                "Placement drive closed",
                                "The placement drive \"" + (job.getJobTitle() == null ? "this job" : job.getJobTitle()) +
                                        "\" was removed by the placement team. Your application record is preserved; any open interview for this drive has been cancelled.",
                                recipient.get("classId"),
                                0,
                                recipient.get("learnerId"),
                                "JOB",
                                job.getCompanyName(),
                                recipient.get("applicationId"),
                                jobId
                        );
                    } catch (Exception notificationError) {
                        log.warn("Failed to notify learner {} after deleting job {}: {}",
                                recipient.get("learnerId"), jobId, notificationError.getMessage());
                    }
                }
            };
            if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                        new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                            @Override
                            public void afterCommit() {
                                notifyLearners.run();
                            }
                        });
            } else {
                notifyLearners.run();
            }
        }
        log.info("Job deleted successfully with ID: {} ({} active applications affected)", jobId, activeApplicationCount);
    }

    @Override
    public List<Learner> getEligibleLearners(Job job, Integer collegeId) {
        log.info("Finding eligible learners for job ID: {} with targeting", job.getId());
        
        List<Learner> eligibleLearners = new ArrayList<>();
        
        // Get all learners for the college
        List<Learner> collegeLearners = learnerRepository.fetchContactsByCollegeId(collegeId)
                .stream()
                .filter(learner -> !learner.getIsDeleted())
                .collect(Collectors.toList());
        
        // Cache class list for filtering (prevents multiple full-table scans)
        List<_Class> allClasses = classRepository.findAll();

        // Apply targeting logic
        if (job.getTargetClassId() != null) {
            // Target specific class
            eligibleLearners = collegeLearners.stream()
                    .filter(learner -> job.getTargetClassId().equals(learner.getClassId()))
                    .collect(Collectors.toList());
        } else if (job.getTargetBatchId() != null) {
            // Target all classes in the batch
            List<_Class> batchClasses = allClasses.stream()
                    .filter(c -> job.getTargetBatchId().equals(c.getBatchId()) && !c.getIsDeleted())
                    .collect(Collectors.toList());
            
            List<Integer> classIds = batchClasses.stream()
                    .map(_Class::getId)
                    .collect(Collectors.toList());
            
            eligibleLearners = collegeLearners.stream()
                    .filter(learner -> learner.getClassId() != null && classIds.contains(learner.getClassId()))
                    .collect(Collectors.toList());
        } else if (job.getTargetProgramId() != null) {
            // Target all classes in the program
            List<_Class> programClasses = allClasses.stream()
                    .filter(c -> job.getTargetProgramId().equals(c.getProgramId()) && !c.getIsDeleted())
                    .collect(Collectors.toList());
            
            List<Integer> classIds = programClasses.stream()
                    .map(_Class::getId)
                    .collect(Collectors.toList());
            
            eligibleLearners = collegeLearners.stream()
                    .filter(learner -> learner.getClassId() != null && classIds.contains(learner.getClassId()))
                    .collect(Collectors.toList());
        } else if (job.getTargetDepartmentId() != null) {
            // Target all classes in department (new_program)
            List<NewProgram> departmentPrograms = newProgramRepository.findByDeptId(job.getTargetDepartmentId());
            List<Integer> programIds = departmentPrograms.stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                    .map(NewProgram::getId)
                    .collect(Collectors.toList());
            
            List<_Class> departmentClasses = allClasses.stream()
                    .filter(c -> programIds.contains(c.getProgramId()) && !c.getIsDeleted())
                    .collect(Collectors.toList());
            
            List<Integer> classIds = departmentClasses.stream()
                    .map(_Class::getId)
                    .collect(Collectors.toList());
            
            eligibleLearners = collegeLearners.stream()
                    .filter(learner -> learner.getClassId() != null && classIds.contains(learner.getClassId()))
                    .collect(Collectors.toList());
        } else {
            // No targeting - all learners in college
            eligibleLearners = collegeLearners;
        }
        
        log.info("Found {} eligible learners for job ID: {}", eligibleLearners.size(), job.getId());
        return eligibleLearners;
    }

    @Override
    public List<JobApplication> getJobApplications(Integer jobId, Integer collegeId) {
        log.info("Fetching applications for job ID: {} and college ID: {}", jobId, collegeId);

        // Verify job belongs to college — allowDeleted so a soft-deleted job doesn't strand
        // its applications from admin view (item 210).
        getJobById(jobId, collegeId, true);

        return jobApplicationRepository.findByJobId(jobId);
    }

    @Override
    public JobApplication getJobApplication(Integer applicationId, Integer jobId, Integer collegeId) {
        // allowDeleted=true mirrors list/history/export: deleting a job must not strand the
        // application record from admins who still need to inspect its placement history.
        getJobById(jobId, collegeId, true);
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (application.getJob() == null || !Objects.equals(application.getJob().getId(), jobId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!jobBelongsToCollege(application.getJob(), collegeId)) {
            throw new IllegalArgumentException("Application not found");
        }
        return application;
    }

    @Override
    public Page<JobApplication> getJobApplicationsPaginated(Integer jobId, Integer collegeId, Pageable pageable,
                                                            String applicationStatus, Double minScore, Double maxScore,
                                                            LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                            String source, Integer departmentId, Integer programId, Integer batchId, String search) {
        Job job = getJobById(jobId, collegeId, true);
        Integer organizationId = job.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalArgumentException("Job has no organization ID");
        }
        return placementJobService.getApplicationsForJobPaginated(
                jobId, organizationId, pageable, applicationStatus, minScore, maxScore, appliedAfter, appliedBefore,
                source, programId, null, departmentId, batchId, search, null);
    }

    @Override
    public Long getApplicationCount(Integer jobId, Integer collegeId) {
        log.info("Getting application count for job ID: {} and college ID: {}", jobId, collegeId);
        
        // Verify job belongs to college
        getJobById(jobId, collegeId);
        
        return jobApplicationRepository.countByJobId(jobId);
    }

    @Override
    // REQUIRES_NEW (not the default REQUIRED): a bulk update calls this once per application id
    // through `self` (see bulkUpdateApplicationStatus) specifically so each row commits — or
    // fails — in its own transaction. With everything sharing one transaction, an
    // OptimisticLockException from JobApplication's @Version column (two admins hitting the same
    // hot job) surfaces at the single shared commit, after the loop has already returned a
    // per-item "updated"/"failed" breakdown — silently rolling back every row in the batch,
    // including the ones that had no conflict, while the caller was told which ones "succeeded".
    public JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer jobId, Integer collegeId,
                                                  Integer updatedBy, String assessmentUrl, String rejectionReason) {
        return updateApplicationStatus(applicationId, newStatus, jobId, collegeId, updatedBy, assessmentUrl, Boolean.TRUE, rejectionReason);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer jobId, Integer collegeId,
                                                  Integer updatedBy, String assessmentUrl, Boolean saveAssessmentUrlToJob,
                                                  String rejectionReason) {
        // Normalize to canonical uppercase as early as possible. JobApplicationStatusValidator
        // is case-insensitive (uppercases internally before checking the transition map), but
        // application_status is a plain String column with no enum/DB constraint enforcing
        // casing — persisting the raw client string (e.g. "shortlisted") would silently corrupt
        // the row, since every other case-SENSITIVE .equals()/contains() check on this status
        // elsewhere (attachOfferLetter's !"OFFERED".equals(...), InterviewServiceImpl's
        // ELIGIBLE_APPLICATION_STATUSES / !"INTERVIEW".equals(...)) would then silently fail to
        // recognize it. Normalizing here — before the no-op shortcut, the WITHDRAWN block, and
        // the validator call — keeps every downstream check and the persisted value itself in
        // agreement on canonical casing.
        if (newStatus != null) {
            newStatus = newStatus.toUpperCase();
        }
        log.info("Updating application {} status to {} for job {} college {} by user {}", applicationId, newStatus, jobId, collegeId, updatedBy);
        // allowDeleted=true: deleteJob() explicitly soft-deletes a job while leaving its
        // applications in place ("Applications will remain but the job will no longer appear in
        // listings" — see deleteJob's log message), and getJobApplications already uses
        // allowDeleted so admins can still see those stranded rows. Using the strict overload here
        // (as this previously did) meant a mid-pipeline application (e.g. INTERVIEW/OFFERED)
        // against a since-deleted job could never be touched again through this endpoint at all —
        // not even rejected for cleanup — even though the exact same JP-03 pattern already exists
        // a few lines below for a merely-closed (isActive=false) job. The isDeleted check below
        // reapplies that same "block advance, allow REJECTED cleanup" policy for a deleted job.
        Job job = getJobById(jobId, collegeId, true);
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and ownership-mismatch below intentionally throw the exact
                // same message/status. Distinguishing "this ID doesn't exist" from "this ID exists
                // but isn't yours" is an IDOR enumeration oracle — never let a caller tell them apart.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!Objects.equals(application.getJob().getId(), jobId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!jobBelongsToCollege(application.getJob(), collegeId)) {
            throw new IllegalArgumentException("Application not found");
        }
        String currentStatus = application.getApplicationStatus();
        // JP-03: Block advancing applications for a closed job (allow REJECTED for cleanup) — this
        // check already existed on the org-scoped PlacementJobServiceImpl path but was missing
        // here, so whether a candidate could be advanced/hired against a job that's supposedly
        // closed depended entirely on which of the two admin surfaces performed the update.
        // Only applies to an actual status transition — a same-status call (e.g. just correcting
        // the assessment link below, or any other future no-op-status use) isn't "advancing"
        // anything and must not be blocked just because the job happens to be closed.
        if (Boolean.FALSE.equals(job.getIsActive()) && !"REJECTED".equalsIgnoreCase(newStatus)
                && !newStatus.equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException("Cannot advance application status: the job posting is closed");
        }
        // Same policy as the isActive check above, for a soft-deleted job (see allowDeleted note
        // on the getJobById call above).
        if (Boolean.TRUE.equals(job.getIsDeleted()) && !"REJECTED".equalsIgnoreCase(newStatus)
                && !newStatus.equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException("Cannot advance application status: the job posting has been deleted");
        }
        // Assessment links have two distinct lifecycles:
        // 1) every supplied link belongs to the affected application, so a one-off/batch-specific
        //    link reaches exactly those learners;
        // 2) only when saveAssessmentUrlToJob=true is it also promoted to Job.assessmentUrl as
        //    the reusable default for future candidates.
        boolean applicationAssessmentUrlChanged = false;
        boolean jobAssessmentUrlChanged = false;
        boolean saveAssessmentDefault = saveAssessmentUrlToJob == null || Boolean.TRUE.equals(saveAssessmentUrlToJob);
        if ("ASSESSMENT".equalsIgnoreCase(newStatus) && assessmentUrl != null && !assessmentUrl.trim().isEmpty()) {
            String trimmed = assessmentUrl.trim();
            if (trimmed.length() > 2048) {
                throw new IllegalArgumentException("Assessment URL must be at most 2048 characters");
            }
            if (!trimmed.matches("^https?://.+")) {
                throw new IllegalArgumentException("Assessment URL must be a valid http or https link");
            }
            if (!trimmed.equals(application.getAssessmentUrl())) {
                application.setAssessmentUrl(trimmed);
                applicationAssessmentUrlChanged = true;
            }
            if (saveAssessmentDefault && !trimmed.equals(job.getAssessmentUrl())) {
                job.setAssessmentUrl(trimmed);
                jobRepository.save(job);
                jobAssessmentUrlChanged = true;
            }
        } else if ("ASSESSMENT".equalsIgnoreCase(newStatus)
                && !newStatus.equalsIgnoreCase(currentStatus)
                && application.getAssessmentUrl() != null) {
            // Re-entering Assessment with no explicit one-off URL must not resurrect a stale
            // application-specific link from an earlier assessment cycle. Null means "use the
            // current job default" in JobNotificationHelper / learner UI.
            application.setAssessmentUrl(null);
            applicationAssessmentUrlChanged = true;
        }

        // No-op: same status, skip status-transition side effects. A same-status assessment-link
        // edit is still a real write and should notify the learner after it is persisted.
        if (newStatus.equalsIgnoreCase(currentStatus)) {
            log.debug("Status unchanged ({}→{}) for application {} - skipping", currentStatus, newStatus, applicationId);
            JobApplication result = application;
            if (applicationAssessmentUrlChanged) {
                result = jobApplicationRepository.save(application);
            }
            if (applicationAssessmentUrlChanged || jobAssessmentUrlChanged) {
                sendJobApplicationStatusNotifications(result, newStatus);
            }
            return result;
        }
        // WITHDRAWN is a learner-initiated action (see JobServiceImpl.withdrawApplication, which
        // also soft-deletes the row). An admin forcing it here left the row neither soft-deleted
        // nor movable again — WITHDRAWN has zero valid outbound transitions in the state machine,
        // so it became a permanently stuck row that still counted as "active" everywhere.
        if ("WITHDRAWN".equalsIgnoreCase(newStatus)) {
            throw new IllegalArgumentException("WITHDRAWN can only be set by the learner withdrawing their own application, not by an admin status update.");
        }
        JobApplicationStatusValidator.validateTransition(currentStatus, newStatus);
        // CONCURRENCY FIX (round 5 audit): the JP-03 isActive/isDeleted gate above ran against
        // `job`, a plain (unlocked) read from getJobById at the top of this method — nothing
        // stopped a concurrent deleteJob (soft-delete UPDATE) or an isActive-closing update from
        // committing in the window between that check and this method's application-status write
        // below, letting an advance slip through against a job that's simultaneously (or by now
        // already) closed/deleted, bypassing JP-03 entirely. Same gap and same fix as
        // JobServiceImpl.applyToJob / InterviewServiceImpl.scheduleInterview: re-verify under a
        // PESSIMISTIC_WRITE lock on the Job row immediately before the write section, which
        // serializes against deleteJob's/the closing update's UPDATE on the same row. Skipped for
        // REJECTED, mirroring the exemption already applied to the unlocked check above (REJECTED
        // is always allowed, even against a closed/deleted job, for cleanup).
        if (!"REJECTED".equalsIgnoreCase(newStatus)) {
            Job lockedJob = jobRepository.lockJobById(jobId)
                    .orElseThrow(() -> new IllegalArgumentException("Job not found with ID: " + jobId));
            if (Boolean.FALSE.equals(lockedJob.getIsActive())) {
                throw new IllegalArgumentException("Cannot advance application status: the job posting is closed");
            }
            if (Boolean.TRUE.equals(lockedJob.getIsDeleted())) {
                throw new IllegalArgumentException("Cannot advance application status: the job posting has been deleted");
            }
        }
        // One-offer-per-student, admin-direct path: JobServiceImpl.respondToOffer already blocks
        // a learner from accepting a second offer while already HIRED elsewhere (see that
        // method's comment for the full rationale — HIRED is excluded from
        // ACTIVE_NON_TERMINAL_STATUSES, so the cascade below would otherwise silently leave a
        // pre-existing HIRED application untouched). An admin setting HIRED directly through this
        // college-scoped surface bypassed that guard entirely — nothing stopped an admin from
        // hiring a candidate on a second application while an earlier one was still HIRED (e.g.
        // after a HIRED -> OFFERED corrective undo on that first application followed by
        // re-offering and admin-accepting a second one). Same check, same outcome, applied here.
        if ("HIRED".equalsIgnoreCase(newStatus)) {
            boolean alreadyHiredElsewhere = jobApplicationRepository.findByLearnerId(
                            application.getLearner() != null ? application.getLearner().getId() : -1).stream()
                    .anyMatch(a -> a.getId() != application.getId()
                            && "HIRED".equalsIgnoreCase(String.valueOf(a.getApplicationStatus())));
            if (alreadyHiredElsewhere) {
                throw new IllegalArgumentException(
                        "This learner already has an accepted offer (HIRED) on another application. " +
                        "Cannot mark a second application as HIRED while one is already accepted.");
            }
        }
        application.setApplicationStatus(newStatus);
        application.setStatusUpdatedBy(updatedBy);
        application.setStatusUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        if ("REJECTED".equalsIgnoreCase(newStatus) && rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            // Round 3 fix: rejectionReason is returned to the learner via
            // LearnerApplicationWithInterviewsDTO and interpolated into the
            // JOB_APPLICATION_REJECTED notification/email template, but was only trimmed and
            // length-capped - never HTML-escaped. Same stored-XSS gap as jobTitle/companyName/etc.
            application.setRejectionReason(TextSanitizer.sanitizeAndTruncate(rejectionReason.trim(), 500));
        } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
            application.setRejectionReason(null);
        } else if (!"REJECTED".equalsIgnoreCase(currentStatus)) {
            // Only clear when we weren't REJECTED to begin with. Reinstating a REJECTED
            // application (e.g. back to APPLIED for a second look) used to silently null the
            // reason with no confirmation — the one piece of information most relevant to a
            // re-review became invisible to the next person looking at it. Now it's preserved
            // until the application is REJECTED again (which does explicitly set a fresh reason
            // or null above).
            application.setRejectionReason(null);
        }
        // Previously only fired for REJECTED — moving an application backward out of INTERVIEW
        // (or OFFERED) any other way, e.g. INTERVIEW→SHORTLISTED to re-screen before a second
        // round, left the scheduled interview dangling: still bookable/confirmable for a stage
        // the candidate was just moved out of, and blocking a legitimate next round from being
        // scheduled (scheduleInterview refuses a new round while one is still "active").
        boolean leavingInterviewStage = ("INTERVIEW".equalsIgnoreCase(currentStatus) || "OFFERED".equalsIgnoreCase(currentStatus))
                && !"INTERVIEW".equalsIgnoreCase(newStatus) && !"OFFERED".equalsIgnoreCase(newStatus) && !"HIRED".equalsIgnoreCase(newStatus);
        if ("REJECTED".equalsIgnoreCase(newStatus) || leavingInterviewStage) {
            cancelNonTerminalInterviewsForApplicationLocked(application);
        }
        // offer_letter_url is a legally meaningful document — leaving it in place once the
        // application moves away from OFFERED/HIRED meant a rejected or reverted-to-interview
        // application could still carry a stale, no-longer-valid offer letter around.
        // offerLetterSentAt must be cleared alongside the URL — otherwise a later re-offer cycle
        // (e.g. REJECTED -> APPLIED reinstate -> re-advanced to OFFERED again) shows a stale
        // "sent at" timestamp from the first offer with no corresponding URL until re-attached.
        if (!"OFFERED".equalsIgnoreCase(newStatus) && !"HIRED".equalsIgnoreCase(newStatus)) {
            application.setOfferLetterUrl(null);
            application.setOfferLetterSentAt(null);
        }
        JobApplication saved = jobApplicationRepository.save(application);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(
                    saved.getId(), currentStatus, newStatus, updatedBy,
                    "REJECTED".equalsIgnoreCase(newStatus) ? application.getRejectionReason() : null));
        }
        // Audit logging previously covered exactly one action in the whole placements codebase —
        // job metadata edits. "Who moved this candidate to REJECTED/OFFERED and when" had zero
        // coverage; this also covers bulkUpdateApplicationStatus for free, since it routes every
        // item through this same method.
        if (adminAuditLogService != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", currentStatus);
            payload.put("to", newStatus);
            adminAuditLogService.log(null, "APPLICATION_STATUS_CHANGED", "JobApplication", String.valueOf(saved.getId()),
                    job.getOrganizationId(), collegeId, payload);
        }
        sendJobApplicationStatusNotifications(saved, newStatus);
        // One-offer-per-student cascade, admin-direct path: JobServiceImpl.respondToOffer already
        // auto-withdraws a learner's other active applications when THEY accept an offer — an
        // admin setting HIRED directly through this surface previously left every other pending
        // application (SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/WAITLISTED elsewhere) completely
        // untouched, as if nothing had happened, contradicting the same one-offer-per-student
        // invariant this class just started enforcing above (the HIRED-conflict check). Mirrors
        // JobServiceImpl.withdrawOtherActiveApplications's exact transition rules (OFFERED ->
        // REJECTED with a reason, everything else -> WITHDRAWN/soft-deleted).
        if ("HIRED".equalsIgnoreCase(newStatus)) {
            withdrawOtherActiveApplicationsOnHire(saved);
        }
        return saved;
    }

    private static final java.util.Set<String> ACTIVE_NON_TERMINAL_STATUSES = java.util.Set.of(
            "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "WAITLISTED");

    private void withdrawOtherActiveApplicationsOnHire(JobApplication hiredApplication) {
        Integer learnerId = hiredApplication.getLearner() != null ? hiredApplication.getLearner().getId() : null;
        if (learnerId == null) return;
        List<Integer> otherIds = jobApplicationRepository.findByLearnerId(learnerId).stream()
                .filter(a -> a.getId() != hiredApplication.getId())
                .filter(a -> ACTIVE_NON_TERMINAL_STATUSES.contains(String.valueOf(a.getApplicationStatus()).toUpperCase(java.util.Locale.ROOT)))
                .map(JobApplication::getId)
                // CONCURRENCY FIX (round 5 audit): sort ascending by id before locking — see
                // JobServiceImpl.withdrawOtherActiveApplications for the full rationale. This cascade,
                // JobServiceImpl's respondToOffer cascade, and PlacementJobServiceImpl's identical cascade
                // can race for the SAME learner via different surfaces (candidate accept vs. admin HIRED),
                // each taking findByIdForUpdate locks on the learner's other applications in a loop;
                // sorting by id gives every caller the same caller-independent lock order regardless of
                // appliedAt ties or which application each cascade itself excludes.
                .sorted()
                .collect(Collectors.toList());
        for (Integer otherId : otherIds) {
            // CONCURRENCY FIX (round 4 audit): lock this "other" application row BEFORE touching
            // its interviews — same fix and rationale as
            // JobServiceImpl.withdrawOtherActiveApplications: without it, a concurrent
            // InterviewServiceImpl.scheduleInterview call for this same application could commit
            // a brand-new interview after this cascade's own (unlocked, REPEATABLE-READ
            // snapshot-bound) interview lookup already ran, leaving it un-cancelled on a
            // now-withdrawn application. Locking the application first (matching
            // scheduleInterview's own Application-then-Interview lock order) also avoids a
            // cross-table deadlock between the two code paths. See
            // InterviewRepository.findNonTerminalByJobApplicationIdForUpdate for the full detail.
            java.util.Optional<JobApplication> lockedOther = jobApplicationRepository.findByIdForUpdate(otherId);
            if (lockedOther.isEmpty()) continue;
            JobApplication other = lockedOther.get();
            String prevStatus = other.getApplicationStatus();
            // Re-validate under the lock: another transaction may have already moved this
            // application out of the active/non-terminal set between the initial list query
            // above (unlocked) and acquiring this lock.
            if (!ACTIVE_NON_TERMINAL_STATUSES.contains(String.valueOf(prevStatus).toUpperCase(java.util.Locale.ROOT))) {
                continue;
            }
            String otherNewStatus = "OFFERED".equals(prevStatus) ? "REJECTED" : "WITHDRAWN";
            JobApplicationStatusValidator.validateTransition(prevStatus, otherNewStatus);
            other.setApplicationStatus(otherNewStatus);
            other.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
            if ("REJECTED".equals(otherNewStatus)) {
                other.setRejectionReason("Offer declined — candidate accepted another offer");
                other.setOfferLetterUrl(null);
                other.setOfferLetterSentAt(null);
            } else {
                other.setStatusBeforeWithdrawal(prevStatus);
                other.setIsDeleted(true);
            }
            cancelNonTerminalInterviewsForApplicationLocked(other);
            JobApplication savedOther = jobApplicationRepository.save(other);
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new ApplicationStatusChangedEvent(savedOther.getId(), prevStatus, otherNewStatus, null,
                        "REJECTED".equals(otherNewStatus) ? other.getRejectionReason() : null));
            }
            sendJobApplicationStatusNotifications(savedOther, otherNewStatus);
        }
    }

    /**
     * Delegate to shared notification helper (single source of truth for all job status
     * notifications) — dispatched asynchronously so a bulk status-update loop (see
     * bulkUpdateApplicationStatus) doesn't block on blocking email/SMS calls once per row, inside
     * an open transaction, for the whole batch.
     *
     * The @Async dispatch used to fire immediately, while this method's own REQUIRES_NEW
     * transaction was still open — the async thread could re-fetch and read the row before this
     * transaction's own COMMIT reached the database (a stale-read race), or the transaction
     * could still fail at commit after the notification had already gone out describing a change
     * that never actually persisted. Registering it as an after-commit synchronization instead
     * guarantees the dispatch only ever fires once the write is durable.
     */
    private void sendJobApplicationStatusNotifications(JobApplication application, String newStatus) {
        Integer applicationId = application.getId();
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                        @Override
                        public void afterCommit() {
                            jobNotificationHelper.sendStatusNotificationAsync(applicationId, newStatus);
                        }
                    });
        } else {
            jobNotificationHelper.sendStatusNotificationAsync(applicationId, newStatus);
        }
    }

    private static final int BULK_STATUS_MAX = 100;

    @Override
    public Map<String, Object> bulkUpdateApplicationStatus(Integer jobId, Integer collegeId, List<Integer> applicationIds,
                                                          String newStatus, Integer updatedBy, String assessmentUrl,
                                                          String rejectionReason) {
        return bulkUpdateApplicationStatus(jobId, collegeId, applicationIds, newStatus, updatedBy,
                assessmentUrl, Boolean.TRUE, rejectionReason);
    }

    @Override
    // No @Transactional here on purpose — each item's own call (routed through `self` below) opens
    // its own REQUIRES_NEW transaction, so a failure on one row can never roll back the others.
    public Map<String, Object> bulkUpdateApplicationStatus(Integer jobId, Integer collegeId, List<Integer> applicationIds,
                                                          String newStatus, Integer updatedBy, String assessmentUrl,
                                                          Boolean saveAssessmentUrlToJob, String rejectionReason) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            throw new IllegalArgumentException("applicationIds is required and must not be empty");
        }
        if (applicationIds.size() > BULK_STATUS_MAX) {
            throw new IllegalArgumentException("Maximum " + BULK_STATUS_MAX + " applications per bulk update");
        }
        // allowDeleted=true: mirrors the per-item updateApplicationStatus fix above — a bulk
        // REJECTED cleanup against applications whose job was since soft-deleted must not be
        // rejected wholesale here before each item even gets a chance to run its own (now
        // deleted-aware) checks.
        getJobById(jobId, collegeId, true);
        List<JobApplication> updated = new ArrayList<>();
        List<Map<String, Object>> failed = new ArrayList<>();
        for (Integer applicationId : applicationIds) {
            try {
                JobApplication app = self.updateApplicationStatus(applicationId, newStatus, jobId, collegeId, updatedBy,
                        assessmentUrl, saveAssessmentUrlToJob, rejectionReason);
                updated.add(app);
            } catch (Exception e) {
                log.warn("Bulk status update: skipped application {}: {}", applicationId, e.getMessage());
                Map<String, Object> failEntry = new HashMap<>();
                failEntry.put("applicationId", applicationId);
                failEntry.put("reason", e.getMessage() != null ? e.getMessage() : "Unknown error");
                failed.add(failEntry);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updated.size());
        result.put("applications", updated);
        result.put("failed", failed);
        return result;
    }

    @Override
    @Transactional
    public JobApplication updateApplicationNotes(Integer applicationId, String internalNotes, Integer jobId, Integer collegeId, Long version) {
        getJobById(jobId, collegeId);
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and ownership-mismatch intentionally throw the exact same
                // message/status — distinguishing "doesn't exist" from "isn't yours" is an IDOR
                // enumeration oracle.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!Objects.equals(application.getJob().getId(), jobId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!jobBelongsToCollege(application.getJob(), collegeId)) {
            throw new IllegalArgumentException("Application not found");
        }
        // Two admins opening the same notes editor from the same starting text used to silently
        // let whoever saved last overwrite the other's note with no warning and no history.
        if (version != null && !version.equals(application.getVersion())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "These notes were updated by someone else. Please refresh and try again.");
        }
        application.setInternalNotes(internalNotes != null ? internalNotes.trim() : null);
        return jobApplicationRepository.save(application);
    }

    @Override
    @Transactional
    public JobApplication attachOfferLetter(Integer applicationId, String offerLetterUrl, Integer jobId, Integer collegeId) {
        getJobById(jobId, collegeId);
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and ownership-mismatch intentionally throw the exact same
                // message/status — distinguishing "doesn't exist" from "isn't yours" is an IDOR
                // enumeration oracle.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!Objects.equals(application.getJob().getId(), jobId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!jobBelongsToCollege(application.getJob(), collegeId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!"OFFERED".equals(application.getApplicationStatus()) && !"HIRED".equals(application.getApplicationStatus())) {
            throw new IllegalArgumentException("Offer letters can only be attached once the application is Offered or Hired.");
        }
        String trimmed = offerLetterUrl == null ? null : offerLetterUrl.trim();
        if (trimmed == null || trimmed.isEmpty()) {
            throw new IllegalArgumentException("offerLetterUrl is required");
        }
        if (trimmed.length() > 2048) {
            throw new IllegalArgumentException("Offer letter URL must be at most 2048 characters");
        }
        if (!trimmed.matches("^https?://.+")) {
            throw new IllegalArgumentException("Offer letter URL must be a valid http or https link");
        }
        application.setOfferLetterUrl(trimmed);
        application.setOfferLetterSentAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        JobApplication saved = jobApplicationRepository.save(application);

        // This lifecycle event visibly changes what the candidate can see/download in their
        // portal (offerLetterUrl becomes non-null) — previously nothing told them it was there;
        // they only discovered it by manually revisiting the portal days after the separate,
        // earlier OFFERED status notification.
        try {
            if (notificationService != null && application.getLearner() != null) {
                Job job = application.getJob();
                String title = "Offer letter available";
                String body = "Your offer letter for " + (job != null ? job.getJobTitle() : "your job offer")
                        + (job != null && job.getCompanyName() != null && !job.getCompanyName().isEmpty() ? " at " + job.getCompanyName() : "")
                        + " is now available in your portal.";
                Integer classId = application.getLearner().getClassId() != null ? application.getLearner().getClassId() : 0;
                notificationService.createNotification(title, body, classId, 0, application.getLearner().getId(),
                        "JOB", job != null ? job.getJobTitle() : "Job", saved.getId(), jobId);
            }
        } catch (Exception e) {
            log.warn("Failed to send offer-letter-attached notification for application {}: {}", applicationId, e.getMessage());
        }

        if (adminAuditLogService != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("offerLetterUrl", "attached");
            adminAuditLogService.log(null, "OFFER_LETTER_ATTACHED", "JobApplication", String.valueOf(saved.getId()),
                    saved.getOrganizationId(), collegeId, payload);
        }

        return saved;
    }

    @Override
    public Map<String, Object> getDataRetentionReport(Integer collegeId, int olderThanDays) {
        List<Job> jobs = resolveJobsForMetrics(null, collegeId);
        Map<String, Object> result = new HashMap<>();
        result.put("thresholdDays", olderThanDays);
        if (jobs.isEmpty()) {
            result.put("totalStaleCount", 0L);
            result.put("sampleTruncatedAt200", false);
            result.put("sample", new ArrayList<>());
            return result;
        }
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(Math.max(1, olderThanDays));

        // Previously loaded every application for every job (one query per job — an N+1) into
        // Java just to filter down to a stale/terminal subset. A single query with the same
        // filter conditions does the work in the database.
        String where = "ja.job.id IN :jobIds AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                "AND ja.applicationStatus IN ('REJECTED', 'WITHDRAWN') " +
                "AND COALESCE(ja.statusUpdatedAt, ja.appliedAt) < :threshold";

        TypedQuery<Long> countQuery = entityManager.createQuery(
                "SELECT COUNT(ja) FROM JobApplication ja WHERE " + where, Long.class);
        countQuery.setParameter("jobIds", jobIds);
        countQuery.setParameter("threshold", threshold);
        long totalStale = countQuery.getSingleResult();

        TypedQuery<JobApplication> sampleQuery = entityManager.createQuery(
                "SELECT ja FROM JobApplication ja LEFT JOIN FETCH ja.job LEFT JOIN FETCH ja.learner WHERE " + where +
                " ORDER BY COALESCE(ja.statusUpdatedAt, ja.appliedAt) ASC", JobApplication.class);
        sampleQuery.setParameter("jobIds", jobIds);
        sampleQuery.setParameter("threshold", threshold);
        sampleQuery.setMaxResults(200);

        List<Map<String, Object>> sample = new ArrayList<>();
        for (JobApplication app : sampleQuery.getResultList()) {
            Map<String, Object> row = new HashMap<>();
            row.put("applicationId", app.getId());
            row.put("jobTitle", app.getJob() != null ? app.getJob().getJobTitle() : null);
            row.put("learnerId", app.getLearner() != null ? app.getLearner().getId() : null);
            row.put("applicationStatus", app.getApplicationStatus());
            row.put("lastActivityAt", app.getStatusUpdatedAt() != null ? app.getStatusUpdatedAt() : app.getAppliedAt());
            row.put("hasResume", app.getResumeUrl() != null && !app.getResumeUrl().isBlank());
            row.put("hasInternalNotes", app.getInternalNotes() != null && !app.getInternalNotes().isBlank());
            sample.add(row);
        }
        result.put("totalStaleCount", totalStale);
        result.put("sampleTruncatedAt200", totalStale > 200);
        result.put("sample", sample);
        return result;
    }

    // Part A, "Placement policy: set hiring-dashboard alert rules". These four decide what lands
    // in the Needs-attention panel, and every one was a hardcoded constant -- a college that runs
    // week-long drives and one that runs month-long drives got the same "closing soon" window.
    // Defaults are the previous literals, so behaviour is unchanged until an admin overrides them.
    private static final int NEEDS_ATTENTION_SAMPLE_CAP_DEFAULT = 5;
    private static final int STALE_APPLIED_DAYS_DEFAULT = 7;
    private static final int CLOSING_SOON_DAYS_DEFAULT = 3;
    private static final double LOW_CONVERSION_THRESHOLD_DEFAULT = 0.15; // shortlisted-or-further / applied

    private int needsAttentionSampleCap() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "placement.needsAttentionSampleCap", NEEDS_ATTENTION_SAMPLE_CAP_DEFAULT)
                : NEEDS_ATTENTION_SAMPLE_CAP_DEFAULT;
    }

    private int staleAppliedDays() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "placement.staleAppliedDays", STALE_APPLIED_DAYS_DEFAULT)
                : STALE_APPLIED_DAYS_DEFAULT;
    }

    private int closingSoonDays() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "placement.closingSoonDays", CLOSING_SOON_DAYS_DEFAULT)
                : CLOSING_SOON_DAYS_DEFAULT;
    }

    private double lowConversionThreshold() {
        return appSettingsService != null
                ? appSettingsService.getDouble("GLOBAL", null, "placement.lowConversionThreshold", LOW_CONVERSION_THRESHOLD_DEFAULT)
                : LOW_CONVERSION_THRESHOLD_DEFAULT;
    }

    @Override
    public Map<String, Object> getNeedsAttentionSummary(Integer collegeId) {
        List<Job> jobs = resolveJobsForMetrics(null, collegeId);
        Map<String, Object> result = new HashMap<>();
        if (jobs.isEmpty()) {
            result.put("staleApplications", emptyAttentionCategory());
            result.put("unscheduledInterviews", emptyAttentionCategory());
            result.put("missingOfferLetters", emptyAttentionCategory());
            result.put("closingSoonLowConversion", emptyAttentionCategory());
            return result;
        }
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        java.time.LocalDateTime nowUtc = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);

        // Applications sitting in APPLIED with no admin action in over a week — the "did anyone
        // even look at this" signal.
        java.time.LocalDateTime staleThreshold = nowUtc.minusDays(staleAppliedDays());
        result.put("staleApplications", buildAttentionCategory(
                "SELECT ja FROM JobApplication ja LEFT JOIN FETCH ja.job LEFT JOIN FETCH ja.learner WHERE " +
                        "ja.job.id IN :jobIds AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                        "AND ja.applicationStatus = 'APPLIED' AND COALESCE(ja.statusUpdatedAt, ja.appliedAt) < :staleThreshold " +
                        "ORDER BY COALESCE(ja.statusUpdatedAt, ja.appliedAt) ASC",
                java.util.Map.of("jobIds", jobIds, "staleThreshold", staleThreshold),
                app -> daysAgoDetail(app.getStatusUpdatedAt() != null ? app.getStatusUpdatedAt() : app.getAppliedAt(), nowUtc, "Applied, no action")));

        // Application marked INTERVIEW but no round was ever actually scheduled (or every round
        // scheduled was later cancelled) — a status that silently drifted out of sync with reality.
        result.put("unscheduledInterviews", buildAttentionCategory(
                "SELECT ja FROM JobApplication ja LEFT JOIN FETCH ja.job LEFT JOIN FETCH ja.learner WHERE " +
                        "ja.job.id IN :jobIds AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                        "AND ja.applicationStatus = 'INTERVIEW' " +
                        "AND NOT EXISTS (SELECT 1 FROM Interview i WHERE i.jobApplication.id = ja.id AND i.interviewStatus <> 'CANCELLED') " +
                        "ORDER BY ja.statusUpdatedAt ASC",
                java.util.Map.of("jobIds", jobIds),
                app -> "Marked Interview, nothing scheduled"));

        // Offer extended but no offer-letter document ever attached. Includes HIRED, not just
        // OFFERED — attachOfferLetter allows attaching to either status, so a candidate who's
        // already HIRED with no offer letter on file was silently dropping off this queue right
        // when it matters most.
        result.put("missingOfferLetters", buildAttentionCategory(
                "SELECT ja FROM JobApplication ja LEFT JOIN FETCH ja.job LEFT JOIN FETCH ja.learner WHERE " +
                        "ja.job.id IN :jobIds AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                        "AND ja.applicationStatus IN ('OFFERED', 'HIRED') AND ja.offerLetterUrl IS NULL " +
                        "ORDER BY ja.statusUpdatedAt ASC",
                java.util.Map.of("jobIds", jobIds),
                app -> "Offered, no offer letter attached"));

        // Drives closing within a few days whose shortlist-or-further conversion is weak — the
        // "this drive is quietly underperforming" signal, computed per-job since the closing-soon
        // set is always small (bounded by how many drives can close in the same few days).
        java.time.LocalDateTime closingWindowEnd = nowUtc.plusDays(closingSoonDays());
        List<com._42students.lms.dto.response.NeedsAttentionItemDTO> closingSoonItems = new ArrayList<>();
        for (Job job : jobs) {
            if (!Boolean.TRUE.equals(job.getIsActive()) || Boolean.TRUE.equals(job.getIsDraft())) continue;
            if (job.getApplicationDeadline() == null) continue;
            if (job.getApplicationDeadline().isBefore(nowUtc) || job.getApplicationDeadline().isAfter(closingWindowEnd)) continue;
            long applied = jobApplicationRepository.countByJobId(job.getId());
            if (applied == 0) continue;
            long advanced = countAdvancedApplications(job.getId());
            double conversion = (double) advanced / applied;
            if (conversion < lowConversionThreshold()) {
                closingSoonItems.add(new com._42students.lms.dto.response.NeedsAttentionItemDTO(job.getId(), job.getJobTitle(), null, null,
                        applied + " applied, only " + Math.round(conversion * 100) + "% advanced — closes "
                                + job.getApplicationDeadline().toLocalDate()));
            }
        }
        Map<String, Object> closingSoonCategory = new HashMap<>();
        closingSoonCategory.put("count", (long) closingSoonItems.size());
        closingSoonCategory.put("items", closingSoonItems.stream().limit(needsAttentionSampleCap()).collect(Collectors.toList()));
        result.put("closingSoonLowConversion", closingSoonCategory);

        return result;
    }

    private long countAdvancedApplications(Integer jobId) {
        TypedQuery<Long> q = entityManager.createQuery(
                "SELECT COUNT(ja) FROM JobApplication ja WHERE ja.job.id = :jobId AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                        "AND ja.applicationStatus IN ('SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'WAITLISTED', 'OFFERED', 'HIRED')",
                Long.class);
        q.setParameter("jobId", jobId);
        return q.getSingleResult();
    }

    private Map<String, Object> emptyAttentionCategory() {
        Map<String, Object> m = new HashMap<>();
        m.put("count", 0L);
        m.put("items", new ArrayList<>());
        return m;
    }

    private Map<String, Object> buildAttentionCategory(String jpql, Map<String, Object> params,
                                                         java.util.function.Function<JobApplication, String> detailFn) {
        long total = countAttention(jpql, params);

        TypedQuery<JobApplication> dataQuery = entityManager.createQuery(jpql, JobApplication.class);
        params.forEach(dataQuery::setParameter);
        dataQuery.setMaxResults(needsAttentionSampleCap());
        List<com._42students.lms.dto.response.NeedsAttentionItemDTO> items = dataQuery.getResultList().stream()
                .map(app -> new com._42students.lms.dto.response.NeedsAttentionItemDTO(
                        app.getJob() != null ? app.getJob().getId() : null,
                        app.getJob() != null ? app.getJob().getJobTitle() : null,
                        app.getId(),
                        app.getLearner() != null ? (app.getLearner().getFirstName() + " " + app.getLearner().getLastName()) : null,
                        detailFn.apply(app)))
                .collect(Collectors.toList());

        Map<String, Object> category = new HashMap<>();
        category.put("count", total);
        category.put("items", items);
        return category;
    }

    private long countAttention(String selectJpql, Map<String, Object> params) {
        String countJpql = selectJpql
                .replaceFirst("^SELECT ja FROM JobApplication ja LEFT JOIN FETCH ja\\.job LEFT JOIN FETCH ja\\.learner",
                        "SELECT COUNT(ja) FROM JobApplication ja")
                .replaceAll(" ORDER BY.*$", "");
        TypedQuery<Long> q = entityManager.createQuery(countJpql, Long.class);
        params.forEach(q::setParameter);
        return q.getSingleResult();
    }

    private String daysAgoDetail(java.time.LocalDateTime since, java.time.LocalDateTime now, String label) {
        if (since == null) return label;
        long days = java.time.Duration.between(since, now).toDays();
        return label + " " + days + "d ago";
    }

    @Override
    public List<com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO> getStudentPlacementSummary(Integer learnerId, Integer collegeId) {
        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        if (learner.getCollegeId() == null || !learner.getCollegeId().equals(collegeId)) {
            throw new IllegalArgumentException("Student does not belong to the specified college");
        }
        if (jobService == null) {
            throw new IllegalStateException("Placement summary is temporarily unavailable");
        }
        return jobService.getLearnerApplicationsWithInterviews(learnerId);
    }

    private static final DateTimeFormatter CSV_DATE = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // A user-supplied search term is wrapped in %...% and bound as a JPQL LIKE parameter. LIKE
    // treats %, _, and the escape character itself as wildcards even when the value is bound as a
    // parameter (parameter binding only prevents SQL/JPQL injection, not LIKE-wildcard semantics),
    // so a search term containing them (e.g. "50%" or "a_b") would match far more broadly than the
    // literal text the caller typed. Escape those three characters and pair with ESCAPE '\' on the
    // LIKE clause so the search term is always matched literally.
    private static String escapeLikeWildcards(String value) {
        if (value == null) return value;
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        // CWE-1236 CSV formula-injection guard: a value starting with =, +, -, @, a tab, or a
        // carriage return can be interpreted as a formula by Excel/Sheets/LibreOffice when the
        // exported CSV is opened. Prefix with a single quote to force it to be read as text.
        if (!value.isEmpty()) {
            char first = value.charAt(0);
            if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
                value = "'" + value;
            }
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @Override
    public byte[] exportApplicationsAsCsv(Integer jobId, Integer collegeId, String applicationStatus, String source,
                                           Integer departmentId, Integer programId, Integer batchId, String search) {
        // Previously always exported every application regardless of what the admin had
        // filtered/searched for on screen, with no indication the export scope differed from
        // the visible table — now applies the same filters the table itself uses. Always routed
        // through the SQL-paginated method (not the raw unbounded getJobApplications) with a
        // hard cap, so this can no longer load an unlimited number of rows into memory —
        // generous enough for any single job's realistic applicant count, but bounded.
        final int EXPORT_ROW_CAP = 20000;
        Page<JobApplication> page = getJobApplicationsPaginated(jobId, collegeId,
                org.springframework.data.domain.PageRequest.of(0, EXPORT_ROW_CAP),
                applicationStatus, null, null, null, null, source, departmentId, programId, batchId, search);
        List<JobApplication> applications = page.getContent();
        boolean truncated = page.getTotalElements() > EXPORT_ROW_CAP;
        StringBuilder sb = new StringBuilder();
        // screeningScore/isPartialScore are populated by getJobApplicationsPaginated (via
        // placementJobService.attachScreeningScores) using the SAME job/org/version-scoped
        // subquery the on-screen paginated table uses — so the value exported here is guaranteed
        // to match what was visible in the UI when the export was triggered. Previously the CSV
        // omitted this column entirely even though it's a column in the on-screen table (checklist
        // item 205: "CSV export content matches on-screen data").
        sb.append("applicationId,jobId,jobTitle,companyName,learnerId,firstName,lastName,email,applicationStatus,screeningScore,isPartialScore,appliedAt,source,internalNotes,rejectionReason\n");
        for (JobApplication a : applications) {
            Job j = a.getJob();
            Learner l = a.getLearner();
            sb.append(a.getId()).append(",");
            sb.append(j != null ? j.getId() : "").append(",");
            sb.append(escapeCsv(j != null ? j.getJobTitle() : "")).append(",");
            sb.append(escapeCsv(j != null ? j.getCompanyName() : "")).append(",");
            sb.append(l != null ? l.getId() : "").append(",");
            sb.append(escapeCsv(l != null ? l.getFirstName() : "")).append(",");
            sb.append(escapeCsv(l != null ? l.getLastName() : "")).append(",");
            sb.append(escapeCsv(l != null ? l.getContactMail() : "")).append(",");
            sb.append(escapeCsv(a.getApplicationStatus())).append(",");
            sb.append(a.getScreeningScore() != null ? a.getScreeningScore() : "").append(",");
            sb.append(Boolean.TRUE.equals(a.getIsPartialScore()) ? "true" : "false").append(",");
            sb.append(a.getAppliedAt() != null ? a.getAppliedAt().format(CSV_DATE) : "").append(",");
            sb.append(escapeCsv(a.getSource())).append(",");
            String notes = a.getInternalNotes();
            if (notes != null && notes.length() > 500) notes = notes.substring(0, 500) + "...";
            sb.append(escapeCsv(notes)).append(",");
            String rej = a.getRejectionReason();
            if (rej != null && rej.length() > 500) rej = rej.substring(0, 500) + "...";
            sb.append(escapeCsv(rej)).append("\n");
        }
        if (truncated) {
            sb.append("# Export truncated at ").append(EXPORT_ROW_CAP).append(" rows (")
              .append(page.getTotalElements()).append(" total match the current filters). Narrow the filters to export the rest.\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<JobApplicationStatusHistory> getApplicationHistory(Integer applicationId, Integer jobId, Integer collegeId) {
        Job job = getJobById(jobId, collegeId, true);
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and ownership-mismatch intentionally throw the exact same
                // message/status — distinguishing "doesn't exist" from "isn't yours" is an IDOR
                // enumeration oracle.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!Objects.equals(application.getJob().getId(), jobId)) {
            throw new IllegalArgumentException("Application not found");
        }
        if (!jobBelongsToCollege(application.getJob(), collegeId)) {
            throw new IllegalArgumentException("Application not found");
        }
        return statusHistoryService != null
                ? statusHistoryService.getHistoryForApplication(applicationId)
                : java.util.Collections.emptyList();
    }

    /**
     * Validate targeting hierarchy - ensure parent-child relationships are correct.
     * Also validates that target entities are not soft-deleted and belong to the job's college.
     *
     * <p>Allowed partial targeting (all optional, but must be consistent when set):
     * <ul>
     *   <li>College-wide: all target fields null</li>
     *   <li>Department-wide: only targetDepartmentId set</li>
     *   <li>Program-wide: targetDepartmentId + targetProgramId</li>
     *   <li>Batch-wide: targetDepartmentId + targetProgramId + targetBatchId</li>
     *   <li>Class-specific: all four target fields (targetClassId implies program/batch match)</li>
     * </ul>
     * When both class and program/batch are set, they must match the class's program and batch.
     */
    private void validateTargetingHierarchy(Job job) {
        // Get college ID from job
        Integer jobCollegeId = job.getCollegeId();
        if (jobCollegeId == null) {
            throw new IllegalArgumentException("Job must have a college ID for targeting validation");
        }

        _Class targetClass = null;
        if (job.getTargetClassId() != null) {
            // If class is specified, validate it exists, is not deleted, and belongs to the program/batch if specified
            targetClass = classRepository.findById(job.getTargetClassId())
                    .orElseThrow(() -> new IllegalArgumentException("Target class not found with ID: " + job.getTargetClassId()));

            // Check if class is soft-deleted
            if (Boolean.TRUE.equals(targetClass.getIsDeleted())) {
                throw new IllegalArgumentException("Target class with ID " + job.getTargetClassId() + " has been deleted");
            }

            if (job.getTargetProgramId() != null && !job.getTargetProgramId().equals(targetClass.getProgramId())) {
                throw new IllegalArgumentException("Target program does not match the class's program");
            }

            if (job.getTargetBatchId() != null && !job.getTargetBatchId().equals(targetClass.getBatchId())) {
                throw new IllegalArgumentException("Target batch does not match the class's batch");
            }
        }

        // Previously this whole block only ran when targetProgramId was ALSO set, so picking
        // only a batch (the normal "target one batch, nothing more specific" case) skipped
        // existence/active-status/ownership validation entirely — a stale, foreign-org, or
        // since-deleted batchId would save and publish with zero error, then silently match
        // zero learners in getEligibleLearners(). Existence/active checks now always run when
        // targetBatchId is set; the program-match check only applies when a program is also given.
        Batch targetBatch = null;
        if (job.getTargetBatchId() != null) {
            targetBatch = batchRepository.findById(job.getTargetBatchId().longValue())
                    .orElseThrow(() -> new IllegalArgumentException("Target batch not found with ID: " + job.getTargetBatchId()));

            // Check if batch is inactive (Batch uses StatusType instead of isDeleted)
            if (targetBatch.getStatus() == com._42students.lms.enums.StatusType.INACTIVE) {
                throw new IllegalArgumentException("Target batch with ID " + job.getTargetBatchId() + " is inactive");
            }

            if (job.getTargetProgramId() != null && !job.getTargetProgramId().equals(targetBatch.getProgramId().intValue())) {
                throw new IllegalArgumentException("Target batch does not belong to the specified program");
            }
        }

        // Same fix as above, one level up: a program-only target (no department picked) used to
        // skip existence/deleted validation entirely.
        if (job.getTargetProgramId() != null) {
            NewProgram program = newProgramRepository.findById(job.getTargetProgramId())
                    .orElseThrow(() -> new IllegalArgumentException("Target program not found with ID: " + job.getTargetProgramId() + ". Program may have been deleted or does not exist."));
            if (Boolean.TRUE.equals(program.getIsDeleted())) {
                log.error("Attempted to use deleted program in job targeting: programId={}, departmentId={}",
                        job.getTargetProgramId(), job.getTargetDepartmentId());
                throw new IllegalArgumentException("Target program with ID: " + job.getTargetProgramId() + " has been deleted.");
            }
            if (job.getTargetDepartmentId() != null && !job.getTargetDepartmentId().equals(program.getDeptId())) {
                throw new IllegalArgumentException("Target program does not belong to the specified department. Program deptId: " + program.getDeptId() + ", specified deptId: " + job.getTargetDepartmentId());
            }
        }

        // Validate department if specified
        if (job.getTargetDepartmentId() != null) {
            Department department = departmentRepository.findById(job.getTargetDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Target department not found with ID: " + job.getTargetDepartmentId()));

            // Check if department is soft-deleted
            if (Boolean.TRUE.equals(department.getIsDeleted())) {
                throw new IllegalArgumentException("Target department with ID " + job.getTargetDepartmentId() + " has been deleted");
            }

            // Validate college-level access: department must belong to the same college as the job
            if (department.getCollegeId() != jobCollegeId.intValue()) {
                throw new IllegalArgumentException(
                    "Target department (ID: " + job.getTargetDepartmentId() +
                    ", College ID: " + department.getCollegeId() +
                    ") does not belong to the same college as the job (College ID: " + jobCollegeId + ")");
            }
        }

        // SECURITY (round 3 audit, item 3): every check above only cross-validates a targeting
        // field against its DIRECT parent, and only when that parent field was ALSO explicitly
        // supplied (e.g. targetProgramId is only checked against a department when
        // targetDepartmentId is also present). The only check that ever verified COLLEGE
        // ownership was the department block just above — which never runs at all if the
        // request sets only targetProgramId, or only targetBatchId, or only targetClassId
        // without also sending targetDepartmentId. That let a caller targeting a job at (say)
        // only targetProgramId=<some other college's program> skip college-scope validation
        // entirely, silently exposing/cross-eligibility-matching a different college's
        // department/program/batch/class against this college's job. Resolve the effective
        // department transitively — class -> program -> department, or batch -> program ->
        // department, or program -> department — whenever it wasn't explicitly given, and
        // enforce the same college-ownership check on it unconditionally.
        if (job.getTargetDepartmentId() == null) {
            Integer effectiveProgramId = job.getTargetProgramId();
            if (effectiveProgramId == null && targetClass != null) {
                effectiveProgramId = targetClass.getProgramId();
            } else if (effectiveProgramId == null && targetBatch != null) {
                effectiveProgramId = targetBatch.getProgramId().intValue();
            }
            if (effectiveProgramId != null) {
                Integer effectiveDepartmentId = newProgramRepository.findById(effectiveProgramId)
                        .map(NewProgram::getDeptId)
                        .orElse(null);
                if (effectiveDepartmentId != null) {
                    Department department = departmentRepository.findById(effectiveDepartmentId)
                            .orElseThrow(() -> new IllegalArgumentException("Target department not found with ID: " + effectiveDepartmentId));
                    if (Boolean.TRUE.equals(department.getIsDeleted())) {
                        throw new IllegalArgumentException("Target department with ID " + effectiveDepartmentId + " has been deleted");
                    }
                    if (department.getCollegeId() != jobCollegeId.intValue()) {
                        throw new IllegalArgumentException(
                            "Target selection (resolved department ID: " + effectiveDepartmentId +
                            ", College ID: " + department.getCollegeId() +
                            ") does not belong to the same college as the job (College ID: " + jobCollegeId + ")");
                    }
                }
            }
        }
    }

    /**
     * Derive applicationDeadline from importantDates: if an entry has label "Application deadline" (case-insensitive),
     * set job.applicationDeadline to that date; otherwise set to null.
     */
    private void deriveApplicationDeadlineFromImportantDates(Job job) {
        Object importantDates = job.getImportantDates();
        if (importantDates == null) {
            job.setApplicationDeadline(null);
            return;
        }
        if (!(importantDates instanceof List)) {
            return;
        }
        List<?> list = (List<?>) importantDates;
        long deadlineLabelCount = list.stream()
                .filter(i -> i instanceof Map)
                .filter(i -> {
                    Object l = ((Map<?, ?>) i).get("label");
                    return l != null && "application deadline".equalsIgnoreCase(l.toString().trim());
                })
                .count();
        if (deadlineLabelCount > 1) {
            log.warn("Job id={} title='{}' has {} 'Application deadline'-labeled importantDates entries — using the first one found",
                    job.getId(), job.getJobTitle(), deadlineLabelCount);
        }
        for (Object item : list) {
            if (!(item instanceof Map)) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) item;
            Object labelObj = map.get("label");
            Object dateObj = map.get("date");
            if (labelObj == null || dateObj == null) continue;
            String label = labelObj.toString().trim();
            if (!"application deadline".equalsIgnoreCase(label)) continue;

            LocalDateTime parsed = PlacementDateTimeUtils.parseUtcDeadline(dateObj);
            if (parsed != null) {
                job.setApplicationDeadline(parsed);
                return;
            }
            log.warn("Could not parse 'Application deadline' importantDates entry for job id={} title='{}': raw value='{}' - applicationDeadline will be left unset (no enforcement)",
                    job.getId(), job.getJobTitle(), dateObj);
        }
        job.setApplicationDeadline(null);
    }

    /**
     * Sanitize job input text fields to prevent XSS and security issues
     */
    private void sanitizeJobInputs(Job job) {
        if (job.getJobDescription() != null) {
            job.setJobDescription(TextSanitizer.sanitizeRichTextAndTruncate(job.getJobDescription(), 5000));
        }

        if (job.getJobResponsibilities() != null) {
            job.setJobResponsibilities(TextSanitizer.sanitizeAndTruncate(job.getJobResponsibilities(), 5000));
        }

        if (job.getJobTitle() != null) {
            job.setJobTitle(TextSanitizer.sanitizeAndTruncate(job.getJobTitle(), 100));
        }

        if (job.getCompanyName() != null) {
            job.setCompanyName(TextSanitizer.sanitizeAndTruncate(job.getCompanyName(), 100));
        }

        if (job.getLocation() != null) {
            job.setLocation(TextSanitizer.sanitizeAndTruncate(job.getLocation(), 200));
        }

        if (job.getJobType() != null) {
            job.setJobType(TextSanitizer.sanitizeAndTruncate(job.getJobType(), 50));
        }

        if (job.getCtcRange() != null) {
            job.setCtcRange(TextSanitizer.sanitizeAndTruncate(job.getCtcRange(), 50));
        }

        // Round 2 fix: importantDates previously had zero structural/size validation and its
        // label text was stored+returned to learners unsanitized. See TextSanitizer.sanitizeImportantDates.
        if (job.getImportantDates() != null) {
            job.setImportantDates(TextSanitizer.sanitizeImportantDates(job.getImportantDates()));
        }

        // Round 3 fix: candidatePreferences is validated for shape/keys/length by
        // EligibilityRulesValidator but was never HTML-escaped, so its free-text values
        // (preferredCity, preferredSkills[], customRules[].label/value, etc.) were stored and
        // shown to learners verbatim - same stored-XSS gap as importantDates before round 2,
        // just never wired into sanitizeJobInputs at all. See TextSanitizer.sanitizeCandidatePreferences.
        if (job.getCandidatePreferences() != null) {
            job.setCandidatePreferences(TextSanitizer.sanitizeCandidatePreferences(job.getCandidatePreferences()));
        }

        // Round 2 fix: evaluationConfig is currently unused by scoring logic but still had no
        // write-side size cap, so an admin could store an arbitrarily large JSON blob in it.
        if (job.getEvaluationConfig() != null) {
            TextSanitizer.enforceJsonSizeLimit(job.getEvaluationConfig(), 20_000, "evaluationConfig");
        }
    }

    @Override
    public Job getJobBySlug(String slug) {
        log.info("Fetching job by slug: {}", slug);
        
        if (slug == null || slug.trim().isEmpty()) {
            throw new IllegalArgumentException("Job slug cannot be null or empty");
        }
        
        Job job = jobRepository.findByJobSlug(slug.trim())
                .orElseThrow(() -> new IllegalArgumentException("Job not found with slug: " + slug));
        
        if (job.getIsDeleted()) {
            throw new IllegalArgumentException("Job has been deleted");
        }
        
        // Check if job is expired
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Job application deadline has passed");
        }
        
        // Check if job is active
        if (!Boolean.TRUE.equals(job.getIsActive())) {
            throw new IllegalArgumentException("Job is not active");
        }

        // SECURITY: INTERNAL_ONLY jobs must not be exposed via public slug
        String visibilityType = job.getVisibilityType();
        if (visibilityType != null && "INTERNAL_ONLY".equals(visibilityType.trim())) {
            throw new IllegalArgumentException("The requested job is not available");
        }

        log.info("Job found with slug: {} (ID: {})", slug, job.getId());
        return job;
    }



    @Override
    public Map<String, Object> getHiringMetrics(Integer jobId, Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                               Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        List<Job> jobs = resolveJobsForMetrics(jobId, collegeId);
        if (jobs.isEmpty()) {
            return buildEmptyMetrics();
        }
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        // Previously loaded every application across every job in the college into Java and
        // counted each status with a separate .stream().filter().count() pass — with a college
        // running dozens of jobs across a placement season that's tens of thousands of rows
        // streamed repeatedly on every dashboard load and every filter change. GROUP BY does the
        // counting in the database instead.
        String where = buildMetricsWhereClause(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, classId);
        Map<String, Object> params = buildMetricsParams(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, classId);

        String countJpql = "SELECT ja.applicationStatus, COUNT(ja) FROM JobApplication ja LEFT JOIN ja.learner l WHERE " + where
                + " GROUP BY ja.applicationStatus";
        TypedQuery<Object[]> countQuery = entityManager.createQuery(countJpql, Object[].class);
        params.forEach(countQuery::setParameter);

        Map<String, Object> metrics = buildEmptyMetrics();
        long total = 0L;
        for (Object[] row : countQuery.getResultList()) {
            String status = String.valueOf(row[0]).toLowerCase(java.util.Locale.ROOT);
            long count = (Long) row[1];
            metrics.put(status, count);
            total += count;
        }
        metrics.put("totalApplications", total);

        // Average time-to-first-shortlist, computed entirely in SQL via a correlated subquery
        // (MIN changedAt per application) — the old approach pulled every matching application's
        // id into a Java list and built a literal SQL "IN (id1, id2, ..., idN)" clause, which for
        // a whole-college metrics call (no jobId) could mean tens of thousands of ids in one
        // query string, close to breaking on packet-size limits alone.
        //
        // Native SQL, not JPQL: Hibernate 5's HQL AVG() can't determine the JDBC type of a
        // generic FUNCTION('TIMESTAMPDIFF', ...) call's result (it's a passthrough with no
        // registered return type), which throws a NullPointerException at query-parse time
        // ("Cannot invoke Type.sqlTypes(...) because firstArgumentType is null") the moment this
        // runs with an all-filters-null call — every real request hit this. TIMESTAMPDIFF is
        // MySQL-specific here anyway, so native SQL sidesteps the type-inference path entirely.
        String avgSql = "SELECT AVG(TIMESTAMPDIFF(SECOND, ja.applied_at, " +
                "(SELECT MIN(h.changed_at) FROM job_application_status_history h WHERE h.application_id = ja.id AND h.new_status = 'SHORTLISTED'))) " +
                "FROM job_application ja LEFT JOIN learner l ON l.id = ja.learner_id WHERE " + buildMetricsWhereClauseNative(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, classId) +
                " AND EXISTS (SELECT 1 FROM job_application_status_history h2 WHERE h2.application_id = ja.id AND h2.new_status = 'SHORTLISTED')";
        javax.persistence.Query avgQuery = entityManager.createNativeQuery(avgSql);
        params.forEach(avgQuery::setParameter);
        Object avgResult = avgQuery.getSingleResult();
        if (avgResult != null) {
            double avgSeconds = ((Number) avgResult).doubleValue();
            metrics.put("avgTimeToShortlistMs", Math.round(avgSeconds * 1000));
        }

        return metrics;
    }

    private String buildMetricsWhereClauseNative(List<Integer> jobIds, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                  Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        StringBuilder where = new StringBuilder("ja.job_id IN (:jobIds) AND (ja.is_deleted = false OR ja.is_deleted IS NULL)");
        if (appliedAfter != null) where.append(" AND ja.applied_at >= :appliedAfter");
        if (appliedBefore != null) where.append(" AND ja.applied_at <= :appliedBefore");
        if (classId != null) {
            where.append(" AND l.class_id = :classId");
        } else if (batchId != null) {
            where.append(" AND l.class_id IN (SELECT c.id FROM class c WHERE c.batch_id = :batchId AND (c.is_deleted = false OR c.is_deleted IS NULL))");
        }
        if (programId != null) {
            where.append(" AND l.program_id = :programId");
        } else if (departmentId != null) {
            where.append(" AND l.program_id IN (SELECT p.id FROM new_program p WHERE p.dept_id = :departmentId AND (p.is_deleted = false OR p.is_deleted IS NULL))");
        }
        return where.toString();
    }

    private String buildMetricsWhereClause(List<Integer> jobIds, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                            Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        StringBuilder where = new StringBuilder("ja.job.id IN :jobIds AND (ja.isDeleted = false OR ja.isDeleted IS NULL)");
        if (appliedAfter != null) where.append(" AND ja.appliedAt >= :appliedAfter");
        if (appliedBefore != null) where.append(" AND ja.appliedAt <= :appliedBefore");
        if (classId != null) {
            where.append(" AND l.classId = :classId");
        } else if (batchId != null) {
            where.append(" AND l.classId IN (SELECT c.id FROM _Class c WHERE c.batchId = :batchId AND (c.isDeleted = false OR c.isDeleted IS NULL))");
        }
        if (programId != null) {
            where.append(" AND l.programId = :programId");
        } else if (departmentId != null) {
            where.append(" AND l.programId IN (SELECT p.id FROM NewProgram p WHERE p.deptId = :departmentId AND (p.isDeleted = false OR p.isDeleted IS NULL))");
        }
        return where.toString();
    }

    private Map<String, Object> buildMetricsParams(List<Integer> jobIds, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                     Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        Map<String, Object> params = new HashMap<>();
        params.put("jobIds", jobIds);
        if (appliedAfter != null) params.put("appliedAfter", appliedAfter);
        if (appliedBefore != null) params.put("appliedBefore", appliedBefore);
        if (classId != null) params.put("classId", classId);
        else if (batchId != null) params.put("batchId", batchId);
        if (programId != null) params.put("programId", programId);
        else if (departmentId != null) params.put("departmentId", departmentId);
        return params;
    }

    @Override
    public List<Map<String, Object>> getHiringFunnel(Integer jobId, Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                     Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        String[] stages = {"APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED"};
        List<Job> jobs = resolveJobsForMetrics(jobId, collegeId);
        if (jobs.isEmpty()) {
            return buildEmptyFunnel(stages);
        }
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());

        // TRUE funnel semantics: cumulative "how many applications EVER reached stage X",
        // computed from JobApplicationStatusHistory. This is deliberately different from
        // getHiringMetrics's snapshot (GROUP BY current applicationStatus) — an application
        // that reached INTERVIEW and was later REJECTED must still count in the INTERVIEW
        // bucket here, even though the snapshot metrics bucket it under "rejected" only.
        // Previously this method just relabelled getHiringMetrics's current-status counts as
        // "funnel" stages, which is a plain snapshot in disguise: it produces a non-monotonic,
        // nonsensical funnel shape (a later stage can show MORE applications than an earlier
        // one, since each bucket only holds whoever is CURRENTLY sitting there) and drives
        // wildly wrong stage-to-stage conversion percentages on the dashboard.
        //
        // APPLIED needs no history lookup — every application starts there, so it's just the
        // total count of matching applications.
        String whereNative = buildMetricsWhereClauseNative(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, classId);
        String sql = "SELECT COUNT(*) AS applied, " + reachedStageSql("SHORTLISTED") + " AS shortlisted, "
                + reachedStageSql("ASSESSMENT") + " AS assessment, " + reachedStageSql("INTERVIEW") + " AS interview, "
                + reachedStageSql("OFFERED") + " AS offered, " + reachedStageSql("HIRED") + " AS hired "
                + "FROM job_application ja LEFT JOIN learner l ON l.id = ja.learner_id WHERE " + whereNative;
        javax.persistence.Query query = entityManager.createNativeQuery(sql);
        buildMetricsParams(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, classId).forEach(query::setParameter);
        Object[] row = (Object[]) query.getSingleResult();

        List<Map<String, Object>> funnel = new ArrayList<>();
        for (int i = 0; i < stages.length; i++) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("stage", stages[i]);
            entry.put("count", row[i] != null ? ((Number) row[i]).longValue() : 0L);
            funnel.add(entry);
        }
        return funnel;
    }

    private static String reachedStageSql(String stage) {
        return "SUM(CASE WHEN ja.application_status = '" + stage + "' OR EXISTS (SELECT 1 FROM job_application_status_history h "
                + "WHERE h.application_id = ja.id AND h.new_status = '" + stage + "') THEN 1 ELSE 0 END)";
    }

    private List<Map<String, Object>> buildEmptyFunnel(String[] stages) {
        List<Map<String, Object>> funnel = new ArrayList<>();
        for (String stage : stages) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("stage", stage);
            entry.put("count", 0L);
            funnel.add(entry);
        }
        return funnel;
    }

    @Override
    public List<Map<String, Object>> getCompanyWiseHiringReport(Integer collegeId, LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                                 Integer departmentId, Integer programId, Integer batchId) {
        List<Job> jobs = resolveJobsForMetrics(null, collegeId);
        if (jobs.isEmpty()) {
            return new ArrayList<>();
        }
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        // Previously loaded every application across every job into Java and ran 7
        // .stream().filter().count() passes PER JOB (200 jobs = 1,400 full passes over the
        // grouped list) — a single GROUP BY (job, status) query does all of this counting in
        // the database in one round trip.
        String where = buildMetricsWhereClause(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, null);
        Map<String, Object> params = buildMetricsParams(jobIds, appliedAfter, appliedBefore, departmentId, programId, batchId, null);
        String countJpql = "SELECT ja.job.id, ja.applicationStatus, COUNT(ja) FROM JobApplication ja LEFT JOIN ja.learner l WHERE " + where
                + " GROUP BY ja.job.id, ja.applicationStatus";
        TypedQuery<Object[]> countQuery = entityManager.createQuery(countJpql, Object[].class);
        params.forEach(countQuery::setParameter);

        Map<Integer, Map<String, Long>> countsByJob = new HashMap<>();
        for (Object[] row : countQuery.getResultList()) {
            Integer rowJobId = (Integer) row[0];
            String status = String.valueOf(row[1]).toLowerCase(java.util.Locale.ROOT);
            long count = (Long) row[2];
            countsByJob.computeIfAbsent(rowJobId, k -> new HashMap<>()).put(status, count);
        }

        List<Map<String, Object>> report = new ArrayList<>();
        for (Job job : jobs) {
            Map<String, Long> jobCounts = countsByJob.get(job.getId());
            if (jobCounts == null || jobCounts.isEmpty()) continue;
            Map<String, Object> row = new HashMap<>();
            row.put("companyName", job.getCompanyName() != null ? job.getCompanyName() : "");
            row.put("jobId", job.getId());
            row.put("jobTitle", job.getJobTitle() != null ? job.getJobTitle() : "");
            for (String status : new String[]{"applied", "shortlisted", "assessment", "interview", "offered", "hired", "rejected"}) {
                row.put(status, jobCounts.getOrDefault(status, 0L));
            }
            report.add(row);
        }
        report.sort((a, b) -> {
            String c1 = (String) a.get("companyName");
            String c2 = (String) b.get("companyName");
            int cmp = (c1 != null ? c1 : "").compareToIgnoreCase(c2 != null ? c2 : "");
            if (cmp != 0) return cmp;
            return ((Number) a.get("jobId")).intValue() - ((Number) b.get("jobId")).intValue();
        });
        // The report is named "company-wise" but previously produced one disconnected row per
        // job — a company running two concurrent drives never got a rolled-up total. Insert a
        // combined total row ahead of each company's job rows whenever it ran more than one.
        //
        // ROUND 2 AUDIT FIX: the grouping key must match case-/whitespace-insensitively, not via
        // exact String equality. A companyId-linked job's companyName is always the exact
        // canonical Company.name (applyCompanyLink keeps it in sync), but a free-text job's
        // companyName is whatever an admin typed and is never normalized (sanitizeJobInputs
        // HTML-escapes it but does not trim/case-fold). The sort just above already treats names
        // case-insensitively (compareToIgnoreCase), so "Acme Corp" (linked) and "acme corp " /
        // "ACME CORP" (free-text, same real company, no companyId link — exactly the scenario the
        // Company<->Job architecture allows to coexist) sort next to each other but previously fell
        // into two different groupingBy buckets under exact-match keys, splitting one company into
        // two disconnected report rows with no rollup total for either.
        Map<String, List<Map<String, Object>>> byCompany = report.stream()
                .collect(Collectors.groupingBy(r -> String.valueOf(r.get("companyName")).trim().toLowerCase(java.util.Locale.ROOT),
                        java.util.LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> withTotals = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : byCompany.entrySet()) {
            List<Map<String, Object>> rows = entry.getValue();
            if (rows.size() > 1) {
                Map<String, Object> total = new HashMap<>();
                // entry.getKey() is the normalized (trimmed/lowercased) grouping key, not fit for
                // display — use the first row's original-cased companyName instead.
                total.put("companyName", rows.get(0).get("companyName"));
                total.put("jobId", null);
                total.put("jobTitle", "All " + rows.size() + " roles at this company");
                total.put("isCompanyTotal", true);
                for (String field : new String[]{"applied", "shortlisted", "assessment", "interview", "offered", "hired", "rejected"}) {
                    long sum = rows.stream().mapToLong(r -> ((Number) r.get(field)).longValue()).sum();
                    total.put(field, sum);
                }
                withTotals.add(total);
            }
            withTotals.addAll(rows);
        }
        return withTotals;
    }

    private List<Job> resolveJobsForMetrics(Integer jobId, Integer collegeId) {
        if (jobId != null) {
            Job job = getJobById(jobId, collegeId);
            return java.util.Collections.singletonList(job);
        }
        Integer orgId = collegeRepository.findById(collegeId).map(College::getOrgId).orElse(null);
        List<Job> jobs = orgId != null
                ? jobRepository.findByCollegeIdOrOrg(collegeId, orgId)
                : jobRepository.findByCollegeIdAndIsDeletedFalse(collegeId);
        return jobs.stream().filter(j -> !Boolean.TRUE.equals(j.getIsDeleted())).collect(Collectors.toList());
    }


    private Map<String, Object> buildEmptyMetrics() {
        Map<String, Object> m = new HashMap<>();
        m.put("totalApplications", 0L);
        m.put("applied", 0L);
        m.put("shortlisted", 0L);
        m.put("assessment", 0L);
        m.put("interview", 0L);
        m.put("offered", 0L);
        m.put("rejected", 0L);
        m.put("hired", 0L);
        // FIX (this audit round): WITHDRAWN/WAITLISTED are real, reachable applicationStatus
        // values that getHiringMetrics' GROUP BY loop already folds into totalApplications below —
        // they just had no dedicated key here (or on the frontend), so the dashboard's total
        // silently exceeded the sum of applied+shortlisted+assessment+interview+offered+hired+rejected
        // with no visible line explaining the gap. Defaulting them here (mirrored by the same two
        // fixed 7-card-plus-2 set on the frontend) keeps every counted status visible.
        m.put("withdrawn", 0L);
        m.put("waitlisted", 0L);
        return m;
    }

    @Override
    public Map<String, Object> resolveJobContext(Integer jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with ID: " + jobId));
        if (Boolean.TRUE.equals(job.getIsDeleted())) {
            throw new IllegalArgumentException("Job has been deleted");
        }
        Map<String, Object> context = new HashMap<>();
        Integer cid = job.getCollegeId();
        Integer oid = job.getOrganizationId();
        if (cid != null) {
            context.put("collegeId", cid);
        } else if (oid != null) {
            List<College> colleges = collegeRepository.fetchColleges(oid);
            if (!colleges.isEmpty()) {
                context.put("collegeId", colleges.get(0).getId());
            }
        }
        context.put("organizationId", oid);
        return context;
    }
}

