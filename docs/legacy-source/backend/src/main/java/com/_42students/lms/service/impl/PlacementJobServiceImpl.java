package com._42students.lms.service.impl;

import com._42students.lms.dto.profile.SkillDTO;
import com._42students.lms.event.ApplicationStatusChangedEvent;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.service.PlacementJobService;
import com._42students.lms.util.JobVisibilityCache;
import com._42students.lms.util.TextSanitizer;
import com._42students.lms.util.PlacementDateTimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Organization-scoped placement job and application management.
 * Used from the admin UI and college admin.
 */
@Slf4j
@Service
public class PlacementJobServiceImpl implements PlacementJobService {

    // Self-injected proxy — see the identical field on AdminJobServiceImpl for the full
    // rationale (self-invocation bypasses the transactional proxy entirely).
    @Autowired
    @org.springframework.context.annotation.Lazy
    private PlacementJobService self;

    private static final List<String> VALID_STATUSES = Arrays.asList(
            "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "OFFERED", "REJECTED", "HIRED"
    );

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private ApplicationScreeningRepository screeningRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @PersistenceContext
    private EntityManager entityManager;

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

    @Autowired(required = false)
    private com._42students.lms.repository.InterviewRepository interviewRepository;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService adminAuditLogService;

    // Used only to fire the interview-specific cancellation notification/audit log when this
    // class's cancelNonTerminalInterviewsForApplication[Locked] cascade cancels an interview as a
    // side effect of an admin-driven application status change — see
    // InterviewService.notifyInterviewCancelledByCascade's javadoc.
    @Autowired(required = false)
    private com._42students.lms.service.InterviewService interviewService;

    @Autowired(required = false)
    private com._42students.lms.repository.CompanyRepository companyRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.CollegeCompanyRepository collegeCompanyRepository;

    // Shared with AdminJobServiceImpl — see that class for the full rationale.
    @Autowired
    private com._42students.lms.util.JobSlugGenerator jobSlugGenerator;

    // Same as AdminJobServiceImpl.applyCompanyLink, but this surface is org-scoped (not college-scoped).
    private void applyCompanyLink(Job job, Integer organizationId) {
        if (job.getCompanyId() == null || companyRepository == null) return;
        // findById().ifPresent(...) used to silently no-op when companyId didn't match any row,
        // leaving the job saved with a dangling companyId and whatever companyName/companyLogo
        // happened to be in the request (often null) — the one case this method didn't reject
        // even though every other invalid-link case (deleted company, wrong organization) does.
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
        // Companies are shared (recruiter phase 1, V202): this surface is org-scoped, so the job's own college must have the
        // company in its list, or (a job with no college) some college of this organization must.
        boolean belongs = collegeCompanyRepository != null && (job.getCollegeId() != null
                ? collegeCompanyRepository.findByCollegeIdAndCompanyId(job.getCollegeId(), company.getId()).map(l -> !Boolean.TRUE.equals(l.getIsDeleted())).orElse(false)
                : collegeCompanyRepository.isListedInOrganization(organizationId, company.getId()));
        if (!belongs) {
            throw new IllegalArgumentException("Company does not belong to the specified organization");
        }
        job.setCompanyName(company.getName());
        job.setCompanyLogo(company.getLogoUrl());
    }

    // Candidate previously got no interview-specific notification for this cascade path — only
    // the (already-dispatched-elsewhere via sendJobApplicationStatusNotifications) application-level
    // status-change notification, which does not necessarily mention that their specific scheduled
    // interview was cancelled. See InterviewService.notifyInterviewCancelledByCascade's javadoc.
    // Deferred to after-commit, mirroring sendJobApplicationStatusNotifications below, so it never
    // fires for a cancellation that ends up rolled back.
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

    // Same as AdminJobServiceImpl's identical private method — rejecting/reverting an
    // application here previously left any already-SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED
    // interview dangling: still bookable/confirmable via confirmInterview (which only checks the
    // interview's own status, never the parent application's) for a candidate no longer active
    // at that stage. This entire cascade was simply missing from the org-scoped path.
    //
    // CONCURRENCY FIX (round 4 audit; also used by updateApplicationStatus's REJECTED/
    // leaving-interview-stage cascade as of self-review round 3): a plain (non-locking) lookup
    // of this application's interviews is snapshot-bound under REPEATABLE READ and can miss an
    // interview a concurrent scheduleInterview call just committed for this same application —
    // see InterviewRepository.findNonTerminalByJobApplicationIdForUpdate. This is the exact same
    // gap self-review round 2 (aca46a4) found and fixed for InterviewServiceImpl's REJECT-
    // feedback cascade; this class's updateApplicationStatus cascade had the identical gap and
    // was simply missed by that pass. Caller must already hold a pessimistic lock on the
    // JobApplication row (via findByIdForUpdate) before calling this if it isn't the same row
    // already under a transactional write here, to keep lock order Application-then-Interview
    // and avoid a cross-table deadlock with scheduleInterview.
    private void cancelNonTerminalInterviewsForApplicationLocked(JobApplication application) {
        if (interviewRepository == null) return;
        for (com._42students.lms.model.Interview interview : interviewRepository.findNonTerminalByJobApplicationIdForUpdate(application.getId())) {
            String previousStatus = interview.getInterviewStatus();
            interview.setInterviewStatus("CANCELLED");
            interviewRepository.save(interview);
            notifyInterviewCascadeCancelledAfterCommit(interview.getId(), previousStatus);
        }
    }

    @Override
    public List<Job> getJobsForOrganization(Integer organizationId) {
        // Was findAllActiveJobsByOrganization, which silently excluded draft and closed jobs with
        // no filtered/paginated alternative anywhere on this surface — an org-level admin had no
        // way to see draft or closed jobs through this API at all, despite the controller's doc
        // string claiming this "Returns all jobs for the admin's organization". No caller (backend
        // or frontend) relies on this being active-only: the frontend's getJobsForOrganization()
        // wrapper (src/api/Services/placementJobService.js) is currently unused/unwired, so
        // broadening this existing endpoint is safe rather than adding a parallel one.
        List<Job> jobs = jobRepository.findAllJobsByOrganization(organizationId);
        if (jobs.isEmpty()) return jobs;

        List<Integer> jobIds = jobs.stream().map(Job::getId).filter(Objects::nonNull).collect(Collectors.toList());
        if (jobIds.isEmpty()) return jobs;

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
        return jobs;
    }

    @Override
    public Job getJobById(Integer jobId, Integer organizationId) {
        return jobRepository.findByIdAndOrganization(jobId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Job not found or does not belong to your organization: " + jobId));
    }

    // For the applications-viewing endpoints — a soft-deleted job shouldn't strand an admin's
    // access to its applications (item 210). Job-level mutation still goes through the strict
    // getJobById overload above.
    private Job getJobByIdIncludeDeleted(Integer jobId, Integer organizationId) {
        return jobRepository.findByIdAndOrganizationIncludeDeleted(jobId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Job not found or does not belong to your organization: " + jobId));
    }

    @Override
    @Transactional
    public Job createJob(Job job, Integer organizationId, Integer createdBy) {
        log.info("Creating job for organization {} by user {}", organizationId, createdBy);

        sanitizeJobInputs(job);

        // A client-supplied non-zero id makes JPA's isNew() check treat this as an existing
        // row and merge() into it instead of inserting a new one, silently overwriting whatever
        // row already has that id (possibly belonging to a different organization).
        job.setId(0);
        // isNew() for a @Version-annotated entity actually checks version == null, not id — a
        // client-supplied non-null version would still route this through merge() even with
        // id reset above, defeating the protection.
        job.setVersion(null);
        job.setOrganizationId(organizationId);
        job.setCreatedBy(createdBy);
        job.setIsDeleted(false);
        // AdminJobServiceImpl.createJob couples these (isActive = !isDraft); this surface
        // unconditionally forced isActive=true and never read/coupled isDraft at all — a raw
        // request body with "isDraft": true would persist that flag while isActive was still
        // forced true, an inconsistent state reachable at CREATE time, not just via a partial
        // update payload.
        boolean asDraft = Boolean.TRUE.equals(job.getIsDraft());
        job.setIsDraft(asDraft);
        job.setIsActive(!asDraft);

        if (job.getScreeningVersion() == null || job.getScreeningVersion().trim().isEmpty()) {
            job.setScreeningVersion("v1");
        }

        // Always server-set on create, matching AdminJobServiceImpl.createJob — postedDate drives
        // listing sort order, so a client-supplied value (past or future) must never be trusted here.
        job.setPostedDate(LocalDateTime.now());

        // deriveApplicationDeadlineFromImportantDates's "importantDates == null -> preserve
        // existing deadline" branch is correct for a partial UPDATE, but on CREATE there is no
        // existing row — "preserve" instead means "keep whatever raw applicationDeadline value
        // the client bound directly onto this freshly-deserialized entity," bypassing the
        // "Application deadline"-labeled importantDates entry entirely and letting a client set
        // an arbitrary (or unvalidated-for-derivation) deadline via the raw JSON field. Clear it
        // first so a create with no matching importantDates entry always ends up null, matching
        // AdminJobServiceImpl.createJob's semantics.
        job.setApplicationDeadline(null);
        deriveApplicationDeadlineFromImportantDates(job);
        // AdminJobServiceImpl (college-scoped) already rejected past deadlines here; this
        // sibling org-scoped path never got the same fix, so a job could publish permanently
        // un-applyable with no server-side signal to the admin who created it.
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Application deadline cannot be in the past");
        }
        // assessmentDeadline had no validation at all on this surface (unlike
        // AdminJobServiceImpl.createJob) — not in the past, and must be after the application
        // deadline if both are set.
        if (job.getAssessmentDeadline() != null) {
            LocalDateTime ad = job.getAssessmentDeadline();
            if (ad.isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
                throw new IllegalArgumentException("Assessment deadline cannot be in the past");
            }
            if (job.getApplicationDeadline() != null && ad.isBefore(job.getApplicationDeadline())) {
                throw new IllegalArgumentException("Assessment deadline must be after application deadline");
            }
        }

        // assessmentUrl had no validation at all on this surface (unlike AdminJobServiceImpl.createJob
        // and both services' updateJob methods).
        if (job.getAssessmentUrl() != null && !job.getAssessmentUrl().trim().isEmpty()) {
            String url = job.getAssessmentUrl().trim();
            if (url.length() > 2048) {
                throw new IllegalArgumentException("Assessment URL must be at most 2048 characters");
            }
            if (!url.matches("^https?://.+")) {
                throw new IllegalArgumentException("Assessment URL must be a valid http or https link");
            }
            job.setAssessmentUrl(url);
        }

        // This surface never handled visibilityType/jobSlug/EXTERNAL_ONLY targeting-clearing at
        // all (unlike AdminJobServiceImpl.createJob) — a raw request body's visibilityType was
        // bound directly onto the entity with no validation, no slug generated for HYBRID/
        // EXTERNAL_ONLY jobs, and targeting fields left intact for EXTERNAL_ONLY jobs.
        if (job.getVisibilityType() == null || job.getVisibilityType().trim().isEmpty()) {
            job.setVisibilityType("INTERNAL_ONLY");
        }

        String visibilityType = job.getVisibilityType();
        if (!"INTERNAL_ONLY".equals(visibilityType)
                && !"HYBRID".equals(visibilityType)
                && !"EXTERNAL_ONLY".equals(visibilityType)) {
            throw new IllegalArgumentException("Invalid visibility type: " + visibilityType + ". Must be INTERNAL_ONLY, HYBRID, or EXTERNAL_ONLY");
        }

        if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
            if (job.getJobSlug() == null || job.getJobSlug().trim().isEmpty()) {
                String slug;
                int attempts = 0;
                do {
                    slug = jobSlugGenerator.generateSlug();
                    attempts++;
                } while (jobRepository.existsByJobSlug(slug) && attempts < 50);

                if (attempts >= 50) {
                    log.error("Job slug collision: failed to generate unique slug after 50 attempts for job title: {}", job.getJobTitle());
                    throw new IllegalArgumentException("Unable to generate a unique external link for this job. Please try again or contact support.");
                }
                job.setJobSlug(slug);
                log.info("Generated job slug: {} for job: {}", slug, job.getJobTitle());
            }
        }

        if ("EXTERNAL_ONLY".equals(visibilityType)) {
            if (job.getTargetDepartmentId() != null || job.getTargetProgramId() != null ||
                job.getTargetBatchId() != null || job.getTargetClassId() != null) {
                throw new IllegalArgumentException("EXTERNAL_ONLY jobs cannot have targeting fields. All targeting fields must be null.");
            }
            job.setTargetDepartmentId(null);
            job.setTargetProgramId(null);
            job.setTargetBatchId(null);
            job.setTargetClassId(null);
        }

        validateTargetingHierarchy(job);
        applyCompanyLink(job, organizationId);

        Job saved = jobRepository.save(job);
        invalidateJobCaches(saved.getOrganizationId());
        return saved;
    }

