package com._42students.lms.service.impl;

import com._42students.lms.event.ApplicationStatusChangedEvent;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.model.ApplicationScreening;
import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.dto.response.JobImportantDateEventDTO;
import com._42students.lms.dto.response.LearnerApplicationWithInterviewsDTO;
import com._42students.lms.exceptions.CustomException;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.service.JobService;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.service.ScreeningService;
import com._42students.lms.util.JobVisibilityCache;
import com._42students.lms.util.PlacementDateTimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * NEW FLOW: Target → Apply → Screen → Decide
 * 
 * PHILOSOPHY:
 * - Targeting decides who can SEE & APPLY (HARD - visibility gate)
 * - Screening decides who looks STRONG (post-apply evaluation)
 * - Humans decide who gets HIRED (recruiter decision)
 * 
 * NO hard eligibility rejection before apply.
 */
@Slf4j
@Service
public class JobServiceImpl implements JobService {

    // TPO V1: which other applications the college's placement rules still allow after an accept. Optional so the class works without it.
    @Autowired(required = false)
    private com._42students.lms.service.tpo.PlacementCascadePolicy placementCascadePolicy;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private com._42students.lms.repository.JobApplicationStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private BatchRepository batchRepository;



    @Autowired
    private ScreeningService screeningService;

    @Autowired
    private ApplicationScreeningRepository screeningRepository;

    @Autowired
    private com._42students.lms.repository.InterviewRepository interviewRepository;

    // Used only to fire the interview-specific cancellation notification/audit log when this
    // class's cancelNonTerminalInterviewsForApplicationLocked cascade cancels an interview as a
    // side effect of an application status change — see notifyInterviewCancelledByCascade's javadoc.
    // required=false: this class must keep working in test contexts that don't wire InterviewService.
    @Autowired(required = false)
    private com._42students.lms.service.InterviewService interviewService;

    @Autowired
    private JobVisibilityCache visibilityCache;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.utils.ContentUrlValidator contentUrlValidator;

    @Autowired(required = false)
    private com._42students.lms.service.JobApplicationStatusHistoryService statusHistoryService;

    @Autowired(required = false)
    private ApplicationEventPublisher eventPublisher;

    /** The placement cell's drive rules and debarments, checked when a student applies (lazy: these services depend on this one). */
    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.EligibilityService driveEligibility;

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.TpoStudentService tpoStudentService;

    /** TPO V1 offer rows (job_offer): closed here whenever a student answers an offer through this older path. */
    @Autowired(required = false)
    private com._42students.lms.repository.tpo.JobOfferRepository jobOfferRepository;