    @Override
    @Transactional
    public Job updateJob(Integer jobId, Job job, Integer organizationId) {
        log.info("Updating job {} for organization {}", jobId, organizationId);

        Job existingJob = getJobById(jobId, organizationId);

        if (job.getVersion() != null && !job.getVersion().equals(existingJob.getVersion())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "This job was updated by someone else. Please refresh and try again.");
        }

        if (job.getJobTitle() != null) existingJob.setJobTitle(job.getJobTitle());
        // companyId links this job to a reusable Company record; applyCompanyLink below (after
        // validation) re-syncs companyName/companyLogo from that record whenever the link is
        // (re)established — matching AdminJobServiceImpl.updateJob's handling.
        // companyIdChanged is tracked so applyCompanyLink only runs when the admin is actually
        // changing/setting the company link, not on every unrelated field edit — otherwise a job
        // whose already-linked Company was later soft-deleted would fail to save on ANY edit.
        boolean companyIdChanged = !Objects.equals(existingJob.getCompanyId(), job.getCompanyId());
        if (companyIdChanged) {
            existingJob.setCompanyId(job.getCompanyId());
        }
        // Company is the source of truth for companyName/companyLogo once a job is linked. Raw
        // companyName/companyLogo sent alongside a companyId used to be applied directly here
        // regardless of whether the link changed, so an admin could silently edit a LINKED job's
        // name and have it never re-sync (applyCompanyLink only fires when companyId itself
        // changes), permanently diverging that job from its own Company's actual name. Only
        // honor direct edits for unlinked (free-text) jobs.
        if (existingJob.getCompanyId() == null) {
            if (job.getCompanyName() != null) existingJob.setCompanyName(job.getCompanyName());
            if (job.getCompanyLogo() != null) existingJob.setCompanyLogo(job.getCompanyLogo());
        }
        if (job.getJobDescription() != null) existingJob.setJobDescription(job.getJobDescription());
        if (job.getJobType() != null) existingJob.setJobType(job.getJobType());
        if (job.getLocation() != null) existingJob.setLocation(job.getLocation());
        if (job.getCtcRange() != null) existingJob.setCtcRange(job.getCtcRange());
        if (job.getJobResponsibilities() != null) existingJob.setJobResponsibilities(job.getJobResponsibilities());
        // Same fix as AdminJobServiceImpl.updateJob — the screeningVersion lock below only
        // guarded the version label, not the actual criteria data, making its "prevents
        // mixed-logic scoring" guarantee illusory.
        if (job.getCandidatePreferences() != null && !job.getCandidatePreferences().equals(existingJob.getCandidatePreferences())) {
            long applicationCount = jobApplicationRepository.findByJobIdAndOrganization(jobId, organizationId).stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .count();
            if (applicationCount > 0) {
                throw new IllegalArgumentException("Cannot change eligibility/matching preferences: this job already has " + applicationCount + " application(s) scored against the current criteria. Create a new drive instead.");
            }
            existingJob.setCandidatePreferences(job.getCandidatePreferences());
        }
        if (job.getEvaluationConfig() != null) existingJob.setEvaluationConfig(job.getEvaluationConfig());
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
        // Copy the raw importantDates onto existingJob now, but defer deriving
        // applicationDeadline from it (deriveApplicationDeadlineFromImportantDates, called below)
        // until after sanitizeJobInputs has run.
        if (job.getImportantDates() != null) {
            existingJob.setImportantDates(job.getImportantDates());
        }

        // LOG-INJECTION FIX (round 4 audit, stress-test of the existing HTML-escaping fixes):
        // sanitizeJobInputs used to run at the very end of this method, but the slug-generation
        // log.info/log.error further down logs existingJob.getJobTitle() — which by that point
        // still held the RAW, un-sanitized client value copied in above (line ~378), not the
        // escaped one. HTML-escaping never neutralizes newlines anyway, so this was reachable
        // even after the round-2/3 escaping fixes: a jobTitle containing embedded "\n" plus
        // forged text (e.g. a fake "ERROR: security breach" line) would be written verbatim into
        // the log stream by the slug-collision log lines below, before sanitizeJobInputs ever
        // touched the field. Moved up to run immediately after all client-supplied text fields
        // (including importantDates/candidatePreferences, copied above) have been applied to
        // existingJob, so every log statement from here on only ever sees the sanitized value.
        // See TextSanitizer.sanitizeAndTruncate / sanitizeJobInputs.
        //
        // ROUND 5 FOLLOW-UP: deriveApplicationDeadlineFromImportantDates (called right below) can
        // itself log.warn() the job's title and the raw importantDates label/date values (the
        // "multiple Application deadline entries" and "unparseable date" warnings further down in
        // that helper). It used to run further below in this method — before this call — which
        // reopened the same before-sanitization log-injection shape the fix above closed for the
        // slug-collision logs, just via this helper instead. Moved sanitizeJobInputs up to right
        // after importantDates is copied on above (candidatePreferences/evaluationConfig/other
        // text fields are already copied on by this point too), so deriveApplicationDeadlineFromImportantDates
        // now only ever runs against sanitized values.
        sanitizeJobInputs(existingJob);

        if (job.getImportantDates() != null) {
            deriveApplicationDeadlineFromImportantDates(existingJob);
            if (existingJob.getApplicationDeadline() != null && existingJob.getApplicationDeadline().isBefore(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
                throw new IllegalArgumentException("Application deadline cannot be in the past");
            }
        }

        // assessmentDeadline was never read here at all — any value sent through this surface's
        // update endpoint was silently dropped (not validated, not persisted, not rejected).
        // Mirrors AdminJobServiceImpl.updateJob's handling, including "sending null clears it."
        // Checked against the just-updated applicationDeadline above, not the pre-update value.
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

        if (job.getScreeningVersion() != null && !job.getScreeningVersion().trim().isEmpty()) {
            String newVersion = job.getScreeningVersion().trim();
            if (!newVersion.equals(existingJob.getScreeningVersion())) {
                long applicationCount = jobApplicationRepository.findByJobIdAndOrganization(jobId, organizationId).stream()
                    .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                    .count();
                if (applicationCount > 0) {
                    throw new IllegalArgumentException("Cannot change screening version: this job already has " + applicationCount + " application(s). Screening version cannot be updated after the first application.");
                }
                existingJob.setScreeningVersion(newVersion);
            }
        }

        // (sanitizeJobInputs now runs earlier — see the log-injection fix above, right after
        // importantDates is copied onto existingJob.)

        // This surface never handled visibilityType/jobSlug/EXTERNAL_ONLY targeting-clearing at
        // all (unlike AdminJobServiceImpl.updateJobInternal) — visibilityType changes (and the
        // slug generation / targeting-clearing that must accompany a switch to HYBRID or
        // EXTERNAL_ONLY) were silently dropped on this org-scoped path.
        if (job.getVisibilityType() != null) {
            String visibilityType = job.getVisibilityType();
            if (!"INTERNAL_ONLY".equals(visibilityType)
                    && !"HYBRID".equals(visibilityType)
                    && !"EXTERNAL_ONLY".equals(visibilityType)) {
                throw new IllegalArgumentException("Invalid visibility type: " + visibilityType);
            }
            existingJob.setVisibilityType(visibilityType);

            if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
                if (existingJob.getJobSlug() == null || existingJob.getJobSlug().trim().isEmpty()) {
                    String slug;
                    int attempts = 0;
                    do {
                        slug = jobSlugGenerator.generateSlug();
                        attempts++;
                    } while (jobRepository.existsByJobSlug(slug) && attempts < 50);

                    if (attempts >= 50) {
                        log.error("Job slug collision: failed to generate unique slug after 50 attempts for job id: {}", existingJob.getId());
                        throw new IllegalArgumentException("Unable to generate a unique external link for this job. Please try again or contact support.");
                    }
                    existingJob.setJobSlug(slug);
                    log.info("Generated job slug: {} for job: {}", slug, existingJob.getJobTitle());
                }
            }

            if ("EXTERNAL_ONLY".equals(visibilityType)) {
                existingJob.setTargetDepartmentId(null);
                existingJob.setTargetProgramId(null);
                existingJob.setTargetBatchId(null);
                existingJob.setTargetClassId(null);

                if (job.getTargetDepartmentId() != null || job.getTargetProgramId() != null ||
                    job.getTargetBatchId() != null || job.getTargetClassId() != null) {
                    throw new IllegalArgumentException("EXTERNAL_ONLY jobs cannot have targeting fields. All targeting fields must be null.");
                }
            }

            if (("HYBRID".equals(visibilityType) || "EXTERNAL_ONLY".equals(visibilityType))) {
                if (existingJob.getJobSlug() == null || existingJob.getJobSlug().trim().isEmpty()) {
                    throw new IllegalArgumentException(visibilityType + " jobs must have a job slug. Slug generation failed.");
                }
            }
        }

        // Update targeting (only if not EXTERNAL_ONLY) — matches AdminJobServiceImpl.updateJobInternal.
        if (!"EXTERNAL_ONLY".equals(existingJob.getVisibilityType())) {
            existingJob.setTargetDepartmentId(job.getTargetDepartmentId());
            existingJob.setTargetProgramId(job.getTargetProgramId());
            existingJob.setTargetBatchId(job.getTargetBatchId());
            existingJob.setTargetClassId(job.getTargetClassId());
        }
        // Same coupling as AdminJobServiceImpl.updateJob — this surface previously never read
        // isDraft from the payload at all, so a job could only ever be un-drafted here, never
        // re-drafted/deactivated via isDraft=true. Re-couple: isActive=true un-drafts the job;
        // isDraft=true deactivates it (a draft can never be active).
        //
        // BUG FIX (round 22 audit, lifecycle boolean-combination sweep): mirrors the
        // AdminJobServiceImpl.updateJobInternal fix — branching on existingJob's merged
        // post-assignment state made {isDraft: true} alone a silent no-op whenever the job was
        // already active (the stale, untouched existingJob.isActive=true re-triggered the
        // isActive->undraft branch and reverted the explicit isDraft=true right back to false).
        // Branch on what THIS request explicitly sent instead, with isActive:true winning when
        // both are sent true together.
        Boolean incomingIsDraft = job.getIsDraft();
        Boolean incomingIsActive = job.getIsActive();
        if (incomingIsDraft != null) existingJob.setIsDraft(incomingIsDraft);
        if (incomingIsActive != null) existingJob.setIsActive(incomingIsActive);
        if (Boolean.TRUE.equals(incomingIsActive)) {
            existingJob.setIsDraft(false);
        } else if (Boolean.TRUE.equals(incomingIsDraft)) {
            existingJob.setIsActive(false);
        }

        validateTargetingHierarchy(existingJob);
        // Sanitize text inputs (same as createJob and AdminJobServiceImpl.updateJob — this path
        // previously never called sanitizeJobInputs at all, so jobTitle/companyName/jobDescription/
        // jobResponsibilities/location/jobType/ctcRange were persisted as raw, un-HTML-escaped
        // client input on every edit made through this org-scoped surface, even though the exact
        // same fields ARE escaped when the job is first created (createJob, line ~241) or edited
        // via the college-scoped AdminJobServiceImpl.updateJob. A stored XSS payload in any of
        // these fields (e.g. jobTitle="<img src=x onerror=alert(1)>") would sail through @Valid's
        // length/blank checks unchanged and land in the DB exactly as submitted.
        // (Moved earlier — see the log-injection fix above; sanitizeJobInputs now runs right
        // after the text fields are copied, before the slug-generation log statements.)
        // Only re-validate the Company link when it's actually changing — see companyIdChanged
        // above.
        if (companyIdChanged) {
            applyCompanyLink(existingJob, organizationId);
        }