    @Autowired(required = false)
    private com._42students.lms.service.NotificationService notificationService;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // TPO V1 job_round data, for the S5 richer per-status sentences (Shortlisted/Waitlisted).
    // Optional: legacy (non-TPO-V1) drives never populate job_round, and this class must keep
    // working in test contexts that don't wire it.
    @Autowired(required = false)
    private com._42students.lms.repository.tpo.JobRoundRepository jobRoundRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * In-memory apply rate limit: per learner, max applies per minute. Lightweight, no heavy infra.
     *
     * <p><b>KNOWN LIMITATION (per-replica, not global):</b> this map is a static, in-JVM
     * {@link ConcurrentHashMap}. It is NOT shared across pods. This service currently runs with
     * 2 replicas in every environment (see k8s/*&#47;lms-be.yaml, {@code replicas: 2}), and a learner's
     * requests are not guaranteed to land on the same pod (typical round-robin / random Service
     * load balancing). The effective ceiling a learner can actually achieve is therefore up to
     * {@code APPLY_RATE_LIMIT_PER_MINUTE * <replica count>} applies per minute (currently 5 * 2 = 10/min),
     * not a hard global cap of {@code APPLY_RATE_LIMIT_PER_MINUTE}.
     *
     * <p>No shared/distributed store (Redis or otherwise) currently exists anywhere in this codebase
     * (verified: no {@code spring.redis.*} config in any application*.properties, no Redis client
     * dependency in pom.xml, and the only existing {@code @EnableCaching} setup —
     * {@link com._42students.lms.config.CacheConfig} — uses local Caffeine, not a distributed cache).
     * Fixing this properly requires introducing new shared-state infrastructure (e.g. Redis with
     * INCR+TTL), which is out of scope for a low-risk fix pass. Tracked as a known gap rather than
     * silently assumed to be a hard per-learner cap.
     */
    private static final int APPLY_RATE_LIMIT_PER_MINUTE_DEFAULT = 5;
    private static final long APPLY_RATE_WINDOW_MS = 60_000L;
    private static final Map<Integer, List<Long>> APPLY_TIMESTAMPS_BY_LEARNER = new ConcurrentHashMap<>();

    // GLOBAL, not per-college: raising this during a high-traffic drive window (the audit's own
    // framing — "can't be raised during a drive") is an operational lever a superadmin needs fast,
    // and every college shares the same backend replicas/capacity this limit is protecting.
    private int applyRateLimitPerMinute() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "placement.applyRateLimitPerMinute", APPLY_RATE_LIMIT_PER_MINUTE_DEFAULT)
                : APPLY_RATE_LIMIT_PER_MINUTE_DEFAULT;
    }

    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Override
    public List<Job> getAllActiveJobsForLearnerOrganization(Integer learnerId) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));
        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
        if (!scope.hasOrganization()) {
            log.warn("Learner {} has no organization (direct or resolved), returning empty job list", learnerId);
            return Collections.emptyList();
        }
        return jobRepository.findAllActiveJobsByOrganization(scope.getOrganizationId());
    }

    /**
     * @deprecated This method returns jobs from all organizations (security risk)
     * Use getAllActiveJobsForLearnerOrganization instead
     */
    @Deprecated
    @Override
    public List<Job> getAllActiveJobs() {
        log.warn("DEPRECATED: getAllActiveJobs() called - returns jobs from all organizations. Use getAllActiveJobsForLearnerOrganization() instead.");
        return jobRepository.findAllActiveJobs();
    }

    @Override
    public Job getJobById(Integer jobId) {
        return jobRepository.findActiveJobById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found or not active: " + jobId));
    }

    /**
     * Get jobs visible to a learner
     * Visibility based ONLY on:
     * - Organization match
     * - Targeting hierarchy (Department/Program/Batch/Class)
     * - Job active flag
     * - Application deadline not passed
     * 
     * STALE VISIBILITY FIX: Uses cache with hierarchy-based keys to prevent stale data.
     * Cache key includes organizationId, classId, batchId, programId.
     * 
     * DO NOT check: Skills, GPA, Degree, Specialization
     */
    @Override
    public List<Job> getVisibleJobsForLearner(Integer learnerId) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));

        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);

        if (!scope.hasOrganization()) {
            log.warn("Learner {} has no organization (direct or resolved), returning empty job list", learnerId);
            return Collections.emptyList();
        }
        if (scope.getClassId() == null || scope.getProgramId() == null) {
            log.warn("Learner {} has incomplete hierarchy (classId: {}, programId: {}). Returning empty list.",
                    learnerId, scope.getClassId(), scope.getProgramId());
            return Collections.emptyList();
        }

        List<Job> cachedJobs = visibilityCache.getCachedVisibleJobs(
                scope.getOrganizationId(), scope.getCollegeId(), scope.getClassId(),
                scope.getBatchId(), scope.getProgramId());

        if (cachedJobs != null) {
            log.debug("Returning {} cached visible jobs for learner {}", cachedJobs.size(), learnerId);
            return new ArrayList<>(cachedJobs);
        }

        log.debug("Cache MISS for learner {} - calculating visibility", learnerId);

        List<Job> orgJobs = jobRepository.findAllActiveJobsByOrganization(scope.getOrganizationId());
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);

        List<Job> visibleJobs = orgJobs.stream()
                .filter(job -> isJobVisibleToLearner(job,
                        scope.getOrganizationId(), scope.getCollegeId(),
                        scope.getClassId(), scope.getProgramId(),
                        scope.getBatchId(), now))
                .collect(Collectors.toList());

        visibilityCache.cacheVisibleJobs(
                scope.getOrganizationId(), scope.getCollegeId(), scope.getClassId(),
                scope.getBatchId(), scope.getProgramId(), visibleJobs);

        return visibleJobs;
    }

    /**
     * Check if a job is visible to a learner
     * Based ONLY on targeting + active + deadline
     * 
     * EVENT ORDERING FIX: Validates hierarchy is complete before checking visibility
     */
    @Override
    public VisibilityResult checkJobVisibility(Integer learnerId, Integer jobId) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));

        Job job;
        try {
            job = getJobById(jobId);
        } catch (IllegalArgumentException e) {
            return new VisibilityResult(false, "Job not found or not active");
        }

        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);

        if (!scope.hasOrganization()) {
            return new VisibilityResult(false, "Learner has no organization assigned");
        }
        if (scope.getClassId() == null || scope.getProgramId() == null) {
            return new VisibilityResult(false,
                    "Learner hierarchy is incomplete. Ensure learner is fully onboarded with classId and programId set.");
        }
        if (!scope.getOrganizationId().equals(job.getOrganizationId())) {
            return new VisibilityResult(false, "Job is not available in your organization");
        }
        if (!job.getIsActive()) {
            return new VisibilityResult(false, "Job is not active");
        }
        // Keep in sync with applyToJob's EXTERNAL_ONLY guard and the list-building SQL
        // (findAllActiveJobsByOrganization) — an EXTERNAL_ONLY job must never be reported as
        // visible even though it can otherwise pass every other check here.
        if ("EXTERNAL_ONLY".equals(job.getVisibilityType())) {
            return new VisibilityResult(false, "This job only accepts applications through the external application process");
        }
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(now)) {
            return new VisibilityResult(false, "Application deadline has passed");
        }
        if (!matchesHierarchicalTargeting(job, scope.getCollegeId(), scope.getClassId(),
                scope.getProgramId(), scope.getBatchId())) {
            return new VisibilityResult(false, "This job is not available for your department/program/batch/class");
        }

        return new VisibilityResult(true, "Job is visible and you can apply");
    }

    /**
     * Check if job is visible to learner using centralized scope resolution.
     */
    private boolean isJobVisibleToLearner(Job job, Learner learner, LocalDateTime now) {
        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);
        return isJobVisibleToLearner(job,
                scope.getOrganizationId(), scope.getCollegeId(),
                scope.getClassId(), scope.getProgramId(),
                scope.getBatchId(), now);
    }

    /**
     * Check if job is visible using resolved effective hierarchy (used when learner fields are resolved from class/org).
     */
    private boolean isJobVisibleToLearner(Job job, Integer orgId, Integer collegeId,
                                         Integer classId, Integer programId, Integer batchId, LocalDateTime now) {
        if (orgId == null || !orgId.equals(job.getOrganizationId())) return false;
        if (!job.getIsActive()) return false;
        // Keep in sync with applyToJob's EXTERNAL_ONLY guard and checkJobVisibility above.
        if ("EXTERNAL_ONLY".equals(job.getVisibilityType())) return false;
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(now)) return false;
        return matchesHierarchicalTargeting(job, collegeId, classId, programId, batchId);
    }

    /**
     * Hierarchical targeting check using effective IDs (no Learner entity).
     */
    private boolean matchesHierarchicalTargeting(Job job, Integer collegeId, Integer classId,
                                                 Integer programId, Integer batchId) {
        if (job.getCollegeId() == null
                && job.getTargetClassId() == null
                && job.getTargetBatchId() == null
                && job.getTargetProgramId() == null
                && job.getTargetDepartmentId() == null) {
            return true;
        }
        if (job.getCollegeId() != null) {
            if (collegeId == null || !collegeId.equals(job.getCollegeId())) return false;
        }
        if (job.getTargetClassId() != null) {
            return classId != null && classId.equals(job.getTargetClassId());
        }
        if (job.getTargetBatchId() != null) {
            if (classId == null || batchId == null) return false;
            return batchId.equals(job.getTargetBatchId());
        }
        if (job.getTargetProgramId() != null) {
            return programId != null && programId.equals(job.getTargetProgramId());
        }
        if (job.getTargetDepartmentId() != null) {
            if (programId == null) return false;
            return newProgramRepository.findById(programId)
                    .map(np -> np.getDeptId() == job.getTargetDepartmentId().intValue())
                    .orElse(false);
        }
        return true;
    }

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
     * - Screening runs synchronously (triggered by ScreeningService)
     */
    @Override
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public JobApplication applyToJob(Integer learnerId, Integer jobId, String resumeUrl) {
        log.info("Learner {} applying to job {} with resume: {}", learnerId, jobId, resumeUrl != null ? "provided" : "none");

        // Phase 6 - 19.7: Validate resume URL format when provided. This only checked length and
        // a bare http(s) shape — unlike the profile resume path (LearnerProfileController's
        // validateResumeRef/validateOwnedStorageRef), it never verified the URL was actually
        // HTTPS, from an allowed host/storage key, or scoped to THIS learner's own
        // resumes/user-{learnerId}/ folder. A learner could submit any http(s) URL as their
        // application resume — including, if ever seen, another learner's resume URL, since
        // nothing tied it to the caller's own uploaded file. The real upload paths
        // (JobDetailContent.jsx's direct upload and "From Drive" import) both already produce a
        // URL in exactly this shape, so tightening this doesn't affect legitimate submissions.
        if (resumeUrl != null && !resumeUrl.trim().isEmpty()) {
            String trimmed = resumeUrl.trim();
            if (trimmed.length() > 2048) {
                throw new IllegalArgumentException("Resume URL must be at most 2048 characters");
            }
            if (!trimmed.startsWith("https://")) {
                throw new IllegalArgumentException("Resume URL must use HTTPS");
            }
            if (contentUrlValidator != null
                    && !contentUrlValidator.isAllowedContentUrl(trimmed)
                    && !contentUrlValidator.isAllowedStorageKey(trimmed)) {
                throw new IllegalArgumentException("Resume URL is not from an allowed storage location");
            }
            ResolvedLearnerScope scope = scopeResolutionService != null ? scopeResolutionService.resolveFullScope(learnerId) : null;
            if (scope == null || scope.getOrganizationId() == null || scope.getCollegeId() == null) {
                throw new IllegalArgumentException("Could not resolve tenant scope for resume upload");
            }
            String expectedSegment = "org-" + scope.getOrganizationId() + "/college-" + scope.getCollegeId() + "/resumes/user-" + learnerId + "/";
            if (!trimmed.contains(expectedSegment)) {
                throw new IllegalArgumentException("Resume must be uploaded under your own profile");
            }
        }

        // HARDENING: Global per-learner apply rate limit (e.g. 5 per minute)
        long nowMs = System.currentTimeMillis();
        synchronized (APPLY_TIMESTAMPS_BY_LEARNER) {
            List<Long> timestamps = APPLY_TIMESTAMPS_BY_LEARNER.computeIfAbsent(learnerId, k -> new ArrayList<>());
            timestamps.removeIf(t -> nowMs - t > APPLY_RATE_WINDOW_MS);
            // Remove the entry entirely if empty to prevent unbounded map growth
            if (timestamps.isEmpty()) {
                APPLY_TIMESTAMPS_BY_LEARNER.remove(learnerId);
                timestamps = APPLY_TIMESTAMPS_BY_LEARNER.computeIfAbsent(learnerId, k -> new ArrayList<>());
            }
            if (timestamps.size() >= applyRateLimitPerMinute()) {
                throw new CustomException("Too many applications in the last minute. Please try again shortly.", HttpStatus.TOO_MANY_REQUESTS);
            }
            timestamps.add(nowMs);
        }

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));

        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);

        if (!scope.hasOrganization()) {
            throw new IllegalArgumentException("Learner has no organization assigned");
        }
        // getVisibleJobsForLearner/checkJobVisibility both reject a learner with an incomplete
        // hierarchy (empty list / "not visible"), but applyToJob never repeated this check —
        // for a fully untargeted (org-wide, no class/batch/program/department set) job,
        // matchesHierarchicalTargeting returns true unconditionally without ever looking at
        // classId/programId, so a learner who sees an EMPTY job list (because their hierarchy
        // is incomplete) could still successfully apply to any such job by knowing its id.
        if (scope.getClassId() == null || scope.getProgramId() == null) {
            throw new IllegalArgumentException("Learner hierarchy is incomplete; cannot apply to jobs.");
        }

        Job job = getJobById(jobId);

        if (!scope.getOrganizationId().equals(job.getOrganizationId())) {
            throw new IllegalArgumentException("Cannot apply to jobs from different organization");
        }

        if (!job.getIsActive()) {
            throw new IllegalArgumentException("Job is not active");
        }

        // A gap between "visible to learner" (SQL-level, correctly excludes EXTERNAL_ONLY from
        // list/search queries) and "acceptable for application" (no equivalent check here) let a
        // learner who knew/guessed an EXTERNAL_ONLY job's id apply directly, leaking an internal
        // application into a channel meant to route exclusively through an external ATS.
        if ("EXTERNAL_ONLY".equals(job.getVisibilityType())) {
            throw new IllegalArgumentException("This job only accepts applications through the external application process");
        }

        // The drive form sends the deadline as UTC (DriveFormPage serverTime: timestamp conventions kind 3), so it is compared
        // with UTC now. Do not switch this to India time: that closes applications 5.5 hours early.
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(now)) {
            throw new IllegalArgumentException("Application deadline has passed");
        }

        if (!matchesHierarchicalTargeting(job, scope.getCollegeId(), scope.getClassId(),
                scope.getProgramId(), scope.getBatchId())) {
            log.warn("Application eligibility check failed - Learner {} (orgId: {}, programId: {}, classId: {}, collegeId: {}) does not match job {} targeting (orgId: {}, collegeId: {}, deptId: {}, programId: {}, batchId: {}, classId: {})",
                learner.getId(),
                scope.getOrganizationId(),
                scope.getProgramId(),
                scope.getClassId(),
                scope.getCollegeId(),
                job.getId(),
                job.getOrganizationId(),
                job.getCollegeId(),
                job.getTargetDepartmentId(),
                job.getTargetProgramId(),
                job.getTargetBatchId(),
                job.getTargetClassId());
            throw new IllegalArgumentException("You are not eligible to apply to this job based on targeting");
        }
        requireDriveRulesMet(job, learner);

        // CONCURRENCY FIX: applyToJob runs READ_COMMITTED because its first validation reads
        // happen BEFORE this lock. Under MySQL REPEATABLE READ those reads can establish a snapshot;
        // after a second tab waits here for the first tab to commit, a later plain application
        // lookup could still read that older snapshot and miss the winning insert. READ_COMMITTED
        // makes the post-lock duplicate lookup below see the latest committed row, so the second
        // request returns it idempotently. We deliberately avoid adding an Application-row lock
        // here because interview scheduling uses Application -> Job lock order; Job -> Application
        // would introduce an avoidable cross-table deadlock cycle.
        //
        // The Job lock also preserves the earlier delete/close race protection: job above was read
        // via getJobById's plain (unlocked) findActiveJobById, and nothing stops AdminJobServiceImpl /
        // PlacementJobServiceImpl.deleteJob (a soft-delete UPDATE) from committing in the window
        // between that read and this method's application insert/reactivation below, letting a
        // brand-new application slip through against a job that's simultaneously (or by now
        // already) deleted — the exact gap the "DATA CONSISTENCY ERROR" log further down could
        // only detect after the fact, never prevent. Re-verify under a PESSIMISTIC_WRITE lock on
        // the Job row immediately before the write section: this serializes against deleteJob's
        // UPDATE, which takes the same row's write lock at flush time, so whichever transaction
        // commits first is the one this method observes.
        Job lockedJob = jobRepository.lockJobById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
        if (!Boolean.TRUE.equals(lockedJob.getIsActive()) || Boolean.TRUE.equals(lockedJob.getIsDeleted())) {
            throw new IllegalArgumentException("Job is not active");
        }

        // Check if already applied or has a withdrawn (soft-deleted) row to reactivate
        Optional<JobApplication> existingApplication = jobApplicationRepository.findByLearnerIdAndJobIdIncludeDeleted(learnerId, jobId);
        if (existingApplication.isPresent()) {
            JobApplication existing = existingApplication.get();
            if (!Boolean.TRUE.equals(existing.getIsDeleted())) {
                // Idempotent replay: the Job row is held under PESSIMISTIC_WRITE immediately
                // above, so two tabs hitting Apply for the same job serialize here. Once the
                // first transaction commits, the second sees the already-created APPLIED row.
                // Returning that same row makes a repeated submission safe without creating a
                // duplicate event/screening/notification. More advanced statuses are NOT treated
                // as replays: by then the request is no longer the same "create application"
                // operation and normal state-machine messaging must win.
                if ("APPLIED".equalsIgnoreCase(existing.getApplicationStatus())) {
                    log.info("Idempotent application replay for learner {} job {}; returning application {}",
                            learnerId, jobId, existing.getId());
                    return existing;
                }
                // A REJECTED row that's still isDeleted=false can arrive here three ways: an
                // admin directly rejected an APPLIED application, a learner declined an offer
                // via respondToOffer, or withdrawApplication's OFFERED special-case (which
                // converts to REJECTED rather than a real withdrawal, see JP-02/JP-04) — none of
                // these set statusBeforeWithdrawal, since none of them go through the
                // soft-delete withdrawal path below.
                if ("REJECTED".equalsIgnoreCase(existing.getApplicationStatus())) {
                    throw new IllegalArgumentException("You cannot re-apply to this job. Your previous application reached status: REJECTED");
                }
                throw new IllegalArgumentException("You have already applied to this job");
            }
            // JP-01/JP-04: Block re-application if the previous application reached an advanced or
            // terminal status. existing.getApplicationStatus() is always "WITHDRAWN" at this
            // point (withdrawal overwrites it) — statusBeforeWithdrawal is what actually carries
            // the status that matters for this check; without it, a candidate who reached OFFERED
            // and withdrew could always restart the same job's pipeline from scratch.
            String prevStatus = existing.getStatusBeforeWithdrawal();
            if (prevStatus != null) {
                switch (prevStatus.toUpperCase()) {
                    case "SHORTLISTED":
                    case "ASSESSMENT":
                    case "INTERVIEW":
                    case "WAITLISTED":
                    case "OFFERED":
                    case "REJECTED":
                        // WAITLISTED was missing from this list — a candidate only reaches it via
                        // INTERVIEW (see JobApplicationStatusValidator: INTERVIEW -> WAITLISTED),
                        // so it represents progress at least as advanced as INTERVIEW, which IS
                        // blocked here. Without this case, a WAITLISTED candidate who withdrew
                        // could restart the same job's pipeline from scratch even though an
                        // equally-advanced (or less advanced) INTERVIEW candidate could not.
                        throw new IllegalArgumentException("You cannot re-apply to this job. Your previous application reached status: " + prevStatus);
                    default:
                        break;
                }
            }
            // Reactivate the withdrawn application
            // NOTE: This WITHDRAWN->APPLIED transition deliberately bypasses
            // JobApplicationStatusValidator (which declares WITHDRAWN terminal) — eligibility is
            // enforced by the statusBeforeWithdrawal check above instead. See
            // JobApplicationStatusValidator's WITHDRAWN mapping comment.
            log.info("Reactivating withdrawn application {} for learner {} on job {}", existing.getId(), learnerId, jobId);
            existing.setIsDeleted(false);
            existing.setApplicationStatus("APPLIED");
            existing.setStatusBeforeWithdrawal(null);
            existing.setOrganizationId(job.getOrganizationId());
            existing.setSource("INTERNAL");
            existing.setStatusUpdatedBy(null);
            existing.setStatusUpdatedAt(null);
            String newResumeUrl = null;
            if (resumeUrl != null && !resumeUrl.trim().isEmpty()) {
                newResumeUrl = resumeUrl.trim();
            } else if (learner.getResumeUrl() != null && !learner.getResumeUrl().trim().isEmpty()) {
                newResumeUrl = learner.getResumeUrl();
            }
            if (newResumeUrl != null && !newResumeUrl.equals(existing.getResumeUrl())) {
                String previousResumeUrl = existing.getResumeUrl();
                if (previousResumeUrl != null && !previousResumeUrl.isBlank()) {
                    java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
                    if (existing.getResumeHistory() instanceof java.util.List<?> existingHistory) {
                        for (Object entry : existingHistory) {
                            if (entry instanceof java.util.Map<?, ?> map) {
                                java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                                map.forEach((k, v) -> row.put(String.valueOf(k), v));
                                history.add(row);
                            }
                        }
                    }
                    java.util.Map<String, Object> snapshot = new java.util.LinkedHashMap<>();
                    snapshot.put("url", previousResumeUrl);
                    snapshot.put("replacedAt", java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).toString());
                    history.add(snapshot);
                    existing.setResumeHistory(history);
                }
                existing.setResumeUrl(newResumeUrl);
            }
            JobApplication savedApplication = jobApplicationRepository.saveAndFlush(existing);
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new ApplicationStatusChangedEvent(savedApplication.getId(), "WITHDRAWN", "APPLIED", null, null));
            }
            log.info("Withdrawn application reactivated: Learner {} re-applied to job {} (App ID: {})",
                    learnerId, jobId, savedApplication.getId());
            sendJobApplicationConfirmation(savedApplication, learner, job);
            // Reactivation used to skip screening entirely, leaving whatever score/status the
            // FIRST application cycle produced (possibly stale, possibly FAILED) attached to a
            // freshly-resubmitted application — recruiters would see a screening result that
            // doesn't correspond to the live cycle. screenApplication updates the existing
            // ApplicationScreening row in place rather than requiring a fresh one.
            try {
                screeningService.screenApplication(savedApplication);
            } catch (Exception e) {
                log.error("Screening failure on reactivation for application {} (reapply succeeded): {}", savedApplication.getId(), e.getMessage(), e);
            }
            return savedApplication;
        }

        // Create new application - NO eligibility checks beyond visibility
        JobApplication application = new JobApplication();
        application.setIsDeleted(false);
        application.setLearner(learner);
        application.setJob(job);
        application.setApplicationStatus("APPLIED");
        application.setOrganizationId(job.getOrganizationId());
        
        // Set source as INTERNAL for LMS student applications
        application.setSource("INTERNAL");
        
        // Set resume URL (use provided resumeUrl or fallback to learner's profile resume)
        if (resumeUrl != null && !resumeUrl.trim().isEmpty()) {
            application.setResumeUrl(resumeUrl.trim());
            log.debug("Using provided resume URL for application");
        } else if (learner.getResumeUrl() != null && !learner.getResumeUrl().trim().isEmpty()) {
            // Fallback to learner's profile resume if no resume provided in application
            application.setResumeUrl(learner.getResumeUrl());
            log.debug("Using learner profile resume URL for application");
        } else {
            log.debug("No resume URL available for application");
        }

        // CRITICAL FIX: Use saveAndFlush to ensure ID is immediately available
        // Do NOT use entityManager.clear() as it detaches entities and causes screening issues
        JobApplication savedApplication;
        try {
            savedApplication = jobApplicationRepository.saveAndFlush(application);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // The production schema has a UNIQUE(learner_id, job_id) constraint as the final
            // database-safety net. Never query-and-return from THIS transaction after a failed
            // flush: Hibernate/Spring may already have marked it rollback-only, which can turn a
            // seemingly successful return into UnexpectedRollbackException at commit. The normal
            // same-service race is serialized by the locked Job row above and returns idempotently;
            // if some other writer still wins the unique race, propagate the integrity exception
            // so JobController returns a clean 409 and the transaction rolls back normally.
            log.warn("Database uniqueness prevented a duplicate application for learner {} job {}", learnerId, jobId);
            throw e;
        }
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(savedApplication.getId(), null, "APPLIED", null, null));
        }
        // Verify application has a valid ID before creating screening (ID > 0 means it was persisted)
        if (savedApplication.getId() <= 0) {
            throw new IllegalStateException("Application ID is invalid after save (ID: " + savedApplication.getId() + ") - cannot create screening");
        }
        
        // Data consistency validation (non-blocking, logs warnings only)
        try {
            // Validate job and learner still exist and are not deleted
            if (savedApplication.getJob() != null) {
                Optional<Job> jobCheck = jobRepository.findById(savedApplication.getJob().getId());
                if (jobCheck.isEmpty() || Boolean.TRUE.equals(jobCheck.get().getIsDeleted())) {
                    log.error("DATA CONSISTENCY ERROR: Job {} referenced by JobApplication {} does not exist or is deleted",
                            savedApplication.getJob().getId(), savedApplication.getId());
                }
            }
            if (savedApplication.getLearner() != null) {
                Optional<Learner> learnerCheck = learnerRepository.findById(savedApplication.getLearner().getId());
                if (learnerCheck.isEmpty() || Boolean.TRUE.equals(learnerCheck.get().getIsDeleted())) {
                    log.error("DATA CONSISTENCY ERROR: Learner {} referenced by JobApplication {} does not exist or is deleted",
                            savedApplication.getLearner().getId(), savedApplication.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Data consistency check failed (non-critical): {}", e.getMessage());
            // Don't fail application creation if consistency check fails
        }
        
        log.info("Application created: Learner {} applied to job {} (Org: {}, App ID: {})", 
                learnerId, jobId, job.getOrganizationId(), savedApplication.getId());

        // Send confirmation email immediately after application submission
        sendJobApplicationConfirmation(savedApplication, learner, job);

        // HARDENING: Screening extracted for future async replacement; failures do not break apply; idempotent.
        triggerScreeningAfterApply(savedApplication);

        return savedApplication;
    }

    /**
     * Trigger screening after application is created. Extracted for clarity and future async replacement.
     * Screening failures are logged and marked FAILED; apply still succeeds. Idempotent (create PENDING once, then run).
     * Do NOT introduce queue here; this remains synchronous until explicitly migrated.
     */
    private void triggerScreeningAfterApply(JobApplication savedApplication) {
        try {
            Optional<ApplicationScreening> existingScreening = screeningRepository.findByApplicationId(savedApplication.getId());
            if (!existingScreening.isPresent()) {
                ApplicationScreening screening = new ApplicationScreening();
                screening.setApplication(savedApplication);
                screening.setScreeningStatus("PENDING");
                screening.setOverallScore(null);
                screening.setSkillScore(null);
                screening.setEducationScore(null);
                screening.setIsDeleted(false);
                screeningRepository.saveAndFlush(screening);
                log.info("Created pending screening for application {}", savedApplication.getId());
            }
            screeningService.screenApplication(savedApplication);
            log.info("Screening completed for application {}", savedApplication.getId());
        } catch (Exception e) {
            log.error("Screening failure for application {} (apply succeeded): {}", savedApplication.getId(), e.getMessage(), e);
            try {
                Optional<ApplicationScreening> screeningOpt = screeningRepository.findByApplicationId(savedApplication.getId());
                if (screeningOpt.isPresent()) {
                    ApplicationScreening screening = screeningOpt.get();
                    screening.setScreeningStatus("FAILED");
                    screening.setExplanation("Screening failed: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
                    screeningRepository.save(screening);
                }
            } catch (Exception ex) {
                log.warn("Could not mark screening as failed: {}", ex.getMessage());
            }
        }
    }

    /**
     * SCREENING STATE EXPLICIT: Create screening record with PENDING status immediately on apply
     * This makes it clear that screening is NOT instant - frontend should not assume screening is done
     */
    @Transactional
    private void createPendingScreening(JobApplication application) {
        // CRITICAL VALIDATION: Ensure application has valid ID
        if (application == null) {
            log.warn("Cannot create screening: application is null");
            return; // Don't throw - screening can be created later
        }
        if (application.getId() <= 0) {
            log.warn("Cannot create screening: Application ID is invalid: {}", application.getId());
            return; // Don't throw - screening can be created later
        }
        
        try {
            // Check if screening already exists (shouldn't happen, but defensive check)
            Optional<ApplicationScreening> existingScreening = screeningRepository.findByApplicationId(application.getId());
            if (existingScreening.isPresent()) {
                log.warn("Screening record already exists for application {} with status {}", 
                        application.getId(), existingScreening.get().getScreeningStatus());
                return;
            }

            // Create new screening record with PENDING status
            ApplicationScreening screening = new ApplicationScreening();
            screening.setApplication(application);
            screening.setScreeningStatus("PENDING");
            // Scores are null until screening completes
            screening.setOverallScore(null);
            screening.setSkillScore(null);
            screening.setEducationScore(null);
            // CRITICAL FIX: Explicitly set isDeleted to false
            // BaseModel.isDeleted is Boolean (null by default), but queries use "isDeleted = false"
            screening.setIsDeleted(false);
            
            screeningRepository.saveAndFlush(screening);
            log.info("Created pending screening for application {}", application.getId());
        } catch (Exception e) {
            log.error("Failed to create screening for application {} (ID: {}): {}", 
                    application.getId(), application.getId(), e.getMessage(), e);
            // Don't fail the entire application - screening can be created later
            log.warn("Continuing without screening record for application {}. Screening can be created manually if needed.", application.getId());
        }
    }

    /**
     * SCREENING STATE EXPLICIT: Mark screening as FAILED if screening throws exception
     */
    @Transactional
    private void markScreeningFailed(Integer applicationId, String errorMessage) {
        Optional<ApplicationScreening> screeningOpt = screeningRepository.findByApplicationId(applicationId);
        if (screeningOpt.isPresent()) {
            ApplicationScreening screening = screeningOpt.get();
            screening.setScreeningStatus("FAILED");
            screening.setExplanation("Screening failed: " + (errorMessage != null ? errorMessage : "Unknown error"));
            screeningRepository.save(screening);
            log.warn("Marked screening as FAILED for application {}: {}", applicationId, errorMessage);
        } else {
            log.error("Cannot mark screening as FAILED - screening record not found for application {}", applicationId);
        }
    }

    @Override
    public List<JobApplication> getLearnerApplications(Integer learnerId) {
        return jobApplicationRepository.findByLearnerId(learnerId);
    }

    @Override
    public List<LearnerApplicationWithInterviewsDTO> getLearnerApplicationsWithInterviews(Integer learnerId) {
        List<JobApplication> applications = jobApplicationRepository.findByLearnerIdIncludingWithdrawn(learnerId);
        if (applications.isEmpty()) return Collections.emptyList();

        List<Integer> applicationIds = applications.stream()
                .map(JobApplication::getId)
                .collect(Collectors.toList());

        java.time.LocalDateTime nowUtc = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
        List<Interview> upcoming = interviewRepository.findUpcomingByApplicationIds(applicationIds, nowUtc);

        // Map: applicationId -> earliest (next) interview
        Map<Integer, Interview> nextByAppId = new HashMap<>();
        for (Interview i : upcoming) {
            int appId = i.getJobApplication().getId();
            nextByAppId.putIfAbsent(appId, i); // first occurrence per app is earliest (ordered by scheduledDate ASC)
        }

        // Student V1 §1 "What the student sees for each stage": a rejection must name the round
        // reached ("Not cleared: Interview"), never a bare "Rejected". The prior stage isn't on
        // the application row itself, but the history row that made it REJECTED has it as its own
        // oldStatus — one bulk query, no N+1.
        Map<Integer, String> priorStageBeforeRejection = new HashMap<>();
        for (JobApplicationStatusHistory h : statusHistoryRepository
                .findByApplicationIdsAndNewStatusOrderByChangedAtAsc(applicationIds, "REJECTED")) {
            priorStageBeforeRejection.put(h.getApplicationId(), h.getOldStatus()); // ASC order: last write wins = most recent rejection
        }

        // Student V1 §1's richer Shortlisted/Waitlisted sentences need job_round data, which only
        // TPO-V1 drives populate. Round 1 (lowest seq) of each distinct job is what a freshly
        // SHORTLISTED application is waiting on; a WAITLISTED application's current_round_id is
        // the round that put it on hold (TpoResultsService.applyRound stamps it there on HOLD).
        Map<Integer, com._42students.lms.model.tpo.JobRound> firstRoundByJobId = new HashMap<>();
        Map<Long, com._42students.lms.model.tpo.JobRound> roundById = new HashMap<>();
        if (jobRoundRepository != null) {
            java.util.Set<Integer> jobIdsNeedingFirstRound = applications.stream()
                    .filter(a -> "SHORTLISTED".equalsIgnoreCase(a.getApplicationStatus()))
                    .map(a -> a.getJob() != null ? a.getJob().getId() : null)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
            for (Integer jobId : jobIdsNeedingFirstRound) {
                jobRoundRepository.findByJobIdOrderBySeqAsc(jobId).stream().findFirst()
                        .ifPresent(r -> firstRoundByJobId.put(jobId, r));
            }
            List<Long> roundIdsNeeded = applications.stream()
                    .filter(a -> "WAITLISTED".equalsIgnoreCase(a.getApplicationStatus()))
                    .map(JobApplication::getCurrentRoundId)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            if (!roundIdsNeeded.isEmpty()) {
                for (com._42students.lms.model.tpo.JobRound r : jobRoundRepository.findAllById(roundIdsNeeded)) {
                    roundById.put(r.getId(), r);
                }
            }
        }

        return applications.stream()
                .map(app -> {
                    LearnerApplicationWithInterviewsDTO dto = new LearnerApplicationWithInterviewsDTO(app,
                            LearnerApplicationWithInterviewsDTO.LearnerInterviewView.from(nextByAppId.get(app.getId())));
                    com._42students.lms.model.tpo.JobRound firstRound = app.getJob() != null ? firstRoundByJobId.get(app.getJob().getId()) : null;
                    com._42students.lms.model.tpo.JobRound waitlistRound = app.getCurrentRoundId() != null ? roundById.get(app.getCurrentRoundId()) : null;
                    dto.getApplication().setStageLabel(computeStageLabel(app, priorStageBeforeRejection.get(app.getId()), firstRound, waitlistRound));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private static final java.time.format.DateTimeFormatter STAGE_LABEL_DATE_FORMAT =
            java.time.format.DateTimeFormatter.ofPattern("d MMM");

    /**
     * Student V1 §1's exact wording table. REJECTED names the round it didn't clear
     * ("Not cleared: Interview"), never a bare "Rejected". SHORTLISTED and WAITLISTED get the
     * spec's richer per-status sentences when TPO-V1 job_round data is available to fill them in
     * ("Shortlisted for Technical Interview (12 Oct)" / "Waitlisted for Technical Interview —
     * you'll hear by 12 Oct"); a legacy (non-TPO-V1) drive with no job_round rows keeps the plain
     * label rather than fabricating a round name or date the backend doesn't actually have.
     */
    private String computeStageLabel(JobApplication app, String priorStageBeforeRejection,
            com._42students.lms.model.tpo.JobRound firstRound, com._42students.lms.model.tpo.JobRound waitlistRound) {
        String status = String.valueOf(app.getApplicationStatus()).toUpperCase(java.util.Locale.ROOT);
        if ("WITHDRAWN".equals(status)) {
            return "PLACED_ELSEWHERE".equals(app.getWithdrawalReason()) ? "Withdrawn: placed elsewhere" : "Withdrawn";
        }
        if ("SHORTLISTED".equals(status)) {
            if (firstRound == null) return null; // frontend keeps its existing plain label
            return "Shortlisted for " + firstRound.getName() + " (" + roundDateText(firstRound.getScheduledDate()) + ")";
        }
        if ("WAITLISTED".equals(status)) {
            if (waitlistRound == null) return null; // frontend keeps its existing plain label
            return "Waitlisted for " + waitlistRound.getName() + " — you'll hear by " + roundDateText(waitlistRound.getResultsDue());
        }
        if (!"REJECTED".equals(status)) {
            return null; // frontend keeps its existing plain label for every other status
        }
        if (priorStageBeforeRejection == null) return "Not shortlisted";
        switch (priorStageBeforeRejection.toUpperCase(java.util.Locale.ROOT)) {
            case "APPLIED": return "Not shortlisted";
            case "SHORTLISTED": return "Not cleared: Shortlisting";
            case "ASSESSMENT": return "Not cleared: Assessment";
            case "INTERVIEW": return "Not cleared: Interview";
            case "WAITLISTED": return "Waitlist ended";
            default: return "Not shortlisted";
        }
    }

    private static String roundDateText(java.time.LocalDateTime when) {
        // Round times are stored in UTC (the TPO pages send UTC); students read India time.
        return when == null ? "to be decided" : when.atZone(java.time.ZoneOffset.UTC).withZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).format(STAGE_LABEL_DATE_FORMAT);
    }

    @Override
    public JobApplication getApplicationById(Integer applicationId) {
        return jobApplicationRepository.findByIdWithAssociations(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
    }

    @Override
    public boolean hasApplied(Integer learnerId, Integer jobId) {
        Optional<JobApplication> existing = jobApplicationRepository.findByLearnerIdAndJobId(learnerId, jobId);
        return existing.isPresent() && !Boolean.TRUE.equals(existing.get().getIsDeleted());
    }

    @Override
    public Optional<JobApplication> getApplicationByLearnerAndJob(Integer learnerId, Integer jobId) {
        Optional<JobApplication> existing = jobApplicationRepository.findByLearnerIdAndJobId(learnerId, jobId);
        if (existing.isPresent() && !Boolean.TRUE.equals(existing.get().getIsDeleted())) {
            return existing;
        }
        return Optional.empty();
    }

    @Override
    @Transactional
    public JobApplication withdrawApplication(Integer learnerId, Integer jobId) {
        // Compatibility endpoint. Resolve the current active row first, then perform the actual
        // mutation by application id under a row lock. The unique (learner_id, job_id) constraint
        // means there is at most one row to resolve, while the locked re-read below protects the
        // state transition from a concurrent admin/offer action.
        JobApplication application = jobApplicationRepository.findByLearnerIdAndJobId(learnerId, jobId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        return withdrawApplicationByIdLocked(learnerId, application.getId());
    }

    @Override
    @Transactional
    public JobApplication withdrawApplicationById(Integer learnerId, Integer applicationId) {
        return withdrawApplicationByIdLocked(learnerId, applicationId);
    }

    /**
     * Booked by the placement cell into a round that has no result yet (a TPO drive's test or interview). Only the old interview
     * table was checked, so a student booked for tomorrow's interview could still withdraw on their own (student audit, 14 Oct 2026).
     */
    private boolean bookedIntoOpenRound(Integer applicationId) {
        if (entityManager == null) return false;
        Number n = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM round_assignment ra WHERE ra.application_id = :a AND NOT EXISTS (SELECT 1 FROM round_result rr " +
                "WHERE rr.application_id = ra.application_id AND rr.round_id = ra.round_id AND rr.applied_at IS NOT NULL AND rr.superseded_by IS NULL)")
                .setParameter("a", applicationId).getSingleResult();
        return n != null && n.longValue() > 0;
    }

    private JobApplication withdrawApplicationByIdLocked(Integer learnerId, Integer applicationId) {
        if (applicationId == null || applicationId <= 0) {
            throw new IllegalArgumentException("Application not found");
        }
        JobApplication application = jobApplicationRepository.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        // Do not reveal whether a guessed application id exists for someone else. A withdrawn row
        // is also no longer an active self-service target and gets the same generic response.
        if (Boolean.TRUE.equals(application.getIsDeleted())
                || application.getLearner() == null
                || !Objects.equals(application.getLearner().getId(), learnerId)) {
            throw new IllegalArgumentException("Application not found");
        }
        String currentStatus = application.getApplicationStatus();

        // Student V1 §5 "Withdrawing": self-service withdraw only until scheduled into a round.
        // Offer decline (below) is a separate action untouched by this — the boundary is
        // "has an active interview", not applicationStatus, since that is the actual "scheduled"
        // moment the spec means (an application can sit at INTERVIEW with no live round between
        // an earlier decline-to-reschedule and a not-yet-booked next slot).
        if (!"OFFERED".equals(currentStatus)
                && (!interviewRepository.findActiveInterviewsForApplication(application.getId(), null).isEmpty()
                    || bookedIntoOpenRound(application.getId()))) {
            throw new com._42students.lms.exceptions.WithdrawRequiresRequestException(
                    "You're already scheduled into a round for this drive. Ask the placement cell to withdraw instead.");
        }

        // The state machine (JobApplicationStatusValidator) declares WITHDRAWN reachable from
        // APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW and OFFERED — this used to hard-block
        // every status except APPLIED, leaving a learner who e.g. accepted an offer elsewhere
        // with no way to withdraw once shortlisted.
        // Note: the OFFERED case below actually writes REJECTED (not WITHDRAWN), so it must be
        // validated against that destination rather than WITHDRAWN.
        if ("OFFERED".equals(currentStatus)) {
            if (!com._42students.lms.util.JobApplicationStatusValidator.isValidTransition(currentStatus, "REJECTED")) {
                throw new IllegalArgumentException("This application can no longer be withdrawn from status " + currentStatus);
            }
        } else if (!com._42students.lms.util.JobApplicationStatusValidator.isValidTransition(currentStatus, "WITHDRAWN")) {
            throw new IllegalArgumentException("This application can no longer be withdrawn from status " + currentStatus);
        }

        if ("OFFERED".equals(currentStatus)) {
            // Two learners in an identical situation — both offered, both intending to turn it
            // down — used to get different outcomes purely by which button they clicked: this
            // endpoint produced WITHDRAWN (soft-deleted, vanishes from every admin view), while
            // "decline offer" (respondToOffer) produces REJECTED with a reason and stays visible.
            // Converging both onto the same REJECTED+reason outcome here means "declining an
            // offer" is recorded identically no matter which control the candidate used.
            application.setApplicationStatus("REJECTED");
            application.setRejectionReason("Offer declined by candidate");
            application.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
            // offer_letter_url/offer_letter_sent_at are legally meaningful and are cleared by both
            // admin surfaces (AdminJobServiceImpl/PlacementJobServiceImpl.updateApplicationStatus)
            // whenever an application leaves OFFERED/HIRED — this student-initiated decline path
            // (withdraw-from-OFFERED) previously left both untouched, so a candidate who declined
            // via this control (as opposed to respondToOffer) kept seeing a now-invalid offer
            // letter with no corresponding valid offer.
            application.setOfferLetterUrl(null);
            application.setOfferLetterSentAt(null);
            cancelNonTerminalInterviewsForApplicationLocked(application);
            JobApplication saved = jobApplicationRepository.save(application);
            closeReleasedOffers(saved.getId(), "DECLINED");
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new ApplicationStatusChangedEvent(saved.getId(), currentStatus, "REJECTED", null, application.getRejectionReason()));
            }
            notifyAdminOfWithdrawal(saved, "declined the offer for");
            return saved;
        }

        application.setStatusBeforeWithdrawal(currentStatus);
        application.setApplicationStatus("WITHDRAWN");
        application.setIsDeleted(true);
        // The OFFERED->REJECTED decline branch above stamps statusUpdatedAt, but this WITHDRAWN
        // path previously left it untouched — so an application that had gone through an earlier
        // status change (e.g. APPLIED -> SHORTLISTED) before being withdrawn kept showing that
        // earlier transition's timestamp as its "last activity" (getDataRetentionReport's
        // COALESCE(statusUpdatedAt, appliedAt), any admin list sorting/displaying by
        // statusUpdatedAt), silently understating how recently the withdrawal actually happened.
        application.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
        cancelNonTerminalInterviewsForApplicationLocked(application);
        JobApplication saved = jobApplicationRepository.save(application);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(saved.getId(), currentStatus, "WITHDRAWN", null, null));
        }
        // A candidate walking away — especially mid-interview or post-offer — is exactly the
        // event a recruiter needs to see; previously this fired zero notification anywhere, so
        // the application just silently stopped appearing in every admin list, indistinguishable
        // from having never applied.
        notifyAdminOfWithdrawal(saved, "withdrew their application for");
        return saved;
    }


    private void notifyAdminOfWithdrawal(JobApplication application, String actionPhrase) {
        notifyAdminOfWithdrawal(application, actionPhrase, application.getApplicationStatus());
    }

    /**
     * CONCURRENCY FIX (round 2 audit): this used to build and send the admin notification
     * (in-app Notification row + synchronous SSE broadcast — see
     * NotificationServiceImpl.save()) immediately, inline, while the caller's transaction was
     * still open and its own status write not yet durable. In a race — e.g. this respondToOffer
     * accept losing the optimistic-lock/row-lock race on the SAME application to a concurrent
     * decline/withdraw/admin update (see JobApplicationStatusValidator + JobApplication's
     * @Version), or losing later in withdrawOtherActiveApplications's cascade when a sibling
     * application was concurrently touched by an admin — the whole transaction rolls back
     * *after* this notification (and its SSE push) had already gone out. The SSE broadcast is
     * not part of the DB transaction and cannot be rolled back, so admins could see a real-time
     * "candidate accepted/declined the offer" push for a change that never actually persisted.
     * AdminJobServiceImpl/PlacementJobServiceImpl.sendJobApplicationStatusNotifications already
     * solves the identical problem (see that method's comment) by deferring dispatch to
     * afterCommit and re-fetching fresh state by id — mirrored here. Deferring by id (not the
     * caller's entity reference) also avoids reading a stale/lazy learner or job association
     * after the caller's persistence context has closed post-commit.
     */
    private void notifyAdminOfWithdrawal(JobApplication application, String actionPhrase, String newStatus) {
        if (notificationService == null || application == null) return;
        Integer applicationId = application.getId();
        if (applicationId == null) return;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                        @Override
                        public void afterCommit() {
                            doNotifyAdminOfWithdrawal(applicationId, actionPhrase, newStatus);
                        }
                    });
        } else {
            // No active transaction synchronization (e.g. called from a non-transactional
            // context/test) — fall back to sending immediately rather than silently dropping it.
            doNotifyAdminOfWithdrawal(applicationId, actionPhrase, newStatus);
        }
    }

    private void doNotifyAdminOfWithdrawal(Integer applicationId, String actionPhrase, String newStatus) {
        try {
            if (notificationService == null) return;
            // Re-fetch fresh, post-commit state by id rather than reusing the caller's entity
            // reference — that reference belongs to a persistence context that closed when the
            // caller's transaction committed, so touching its lazy associations here (now on a
            // different thread/callback, after commit) would risk a LazyInitializationException.
            JobApplication application = jobApplicationRepository.findByIdWithAssociations(applicationId).orElse(null);
            if (application == null) return;
            Learner learner = application.getLearner();
            Job job = application.getJob();
            if (learner == null || job == null) return;
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            // Order matters: withdrawOtherActiveApplications's cascade phrase
            // ("accepted another offer, auto-withdrawing their application for ...") also starts
            // with "accepted", but describes the OPPOSITE outcome for this drive's admin — this
            // application was auto-withdrawn because the candidate accepted a DIFFERENT offer, not
            // this one. The more specific "auto-withdrawing" check must run before the generic
            // "accepted" check, or that admin wrongly gets told the candidate accepted their offer.
            // Within the cascade, the actual outcome can be either REJECTED (auto-decline of a
            // pending OFFERED application, converging with the manual decline rule) or WITHDRAWN
            // (every other non-OFFERED status) — the title must reflect which one actually
            // happened rather than always saying "withdrawn".
            String title = actionPhrase.contains("auto-withdrawing")
                    ? ("REJECTED".equals(newStatus)
                        ? "Application declined — candidate accepted another offer"
                        : "Application withdrawn — candidate accepted another offer")
                    : "Candidate " + (actionPhrase.startsWith("declined") ? "declined an offer"
                        : actionPhrase.startsWith("accepted") ? "accepted the offer" : "withdrew");
            String body = learnerName + " " + actionPhrase + " " + job.getJobTitle()
                    + (job.getCompanyName() != null && !job.getCompanyName().isEmpty() ? " at " + job.getCompanyName() : "");
            Integer classId = learner.getClassId() != null ? learner.getClassId() : 0;
            notificationService.createNotification(title, body, classId, 0, "JOB",
                    job.getJobTitle() + (job.getCompanyName() != null && !job.getCompanyName().isEmpty() ? " at " + job.getCompanyName() : ""),
                    application.getId(), job.getId());
        } catch (Exception e) {
            log.warn("Failed to send admin withdrawal notification for application {}: {}", applicationId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public JobApplication respondToOffer(Integer learnerId, Integer applicationId, boolean accept) {
        // BE-0031: accepts for one student run one at a time. Two tabs or requests used to pass the "already HIRED elsewhere"
        // check below together (an unlocked read) and both commit HIRED. Locking the student's own row before anything else is
        // read makes the second accept wait, and its reads then start after the first one committed, so it sees that HIRED.
        if (accept && learnerId != null) {
            learnerRepository.findByIdForUpdate(learnerId).orElseThrow(() -> new IllegalArgumentException("Application not found"));
        }
        // SECURITY: not-found and ownership-mismatch intentionally throw the exact same
        // message/status — distinguishing "doesn't exist" from "isn't yours" is an IDOR
        // enumeration oracle.
        // ROUND 4 AUDIT FIX: was plain findById(), which leaves the learner/job associations as
        // uninitialized lazy proxies (FetchType.LAZY). With spring.jpa.open-in-view=false, the
        // Hibernate session is closed by the time this JobApplication is serialized back to the
        // client (JSON conversion happens outside the @Transactional boundary), so any getter on
        // those proxies beyond the id (e.g. Jackson serializing learner.firstName) throws
        // LazyInitializationException — this endpoint returned a 500 on every accept/decline
        // instead of the intended response. findByIdWithAssociations (JOIN FETCH learner + job)
        // mirrors getApplicationById's fetch and eagerly loads both before the transaction ends.
        JobApplication application = jobApplicationRepository.findByIdWithAssociations(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (application.getLearner() == null || !learnerId.equals(application.getLearner().getId())) {
            throw new IllegalArgumentException("Application not found");
        }
        String currentStatus = application.getApplicationStatus();
        if (!"OFFERED".equals(currentStatus)) {
            throw new IllegalArgumentException("This offer can no longer be responded to (current status: " + currentStatus + ")");
        }
        String newStatus = accept ? "HIRED" : "REJECTED";
        com._42students.lms.util.JobApplicationStatusValidator.validateTransition(currentStatus, newStatus);
        if (accept) {
            // One-offer-per-student: withdrawOtherActiveApplications (below) only cascades OTHER
            // active (non-terminal) applications at the moment THIS offer is accepted — it has no
            // way to reach back and undo a HIRED status that was already committed on a different
            // application earlier. Nothing else in this codebase blocks an admin from progressing
            // a separate application back up to OFFERED (JobApplicationStatusValidator explicitly
            // allows HIRED -> OFFERED as a corrective undo, and PlacementJobServiceImpl/
            // AdminJobServiceImpl.updateApplicationStatus never checks a learner's OTHER
            // applications before writing OFFERED). Without this guard, a learner who is already
            // HIRED on one application could accept a second OFFERED application here and become
            // HIRED on two applications simultaneously — HIRED is excluded from
            // ACTIVE_NON_TERMINAL_STATUSES, so the cascade below would silently leave the first
            // HIRED application untouched instead of surfacing the conflict.
            boolean alreadyHiredElsewhere = jobApplicationRepository.findByLearnerId(learnerId).stream()
                    .anyMatch(a -> a.getId() != application.getId()
                            && "HIRED".equalsIgnoreCase(String.valueOf(a.getApplicationStatus())));
            if (alreadyHiredElsewhere) {
                throw new IllegalArgumentException(
                        "You already have an accepted offer (HIRED) on another application. " +
                        "You cannot accept a second offer while one is already accepted. " +
                        "Please contact placements if this needs to be corrected.");
            }
        }
        application.setApplicationStatus(newStatus);
        // withdrawApplication's OFFERED-decline branch stamps this in UTC; respondToOffer used
        // bare now() (server-default zone) for the "same" logical event, so the two supposedly
        // identical decline paths recorded different wall-clock values off-UTC deployments.
        application.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
        if (!accept) {
            application.setRejectionReason("Offer declined by candidate");
            // Same fix as withdrawApplication's OFFERED-decline branch — respondToOffer's decline
            // is the other control that produces the identical REJECTED outcome, and left the
            // offer letter fields untouched too.
            application.setOfferLetterUrl(null);
            application.setOfferLetterSentAt(null);
            cancelNonTerminalInterviewsForApplicationLocked(application);
        }
        JobApplication saved = jobApplicationRepository.save(application);
        // The placement cell's Offers tab reads job_offer: without this, an answer given on this screen left the offer
        // "released" there, and the expiry sweep later told the student and the recruiter it had lapsed.
        closeReleasedOffers(saved.getId(), accept ? "ACCEPTED" : "DECLINED");
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(saved.getId(), currentStatus, newStatus, null,
                    accept ? null : application.getRejectionReason()));
        }
        if (!accept) {
            notifyAdminOfWithdrawal(saved, "declined the offer for");
        } else {
            // Accepting used to only notify OTHER drives' admins about the auto-withdrawal
            // cascade below — the accepted drive's own admin got no notification at all that
            // the candidate they offered actually accepted.
            notifyAdminOfWithdrawal(saved, "accepted the offer for");
            // Placements is fundamentally one-offer-accepted-per-student for most colleges —
            // accepting here used to leave every other pending application untouched, so a
            // learner could independently accept offers at multiple drives with nothing
            // detecting or preventing it. Auto-withdraw the rest, same as if the candidate had
            // withdrawn from each individually (interviews cancelled, admin notified).
            withdrawOtherActiveApplications(saved);
        }
        return saved;
    }

    /** Marks this application's released TPO offers answered; offers already answered, withdrawn or expired are left as they are. */
    private void closeReleasedOffers(Integer applicationId, String offerStatus) {
        if (jobOfferRepository == null || applicationId == null) return;
        for (com._42students.lms.model.tpo.JobOffer o : jobOfferRepository.findByApplicationId(applicationId)) {
            if (!"RELEASED".equals(o.getStatus())) continue;
            o.setStatus(offerStatus);
            o.setRespondedAt(LocalDateTime.now());
            if (o.getAcceptanceChannel() == null) o.setAcceptanceChannel("IN_APP");
            jobOfferRepository.save(o);
        }
    }

    /**
     * A placement-cell drive's own rules (CGPA, marks, branch, batch, year, gender, verified marks; the college's per-student
     * overrides) and an active debarment decide who may apply. They were only shown to the student ("Why can I not apply?"):
     * nothing stopped the application itself, so any student who could see a drive could apply, debarred ones included.
     */
    private void requireDriveRulesMet(Job job, Learner learner) {
        if (tpoStudentService != null && tpoStudentService.isDebarred(learner.getId())) {
            throw new IllegalArgumentException("You are debarred from placement drives for now. Ask your placement cell.");
        }
        if (driveEligibility == null) return;
        com._42students.lms.service.tpo.EligibilityService.EligibilityResult r = driveEligibility.evaluate(job, learner.getId(), learner.getDepartment());
        if (r != null && !r.eligible) {
            String why = r.checks == null ? null : r.checks.stream().filter(c -> !c.pass).map(c -> c.detail == null ? c.rule : c.rule + ": " + c.detail).findFirst().orElse(null);
            throw new IllegalArgumentException("You do not meet this drive's rules" + (why == null ? "" : " (" + why + ")"));
        }
    }

    private static final java.util.Set<String> ACTIVE_NON_TERMINAL_STATUSES = java.util.Set.of(
            "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "WAITLISTED");

    /**
     * Read-only preview of {@link #withdrawOtherActiveApplications}'s cascade, for the
     * accept-confirm screen (Student V1 §"Offers get their own table"). Deliberately kept as a
     * separate, non-locking read rather than a refactor of that method: withdrawOtherActiveApplications
     * has several rounds of concurrency-hardening built around its locking order, and this preview
     * only needs to classify — never mutate — so it takes plain (unlocked) reads. Whenever that
     * method's classification rules change, this must be updated to match.
     */
    @Override
    public JobService.OfferAcceptPreview previewOfferAccept(Integer learnerId, Integer applicationId) {
        JobService.OfferAcceptPreview preview = new JobService.OfferAcceptPreview();
        JobApplication accepted = jobApplicationRepository.findById(applicationId).orElse(null);
        if (accepted == null || accepted.getLearner() == null || learnerId == null || !learnerId.equals(accepted.getLearner().getId())) {
            return preview;
        }
        for (JobApplication other : jobApplicationRepository.findByLearnerId(learnerId)) {
            if (other.getId() == accepted.getId()) continue;
            String prevStatus = String.valueOf(other.getApplicationStatus()).toUpperCase(java.util.Locale.ROOT);
            if (!ACTIVE_NON_TERMINAL_STATUSES.contains(prevStatus)) continue;
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("applicationId", other.getId());
            row.put("jobTitle", other.getJob() != null ? other.getJob().getJobTitle() : null);
            row.put("companyName", other.getJob() != null ? other.getJob().getCompanyName() : null);
            if (!"OFFERED".equals(prevStatus) && placementCascadePolicy != null && placementCascadePolicy.keepsOpen(accepted, other)) {
                preview.staysOpen.add(row);
            } else if ("OFFERED".equals(prevStatus)) {
                preview.otherPendingDeclined.add(row);
            } else {
                preview.withdrawn.add(row);
            }
        }
        return preview;
    }

    private void withdrawOtherActiveApplications(JobApplication acceptedApplication) {
        Integer learnerId = acceptedApplication.getLearner() != null ? acceptedApplication.getLearner().getId() : null;
        if (learnerId == null) return;
        List<Integer> otherIds = jobApplicationRepository.findByLearnerId(learnerId).stream()
                .filter(a -> a.getId() != acceptedApplication.getId())
                .filter(a -> ACTIVE_NON_TERMINAL_STATUSES.contains(String.valueOf(a.getApplicationStatus()).toUpperCase(java.util.Locale.ROOT)))
                .map(JobApplication::getId)
                // CONCURRENCY FIX (round 5 audit): sort ascending by id before locking, rather than
                // relying on findByLearnerId's appliedAt-DESC ordering. This method, AdminJobServiceImpl's
                // withdrawOtherActiveApplicationsOnHire, and PlacementJobServiceImpl's identical cascade
                // can all run concurrently for the SAME learner (e.g. one offer accepted via respondToOffer
                // while an admin sets a different application to HIRED at the same time) and each acquires
                // findByIdForUpdate locks on this learner's other JobApplication rows in a loop. Locking in
                // appliedAt-DESC order is only guaranteed consistent across callers so long as appliedAt
                // has no ties and every caller's filtered subsequence preserves that same relative order —
                // fragile assumptions to depend on for deadlock-freedom. Sorting by id here (and in the
                // other two cascades) gives a single, caller-independent, tie-proof lock order, which is
                // the standard fix for this class of circular-wait risk.
                .sorted()
                .collect(Collectors.toList());
        for (Integer otherId : otherIds) {
            // CONCURRENCY FIX (round 4 audit): lock this "other" application row BEFORE touching
            // its interviews, mirroring InterviewServiceImpl.scheduleInterview's own
            // Application-then-Interview lock order (it takes findByIdForUpdate on the
            // JobApplication first, then reads/writes Interview rows). Without this, a concurrent
            // scheduleInterview call for this SAME other application could commit a brand-new
            // interview after this cascade's own (previously unlocked, snapshot-bound) interview
            // lookup already ran, leaving that freshly-scheduled interview un-cancelled even
            // though the application is being withdrawn right here — see
            // InterviewRepository.findNonTerminalByJobApplicationIdForUpdate for the full
            // REPEATABLE-READ mechanics. Locking the application first — instead of reading
            // interviews first — also keeps the lock order identical to scheduleInterview's,
            // avoiding a cross-table deadlock between the two code paths.
            Optional<JobApplication> lockedOther = jobApplicationRepository.findByIdForUpdate(otherId);
            if (lockedOther.isEmpty()) continue;
            JobApplication other = lockedOther.get();
            String prevStatus = other.getApplicationStatus();
            // Re-validate under the lock: another transaction may have already moved this
            // application out of the active/non-terminal set between the initial list query
            // above (unlocked) and acquiring this lock.
            if (!ACTIVE_NON_TERMINAL_STATUSES.contains(String.valueOf(prevStatus).toUpperCase(java.util.Locale.ROOT))) {
                continue;
            }
            // TPO V1: an application the college's placement rules still admit (a Dream drive, or a big enough pay increase) stays
            // open. Pending offers are never kept (they converge to declined as before), and anything without a TPO offer behind it
            // is left to the legacy behaviour by the policy itself.
            if (!"OFFERED".equals(prevStatus) && placementCascadePolicy != null && placementCascadePolicy.keepsOpen(acceptedApplication, other)) {
                continue;
            }
            // Mirror withdrawApplication's OFFERED convergence rule exactly: withdraw-from-OFFERED
            // and decline-offer must both converge to REJECTED + "Offer declined by candidate",
            // not WITHDRAWN with no reason.
            String newStatus = "OFFERED".equals(prevStatus) ? "REJECTED" : "WITHDRAWN";
            com._42students.lms.util.JobApplicationStatusValidator.validateTransition(prevStatus, newStatus);
            other.setApplicationStatus(newStatus);
            if ("REJECTED".equals(newStatus)) {
                // Mirrors withdrawApplication's/respondToOffer's own OFFERED-decline branches:
                // neither of those sets statusBeforeWithdrawal for a decline (isDeleted stays
                // false, applicationStatus is REJECTED, not WITHDRAWN) — this row never becomes
                // soft-deleted, so it can never reach applyToJob's reactivation branch (which is
                // gated on isDeleted=true) regardless of this field. Setting it here anyway used
                // to leave a REJECTED-but-never-withdrawn row carrying a stale
                // statusBeforeWithdrawal value that leaked straight into the learner-facing
                // LearnerApplicationWithInterviewsDTO, misrepresenting an offer decline as a
                // withdrawal.
                other.setRejectionReason("Offer declined by candidate");
                other.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
                // Same fix as the manual withdraw-from-OFFERED and respondToOffer decline paths —
                // this cascade produces the identical OFFERED->REJECTED outcome for every other
                // pending offer when one is accepted, and left the offer letter fields untouched.
                other.setOfferLetterUrl(null);
                other.setOfferLetterSentAt(null);
            } else {
                // statusBeforeWithdrawal is set only here — the actual WITHDRAWN+soft-delete
                // outcome that applyToJob's reactivation branch gates on.
                other.setStatusBeforeWithdrawal(prevStatus);
                other.setWithdrawalReason("PLACED_ELSEWHERE");
                other.setIsDeleted(true);
                // Same fix as withdrawApplication's own WITHDRAWN branch — without this, an
                // auto-withdrawn-by-cascade application kept showing whatever earlier transition's
                // timestamp it last had as its "last activity", instead of when the cascade
                // actually withdrew it.
                other.setStatusUpdatedAt(LocalDateTime.now(java.time.ZoneOffset.UTC));
            }
            // Locked variant (see InterviewRepository.findNonTerminalByJobApplicationIdForUpdate)
            // — a plain, non-locking lookup is snapshot-bound under REPEATABLE READ and could miss
            // an interview inserted concurrently by scheduleInterview for this same application.
            cancelNonTerminalInterviewsForApplicationLocked(other);
            JobApplication savedOther = jobApplicationRepository.save(other);
            if ("REJECTED".equals(newStatus)) closeReleasedOffers(savedOther.getId(), "DECLINED"); // the other pending offer is declined in the Offers tab too
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new ApplicationStatusChangedEvent(savedOther.getId(), prevStatus, newStatus, null,
                        "REJECTED".equals(newStatus) ? other.getRejectionReason() : null));
            }
            notifyAdminOfWithdrawal(savedOther, "accepted another offer, auto-withdrawing their application for", newStatus);
        }
    }

    // Candidate previously got no interview-specific notification for this cascade path — only
    // the (already-dispatched-elsewhere) application-level status-change notification, which does
    // not necessarily mention that their specific scheduled interview was cancelled. See
    // InterviewService.notifyInterviewCancelledByCascade's javadoc. Deferred to after-commit,
    // mirroring notifyAdminOfWithdrawal above and every notification dispatch in
    // InterviewServiceImpl, so it never fires for a cancellation that ends up rolled back.
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

    // Neither a learner withdrawing/declining an offer nor an admin rejecting an application used
    // to touch the Interview table, so an already-SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED
    // interview round was left dangling — it kept appearing on calendars/reminders, and the
    // learner could still confirm/reschedule it, for an application that was no longer active.
    //
    // CONCURRENCY FIX (round 4 audit; also used directly by withdrawApplication/respondToOffer's
    // decline branches as of self-review round 3): a plain (non-locking) lookup of this
    // application's interviews is snapshot-bound under REPEATABLE READ and can miss an interview
    // a concurrent scheduleInterview call just committed for this same application — see
    // InterviewRepository.findNonTerminalByJobApplicationIdForUpdate. This is the exact same gap
    // self-review round 2 (aca46a4) found and fixed for InterviewServiceImpl's REJECT-feedback
    // cascade; this class's withdraw/decline cascades had the identical gap (this method used to
    // be locking-only, used solely by withdrawOtherActiveApplications, while a separate plain
    // sibling served withdrawApplication/respondToOffer) and were simply missed by that pass.
    // Caller must already hold a pessimistic lock on the JobApplication row (via findByIdForUpdate)
    // before calling this if it isn't the same row already under a transactional write here, to
    // keep lock order Application-then-Interview and avoid a cross-table deadlock with
    // scheduleInterview.
    private void cancelNonTerminalInterviewsForApplicationLocked(JobApplication application) {
        for (com._42students.lms.model.Interview interview : interviewRepository.findNonTerminalByJobApplicationIdForUpdate(application.getId())) {
            String previousStatus = interview.getInterviewStatus();
            interview.setInterviewStatus("CANCELLED");
            interviewRepository.save(interview);
            notifyInterviewCascadeCancelledAfterCommit(interview.getId(), previousStatus);
        }
    }

    @Override
    public List<JobImportantDateEventDTO> getImportantDateEventsForAdmin(Integer collegeId, Integer organizationId, LocalDateTime start, LocalDateTime end) {
        List<Job> jobs;
        if (collegeId != null && collegeId > 0) {
            Integer orgFromCollege = scopeResolutionService != null
                    ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                    : null;
            if (orgFromCollege != null) {
                jobs = jobRepository.findForCollegeAdminByCollegeOrOrg(collegeId, orgFromCollege);
            } else {
                jobs = jobRepository.findByCollegeIdAndIsDeletedFalse(collegeId);
            }
        } else if (organizationId != null && organizationId > 0) {
            jobs = jobRepository.findAllActiveJobsByOrganization(organizationId);
        } else {
            return Collections.emptyList();
        }
        return expandImportantDatesToEvents(jobs, start, end);
    }

    @Override
    public List<JobImportantDateEventDTO> getImportantDateEventsForLearner(Integer learnerId, LocalDateTime start, LocalDateTime end) {
        List<Job> jobs = getCalendarJobsForLearner(learnerId);
        return expandImportantDatesToEvents(jobs, start, end);
    }

    @Override
    public List<Integer> getCalendarJobIdsForLearner(Integer learnerId) {
        return getCalendarJobsForLearner(learnerId).stream()
                .map(Job::getId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Get jobs for learner career calendar: union of (1) all jobs visible on the Jobs page for this learner,
     * and (2) all jobs the learner has applied to. Ensures calendar shows important dates for every job
     * they can see plus every job they applied to (e.g. screening/technical rounds even after deadline).
     */
    private List<Job> getCalendarJobsForLearner(Integer learnerId) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));

        Map<Integer, Job> byId = new LinkedHashMap<>();

        // (1) All jobs visible on the Jobs page (same as getVisibleJobsForLearner)
        try {
            List<Job> visibleJobs = getVisibleJobsForLearner(learnerId);
            for (Job job : visibleJobs) {
                if (job != null && !Boolean.TRUE.equals(job.getIsDeleted())) {
                    Integer id = job.getId();
                    if (id != null) byId.putIfAbsent(id, job);
                }
            }
        } catch (Exception e) {
            log.debug("No visible jobs for learner {}: {}", learnerId, e.getMessage());
        }

        // (2) Jobs from learner's applications (so applied-job dates show even if job dropped off visible list)
        List<JobApplication> applications = jobApplicationRepository.findByLearnerId(learnerId);
        for (JobApplication app : applications) {
            Job job = app.getJob();
            if (job != null && !Boolean.TRUE.equals(job.getIsDeleted())) {
                Integer id = job.getId();
                if (id != null) byId.putIfAbsent(id, job);
            }
        }

        return new ArrayList<>(byId.values());
    }

    /**
     * Expand each job's important_dates into calendar events in the given range.
     */
    private List<JobImportantDateEventDTO> expandImportantDatesToEvents(List<Job> jobs, LocalDateTime start, LocalDateTime end) {
        List<JobImportantDateEventDTO> result = new ArrayList<>();
        for (Job job : jobs) {
            Object importantDates = job.getImportantDates();
            if (importantDates == null || !(importantDates instanceof List)) continue;
            List<?> list = (List<?>) importantDates;
            for (Object item : list) {
                if (!(item instanceof Map)) continue;
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) item;
                Object labelObj = map.get("label");
                Object dateObj = map.get("date");
                if (labelObj == null || dateObj == null) continue;
                String label = labelObj.toString().trim();
                if (label.isEmpty()) continue;
                LocalDateTime date = parseImportantDate(dateObj);
                if (date == null) continue;
                // Mirrors the frontend fallback path's `item?.type ?? item?.dateType` read, so
                // classifyJobDate() gets the same typed classification regardless of which path
                // (this primary endpoint, or the frontend's own zero-results fallback) served it.
                Object typeObj = map.get("type");
                if (typeObj == null) typeObj = map.get("dateType");
                String type = typeObj != null ? typeObj.toString().trim() : null;
                if (!(date.isBefore(start) || date.isAfter(end))) {
                    result.add(new JobImportantDateEventDTO(job.getId(), job.getJobTitle(), job.getCompanyName(), label, date, "JOB_IMPORTANT_DATE", type));
                }
            }
        }
        return result;
    }

    private LocalDateTime parseImportantDate(Object dateObj) {
        return PlacementDateTimeUtils.parseUtcDateTime(dateObj);
    }

    // ============================================
    // DEPRECATED METHODS (for backward compatibility)
    // ============================================

    /**
     * @deprecated Use getVisibleJobsForLearner instead
     * This method filters by eligibility which blocks visibility
     */
    @Override
    @Deprecated
    public List<Job> getEligibleJobsForLearner(Integer learnerId) {
        log.warn("Using deprecated method getEligibleJobsForLearner. Use getVisibleJobsForLearner instead.");
        // Return visible jobs instead (no eligibility filtering)
        return getVisibleJobsForLearner(learnerId);
    }

    /**
     * @deprecated Use checkJobVisibility instead
     * Eligibility checks are removed - only targeting matters for visibility
     */
    @Override
    @Deprecated
    public EligibilityResult checkLearnerEligibility(Integer learnerId, Integer jobId) {
        log.warn("Using deprecated method checkLearnerEligibility. Use checkJobVisibility instead.");
        VisibilityResult visibility = checkJobVisibility(learnerId, jobId);
        return new EligibilityResult(visibility.isVisible(), visibility.getReason());
    }
    
    /**
     * Send job application confirmation notification immediately after application submission
     * Non-blocking - failures are logged but don't affect the application creation
     */
    private void sendJobApplicationConfirmation(JobApplication application, Learner learner, Job job) {
        try {
            if (learner == null || job == null) {
                log.warn("Cannot send confirmation notification - learner or job is null for application {}", application.getId());
                return;
            }
            
            Map<String, Object> variables = new HashMap<>();
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            variables.put("learnerName", learnerName);
            variables.put("jobTitle", job.getJobTitle());
            variables.put("companyName", job.getCompanyName());
            variables.put("applicationId", application.getId());
            LocalDateTime dateApplied = application.getAppliedAt() != null ? application.getAppliedAt() : application.getCreatedAt();
            variables.put("applicationDate", dateApplied != null
                    ? dateApplied.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", java.util.Locale.ENGLISH))
                    : "N/A");
            
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learnerName)
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(null)
                    .build();
            if (notificationDispatcherService != null) {
                try {
                    notificationDispatcherService.dispatch(NotificationEvent.JOB_APPLICATION_CONFIRMATION, context, recipient, variables);
                } catch (Exception e) {
                    log.error("Failed to send job application confirmation notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending job application confirmation notifications: {}", e.getMessage(), e);
            // Don't throw - notifications are non-critical
        }
    }
}