        Job saved = jobRepository.save(existingJob);
        invalidateJobCaches(saved.getOrganizationId());
        return saved;
    }

    @Override
    @Transactional
    public Job setJobStatus(Integer jobId, Boolean isActive, Integer organizationId) {
        log.info("Setting job {} status to {} for organization {}", jobId, isActive, organizationId);

        Job job = getJobById(jobId, organizationId);
        job.setIsActive(isActive);
        // Same coupling as updateJob above — activating a still-draft job must un-draft it.
        if (Boolean.TRUE.equals(job.getIsActive())) job.setIsDraft(false);

        Job saved = jobRepository.save(job);
        invalidateJobCaches(saved.getOrganizationId());
        return saved;
    }

    @Override
    @Transactional
    public void deleteJob(Integer jobId, Integer organizationId) {
        log.info("Deleting job {} for organization {}", jobId, organizationId);

        // Unlike AdminJobServiceImpl.deleteJob, this org-scoped path deliberately does NOT call
        // any requireCollegeOwnedJob-style guard — an org-wide job (collegeId == null) is
        // explicitly rejected by that guard on the college-scoped surface, and this is the only
        // other delete path, so a null-collegeId job would otherwise be undeletable through any
        // code path at all.
        Job job = getJobById(jobId, organizationId);

        long activeApplicationCount = jobApplicationRepository.countByJobId(jobId);
        if (activeApplicationCount > 0) {
            log.warn("Soft-deleting job {} which has {} active application(s). Applications will remain but the job will no longer appear in listings.",
                    jobId, activeApplicationCount);
        }

        jobRepository.softDeleteById(jobId);
        invalidateJobCaches(job.getOrganizationId());
        log.info("Job deleted successfully with ID: {} ({} active applications affected)", jobId, activeApplicationCount);
    }

    private void invalidateJobCaches(Integer organizationId) {
        if (organizationId != null && jobVisibilityCache != null) {
            jobVisibilityCache.invalidateForOrganization(organizationId);
        }
        if (jobSearchCache != null) {
            jobSearchCache.refresh();
        }
    }

    private void deriveApplicationDeadlineFromImportantDates(Job job) {
        Object importantDates = job.getImportantDates();
        if (importantDates == null) {
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

    @Override
    public List<JobApplication> getApplicationsForJob(Integer jobId, Integer organizationId) {
        Job job = getJobByIdIncludeDeleted(jobId, organizationId);

        List<JobApplication> applications = jobApplicationRepository.findByJobIdAndOrganization(jobId, organizationId);

        String jobScreeningVersion = job.getScreeningVersion();
        if (jobScreeningVersion == null || jobScreeningVersion.trim().isEmpty()) {
            jobScreeningVersion = "v1";
        }

        List<ApplicationScreening> screenings = screeningRepository.findByJobIdAndOrganizationAndVersionOrderByScoreDesc(
                jobId, organizationId, jobScreeningVersion);
        Map<Integer, ApplicationScreening> screeningMap = screenings.stream()
                .collect(Collectors.toMap(
                        s -> s.getApplication().getId(),
                        s -> s
                ));

        applications.sort((a1, a2) -> {
            ApplicationScreening s1 = screeningMap.get(a1.getId());
            ApplicationScreening s2 = screeningMap.get(a2.getId());

            if (s1 != null && s2 != null) {
                if (s1.getOverallScore() != null && s2.getOverallScore() != null) {
                    int scoreCompare = Double.compare(s2.getOverallScore(), s1.getOverallScore());
                    if (scoreCompare != 0) {
                        return scoreCompare;
                    }
                }
                if (a1.getAppliedAt() != null && a2.getAppliedAt() != null) {
                    return a2.getAppliedAt().compareTo(a1.getAppliedAt());
                }
                return 0;
            }

            if (s1 != null && s1.getOverallScore() != null) {
                return -1;
            } else if (s2 != null && s2.getOverallScore() != null) {
                return 1;
            }

            if (a1.getAppliedAt() != null && a2.getAppliedAt() != null) {
                return a2.getAppliedAt().compareTo(a1.getAppliedAt());
            }

            return 0;
        });

        return applications;
    }

    @Override
    public Page<JobApplication> getApplicationsForJobPaginated(Integer jobId, Integer organizationId, Pageable pageable,
                                                              String applicationStatus, Double minScore, Double maxScore,
                                                              LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                              String source, Integer programId, Integer classId,
                                                              Integer departmentId, Integer batchId, String search,
                                                              List<String> skills) {
        // `skills` filters against Learner.skills, a JSON column with no relational path to push
        // into SQL — keep that one rare/advanced case on the old in-memory implementation rather
        // than risk incorrect semantics rushing a JSON-query rewrite. Every other filter (the
        // ones the admin UI actually exposes: status, source, date range, department/program/
        // batch/class, name/email search, score range) now runs as a single paginated SQL query
        // instead of loading the job's entire application list into memory on every page turn —
        // that in-memory approach meant a job with thousands of applicants (realistic once a
        // college's student count reaches the thousands) hydrated its full application+learner
        // graph on every admin page flip.
        if (skills != null && !skills.isEmpty()) {
            return getApplicationsForJobPaginatedInMemory(jobId, organizationId, pageable, applicationStatus, minScore, maxScore,
                    appliedAfter, appliedBefore, source, programId, classId, departmentId, batchId, search, skills);
        }
        Job job = getJobByIdIncludeDeleted(jobId, organizationId);
        String jobScreeningVersion = job.getScreeningVersion() != null && !job.getScreeningVersion().trim().isEmpty()
                ? job.getScreeningVersion() : "v1";

        // Small, bounded (not proportional to application count) lookups to resolve a
        // department/batch into the program/class ids under it — safe to keep in Java.
        Set<Integer> programIdsInDept = null;
        if (departmentId != null) {
            programIdsInDept = newProgramRepository.findByDeptId(departmentId).stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                    .map(NewProgram::getId).collect(Collectors.toSet());
        }
        Set<Integer> classIdsInBatch = null;
        if (batchId != null) {
            classIdsInBatch = classRepository.findByBatchId(batchId).stream()
                    .map(_Class::getId).collect(Collectors.toSet());
        }

        // Withdrawn applications are soft-deleted (isDeleted=true), so the default filter below
        // excludes them from every admin view by design — a candidate walking away used to be
        // completely unrecoverable in the UI, indistinguishable from never having applied.
        // Explicitly asking for the WITHDRAWN status tab is the one deliberate escape hatch:
        // it flips to isDeleted=true instead of hiding them, without touching every other query's
        // (and every count/pagination total's) default behavior of excluding withdrawals.
        boolean wantsWithdrawn = "WITHDRAWN".equalsIgnoreCase(applicationStatus != null ? applicationStatus.trim() : null);
        StringBuilder where = new StringBuilder(
                wantsWithdrawn
                        ? "ja.job.id = :jobId AND ja.organizationId = :organizationId AND ja.isDeleted = true"
                        : "ja.job.id = :jobId AND ja.organizationId = :organizationId AND (ja.isDeleted = false OR ja.isDeleted IS NULL)");
        Map<String, Object> params = new HashMap<>();
        params.put("jobId", jobId);
        params.put("organizationId", organizationId);

        if (applicationStatus != null && !applicationStatus.trim().isEmpty()) {
            where.append(" AND UPPER(ja.applicationStatus) = UPPER(:applicationStatus)");
            params.put("applicationStatus", applicationStatus.trim());
        }
        if (appliedAfter != null) {
            where.append(" AND ja.appliedAt >= :appliedAfter");
            params.put("appliedAfter", appliedAfter);
        }
        if (appliedBefore != null) {
            where.append(" AND ja.appliedAt <= :appliedBefore");
            params.put("appliedBefore", appliedBefore);
        }
        if (source != null && !source.trim().isEmpty()) {
            where.append(" AND UPPER(ja.source) = UPPER(:source)");
            params.put("source", source.trim());
        }
        if (programId != null) {
            where.append(" AND l.programId = :programId");
            params.put("programId", programId);
        }
        if (classId != null) {
            where.append(" AND l.classId = :classId");
            params.put("classId", classId);
        }
        if (programIdsInDept != null) {
            if (programIdsInDept.isEmpty()) {
                where.append(" AND 1 = 0"); // department has no programs — no possible matches
            } else {
                where.append(" AND l.programId IN :programIdsInDept");
                params.put("programIdsInDept", programIdsInDept);
            }
        }
        if (classIdsInBatch != null) {
            if (classIdsInBatch.isEmpty()) {
                where.append(" AND 1 = 0"); // batch has no classes — no possible matches
            } else {
                where.append(" AND l.classId IN :classIdsInBatch");
                params.put("classIdsInBatch", classIdsInBatch);
            }
        }
        if (search != null && !search.trim().isEmpty()) {
            where.append(" AND (LOWER(l.firstName) LIKE :search ESCAPE '\\\\' OR LOWER(l.lastName) LIKE :search ESCAPE '\\\\' OR LOWER(l.contactMail) LIKE :search ESCAPE '\\\\')");
            params.put("search", "%" + escapeLikeWildcards(search.trim().toLowerCase(Locale.ROOT)) + "%");
        }
        // Screening score isn't a relation on JobApplication — resolved via a scalar subquery
        // scoped the same way screeningRepository's own lookup is (job, org, version, COMPLETED),
        // so a null score sorts/filters exactly like the old in-memory logic did (excluded from
        // range filters, ordered last).
        String scoreSubquery = "(SELECT s.overallScore FROM ApplicationScreening s " +
                "WHERE s.application.id = ja.id AND s.application.job.id = :jobId AND s.application.organizationId = :organizationId " +
                "AND s.screeningVersion = :screeningVersion AND s.isDeleted = false AND s.screeningStatus = 'COMPLETED')";
        // screeningVersion is only bound to `params` (and thus the count query) when the WHERE
        // clause actually references scoreSubquery — i.e. when a min/max score filter is set.
        // It was previously added to `params` unconditionally, but the COUNT query's WHERE clause
        // never includes the ORDER BY's scoreSubquery, so binding it there threw
        // "Could not locate named parameter [screeningVersion]" on every call with neither score
        // filter set — the common case, since most application-list requests filter by status
        // only.
        if (minScore != null) {
            where.append(" AND ").append(scoreSubquery).append(" >= :minScore");
            params.put("minScore", minScore);
            params.put("screeningVersion", jobScreeningVersion);
        }
        if (maxScore != null) {
            where.append(" AND ").append(scoreSubquery).append(" <= :maxScore");
            params.put("maxScore", maxScore);
            params.put("screeningVersion", jobScreeningVersion);
        }

        String orderBy = " ORDER BY COALESCE(" + scoreSubquery + ", -1.0) DESC, ja.appliedAt DESC";

        String countJpql = "SELECT COUNT(ja) FROM JobApplication ja LEFT JOIN ja.learner l WHERE " + where;
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        params.forEach(countQuery::setParameter);
        long total = countQuery.getSingleResult();

        List<JobApplication> content;
        if (total == 0 || pageable.getOffset() >= total) {
            content = Collections.emptyList();
        } else {
            String dataJpql = "SELECT DISTINCT ja FROM JobApplication ja " +
                    "LEFT JOIN FETCH ja.learner l LEFT JOIN FETCH ja.job WHERE " + where + orderBy;
            TypedQuery<JobApplication> dataQuery = entityManager.createQuery(dataJpql, JobApplication.class);
            params.forEach(dataQuery::setParameter);
            // orderBy always references scoreSubquery (via COALESCE) regardless of min/max score
            // filters, so the data query needs screeningVersion bound even when `params` doesn't
            // already have it.
            dataQuery.setParameter("screeningVersion", jobScreeningVersion);
            dataQuery.setFirstResult((int) pageable.getOffset());
            dataQuery.setMaxResults(pageable.getPageSize());
            content = dataQuery.getResultList();
            attachScreeningScores(content, jobId, organizationId, jobScreeningVersion);
        }

        return new PageImpl<>(content, pageable, total);
    }

    // The screening/match score was computed for every application but never returned to the
    // admin UI — it was used only internally as a sort key. One extra bounded query (scoped to
    // just this page's application ids) attaches it for display.
    private void attachScreeningScores(List<JobApplication> applications, Integer jobId, Integer organizationId, String screeningVersion) {
        if (applications == null || applications.isEmpty()) return;
        List<Integer> applicationIds = applications.stream().map(JobApplication::getId).collect(Collectors.toList());
        List<ApplicationScreening> screenings = screeningRepository.findByJobIdAndOrganizationAndVersionAndApplicationIds(
                jobId, organizationId, screeningVersion, applicationIds);
        Map<Integer, Double> scoreByApplicationId = screenings.stream()
                .filter(s -> s.getApplication() != null && s.getOverallScore() != null)
                .collect(Collectors.toMap(s -> s.getApplication().getId(), ApplicationScreening::getOverallScore, (a, b) -> a));
        Map<Integer, Boolean> partialByApplicationId = screenings.stream()
                .filter(s -> s.getApplication() != null)
                .collect(Collectors.toMap(s -> s.getApplication().getId(), ApplicationScreening::getIsPartialScore, (a, b) -> a));
        for (JobApplication app : applications) {
            app.setScreeningScore(scoreByApplicationId.get(app.getId()));
            app.setIsPartialScore(partialByApplicationId.get(app.getId()));
        }
    }

    /**
     * Old in-memory implementation — kept only as the fallback for the `skills` filter, which
     * has no relational path to push into SQL (Learner.skills is a JSON column). Loads the
     * job's entire application list; do not use this on the hot path.
     */
    private Page<JobApplication> getApplicationsForJobPaginatedInMemory(Integer jobId, Integer organizationId, Pageable pageable,
                                                              String applicationStatus, Double minScore, Double maxScore,
                                                              LocalDateTime appliedAfter, LocalDateTime appliedBefore,
                                                              String source, Integer programId, Integer classId,
                                                              Integer departmentId, Integer batchId, String search,
                                                              List<String> skills) {
        Job job = getJobByIdIncludeDeleted(jobId, organizationId);

        List<JobApplication> applications = jobApplicationRepository.findByJobIdAndOrganization(jobId, organizationId);
        String jobScreeningVersion = job.getScreeningVersion() != null && !job.getScreeningVersion().trim().isEmpty()
                ? job.getScreeningVersion() : "v1";

        List<ApplicationScreening> screenings = screeningRepository.findByJobIdAndOrganizationAndVersionOrderByScoreDesc(
                jobId, organizationId, jobScreeningVersion);
        Map<Integer, ApplicationScreening> screeningMap = screenings.stream()
                .collect(Collectors.toMap(s -> s.getApplication().getId(), s -> s, (a, b) -> a));

        // Apply optional filters (org-scoped; all applications already belong to organizationId)
        if (applicationStatus != null && !applicationStatus.trim().isEmpty()) {
            applications = applications.stream()
                    .filter(a -> applicationStatus.trim().equalsIgnoreCase(a.getApplicationStatus()))
                    .collect(Collectors.toList());
        }
        if (appliedAfter != null) {
            applications = applications.stream()
                    .filter(a -> a.getAppliedAt() != null && !a.getAppliedAt().isBefore(appliedAfter))
                    .collect(Collectors.toList());
        }
        if (appliedBefore != null) {
            applications = applications.stream()
                    .filter(a -> a.getAppliedAt() != null && !a.getAppliedAt().isAfter(appliedBefore))
                    .collect(Collectors.toList());
        }
        if (minScore != null || maxScore != null) {
            applications = applications.stream()
                    .filter(a -> {
                        ApplicationScreening s = screeningMap.get(a.getId());
                        Double score = s != null ? s.getOverallScore() : null;
                        // An unscored application can't satisfy either bound, so it must be
                        // excluded whenever any score filter is active — previously a maxScore-only
                        // filter (minScore == null) let unscored applications through inconsistently
                        // with the mirror-image minScore-only filter, which correctly excluded them.
                        if (score == null) return false;
                        if (minScore != null && score < minScore) return false;
                        if (maxScore != null && score > maxScore) return false;
                        return true;
                    })
                    .collect(Collectors.toList());
        }
        if (source != null && !source.trim().isEmpty()) {
            String src = source.trim();
            applications = applications.stream()
                    .filter(a -> src.equalsIgnoreCase(a.getSource()))
                    .collect(Collectors.toList());
        }
        if (programId != null) {
            applications = applications.stream()
                    .filter(a -> a.getLearner() != null && programId.equals(a.getLearner().getProgramId()))
                    .collect(Collectors.toList());
        }
        if (classId != null) {
            applications = applications.stream()
                    .filter(a -> a.getLearner() != null && classId.equals(a.getLearner().getClassId()))
                    .collect(Collectors.toList());
        }
        if (departmentId != null) {
            Set<Integer> programIdsInDept = newProgramRepository.findByDeptId(departmentId).stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                    .map(NewProgram::getId).collect(Collectors.toSet());
            applications = applications.stream()
                    .filter(a -> a.getLearner() != null && a.getLearner().getProgramId() != null
                            && programIdsInDept.contains(a.getLearner().getProgramId()))
                    .collect(Collectors.toList());
        }
        if (batchId != null) {
            List<Integer> classIdsInBatch = classRepository.findByBatchId(batchId).stream()
                    .map(_Class::getId).collect(Collectors.toList());
            Set<Integer> classIdSet = new HashSet<>(classIdsInBatch);
            applications = applications.stream()
                    .filter(a -> a.getLearner() != null && a.getLearner().getClassId() != null
                            && classIdSet.contains(a.getLearner().getClassId()))
                    .collect(Collectors.toList());
        }
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            applications = applications.stream()
                    .filter(a -> {
                        Learner l = a.getLearner();
                        if (l == null) return false;
                        boolean match = (l.getFirstName() != null && l.getFirstName().toLowerCase().contains(q))
                                || (l.getLastName() != null && l.getLastName().toLowerCase().contains(q))
                                || (l.getContactMail() != null && l.getContactMail().toLowerCase().contains(q));
                        return match;
                    })
                    .collect(Collectors.toList());
        }
        if (skills != null && !skills.isEmpty()) {
            Set<String> skillSet = skills.stream().map(s -> s.trim().toLowerCase()).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
            if (!skillSet.isEmpty()) {
                applications = applications.stream()
                        .filter(a -> {
                            Learner l = a.getLearner();
                            if (l == null || l.getSkills() == null) return false;
                            return l.getSkills().stream()
                                    .map(SkillDTO::getSkill)
                                    .filter(Objects::nonNull)
                                    .map(String::toLowerCase)
                                    .anyMatch(skillSet::contains);
                        })
                        .collect(Collectors.toList());
            }
        }

        // Sort: screening overallScore DESC, then appliedAt DESC (same as getApplicationsForJob)
        applications.sort((a1, a2) -> {
            ApplicationScreening s1 = screeningMap.get(a1.getId());
            ApplicationScreening s2 = screeningMap.get(a2.getId());
            if (s1 != null && s2 != null) {
                if (s1.getOverallScore() != null && s2.getOverallScore() != null) {
                    int c = Double.compare(s2.getOverallScore(), s1.getOverallScore());
                    if (c != 0) return c;
                }
                if (a1.getAppliedAt() != null && a2.getAppliedAt() != null)
                    return a2.getAppliedAt().compareTo(a1.getAppliedAt());
                return 0;
            }
            if (s1 != null && s1.getOverallScore() != null) return -1;
            if (s2 != null && s2.getOverallScore() != null) return 1;
            if (a1.getAppliedAt() != null && a2.getAppliedAt() != null)
                return a2.getAppliedAt().compareTo(a1.getAppliedAt());
            return 0;
        });

        int total = applications.size();
        int from = (int) pageable.getOffset();
        int to = Math.min(from + pageable.getPageSize(), total);
        List<JobApplication> content = from < total ? applications.subList(from, to) : Collections.emptyList();
        for (JobApplication app : content) {
            ApplicationScreening s = screeningMap.get(app.getId());
            if (s != null) {
                app.setScreeningScore(s.getOverallScore());
                app.setIsPartialScore(s.getIsPartialScore());
            }
        }
        return new PageImpl<>(content, pageable, total);
    }

    @Override
    // REQUIRES_NEW: bulkUpdateApplicationStatus below calls this once per application id through
    // `self` specifically so each row commits — or fails — in its own transaction, not the bulk
    // call's single shared one (see the identical fix + full rationale on the AdminJobServiceImpl
    // copy of this method).
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public JobApplication updateApplicationStatus(Integer applicationId, String newStatus, Integer organizationId, Integer updatedBy, String assessmentUrl, String rejectionReason) {
        // Normalize to canonical uppercase as early as possible — same fix and same rationale as
        // AdminJobServiceImpl.updateApplicationStatus. Without this, VALID_STATUSES.contains(newStatus)
        // below (an exact-case check) rejected any lowercase/mixed-case newStatus (e.g. "shortlisted")
        // with "Invalid status", even though the identical request succeeds on the college-scoped
        // Admin surface — a case-sensitivity drift between the two admin pipelines for the same
        // transition attempt.
        if (newStatus != null) {
            newStatus = newStatus.toUpperCase();
        }
        log.info("Updating application {} status to {} for organization {} by user {}", applicationId, newStatus, organizationId, updatedBy);

        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and org-mismatch intentionally throw the exact same
                // message/status — distinguishing "doesn't exist" from "isn't yours" is an IDOR
                // enumeration oracle.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application not found");
        }

        String currentStatus = application.getApplicationStatus();
        // JP-03: Block advancing applications for a closed job (allow REJECTED for cleanup).
        // Aligned to AdminJobServiceImpl's exact guard: only Boolean.FALSE (not null/absent)
        // counts as "closed" — a null isActive must not block advancement — and a same-status
        // no-op (e.g. just correcting the assessment link below) isn't "advancing" anything and
        // must not be blocked just because the job happens to be closed.
        Job applicationJob = application.getJob();
        if (applicationJob != null && Boolean.FALSE.equals(applicationJob.getIsActive())
                && !"REJECTED".equalsIgnoreCase(newStatus)
                && !newStatus.equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException("Cannot advance application status: the job posting is closed");
        }
        // Same policy for a soft-deleted job. This surface fetches the job via
        // application.getJob() rather than through a strict lookup, so unlike
        // AdminJobServiceImpl.updateApplicationStatus (which used to hard-block ALL status
        // changes, including REJECTED cleanup, once a job was soft-deleted — see that method's
        // getJobById(..., true) comment) this path previously had no isDeleted guard whatsoever:
        // a mid-pipeline application against a since-deleted job could still be freely advanced
        // (even to HIRED) here. Applying the same "block advance, allow REJECTED cleanup" JP-03
        // policy keeps both admin surfaces consistent for a deleted job, exactly as they already
        // are for a merely-closed one.
        if (applicationJob != null && Boolean.TRUE.equals(applicationJob.getIsDeleted())
                && !"REJECTED".equalsIgnoreCase(newStatus)
                && !newStatus.equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException("Cannot advance application status: the job posting has been deleted");
        }
        // When moving to (or re-confirming) ASSESSMENT with assessmentUrl, validate + persist it.
        // Runs whenever newStatus is ASSESSMENT, including the same-status "update the link" case
        // below — an admin correcting an already-set assessment link must still be able to, but
        // that write must not silently piggyback on a true status-transition no-op (see below).
        boolean assessmentUrlChanged = false;
        if ("ASSESSMENT".equalsIgnoreCase(newStatus) && assessmentUrl != null && !assessmentUrl.trim().isEmpty()) {
            String trimmed = assessmentUrl.trim();
            if (trimmed.length() > 2048) {
                throw new IllegalArgumentException("Assessment URL must be at most 2048 characters");
            }
            if (!trimmed.matches("^https?://.+")) {
                throw new IllegalArgumentException("Assessment URL must be a valid http or https link");
            }
            if (applicationJob != null && !trimmed.equals(applicationJob.getAssessmentUrl())) {
                assessmentUrlChanged = true;
                applicationJob.setAssessmentUrl(trimmed);
                jobRepository.save(applicationJob);
            }
        }
        // No-op: same status, skip the status-transition side effects (validator, timestamps,
        // audit log, main status notification) — but if the assessment link was just updated
        // above, still tell the learner about the new link before returning.
        if (newStatus.equalsIgnoreCase(currentStatus)) {
            log.debug("Status unchanged ({}→{}) for application {} - skipping", currentStatus, newStatus, applicationId);
            if (assessmentUrlChanged) {
                sendJobApplicationStatusNotifications(application, newStatus);
            }
            return application;
        }
        // Same explicit check as AdminJobServiceImpl.updateApplicationStatus — defense in depth
        // alongside VALID_STATUSES not listing WITHDRAWN, so the invariant doesn't rely solely on
        // an allowlist that could be edited without noticing this implication. WITHDRAWN is a
        // learner-initiated action (see JobServiceImpl.withdrawApplication, which also
        // soft-deletes the row); an admin forcing it here would leave the row neither
        // soft-deleted nor movable again, since WITHDRAWN has zero valid outbound transitions.
        if ("WITHDRAWN".equalsIgnoreCase(newStatus)) {
            throw new IllegalArgumentException("WITHDRAWN can only be set by the learner withdrawing their own application, not by an admin status update.");
        }
        // Moved below the no-op shortcut and the WITHDRAWN block (was previously the very first
        // check in this method, before the application was even fetched) so that a genuine
        // WITHDRAWN→WITHDRAWN no-op — which the no-op shortcut above already returns as a
        // harmless 200 — isn't rejected here just because VALID_STATUSES doesn't list WITHDRAWN.
        // This aligns Placement with AdminJobServiceImpl.updateApplicationStatus's pipeline
        // order, where the equivalent no-op shortcut and WITHDRAWN block both run first. A real
        // (non-self) transition to WITHDRAWN still can't reach here: the WITHDRAWN block above
        // throws first. A real transition to any other invalid status still hits this check
        // before validateTransition/persistence, unchanged from before.
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status: " + newStatus + ". Valid statuses: " + VALID_STATUSES);
        }
        com._42students.lms.util.JobApplicationStatusValidator.validateTransition(currentStatus, newStatus);

        // CONCURRENCY FIX (round 5 audit): same gap and same fix as
        // AdminJobServiceImpl.updateApplicationStatus — the JP-03 isActive/isDeleted gate above
        // ran against applicationJob, a plain (unlocked) read reached via application.getJob();
        // nothing stopped a concurrent deleteJob/closing update from committing in the window
        // between that check and this method's application-status write below, bypassing JP-03.
        // Re-verify under a PESSIMISTIC_WRITE lock on the Job row immediately before the write
        // section. Skipped for REJECTED (cleanup is always allowed) and when the application has
        // no linked job at all (applicationJob == null), mirroring the unlocked check's own
        // null-guard above.
        if (applicationJob != null && !"REJECTED".equalsIgnoreCase(newStatus)) {
            Job lockedJob = jobRepository.lockJobById(applicationJob.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Job not found with ID: " + applicationJob.getId()));
            if (Boolean.FALSE.equals(lockedJob.getIsActive())) {
                throw new IllegalArgumentException("Cannot advance application status: the job posting is closed");
            }
            if (Boolean.TRUE.equals(lockedJob.getIsDeleted())) {
                throw new IllegalArgumentException("Cannot advance application status: the job posting has been deleted");
            }
        }

        // One-offer-per-student, admin-direct path: same check and rationale as the identical fix
        // on AdminJobServiceImpl.updateApplicationStatus (see that method for the full comment) —
        // JobServiceImpl.respondToOffer already blocks a learner from accepting a second offer
        // while already HIRED elsewhere, but nothing stopped an org-scoped admin from setting
        // HIRED directly here while a different application for the same learner was still HIRED.
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

        // JP-07: when advancing from APPLIED to SHORTLISTED, warn if screening was not completed
        if ("APPLIED".equalsIgnoreCase(currentStatus) && "SHORTLISTED".equalsIgnoreCase(newStatus)) {
            try {
                java.util.Optional<com._42students.lms.model.ApplicationScreening> screeningOpt =
                        screeningRepository.findByApplicationId(applicationId);
                if (screeningOpt.isPresent()) {
                    String screeningStatus = screeningOpt.get().getScreeningStatus();
                    if (!"COMPLETED".equalsIgnoreCase(screeningStatus) && !"PASS".equalsIgnoreCase(screeningStatus)) {
                        log.warn("JP-07: Advancing application {} to SHORTLISTED without completed screening (screeningStatus={})",
                                applicationId, screeningStatus);
                    }
                } else {
                    log.warn("JP-07: Advancing application {} to SHORTLISTED with no screening record on file", applicationId);
                }
            } catch (Exception e) {
                log.warn("JP-07: Could not verify screening status for application {}: {}", applicationId, e.getMessage());
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
            // Same fix as AdminJobServiceImpl.updateApplicationStatus — preserve the reason when
            // reinstating a REJECTED application instead of silently wiping it with no trace.
            application.setRejectionReason(null);
        }

        // Same fix as AdminJobServiceImpl.updateApplicationStatus — previously this whole method
        // never touched the Interview table at all on any transition.
        boolean leavingInterviewStage = ("INTERVIEW".equalsIgnoreCase(currentStatus) || "OFFERED".equalsIgnoreCase(currentStatus))
                && !"INTERVIEW".equalsIgnoreCase(newStatus) && !"OFFERED".equalsIgnoreCase(newStatus) && !"HIRED".equalsIgnoreCase(newStatus);
        if ("REJECTED".equalsIgnoreCase(newStatus) || leavingInterviewStage) {
            cancelNonTerminalInterviewsForApplicationLocked(application);
        }
        // Same fix as AdminJobServiceImpl.updateApplicationStatus — offerLetterSentAt must be
        // cleared alongside the URL, or a later re-offer cycle shows a stale "sent at" timestamp
        // with no corresponding URL until re-attached.
        if (!"OFFERED".equalsIgnoreCase(newStatus) && !"HIRED".equalsIgnoreCase(newStatus)) {
            application.setOfferLetterUrl(null);
            application.setOfferLetterSentAt(null);
        }

        JobApplication savedApplication = jobApplicationRepository.save(application);

        if (adminAuditLogService != null) {
            Map<String, Object> auditPayload = new HashMap<>();
            auditPayload.put("from", currentStatus);
            auditPayload.put("to", newStatus);
            adminAuditLogService.log(null, "APPLICATION_STATUS_CHANGED", "JobApplication", String.valueOf(savedApplication.getId()),
                    organizationId, null, auditPayload);
        }

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(
                    savedApplication.getId(), currentStatus, newStatus, updatedBy,
                    "REJECTED".equalsIgnoreCase(newStatus) ? application.getRejectionReason() : null));
        }
        sendJobApplicationStatusNotifications(savedApplication, newStatus);

        // One-offer-per-student cascade, admin-direct path: same fix and rationale as
        // AdminJobServiceImpl.updateApplicationStatus's identical cascade (see that method for
        // the full comment) — an org-scoped admin setting HIRED directly here previously left the
        // learner's other pending applications completely untouched.
        if ("HIRED".equalsIgnoreCase(newStatus)) {
            withdrawOtherActiveApplicationsOnHire(savedApplication);
        }

        return savedApplication;
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
                // JobServiceImpl's respondToOffer cascade, and AdminJobServiceImpl's identical cascade
                // can race for the SAME learner via different surfaces (candidate accept vs. admin HIRED),
                // each taking findByIdForUpdate locks on the learner's other applications in a loop;
                // sorting by id gives every caller the same caller-independent lock order regardless of
                // appliedAt ties or which application each cascade itself excludes.
                .sorted()
                .collect(Collectors.toList());
        for (Integer otherId : otherIds) {
            // CONCURRENCY FIX (round 4 audit): lock this "other" application row BEFORE touching
            // its interviews — same fix and rationale as
            // JobServiceImpl.withdrawOtherActiveApplications / AdminJobServiceImpl's identical
            // cascade: without it, a concurrent InterviewServiceImpl.scheduleInterview call for
            // this same application could commit a brand-new interview after this cascade's own
            // (unlocked, REPEATABLE-READ snapshot-bound) interview lookup already ran, leaving it
            // un-cancelled on a now-withdrawn application. Locking the application first (matching
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
            com._42students.lms.util.JobApplicationStatusValidator.validateTransition(prevStatus, otherNewStatus);
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

    @Override
    public List<JobApplication> getAllApplicationsForOrganization(Integer organizationId) {
        return jobApplicationRepository.findByOrganizationId(organizationId);
    }

    @Override
    public Page<JobApplication> getAllApplicationsForOrganizationPaginated(Integer organizationId, Pageable pageable) {
        return jobApplicationRepository.findByOrganizationIdPaginated(organizationId, pageable);
    }

    private static final int BULK_STATUS_MAX_DEFAULT = 100;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsServiceForCaps;

    // Same GLOBAL setting AdminJobServiceImpl reads -- see its comment.
    private int bulkStatusMax() {
        return appSettingsServiceForCaps != null ? appSettingsServiceForCaps.getBulkStatusMax() : BULK_STATUS_MAX_DEFAULT;
    }

    @Override
    // No @Transactional here on purpose — each item's own call (routed through `self` below) opens
    // its own REQUIRES_NEW transaction, so a failure on one row can never roll back the others.
    public Map<String, Object> bulkUpdateApplicationStatus(List<Integer> applicationIds, String newStatus, Integer organizationId, Integer updatedBy, String assessmentUrl, String rejectionReason) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            throw new IllegalArgumentException("applicationIds is required and must not be empty");
        }
        if (applicationIds.size() > bulkStatusMax()) {
            throw new IllegalArgumentException("Maximum " + bulkStatusMax() + " applications per bulk update");
        }
        // Deliberately no VALID_STATUSES pre-check here (unlike the size/count checks above) —
        // AdminJobServiceImpl's bulk method has none either, and each item's own
        // updateApplicationStatus call already re-validates newStatus per-row, including the
        // WITHDRAWN→WITHDRAWN no-op it explicitly allows. A batch-wide pre-check here rejected
        // that same no-op with a blanket 400 before any row was even looked at, so a bulk
        // WITHDRAWN→WITHDRAWN request 400'd even though the single-item endpoint returned 200 for
        // the identical transition.
        // JP-12: Ensure all applications belong to the same job before bulk update
        List<JobApplication> applicationsToUpdate = jobApplicationRepository.findAllById(applicationIds);
        java.util.Set<Integer> distinctJobIds = applicationsToUpdate.stream()
                .filter(a -> a.getJob() != null)
                .map(a -> a.getJob().getId())
                .collect(java.util.stream.Collectors.toSet());
        if (distinctJobIds.size() > 1) {
            throw new IllegalArgumentException("All applications in a bulk update must belong to the same job. Found applications from " + distinctJobIds.size() + " different jobs.");
        }
        List<JobApplication> updated = new ArrayList<>();
        // Unlike the college-scoped admin's sibling bulk endpoint, this org-scoped path used to
        // only log per-item failures and never surface them, so the caller had no way to know
        // which items (if any) of a bulk update were silently skipped.
        List<Map<String, Object>> failed = new ArrayList<>();
        for (Integer applicationId : applicationIds) {
            try {
                JobApplication app = self.updateApplicationStatus(applicationId, newStatus, organizationId, updatedBy, assessmentUrl, rejectionReason);
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
    public JobApplication updateApplicationNotes(Integer applicationId, String internalNotes, Integer organizationId, Long version) {
        JobApplication application = jobApplicationRepository.findByIdWithAssociations(applicationId)
                // SECURITY: not-found and org-mismatch intentionally throw the exact same
                // message/status — see comment above in updateApplicationNotes.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application not found");
        }
        // Same fix as AdminJobServiceImpl.updateApplicationNotes — two admins opening the same
        // notes editor from the same starting text used to silently let whoever saved last
        // overwrite the other's note with no warning and no history.
        if (version != null && !version.equals(application.getVersion())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "These notes were updated by someone else. Please refresh and try again.");
        }
        application.setInternalNotes(internalNotes != null ? internalNotes.trim() : null);
        return jobApplicationRepository.save(application);
    }

    private static final DateTimeFormatter CSV_DATE = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // Same fix as AdminJobServiceImpl.escapeLikeWildcards — a user-supplied search term is bound
    // as a JPQL LIKE parameter wrapped in %...%; parameter binding prevents injection but not
    // LIKE-wildcard semantics, so a literal %, _, or \ in the search term must be escaped to avoid
    // unexpectedly broad matches.
    private static String escapeLikeWildcards(String value) {
        if (value == null) return value;
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static final int CSV_EXPORT_ROW_CAP = 20000;

    @Override
    public byte[] exportApplicationsAsCsv(Integer jobId, Integer organizationId, String applicationStatus, String source,
                                           Integer departmentId, Integer programId, Integer batchId, String search) {
        // Previously ignored every filter the admin applied on screen (status/source/department/
        // program/batch/search) and always exported the full unfiltered list via the raw
        // getApplicationsForJob — now routes through the same filtered/paginated query the
        // on-screen table itself uses (getApplicationsForJobPaginated), matching
        // AdminJobServiceImpl.exportApplicationsAsCsv's pattern. The org-wide (jobId == null)
        // branch has no on-screen filters to match today (getAllApplicationsForOrganizationPaginated
        // is page/size only), so it keeps its existing unfiltered behavior.
        List<JobApplication> applications;
        boolean truncated = false;
        long totalMatching = 0;
        if (jobId != null) {
            Page<JobApplication> page = getApplicationsForJobPaginated(jobId, organizationId,
                    org.springframework.data.domain.PageRequest.of(0, CSV_EXPORT_ROW_CAP),
                    applicationStatus, null, null, null, null, source, programId, null, departmentId, batchId, search, null);
            applications = page.getContent();
            totalMatching = page.getTotalElements();
            truncated = totalMatching > CSV_EXPORT_ROW_CAP;
        } else {
            Page<JobApplication> page = getAllApplicationsForOrganizationPaginated(
                    organizationId, org.springframework.data.domain.PageRequest.of(0, CSV_EXPORT_ROW_CAP));
            applications = page.getContent();
            totalMatching = page.getTotalElements();
            truncated = totalMatching > CSV_EXPORT_ROW_CAP;
        }
        StringBuilder sb = new StringBuilder();
        // Same fix as AdminJobServiceImpl.exportApplicationsAsCsv: screeningScore/isPartialScore
        // are shown in the on-screen applications table (attached by getApplicationsForJobPaginated
        // via attachScreeningScores, using the same job/org/version-scoped subquery as the sort/
        // filter logic) but were missing from this CSV entirely, so the export never matched what
        // was on screen (checklist item 205).
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
            sb.append("# Export truncated at ").append(CSV_EXPORT_ROW_CAP).append(" rows (")
              .append(totalMatching).append(" total). Narrow the export scope (e.g. by job) to export the rest.\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
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
    public Map<String, Object> getResumePreviewUrl(Integer applicationId, Integer organizationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and org-mismatch intentionally throw the exact same
                // message/status — see comment above in updateApplicationNotes.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application not found");
        }
        String url = application.getResumeUrl();
        if (url == null || url.trim().isEmpty()) {
            Learner l = application.getLearner();
            if (l != null) url = l.getResumeUrl();
        }
        if (url != null) url = url.trim();
        // Resume URLs are stored as plain public R2 URLs (same as lesson video, course images,
        // and everything else in this app now) — no signing step needed. This endpoint's only
        // remaining job is the applicationResumeUrl-with-fallback-to-profile-resume resolution
        // above; org-scope is already checked before this point.
        Map<String, Object> result = new HashMap<>();
        result.put("url", url);
        result.put("applicationId", applicationId);
        return result;
    }

    @Override
    public List<JobApplicationStatusHistory> getApplicationHistory(Integer applicationId, Integer organizationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                // SECURITY: not-found and org-mismatch intentionally throw the exact same
                // message/status — see comment above in updateApplicationNotes.
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application not found");
        }
        return statusHistoryService != null
                ? statusHistoryService.getHistoryForApplication(applicationId)
                : Collections.emptyList();
    }

    @Override
    public Map<String, Object> getHiringMetrics(Integer jobId, Integer organizationId, LocalDateTime from, LocalDateTime to,
                                               Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        // Previously loaded every application for the whole organization into Java and ran 7
        // separate .stream().filter().count() passes on every dashboard load/filter change — at
        // ~10k students across many concurrent drives that's a full result-set scan repeated
        // seven times per request. A single GROUP BY does the counting in the database instead,
        // mirroring the fix already applied to the college-scoped AdminJobServiceImpl.
        String where = buildOrgMetricsWhereClause(organizationId, jobId, from, to, departmentId, programId, batchId, classId);
        Map<String, Object> params = buildOrgMetricsParams(organizationId, jobId, from, to, departmentId, programId, batchId, classId);

        String countJpql = "SELECT ja.applicationStatus, COUNT(ja) FROM JobApplication ja LEFT JOIN ja.learner l WHERE " + where
                + " GROUP BY ja.applicationStatus";
        TypedQuery<Object[]> countQuery = entityManager.createQuery(countJpql, Object[].class);
        params.forEach(countQuery::setParameter);

        Map<String, Object> metrics = buildEmptyOrgMetrics();
        long total = 0L;
        for (Object[] row : countQuery.getResultList()) {
            String status = String.valueOf(row[0]).toLowerCase(Locale.ROOT);
            long count = (Long) row[1];
            metrics.put(status, count);
            total += count;
        }
        metrics.put("totalApplications", total);

        // Native SQL, not JPQL: Hibernate 5's HQL AVG() can't determine the JDBC type of a
        // generic FUNCTION('TIMESTAMPDIFF', ...) call's result (it's a passthrough with no
        // registered return type), which throws a NullPointerException at query-parse time
        // ("Cannot invoke Type.sqlTypes(...) because firstArgumentType is null") — hit on every
        // real request. TIMESTAMPDIFF is MySQL-specific here anyway, so native SQL sidesteps the
        // type-inference path entirely (mirrors the identical fix in AdminJobServiceImpl).
        String avgSql = "SELECT AVG(TIMESTAMPDIFF(SECOND, ja.applied_at, " +
                "(SELECT MIN(h.changed_at) FROM job_application_status_history h WHERE h.application_id = ja.id AND h.new_status = 'SHORTLISTED'))) " +
                "FROM job_application ja LEFT JOIN learner l ON l.id = ja.learner_id WHERE " + buildOrgMetricsWhereClauseNative(organizationId, jobId, from, to, departmentId, programId, batchId, classId) +
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

    private String buildOrgMetricsWhereClauseNative(Integer organizationId, Integer jobId, LocalDateTime from, LocalDateTime to,
                                                      Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        // Same fix as AdminJobServiceImpl's resolveJobsForMetrics — this org-wide metrics/funnel/
        // company-report path only ever filtered the application's own isDeleted flag, never the
        // parent job's, so a soft-deleted job's applications kept inflating org-wide counts.
        StringBuilder where = new StringBuilder(
                "ja.organization_id = :organizationId AND (ja.is_deleted = false OR ja.is_deleted IS NULL) " +
                "AND NOT EXISTS (SELECT 1 FROM job j WHERE j.id = ja.job_id AND j.is_deleted = true)");
        if (jobId != null) where.append(" AND ja.job_id = :jobId");
        if (from != null) where.append(" AND ja.applied_at >= :from");
        if (to != null) where.append(" AND ja.applied_at <= :to");
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

    private Map<String, Object> buildEmptyOrgMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalApplications", 0L);
        for (String status : new String[]{"applied", "shortlisted", "assessment", "interview", "offered", "rejected", "hired"}) {
            metrics.put(status, 0L);
        }
        return metrics;
    }

    private String buildOrgMetricsWhereClause(Integer organizationId, Integer jobId, LocalDateTime from, LocalDateTime to,
                                               Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        // Same fix as AdminJobServiceImpl's resolveJobsForMetrics — exclude applications whose
        // parent job has been soft-deleted, not just soft-deleted applications themselves.
        StringBuilder where = new StringBuilder(
                "ja.organizationId = :organizationId AND (ja.isDeleted = false OR ja.isDeleted IS NULL) " +
                "AND (ja.job.isDeleted = false OR ja.job.isDeleted IS NULL)");
        if (jobId != null) where.append(" AND ja.job.id = :jobId");
        if (from != null) where.append(" AND ja.appliedAt >= :from");
        if (to != null) where.append(" AND ja.appliedAt <= :to");
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

    private Map<String, Object> buildOrgMetricsParams(Integer organizationId, Integer jobId, LocalDateTime from, LocalDateTime to,
                                                        Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        Map<String, Object> params = new HashMap<>();
        params.put("organizationId", organizationId);
        if (jobId != null) params.put("jobId", jobId);
        if (from != null) params.put("from", from);
        if (to != null) params.put("to", to);
        if (classId != null) params.put("classId", classId);
        else if (batchId != null) params.put("batchId", batchId);
        if (programId != null) params.put("programId", programId);
        else if (departmentId != null) params.put("departmentId", departmentId);
        return params;
    }

    @Override
    public List<Map<String, Object>> getHiringFunnel(Integer jobId, Integer organizationId, LocalDateTime from, LocalDateTime to,
                                                     Integer departmentId, Integer programId, Integer batchId, Integer classId) {
        String[] stages = {"APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED"};

        // TRUE funnel semantics: cumulative "how many applications EVER reached stage X",
        // computed from JobApplicationStatusHistory — mirrors the identical fix in
        // AdminJobServiceImpl. This is deliberately different from getHiringMetrics's snapshot
        // (GROUP BY current applicationStatus): an application that reached INTERVIEW and was
        // later REJECTED must still count in the INTERVIEW bucket here, even though the
        // snapshot metrics bucket it under "rejected" only. Previously this method just
        // relabelled getHiringMetrics's current-status counts as "funnel" stages, which is a
        // plain snapshot in disguise and produces a non-monotonic, nonsensical funnel shape
        // plus wrong stage-to-stage conversion percentages on the dashboard.
        //
        // APPLIED needs no history lookup — every application starts there, so it's just the
        // total count of matching applications.
        String whereNative = buildOrgMetricsWhereClauseNative(organizationId, jobId, from, to, departmentId, programId, batchId, classId);
        String sql = "SELECT COUNT(*) AS applied, " + reachedStageSql("SHORTLISTED") + " AS shortlisted, "
                + reachedStageSql("ASSESSMENT") + " AS assessment, " + reachedStageSql("INTERVIEW") + " AS interview, "
                + reachedStageSql("OFFERED") + " AS offered, " + reachedStageSql("HIRED") + " AS hired "
                + "FROM job_application ja LEFT JOIN learner l ON l.id = ja.learner_id WHERE " + whereNative;
        javax.persistence.Query query = entityManager.createNativeQuery(sql);
        buildOrgMetricsParams(organizationId, jobId, from, to, departmentId, programId, batchId, classId).forEach(query::setParameter);
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

    @Override
    public List<Map<String, Object>> getCompanyWiseHiringReport(Integer organizationId, LocalDateTime from, LocalDateTime to,
                                                                 Integer departmentId, Integer programId, Integer batchId) {
        // Previously loaded every application for the organization into Java, grouped by job id,
        // then ran 7 filter/count passes PER JOB — a college running dozens of jobs meant hundreds
        // of full-list passes on every report load. One GROUP BY (job, status) query does all the
        // counting in the database, then jobs are looked up separately only for their display name.
        String where = buildOrgMetricsWhereClause(organizationId, null, from, to, departmentId, programId, batchId, null);
        Map<String, Object> params = buildOrgMetricsParams(organizationId, null, from, to, departmentId, programId, batchId, null);
        String countJpql = "SELECT ja.job.id, ja.applicationStatus, COUNT(ja) FROM JobApplication ja LEFT JOIN ja.learner l WHERE " + where
                + " GROUP BY ja.job.id, ja.applicationStatus";
        TypedQuery<Object[]> countQuery = entityManager.createQuery(countJpql, Object[].class);
        params.forEach(countQuery::setParameter);

        Map<Integer, Map<String, Long>> countsByJob = new HashMap<>();
        for (Object[] row : countQuery.getResultList()) {
            Integer rowJobId = (Integer) row[0];
            String status = String.valueOf(row[1]).toLowerCase(Locale.ROOT);
            long count = (Long) row[2];
            countsByJob.computeIfAbsent(rowJobId, k -> new HashMap<>()).put(status, count);
        }
        if (countsByJob.isEmpty()) {
            return new ArrayList<>();
        }

        List<Job> jobs = jobRepository.findAllById(countsByJob.keySet());
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
        // Item 10 of the placements re-audit: port AdminJobServiceImpl.getCompanyWiseHiringReport's
        // rollup-row logic so the two scoped views render consistently in the shared frontend — a
        // company running multiple drives gets a combined "All N roles at this company" total row
        // ahead of its individual job rows.
        //
        // ROUND 2 AUDIT FIX: same fix as AdminJobServiceImpl's port — group case-/whitespace-
        // insensitively (matching the compareToIgnoreCase sort above), not by exact String
        // equality. A companyId-linked job's companyName always mirrors the canonical Company.name
        // exactly, but a free-text job's companyName is unnormalized admin input, so the same real
        // company split into a linked job and a free-text job (the Company<->Job architecture
        // allows both to coexist) could previously land in two different buckets — e.g. "Acme Corp"
        // vs "acme corp " — and never get rolled up together.
        Map<String, List<Map<String, Object>>> byCompany = report.stream()
                .collect(Collectors.groupingBy(r -> String.valueOf(r.get("companyName")).trim().toLowerCase(Locale.ROOT),
                        LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> withTotals = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : byCompany.entrySet()) {
            List<Map<String, Object>> rows = entry.getValue();
            if (rows.size() > 1) {
                Map<String, Object> total = new HashMap<>();
                // entry.getKey() is the normalized grouping key, not fit for display — use the
                // first row's original-cased companyName instead.
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

    private void validateTargetingHierarchy(Job job) {
        // Unlike AdminJobServiceImpl (college-scoped, collegeId always required), this is the
        // org-scoped surface where org-wide/untargeted jobs (collegeId == null) are a legitimate,
        // supported category (see deleteJob's handling of the same case). The college ID is only
        // needed to validate targeting fields against that college, so only require it when at
        // least one targeting field is actually set; a job with no targeting has nothing to
        // validate here.
        boolean hasTargeting = job.getTargetDepartmentId() != null
                || job.getTargetProgramId() != null
                || job.getTargetBatchId() != null
                || job.getTargetClassId() != null;
        if (!hasTargeting) {
            return;
        }

        // Get college ID from job
        Integer jobCollegeId = job.getCollegeId();
        if (jobCollegeId == null) {
            throw new IllegalArgumentException("Job must have a college ID for targeting validation");
        }

        _Class targetClass = null;
        if (job.getTargetClassId() != null) {
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

        // Previously both blocks below only ran the existence/deleted check when the
        // more-specific field was ALSO set (batch+program, program+department) — picking only a
        // batch or only a program (the normal single-field targeting case) skipped validation
        // entirely, letting a stale/foreign/deleted id save and publish with zero error while
        // matching zero eligible learners.
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

        if (job.getTargetProgramId() != null) {
            NewProgram program = newProgramRepository.findById(job.getTargetProgramId())
                    .orElseThrow(() -> {
                        log.error("Program not found or deleted: programId={}, departmentId={}, jobId={}",
                                job.getTargetProgramId(), job.getTargetDepartmentId(), job.getId());
                        return new IllegalArgumentException("Target program not found with ID: " + job.getTargetProgramId() +
                                ". Program may have been deleted or does not exist.");
                    });
            if (Boolean.TRUE.equals(program.getIsDeleted())) {
                log.error("Attempted to use deleted program in job targeting: programId={}, departmentId={}",
                        job.getTargetProgramId(), job.getTargetDepartmentId());
                throw new IllegalArgumentException("Target program with ID: " + job.getTargetProgramId() + " has been deleted.");
            }
            if (job.getTargetDepartmentId() != null && !job.getTargetDepartmentId().equals(program.getDeptId())) {
                throw new IllegalArgumentException("Target program does not belong to the specified department");
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

    /**
     * Delegate to shared notification helper (single source of truth for all job status
     * notifications) — dispatched asynchronously so a bulk status-update loop doesn't block on
     * blocking email/SMS calls once per row, inside an open transaction, for the whole batch.
     *
     * Same fix as AdminJobServiceImpl's identical method: registered as an after-commit
     * synchronization instead of firing immediately, so the async re-fetch can never race the
     * still-open transaction's own commit (stale read, or a notification for a write that later
     * rolls back).
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

    /* REFACTORED: ~150 lines of duplicated notification code consolidated into JobNotificationHelper.
       Previously this was a near-identical copy of earlier job-notification logic. */
}

