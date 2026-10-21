package com._42students.lms.service.impl;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.util.PlacementDateTimeUtils;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.event.ApplicationStatusChangedEvent;
import com._42students.lms.model.Interview;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.service.InterviewService;
import com._42students.lms.exceptions.CustomException;
import com._42students.lms.util.JobApplicationStatusValidator;
import com._42students.lms.util.JobNotificationHelper;
import com._42students.lms.util.TextSanitizer;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 5 Implementation: Interview Scheduling Service
 * Organization-scoped interview management
 */
@Slf4j
@Service
public class InterviewServiceImpl implements InterviewService {

    /** Overlap window in minutes: two interviews for the same learner/application must not fall within this window (default). */
    private static final int OVERLAP_WINDOW_MINUTES_DEFAULT = 60;

    /** Valid interview types (Gap #19). */
    private static final List<String> VALID_INTERVIEW_TYPES = Arrays.asList(
            "SCREENING", "TECHNICAL", "HR", "MANAGERIAL", "FINAL"
    );

    /** Min/max duration in minutes (Gap #5, #21) — defaults. */
    private static final int DURATION_MIN_DEFAULT = 15;
    private static final int DURATION_MAX_DEFAULT = 480;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Platform-wide scheduling policy (superadmin > Placements > Interviews). GLOBAL, not
    // per-college: these are used by hasOverlap()'s static-context candidate scan and by
    // request validation, and adding a per-college lookup to every call site (several of which
    // don't have a resolved collegeId in scope, e.g. update/reschedule paths keyed only by
    // interviewId) isn't worth it for a value that's reasonably the same platform-wide.
    private int overlapWindowMinutes() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "interview.overlapWindowMinutes", OVERLAP_WINDOW_MINUTES_DEFAULT)
                : OVERLAP_WINDOW_MINUTES_DEFAULT;
    }

    private int overlapBufferMinutes() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "interview.overlapBufferMinutes", OVERLAP_BUFFER_MINUTES_DEFAULT)
                : OVERLAP_BUFFER_MINUTES_DEFAULT;
    }

    private int durationMin() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "interview.durationMinMinutes", DURATION_MIN_DEFAULT)
                : DURATION_MIN_DEFAULT;
    }

    private int durationMax() {
        return appSettingsService != null
                ? appSettingsService.getInt("GLOBAL", null, "interview.durationMaxMinutes", DURATION_MAX_DEFAULT)
                : DURATION_MAX_DEFAULT;
    }

    /** Max location length in characters (Gap #20, #26). */
    private static final int LOCATION_MAX_LENGTH = 2048;

    private static final List<String> ELIGIBLE_APPLICATION_STATUSES = Arrays.asList(
            "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED"
    );

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private ScopeResolutionService scopeResolutionService;
    
    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired(required = false)
    private JobNotificationHelper jobNotificationHelper;

    @Autowired(required = false)
    private ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    private com._42students.lms.service.NotificationService notificationService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService adminAuditLogService;

    // Audit logging previously covered exactly one action in the whole placements codebase (job
    // metadata edits) — every interview action (schedule/update/cancel) had zero coverage.
    private void auditInterview(String actionKey, Interview interview, java.util.Map<String, Object> payload) {
        if (adminAuditLogService == null || interview == null) return;
        try {
            adminAuditLogService.log(null, actionKey, "Interview", String.valueOf(interview.getId()),
                    interview.getOrganizationId(), null, payload);
        } catch (Exception e) {
            log.warn("Failed to write audit log for interview {} action {}: {}", interview.getId(), actionKey, e.getMessage());
        }
    }

    // Same pattern as AdminJobServiceImpl.sendJobApplicationStatusNotifications: notification
    // dispatch (blocking HTTP calls with retries+backoff, see NotificationDispatcherServiceImpl)
    // used to run synchronously inside this class's open @Transactional methods — several of
    // which hold a pessimistic lock taken via jobApplicationRepository.findByIdForUpdate() — so a
    // slow/retrying dispatch held the transaction (and lock) open for the whole call. Deferring
    // via registerSynchronization(...).afterCommit() guarantees the dispatch only fires once the
    // write is durable and the lock has already been released, matching the AdminJobServiceImpl
    // convention exactly. Falls back to running immediately when no transaction is active (e.g.
    // called from a non-transactional context or in tests).
    private void afterCommitOrNow(Runnable action) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronizationAdapter() {
                        @Override
                        public void afterCommit() {
                            action.run();
                        }
                    });
        } else {
            action.run();
        }
    }

    @Override
    @Transactional
    public Interview scheduleInterview(Interview interview, Integer organizationId, Integer createdBy) {
        log.info("Scheduling interview for application {} by admin {}", interview.getJobApplication().getId(), createdBy);

        // A client-supplied non-zero id makes JPA's isNew() check treat this as an existing
        // row and merge() into it instead of inserting a new one, silently overwriting whatever
        // interview already has that id (possibly belonging to a different organization).
        interview.setId(0);
        // isNew() for a @Version-annotated entity actually checks version == null, not id — a
        // client-supplied non-null version would still route this through merge() even with
        // id reset above, defeating the protection (same fix as AdminJobServiceImpl.createJob /
        // PlacementJobServiceImpl.createJob).
        interview.setVersion(null);

        // Pessimistic lock, held for the rest of this transaction — without it, two concurrent
        // schedule requests for the same application both pass the active-round/overlap checks
        // below before either commits, producing two active interview rounds. This serializes
        // them: the second request blocks here until the first's transaction commits, then sees
        // its effects and correctly rejects.
        JobApplication application = jobApplicationRepository.findByIdForUpdate(interview.getJobApplication().getId())
                .orElseThrow(() -> new IllegalArgumentException("Job application not found"));

        // Verify organization match
        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application does not belong to your organization");
        }

        // Verify application status - must be at least SHORTLISTED (or ASSESSMENT for scheduling after exam pass)
        if (!ELIGIBLE_APPLICATION_STATUSES.contains(application.getApplicationStatus())) {
            throw new IllegalArgumentException(
                    "Cannot schedule interview. Application status must be one of: " + String.join(", ", ELIGIBLE_APPLICATION_STATUSES)
                            + ". Current status: " + application.getApplicationStatus());
        }

        // Verify job belongs to organization
        com._42students.lms.model.Job job = jobRepository.findByIdAndOrganization(interview.getJob().getId(), organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Job does not belong to your organization"));

        // SECURITY (round 2 audit): interview.getJob() and interview.getJobApplication() are two
        // independently client-suppliable IDs. Both were validated above/below only for
        // "belongs to my organization" — never cross-checked against each other. The controller's
        // college-scope guard (requireCollegeScopedAccessToJob) only inspects interview.getJob(),
        // so without this check a college-scoped admin could pass their OWN college's job (to
        // satisfy that guard) while pointing jobApplication at an application whose real job/
        // college is someone else's — writing a bogus interview round, advancing that application's
        // status, and triggering candidate notifications for a college they have no access to.
        // Anchor on the application's own job as ground truth.
        if (application.getJob() == null || job.getId() != application.getJob().getId()) {
            throw new IllegalArgumentException("Job does not match the job application");
        }

        // JP-03 (round 3 audit): same "block advance" policy already enforced on both
        // AdminJobServiceImpl.updateApplicationStatus and PlacementJobServiceImpl's equivalent for
        // a closed (isActive=false) job — scheduling a new interview round is itself a pipeline
        // advance (it auto-promotes the application to INTERVIEW below) and previously had no such
        // guard at all here, so a job closed mid-pipeline could still have brand-new interview
        // rounds scheduled against it, unlike every other advance path. Unlike those two methods,
        // scheduleInterview never doubles as a REJECTED-cleanup call, so no exception is needed.
        // findByIdAndOrganization already excludes soft-deleted jobs (isDeleted=false in the
        // query), so that half of JP-03 is covered by the lookup above throwing not-found.
        if (Boolean.FALSE.equals(job.getIsActive())) {
            throw new IllegalArgumentException("Cannot schedule interview: the job posting is closed");
        }

        // Pessimistic lock on the LEARNER row (not just the application), held for the rest of this
        // transaction. The application-level lock above only serializes concurrent schedule
        // requests against the SAME application — if the same candidate has two live applications
        // (e.g. Job X and Job Y), two concurrent schedule requests lock two DIFFERENT application
        // rows and can both pass the learner-overlap check below before either commits, producing
        // overlapping interviews for the same learner across different applications. Locking the
        // learner row serializes any two schedule attempts for that learner regardless of which
        // application they target.
        Learner learner = learnerRepository.findByIdForUpdate(interview.getLearner().getId())
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        ResolvedLearnerScope learnerScope = scopeResolutionService.resolveFullScope(learner);
        if (!learnerScope.hasOrganization() || !organizationId.equals(learnerScope.getOrganizationId())) {
            throw new IllegalArgumentException("Learner does not belong to your organization");
        }

        // SECURITY (round 2 audit): mirrors the job/application cross-check above — interview.getLearner()
        // is a third independently client-suppliable ID. Without this, an interview could be created
        // that references a learner unrelated to the target application, letting that unrelated
        // learner (or an admin acting via a mismatched combination) confirm/decline/reschedule a
        // round that isn't actually theirs, and desyncing who the interview notifications go to.
        if (application.getLearner() == null || learner.getId() != application.getLearner().getId()) {
            throw new IllegalArgumentException("Learner does not match the job application");
        }

        // Round description is mandatory so interview notifications have context for the candidate
        if (interview.getRoundDescription() == null || interview.getRoundDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Round description is required. Please describe what this round is about so we can send clear context to the candidate.");
        }
        // Round 3 fix: roundDescription is interpolated verbatim into interview notification/email
        // templates sent to the candidate (see JobNotificationHelper), but was only trimmed -
        // never HTML-escaped. Same stored-XSS gap already fixed for Job text fields.
        interview.setRoundDescription(TextSanitizer.sanitizeText(interview.getRoundDescription().trim()));

        // Validate interviewType (Gap #1, #19)
        if (interview.getInterviewType() != null && !interview.getInterviewType().trim().isEmpty()) {
            if (!VALID_INTERVIEW_TYPES.contains(interview.getInterviewType().trim().toUpperCase())) {
                throw new IllegalArgumentException("Invalid interview type. Must be one of: " + String.join(", ", VALID_INTERVIEW_TYPES));
            }
        }

        // Validate durationMinutes (Gap #5, #21)
        Integer duration = interview.getDurationMinutes();
        if (duration != null) {
            if (duration < durationMin() || duration > durationMax()) {
                throw new IllegalArgumentException("Duration must be between " + durationMin() + " and " + durationMax() + " minutes");
            }
        } else {
            interview.setDurationMinutes(60); // Default for calendar/form
        }

        // Validate location length (Gap #26)
        if (interview.getLocation() != null && interview.getLocation().length() > LOCATION_MAX_LENGTH) {
            throw new IllegalArgumentException("Location cannot exceed " + LOCATION_MAX_LENGTH + " characters");
        }
        // Round 3 fix: location is returned directly to learners (LearnerApplicationWithInterviewsDTO)
        // and interpolated into interview notification/email templates as meetingLink/venueAddress,
        // but was never HTML-escaped - only length-checked. Same stored-XSS gap as Job text fields.
        if (interview.getLocation() != null) {
            interview.setLocation(TextSanitizer.sanitizeAndTruncatePreservingAmpersand(interview.getLocation(), LOCATION_MAX_LENGTH));
        }
        if (interview.getInterviewerName() != null) {
            String name = interview.getInterviewerName().trim();
            interview.setInterviewerName(name.isEmpty() ? null : TextSanitizer.sanitizeAndTruncate(name, 255));
        }

        // Validate scheduled date is in the future (UTC for consistent behavior)
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        if (interview.getScheduledDate() != null && interview.getScheduledDate().isBefore(nowUtc)) {
            throw new IllegalArgumentException("Interview scheduled date must be in the future");
        }

        // Duration-aware overlap check: same learner must not have another SCHEDULED/CONFIRMED interview that overlaps.
        LocalDateTime scheduled = interview.getScheduledDate();
        List<Interview> learnerCandidates = interviewRepository.findPotentialOverlapsForLearner(interview.getLearner().getId(), null);
        if (hasOverlap(scheduled, interview.getDurationMinutes(), learnerCandidates)) {
            throw new IllegalArgumentException("This candidate already has an interview that overlaps with the requested time. Please choose a different slot.");
        }

        // Duration-aware overlap check: same application must not have another round overlapping.
        List<Interview> appCandidates = interviewRepository.findPotentialOverlapsForApplication(application.getId(), null);
        if (hasOverlap(scheduled, interview.getDurationMinutes(), appCandidates)) {
            throw new IllegalArgumentException("This application already has an interview that overlaps with the requested time. Please choose a different slot.");
        }

        // SECURITY FIX (this audit round): server-side counterpart of the frontend's soft
        // interviewerName+companyName conflict warning (interviewConflicts.js) — previously only
        // the learner/application were checked here, so a human interviewer could be double-booked
        // with zero server-side rejection. Scoped to companyName like the frontend check, and only
        // runs when an interviewer name was actually supplied.
        if (interview.getInterviewerName() != null && !interview.getInterviewerName().isEmpty()) {
            List<Interview> interviewerCandidates = interviewRepository.findPotentialOverlapsForInterviewer(
                    organizationId, interview.getInterviewerName(), job.getCompanyName(), null);
            if (hasOverlap(scheduled, interview.getDurationMinutes(), interviewerCandidates)) {
                throw new IllegalArgumentException("This interviewer already has an overlapping interview scheduled for this company. Please choose a different slot or interviewer.");
            }
        }

        // Block scheduling a new round while a previous round is still active (SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED).
        // Admin must mark the current round as COMPLETED or CANCELLED before scheduling the next one.
        List<Interview> activeRounds = interviewRepository.findActiveInterviewsForApplication(application.getId(), null);
        if (!activeRounds.isEmpty()) {
            Interview activeRound = activeRounds.get(0);
            throw new IllegalArgumentException(
                "Cannot schedule a new round while a previous round is still active (status: " +
                activeRound.getInterviewStatus() + "). Please mark the current round as Completed or Cancel it first.");
        }

        // CONCURRENCY FIX (round 4 audit): job above was read via findByIdAndOrganization (a plain,
        // unlocked read) near the top of this method — nothing stops AdminJobServiceImpl /
        // PlacementJobServiceImpl.deleteJob (soft-delete UPDATE) or JobAutoExpiryService (isActive
        // UPDATE) from committing in the window between that read and this method's interview
        // insert/status-advance below, letting a brand-new interview round get scheduled (and the
        // application auto-promoted) against a job that's simultaneously (or by now already)
        // deleted/closed. Same gap and same fix as JobServiceImpl.applyToJob's round-3 fix:
        // re-verify under a PESSIMISTIC_WRITE lock on the Job row immediately before the write
        // section, which serializes against deleteJob's/expiry's UPDATE on the same row.
        com._42students.lms.model.Job lockedJob = jobRepository.lockJobById(job.getId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + job.getId()));
        if (!Boolean.TRUE.equals(lockedJob.getIsActive()) || Boolean.TRUE.equals(lockedJob.getIsDeleted())) {
            throw new IllegalArgumentException("Cannot schedule interview: the job posting is closed");
        }

        // Set organization and creator
        interview.setOrganizationId(organizationId);
        interview.setCreatedBy(createdBy);
        interview.setInterviewStatus("SCHEDULED");

        Interview savedInterview = interviewRepository.save(interview);
        auditInterview("INTERVIEW_SCHEDULED", savedInterview, java.util.Map.of(
                "applicationId", String.valueOf(application.getId()),
                "scheduledDate", String.valueOf(savedInterview.getScheduledDate())));

        // Update application status to INTERVIEW in same transaction so interview and status stay in sync.
        // Frontend no longer needs a separate status-update call; notification sent once here.
        // Only auto-advances FORWARD from a genuinely pre-interview status (SHORTLISTED/
        // ASSESSMENT) — scheduling an extra round on an application already at OFFERED (e.g. a
        // final formality conversation) used to silently downgrade it back to INTERVIEW and fire
        // an interview-invite notification directly contradicting the offer email the candidate
        // already received, with no explicit admin decision to rescind the offer.
        String currentStatus = application.getApplicationStatus();
        boolean isPreInterviewStatus = "SHORTLISTED".equalsIgnoreCase(currentStatus) || "ASSESSMENT".equalsIgnoreCase(currentStatus);
        if (isPreInterviewStatus) {
            try {
                JobApplicationStatusValidator.validateTransition(currentStatus, "INTERVIEW");
                application.setApplicationStatus("INTERVIEW");
                application.setStatusUpdatedBy(createdBy);
                application.setStatusUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                jobApplicationRepository.save(application);
                if (eventPublisher != null) {
                    eventPublisher.publishEvent(new ApplicationStatusChangedEvent(application.getId(), currentStatus, "INTERVIEW", createdBy, null));
                }
                if (jobNotificationHelper != null) {
                    final Integer notifyApplicationId = application.getId();
                    afterCommitOrNow(() -> jobNotificationHelper.sendStatusNotificationAsync(notifyApplicationId, "INTERVIEW"));
                }
                log.info("Application {} status set to INTERVIEW and notification deferred to after commit", application.getId());
            } catch (IllegalArgumentException e) {
                // Surface the transition failure so the caller gets a 400 rather than silent success.
                // NOTE: the interview row was already saved above (interviewRepository.save(interview),
                // ~line 249) by this point — it is NOT unsaved. Rethrowing here relies entirely on the
                // surrounding @Transactional boundary on this method to roll that save back, so the
                // interview never actually persists. If this block is ever refactored to run in its own
                // transaction (e.g. REQUIRES_NEW), that save will no longer be rolled back by this throw
                // and will need to be handled explicitly (e.g. deleted) to avoid an orphaned interview row.
                throw new IllegalArgumentException(
                    "Cannot schedule interview: application status transition failed. " + e.getMessage());
            }
        } else {
            // Status already INTERVIEW (round 2+), or OFFERED/HIRED (an extra round scheduled
            // without downgrading) - leave applicationStatus untouched, just notify about the new round.
            final Integer notifyInterviewId = savedInterview.getId();
            afterCommitOrNow(() -> interviewRepository.findByIdWithAllAssociations(notifyInterviewId)
                    .ifPresent(this::sendInterviewScheduledNotifications));
        }

        log.info("Interview scheduled (ID: {}) for application {}", savedInterview.getId(), application.getId());
        return savedInterview;
    }

    /** Buffer added after an interview ends before the next one may start (minutes). */
    private static final int OVERLAP_BUFFER_MINUTES_DEFAULT = 15;

    /**
     * Duration-aware overlap check.
     * Returns true if [newStart, newEnd+buffer) overlaps any existing interview's [existingStart, existingEnd+buffer).
     * Uses durationMinutes from each interview; defaults to overlapWindowMinutes() if null.
     */
    private boolean hasOverlap(LocalDateTime newStart, Integer newDuration, List<Interview> candidates) {
        int newDur = newDuration != null ? newDuration : overlapWindowMinutes();
        LocalDateTime newEnd = newStart.plusMinutes(newDur).plusMinutes(overlapBufferMinutes());
        for (Interview existing : candidates) {
            int existDur = existing.getDurationMinutes() != null ? existing.getDurationMinutes() : overlapWindowMinutes();
            LocalDateTime existStart = existing.getScheduledDate();
            LocalDateTime existEnd = existStart.plusMinutes(existDur).plusMinutes(overlapBufferMinutes());
            // Overlap if: newStart < existEnd AND existStart < newEnd
            if (newStart.isBefore(existEnd) && existStart.isBefore(newEnd)) {
                return true;
            }
        }
        return false;
    }

    /** Assign 1-based roundIndex to interviews (Gap #10). List assumed ordered by scheduledDate. */
    private static void assignRoundIndices(List<Interview> interviews) {
        for (int i = 0; i < interviews.size(); i++) {
            interviews.get(i).setRoundIndex(i + 1);
        }
    }

    @Override
    public List<Interview> getInterviewsForOrganization(Integer organizationId) {
        List<Interview> list = interviewRepository.findByOrganizationId(organizationId);
        assignRoundIndices(list);
        return list;
    }

    @Override
    public Page<Interview> getInterviewsForOrganization(Integer organizationId, Pageable pageable) {
        Page<Interview> page = interviewRepository.findByOrganizationIdPageable(organizationId, pageable);
        assignRoundIndices(page.getContent());
        return page;
    }

    @Override
    public List<Interview> getInterviewsForCollege(Integer collegeId) {
        if (collegeId == null) return List.of();
        List<Interview> list;
        Integer organizationId = scopeResolutionService != null
                ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                : null;
        if (organizationId != null) {
            list = interviewRepository.findByJobCollegeIdOrOrganizationId(collegeId, organizationId);
        } else {
            list = interviewRepository.findByJobCollegeId(collegeId);
        }
        assignRoundIndices(list);
        return list;
    }

    @Override
    public Page<Interview> getInterviewsForCollege(Integer collegeId, Pageable pageable) {
        if (collegeId == null) return Page.<Interview>empty(pageable);
        Integer organizationId = scopeResolutionService != null
                ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                : null;
        Page<Interview> page;
        if (organizationId != null) {
            page = interviewRepository.findByJobCollegeIdOrOrganizationIdPageable(collegeId, organizationId, pageable);
        } else {
            page = interviewRepository.findByJobCollegeIdPageable(collegeId, pageable);
        }
        assignRoundIndices(page.getContent());
        return page;
    }

    @Override
    public List<Interview> getInterviewsForApplication(Integer applicationId, Integer organizationId, com._42students.lms.security.UserPrincipal principal) {
        // Verify application belongs to organization
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!organizationId.equals(application.getOrganizationId())) {
            throw new IllegalArgumentException("Application does not belong to your organization");
        }

        // If caller is a learner, they may only access their own application's interviews
        if (principal != null && principal.isLearner()) {
            Integer learnerId = application.getLearner() != null ? application.getLearner().getId() : null;
            Integer principalId = principal.getId();
            if (learnerId == null || principalId == null || !java.util.Objects.equals(learnerId, principalId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only view interviews for your own applications");
            }
        }

        List<Interview> list = interviewRepository.findByJobApplicationId(applicationId);
        assignRoundIndices(list);
        return list;
    }

    @Override
    public List<Interview> getInterviewsForLearner(Integer learnerId, Integer organizationId) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);

        if (!scope.hasOrganization() || !organizationId.equals(scope.getOrganizationId())) {
            throw new IllegalArgumentException("Learner does not belong to your organization");
        }

        List<Interview> list = interviewRepository.findByLearnerIdAndOrganization(learnerId, organizationId);
        assignRoundIndices(list);
        return list;
    }

    @Override
    public Page<Interview> getInterviewsForLearner(Integer learnerId, Integer organizationId, Pageable pageable) {
        learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));
        ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
        if (!scope.hasOrganization() || !organizationId.equals(scope.getOrganizationId())) {
            throw new IllegalArgumentException("Learner does not belong to your organization");
        }
        Page<Interview> page = interviewRepository.findByLearnerIdAndOrganizationPageable(learnerId, organizationId, pageable);
        assignRoundIndices(page.getContent());
        return page;
    }

    @Override
    public List<Interview> getUpcomingInterviewsForLearner(Integer learnerId, Integer organizationId) {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        List<Interview> list = interviewRepository.findUpcomingInterviewsForLearner(learnerId, organizationId, nowUtc);
        assignRoundIndices(list);
        return list;
    }

    @Override
    public Interview getInterviewById(Integer interviewId, Integer organizationId) {
        return interviewRepository.findByIdAndOrganization(interviewId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Interview not found or does not belong to your organization: " + interviewId));
    }

    @Override
    @Transactional
    public Interview updateInterview(Integer interviewId, Interview interview, Integer organizationId) {
        log.info("Updating interview {} for organization {}", interviewId, organizationId);

        Interview existingInterview = getInterviewById(interviewId, organizationId);

        // Cannot update a cancelled interview
        if ("CANCELLED".equalsIgnoreCase(existingInterview.getInterviewStatus())) {
            throw new IllegalArgumentException("Cannot update a cancelled interview. Please schedule a new one instead.");
        }

        // A COMPLETED interview can already carry submitted feedback (including a HIRE
        // recommendation that already auto-advanced the application to OFFERED) — silently
        // editing its date/location/etc. afterward would leave the audit trail inconsistent
        // with whatever downstream decisions were already made from it. NO_SHOW is likewise a
        // terminal outcome, not an editable state. Mirrors the same guard in cancelInterview.
        if ("COMPLETED".equalsIgnoreCase(existingInterview.getInterviewStatus()) || "NO_SHOW".equalsIgnoreCase(existingInterview.getInterviewStatus())) {
            throw new IllegalArgumentException("Cannot update an interview that has already been marked " + existingInterview.getInterviewStatus() + ".");
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime dateBeforeUpdate = existingInterview.getScheduledDate();

        // Update fields
        if (interview.getInterviewType() != null) {
            String it = interview.getInterviewType().trim();
            if (!it.isEmpty() && !VALID_INTERVIEW_TYPES.contains(it.toUpperCase())) {
                throw new IllegalArgumentException("Invalid interview type. Must be one of: " + String.join(", ", VALID_INTERVIEW_TYPES));
            }
            existingInterview.setInterviewType(it.isEmpty() ? null : it);
        }
        if (interview.getDurationMinutes() != null) {
            int d = interview.getDurationMinutes();
            if (d < durationMin() || d > durationMax()) {
                throw new IllegalArgumentException("Duration must be between " + durationMin() + " and " + durationMax() + " minutes");
            }
            existingInterview.setDurationMinutes(d);
        }
        if (interview.getLocation() != null) {
            if (interview.getLocation().length() > LOCATION_MAX_LENGTH) {
                throw new IllegalArgumentException("Location cannot exceed " + LOCATION_MAX_LENGTH + " characters");
            }
            // Round 3 fix: see createInterview - location was never HTML-escaped, only length-checked.
            existingInterview.setLocation(TextSanitizer.sanitizeAndTruncatePreservingAmpersand(interview.getLocation(), LOCATION_MAX_LENGTH));
        }
        if (interview.getInterviewerName() != null) {
            String name = interview.getInterviewerName().trim();
            existingInterview.setInterviewerName(name.isEmpty() ? null : TextSanitizer.sanitizeAndTruncate(name, 255));
        }
        if (interview.getScheduledDate() != null) {
            LocalDateTime newDate = interview.getScheduledDate();
            if (newDate.isBefore(nowUtc)) {
                throw new IllegalArgumentException("Interview scheduled date must be in the future");
            }
            // Pessimistic lock, held for the rest of this transaction — without it, two concurrent
            // update requests changing this interview's (or a sibling's) date can both pass the
            // overlap checks below before either commits, producing overlapping interviews. Mirrors
            // the same lock scheduleInterview takes before its own overlap checks.
            jobApplicationRepository.findByIdForUpdate(existingInterview.getJobApplication().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Job application not found"));
            // Pessimistic lock on the LEARNER row too (not just the application), held for the rest
            // of this transaction. The application-level lock above only serializes concurrent
            // reschedule requests against the SAME application — if the same candidate has two live
            // applications (e.g. Job X and Job Y), two concurrent reschedule requests lock two
            // DIFFERENT application rows and can both pass the learner-overlap check below before
            // either commits, producing overlapping interviews for the same learner across different
            // applications. Locking the learner row serializes any two reschedule attempts for that
            // learner regardless of which application they target. Mirrors the same lock
            // scheduleInterview takes before its own overlap checks.
            learnerRepository.findByIdForUpdate(existingInterview.getLearner().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Learner not found"));
            // Duration-aware overlap check when rescheduling (exclude self via interviewId)
            Integer effectiveDuration = interview.getDurationMinutes() != null
                    ? interview.getDurationMinutes() : existingInterview.getDurationMinutes();
            List<Interview> learnerCandidatesUpdate = interviewRepository.findPotentialOverlapsForLearner(existingInterview.getLearner().getId(), interviewId);
            if (hasOverlap(newDate, effectiveDuration, learnerCandidatesUpdate)) {
                throw new IllegalArgumentException("This candidate already has an interview that overlaps with the requested time. Please choose a different slot.");
            }
            List<Interview> appCandidatesUpdate = interviewRepository.findPotentialOverlapsForApplication(existingInterview.getJobApplication().getId(), interviewId);
            if (hasOverlap(newDate, effectiveDuration, appCandidatesUpdate)) {
                throw new IllegalArgumentException("This application already has an interview that overlaps with the requested time. Please choose a different slot.");
            }
            existingInterview.setScheduledDate(newDate);
            // Student V1 §7: "Changed slot" badge — old value struck through, "changed 2h ago".
            // Only a genuine change (not a form resubmitting the same date) starts that clock.
            if (!newDate.equals(dateBeforeUpdate)) {
                existingInterview.setPreviousScheduledDate(dateBeforeUpdate);
                existingInterview.setScheduledDateChangedAt(nowUtc);
            }
        }
        // SECURITY FIX (this audit round): server-side counterpart of the interviewer overlap
        // check added to scheduleInterview above — re-checked here whenever this update leaves the
        // interview with a scheduled date and interviewer name, so both "reschedule this round" and
        // "reassign the interviewer for the existing slot" are covered, not just the former.
        if (existingInterview.getInterviewerName() != null && !existingInterview.getInterviewerName().isEmpty()
                && existingInterview.getScheduledDate() != null && existingInterview.getJob() != null) {
            List<Interview> interviewerCandidatesUpdate = interviewRepository.findPotentialOverlapsForInterviewer(
                    organizationId, existingInterview.getInterviewerName(), existingInterview.getJob().getCompanyName(), interviewId);
            if (hasOverlap(existingInterview.getScheduledDate(), existingInterview.getDurationMinutes(), interviewerCandidatesUpdate)) {
                throw new IllegalArgumentException("This interviewer already has an overlapping interview scheduled for this company. Please choose a different slot or interviewer.");
            }
        }
        if (interview.getInterviewMode() != null) {
            existingInterview.setInterviewMode(interview.getInterviewMode());
        }
        // Location is already set with length validation in the block above (lines 396-401).
        // This duplicate block was removed to prevent bypassing the length check.
        if (interview.getNotes() != null) {
            existingInterview.setNotes(interview.getNotes());
        }
        if (interview.getRoundDescription() != null) {
            String rd = interview.getRoundDescription().trim();
            if (rd.isEmpty()) {
                throw new IllegalArgumentException("Round description cannot be empty. Please describe what this round is about.");
            }
            // Round 3 fix: see createInterview - roundDescription was never HTML-escaped before
            // being interpolated into candidate-facing interview notification/email templates.
            existingInterview.setRoundDescription(TextSanitizer.sanitizeText(rd));
        }

        // Mark as No Show (Gap #9, #13): allow transition from SCHEDULED/CONFIRMED to NO_SHOW
        if ("NO_SHOW".equalsIgnoreCase(interview.getInterviewStatus())) {
            String current = existingInterview.getInterviewStatus();
            if ("SCHEDULED".equalsIgnoreCase(current) || "CONFIRMED".equalsIgnoreCase(current)) {
                // Round 4 audit fix: markCompleted already refuses to complete an interview before
                // its scheduled time has passed (line ~1213) — NO_SHOW had no equivalent guard,
                // letting an admin declare "candidate didn't show up" for an interview that hasn't
                // happened yet. That NO_SHOW status then immediately unlocks submitFeedback (which
                // only requires COMPLETED or NO_SHOW), including a REJECT recommendation that
                // auto-advances the application to REJECTED — rejecting a candidate for an
                // interview that was never actually held. Uses existingInterview.getScheduledDate()
                // (not the original) so this also honors a date change made earlier in this same
                // PUT request.
                if (existingInterview.getScheduledDate() != null && existingInterview.getScheduledDate().isAfter(nowUtc)) {
                    throw new IllegalArgumentException("Cannot mark an interview as NO_SHOW before its scheduled time has passed.");
                }
                existingInterview.setInterviewStatus("NO_SHOW");
                log.info("Interview {} marked as NO_SHOW", interviewId);
            } else {
                throw new IllegalArgumentException("Cannot mark as NO_SHOW. Only SCHEDULED or CONFIRMED interviews can be marked no-show. Current: " + current);
            }
        }

        // When admin updates a RESCHEDULE_REQUESTED interview WITH a new date, treat as approved
        // reschedule. Gated on an actual date change (interview.getScheduledDate() != null, the
        // same condition that ran the reschedule block above) — otherwise an admin editing only
        // the interviewer/location/notes on a pending-reschedule interview would silently
        // "resolve" it back to SCHEDULED on the stale original date and tell the learner they'd
        // been rescheduled when nothing about the date actually changed.
        boolean wasRescheduleRequested = "RESCHEDULE_REQUESTED".equalsIgnoreCase(existingInterview.getInterviewStatus())
                && interview.getScheduledDate() != null;
        if (wasRescheduleRequested) {
            existingInterview.setInterviewStatus("SCHEDULED");
            log.info("Admin rescheduled interview {} - status set to SCHEDULED", interviewId);
        }

        Interview saved = interviewRepository.save(existingInterview);
        auditInterview("INTERVIEW_UPDATED", saved, java.util.Map.of("interviewStatus", String.valueOf(saved.getInterviewStatus())));
        // Previously only notified when resolving a RESCHEDULE_REQUESTED — an admin proactively
        // moving a SCHEDULED/CONFIRMED interview's date (e.g. correcting a typo'd time, no prior
        // learner reschedule request involved) changed the date with zero notification to the
        // learner. Notify whenever the date actually changed, not just on that one status path.
        boolean dateActuallyChanged = saved.getScheduledDate() != null
                && !saved.getScheduledDate().equals(dateBeforeUpdate);
        if (wasRescheduleRequested || dateActuallyChanged) {
            final Integer notifyInterviewId = saved.getId();
            afterCommitOrNow(() -> interviewRepository.findByIdWithAllAssociations(notifyInterviewId)
                    .ifPresent(this::sendInterviewRescheduledNotifications));
        }
        return saved;
    }

    @Override
    @Transactional
    public Interview cancelInterview(Integer interviewId, Integer organizationId) {
        log.info("Cancelling interview {} for organization {}", interviewId, organizationId);

        Interview interview = getInterviewById(interviewId, organizationId);

        // Idempotent: already cancelled is a no-op
        if ("CANCELLED".equalsIgnoreCase(interview.getInterviewStatus())) {
            log.debug("Interview {} is already cancelled", interviewId);
            return interview;
        }

        // A COMPLETED interview can already carry submitted feedback (including a HIRE
        // recommendation that already auto-advanced the application to OFFERED) — cancelling it
        // afterward left the audit trail (interview: CANCELLED) directly contradicting the live
        // application state (still OFFERED) with nothing reconciling the two. NO_SHOW is
        // likewise a terminal outcome, not a schedulable state to cancel out of.
        if ("COMPLETED".equalsIgnoreCase(interview.getInterviewStatus()) || "NO_SHOW".equalsIgnoreCase(interview.getInterviewStatus())) {
            throw new IllegalArgumentException("Cannot cancel an interview that has already been marked " + interview.getInterviewStatus() + ".");
        }

        // Pessimistic lock on the application row, held for the rest of this transaction — without
        // it, two concurrent cancellations of two DIFFERENT active rounds under the same application
        // (e.g. the last two of three active rounds) can each run
        // revertToShortlistedIfNoActiveInterviewsRemain's findActiveInterviewsForApplication query
        // before the other's CANCELLED save commits, each see the other round as "still active," and
        // both skip the SHORTLISTED revert — leaving the application stuck at INTERVIEW with zero
        // active rounds and no automatic way out. Mirrors the same lock scheduleInterview takes
        // before its own status-affecting checks.
        if (interview.getJobApplication() != null) {
            jobApplicationRepository.findByIdForUpdate(interview.getJobApplication().getId());
        }

        String previousStatus = interview.getInterviewStatus();
        interview.setInterviewStatus("CANCELLED");

        Interview saved = interviewRepository.save(interview);
        auditInterview("INTERVIEW_CANCELLED", saved, java.util.Map.of("previousStatus", String.valueOf(previousStatus)));
        // No admin actor id is threaded into cancelInterview's public signature today, so
        // statusUpdatedBy is left null here (same as unavailable elsewhere in this call path).
        revertToShortlistedIfNoActiveInterviewsRemain(saved, null);
        final Integer notifyInterviewId = saved.getId();
        afterCommitOrNow(() -> interviewRepository.findByIdWithAllAssociations(notifyInterviewId)
                .ifPresent(this::sendInterviewCancelledNotifications));
        return saved;
    }

    // An application moves to INTERVIEW status the moment a round is scheduled — but cancelling
    // or declining that round (its only active one) previously left applicationStatus stuck at
    // INTERVIEW forever, with zero active interviews behind it and no reconciliation path.
    // Reverting to SHORTLISTED is the safe pre-interview stage the state machine already allows
    // moving back to INTERVIEW from, so a new round can be scheduled cleanly.
    private void revertToShortlistedIfNoActiveInterviewsRemain(Interview cancelledOrDeclined, Integer actorId) {
        JobApplication application = cancelledOrDeclined.getJobApplication();
        if (application == null || !"INTERVIEW".equals(application.getApplicationStatus())) return;
        List<Interview> activeRounds = interviewRepository.findActiveInterviewsForApplication(application.getId(), null);
        boolean stillActive = activeRounds.stream()
                .anyMatch(i -> i.getId() != cancelledOrDeclined.getId());
        if (stillActive) return;
        // CONCURRENCY FIX (round 4 audit): must be a locking read, same rationale as
        // findActiveInterviewsForApplication above. The caller (cancelInterview/declineInterview)
        // already took jobApplicationRepository.findByIdForUpdate on this exact application row
        // BEFORE this transaction's very first plain SELECT (getInterviewById at the top of the
        // calling method) — under MySQL InnoDB REPEATABLE READ, that earlier plain read fixed the
        // transaction's consistent-read snapshot, so a plain findById() here (despite being labeled
        // "fresh") would keep reading THAT pre-lock snapshot rather than the true latest committed
        // status, even though this transaction now holds the row's write lock. A concurrent status
        // change (e.g. an admin directly moving the application to REJECTED/OFFERED) committed in
        // that window could be invisible here, causing this method to wrongly revert the
        // application back to SHORTLISTED based on stale data. A locking read always reads the
        // latest committed data regardless of the snapshot, closing that gap.
        JobApplication fresh = jobApplicationRepository.findByIdForUpdate(application.getId()).orElse(null);
        if (fresh == null || !"INTERVIEW".equals(fresh.getApplicationStatus())) return;
        String previousStatus = fresh.getApplicationStatus();
        JobApplicationStatusValidator.validateTransition(previousStatus, "SHORTLISTED");
        fresh.setApplicationStatus("SHORTLISTED");
        fresh.setStatusUpdatedBy(actorId);
        fresh.setStatusUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        jobApplicationRepository.save(fresh);
        // Consistent with every other status transition in this file (autoAdvanceApplicationStatus,
        // scheduleInterview's auto-advance): publish so downstream listeners/notifications fire.
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new ApplicationStatusChangedEvent(
                    fresh.getId(), previousStatus, "SHORTLISTED", actorId, null));
        }
        if (jobNotificationHelper != null) {
            final Integer notifyApplicationId = fresh.getId();
            afterCommitOrNow(() -> jobNotificationHelper.sendStatusNotificationAsync(notifyApplicationId, "SHORTLISTED"));
        }
    }

    @Override
    @Transactional
    public Interview confirmInterview(Integer interviewId, Integer learnerId, Integer organizationId) {
        log.info("Learner {} confirming interview {}", learnerId, interviewId);

        Interview interview = getInterviewById(interviewId, organizationId);

        // Verify learner matches (null-safe: Learner.getId() returns int, learnerId is Integer)
        if (interview.getLearner() == null || !java.util.Objects.equals(learnerId, interview.getLearner().getId())) {
            throw new IllegalArgumentException("This interview does not belong to you");
        }

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        ResolvedLearnerScope learnerScope = scopeResolutionService.resolveFullScope(learner);
        // Verify learner belongs to interview's org; fallback to learner.organizationId when scope has none
        Integer learnerOrgId = learnerScope.hasOrganization() ? learnerScope.getOrganizationId() : learner.getOrganizationId();
        if (learnerOrgId == null || !organizationId.equals(learnerOrgId)) {
            throw new IllegalArgumentException("You do not belong to this organization. Please contact your placement coordinator.");
        }

        // Cannot confirm a past-dated interview
        LocalDateTime nowUtcConfirm = LocalDateTime.now(ZoneOffset.UTC);
        if (interview.getScheduledDate() != null && interview.getScheduledDate().isBefore(nowUtcConfirm)) {
            throw new IllegalArgumentException(
                "Cannot confirm a past-dated interview. The scheduled time has already passed.");
        }

        // Only SCHEDULED interviews can be confirmed
        if (!"SCHEDULED".equals(interview.getInterviewStatus())) {
            throw new IllegalArgumentException("Only SCHEDULED interviews can be confirmed. Current status: " + interview.getInterviewStatus());
        }

        // Re-check status immediately before save to avoid cancel/confirm race (optimistic lock also protects)
        Interview current = interviewRepository.findByIdAndOrganization(interviewId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (!"SCHEDULED".equals(current.getInterviewStatus())) {
            throw new IllegalArgumentException("Interview was cancelled or already confirmed. Please refresh and try again.");
        }
        current.setInterviewStatus("CONFIRMED");
        // Student V1 §7: confirming clears the "Changed" badge — the student has now seen and
        // accepted this slot.
        current.setPreviousScheduledDate(null);
        current.setScheduledDateChangedAt(null);

        Interview savedInterview = interviewRepository.save(current);

        // Same fix as scheduleInterview/updateInterview/cancelInterview/doAutoAdvanceApplicationStatus
        // in this class: notificationDispatcherService.dispatch(...) makes blocking HTTP calls with
        // retries+backoff. Calling it synchronously here (as this previously did, despite the
        // "non-blocking" comment) ran that dispatch inside this still-open @Transactional method,
        // holding the transaction open for the whole call and risking a notification describing a
        // confirmation that hadn't actually committed yet (or never would, if the transaction later
        // failed). Deferring to after-commit matches every other notification dispatch in this file.
        final Integer notifyInterviewId = savedInterview.getId();
        afterCommitOrNow(() -> interviewRepository.findByIdWithAllAssociations(notifyInterviewId)
                .ifPresent(this::sendInterviewConfirmedNotifications));

        return savedInterview;
    }

    @Override
    @Transactional
    public Interview requestReschedule(Integer interviewId, Integer learnerId, Integer organizationId) {
        return requestReschedule(interviewId, learnerId, organizationId, null);
    }

    @Override
    @Transactional
    public Interview requestReschedule(Integer interviewId, Integer learnerId, Integer organizationId, Object requestDetails) {
        log.info("Learner {} requesting reschedule for interview {}", learnerId, interviewId);

        Interview interview = getInterviewById(interviewId, organizationId);

        // Verify learner matches (null-safe: Learner.getId() returns int, learnerId is Integer)
        if (interview.getLearner() == null || !java.util.Objects.equals(learnerId, interview.getLearner().getId())) {
            throw new IllegalArgumentException("This interview does not belong to you");
        }

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        ResolvedLearnerScope learnerScope = scopeResolutionService.resolveFullScope(learner);
        // Verify learner belongs to interview's org; fallback to learner.organizationId when scope has none
        Integer learnerOrgId = learnerScope.hasOrganization() ? learnerScope.getOrganizationId() : learner.getOrganizationId();
        if (learnerOrgId == null || !organizationId.equals(learnerOrgId)) {
            throw new IllegalArgumentException("You do not belong to this organization. Please contact your placement coordinator.");
        }

        // Only SCHEDULED or CONFIRMED interviews can request reschedule
        if (!"SCHEDULED".equals(interview.getInterviewStatus()) && !"CONFIRMED".equals(interview.getInterviewStatus())) {
            throw new IllegalArgumentException("Cannot request reschedule. Current status: " + interview.getInterviewStatus());
        }

        interview.setInterviewStatus("RESCHEDULE_REQUESTED");
        // Student V1 §7: this used to be discarded entirely — the endpoint took no body. Now the
        // learner's reason/note/preferred windows actually reach the admin reschedule screen.
        if (requestDetails != null) {
            interview.setRescheduleRequestJson(requestDetails);
        }

        Interview saved = interviewRepository.save(interview);
        notifyAdminOfLearnerInterviewAction(saved, learner, "Reschedule requested",
                "requested a new slot for");

        return saved;
    }

    // Shared by requestReschedule and declineInterview — both are learner-initiated events the
    // placement team needs to act on, not the learner themselves. declineInterview used to call
    // sendInterviewCancelledNotifications, which notifies interview.getLearner() — i.e. it told
    // the declining learner about the decline they themselves had just performed, with no signal
    // to the admin/placement team at all.
    private void notifyAdminOfLearnerInterviewAction(Interview saved, Learner learner, String title, String actionPhrase) {
        try {
            if (notificationService == null) return;
            Interview hydrated = interviewRepository.findByIdWithAllAssociations(saved.getId()).orElse(saved);
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            String jobTitle = hydrated.getJobApplication() != null && hydrated.getJobApplication().getJob() != null
                    ? hydrated.getJobApplication().getJob().getJobTitle() : "Job";
            String companyName = hydrated.getJobApplication() != null && hydrated.getJobApplication().getJob() != null
                    ? hydrated.getJobApplication().getJob().getCompanyName() : "";
            String suffix = companyName != null && !companyName.isEmpty() ? " at " + companyName : "";
            String body = learnerName + " " + actionPhrase + " " + jobTitle + suffix;
            Integer classId = learner.getClassId() != null ? learner.getClassId() : 0;
            Integer appId = hydrated.getJobApplication() != null ? hydrated.getJobApplication().getId() : null;
            Integer jobId = hydrated.getJob() != null ? hydrated.getJob().getId() : null;
            notificationService.createNotification(title, body, classId, 0, "JOB",
                    jobTitle + suffix, appId, jobId, null, saved.getId());
            log.info("Admin notification sent ({}) for interview {}", title, saved.getId());
        } catch (Exception e) {
            log.warn("Failed to send admin notification for interview {}: {}", saved.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public Interview declineInterview(Integer interviewId, Integer learnerId, Integer organizationId) {
        log.info("Learner {} declining interview {}", learnerId, interviewId);

        Interview interview = getInterviewById(interviewId, organizationId);

        if (interview.getLearner() == null || !java.util.Objects.equals(learnerId, interview.getLearner().getId())) {
            throw new IllegalArgumentException("This interview does not belong to you");
        }

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));
        ResolvedLearnerScope learnerScope = scopeResolutionService.resolveFullScope(learner);
        Integer learnerOrgId = learnerScope.hasOrganization() ? learnerScope.getOrganizationId() : learner.getOrganizationId();
        if (learnerOrgId == null || !organizationId.equals(learnerOrgId)) {
            throw new IllegalArgumentException("You do not belong to this organization. Please contact your placement coordinator.");
        }

        // A learner's only prior options were Confirm or Request Reschedule — both imply they
        // still want a slot. There was no way to signal "I no longer want to interview here at
        // all" (e.g. already accepted an offer elsewhere), leaving the placement team no signal.
        if (!"SCHEDULED".equals(interview.getInterviewStatus())
                && !"CONFIRMED".equals(interview.getInterviewStatus())
                && !"RESCHEDULE_REQUESTED".equals(interview.getInterviewStatus())) {
            throw new IllegalArgumentException("Cannot decline. Current status: " + interview.getInterviewStatus());
        }

        // Student V1 §5/§7: "Decline interview becomes a withdrawal request (same path as
        // above)" — declining an interview means the student is already scheduled into a round
        // (that is what an interview row IS), so this is no longer an instant self-service
        // cancel. It now points at the same "ask the placement cell" path as
        // JobServiceImpl.withdrawApplication's post-scheduling guard, via the same exception type
        // so the frontend handles both identically.
        throw new com._42students.lms.exceptions.WithdrawRequiresRequestException(
                "Ask the placement cell to withdraw instead of declining this interview directly.");
    }

    /**
     * Send interview scheduled notifications via multiple channels.
     * Used for Round 2+ when status is already INTERVIEW (status-change handler sends for Round 1).
     * Non-blocking - failures are logged but don't affect the scheduling.
     */
    private void sendInterviewScheduledNotifications(Interview interview) {
        try {
            Learner learner = interview.getLearner();
            JobApplication application = interview.getJobApplication();
            if (application == null || application.getJob() == null) {
                log.warn("Cannot send interview scheduled notifications - missing job/application data");
                return;
            }
            
            if (learner == null) {
                log.warn("Cannot send interview scheduled notifications - learner is null");
                return;
            }
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("jobTitle", application.getJob().getJobTitle());
            variables.put("companyName", application.getJob().getCompanyName());
            variables.put("status", "INTERVIEW");
            variables.put("applicationId", application.getId());
            variables.put("jobId", application.getJob() != null ? application.getJob().getId() : null);
            variables.put("interviewId", interview.getId());
            if (application.getAppliedAt() != null) {
                variables.put("applicationDate", application.getAppliedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
            }
            if (interview.getScheduledDate() != null) {
                // Stored in UTC; the student reads India time.
                variables.put("interviewDate", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                variables.put("interviewTime", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
            }
            if (interview.getInterviewMode() != null) {
                variables.put("interviewMode", interview.getInterviewMode());
            }
            String roundName = formatRoundName(interview.getInterviewType());
            variables.put("roundName", roundName != null ? roundName : "Interview");
            variables.put("roundDescription", interview.getRoundDescription() != null ? interview.getRoundDescription().trim() : "");
            if (interview.getLocation() != null) {
                boolean online = "ONLINE".equalsIgnoreCase(interview.getInterviewMode());
                variables.put(online ? "meetingLink" : "venueAddress", interview.getLocation());
                variables.put(online ? "venueAddress" : "meetingLink", "");
            } else {
                variables.put("meetingLink", "");
                variables.put("venueAddress", "");
            }
            if (learner.getContactMobile() != null) {
                variables.put("contactPhone", learner.getContactMobile());
            } else if (learner.getContactPhone() != null) {
                variables.put("contactPhone", learner.getContactPhone());
            }
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
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
                    notificationDispatcherService.dispatch(NotificationEvent.JOB_INTERVIEW_SCHEDULED, context, recipient, variables);
                } catch (Exception e) {
                    log.error("Failed to send interview scheduled notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending interview scheduled notifications: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send interview confirmed notifications via multiple channels
     * Non-blocking - failures are logged but don't affect the confirmation
     */
    private void sendInterviewConfirmedNotifications(Interview interview) {
        try {
            Learner learner = interview.getLearner();
            JobApplication application = interview.getJobApplication();
            if (application == null || application.getJob() == null) {
                log.warn("Cannot send interview confirmed notifications - missing job/application data");
                return;
            }
            
            if (learner == null) {
                log.warn("Cannot send interview confirmed notifications - learner is null");
                return;
            }
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("jobTitle", application.getJob().getJobTitle());
            variables.put("companyName", application.getJob().getCompanyName());
            variables.put("applicationId", application.getId());
            variables.put("jobId", application.getJob() != null ? application.getJob().getId() : null);
            variables.put("interviewId", interview.getId());
            if (application.getAppliedAt() != null) {
                variables.put("applicationDate", application.getAppliedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
            }
            if (interview.getScheduledDate() != null) {
                // Stored in UTC; the student reads India time.
                variables.put("interviewDate", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                variables.put("interviewTime", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
            }
            if (interview.getInterviewMode() != null) {
                variables.put("interviewMode", interview.getInterviewMode());
            }
            if (interview.getLocation() != null) {
                variables.put("interviewLocation", interview.getLocation());
            }
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
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
                    notificationDispatcherService.dispatch(NotificationEvent.INTERVIEW_CONFIRMED, context, recipient, variables);
                } catch (Exception e) {
                    log.error("Failed to send interview confirmed notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending interview confirmed notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Send interview cancelled notifications to the learner.
     * Non-blocking — failures are logged but don't affect the cancellation.
     */
    private void sendInterviewCancelledNotifications(Interview interview) {
        try {
            Learner learner = interview.getLearner();
            JobApplication application = interview.getJobApplication();
            if (learner == null || application == null || application.getJob() == null) {
                log.warn("Cannot send interview cancelled notification — missing learner/job data");
                return;
            }
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("jobTitle", application.getJob().getJobTitle());
            variables.put("companyName", application.getJob().getCompanyName());
            variables.put("applicationId", application.getId());
            variables.put("interviewId", interview.getId());
            if (interview.getScheduledDate() != null) {
                // Stored in UTC; the student reads India time.
                variables.put("interviewDate", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                variables.put("interviewTime", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
            }
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learner.getFirstName() + " " + learner.getLastName())
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(null)
                    .build();
            if (notificationDispatcherService != null) {
                notificationDispatcherService.dispatch(NotificationEvent.INTERVIEW_CANCELLED, context, recipient, variables);
            }
        } catch (Exception e) {
            log.warn("Failed to send interview cancelled notification for interview {}: {}", interview.getId(), e.getMessage());
        }
    }

    /**
     * Send notification to learner when admin resolves a reschedule request with a new date/time.
     * Non-blocking — failures are logged but don't affect the update.
     */
    private void sendInterviewRescheduledNotifications(Interview interview) {
        try {
            Learner learner = interview.getLearner();
            JobApplication application = interview.getJobApplication();
            if (learner == null || application == null || application.getJob() == null) {
                log.warn("Cannot send interview rescheduled notification — missing learner/job data");
                return;
            }
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("jobTitle", application.getJob().getJobTitle());
            variables.put("companyName", application.getJob().getCompanyName());
            variables.put("applicationId", application.getId());
            variables.put("interviewId", interview.getId());
            if (interview.getScheduledDate() != null) {
                // Stored in UTC; the student reads India time.
                variables.put("interviewDate", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                variables.put("interviewTime", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
            }
            if (interview.getInterviewMode() != null) {
                variables.put("interviewMode", interview.getInterviewMode());
            }
            if (interview.getLocation() != null) {
                boolean online = "ONLINE".equalsIgnoreCase(interview.getInterviewMode());
                variables.put(online ? "meetingLink" : "venueAddress", interview.getLocation());
                variables.put(online ? "venueAddress" : "meetingLink", "");
            }
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learner.getFirstName() + " " + learner.getLastName())
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(null)
                    .build();
            if (notificationDispatcherService != null) {
                notificationDispatcherService.dispatch(NotificationEvent.INTERVIEW_RESCHEDULED, context, recipient, variables);
            }
        } catch (Exception e) {
            log.warn("Failed to send interview rescheduled notification for interview {}: {}", interview.getId(), e.getMessage());
        }
    }

    /**
     * Auto-advance application status based on feedback recommendation action.
     * HIRE → OFFERED, REJECT → REJECTED, HOLD/PROCEED_NEXT_ROUND → no-op (manual decision).
     * Wrapped in try/catch so a failure here never blocks feedback submission.
     *
     * <p>An {@link ObjectOptimisticLockingFailureException} (the application row was updated
     * concurrently between our fresh-fetch and our save — e.g. two interviewers submitting
     * feedback around the same time) gets exactly one retry: we re-fetch the application again
     * (see {@link #doAutoAdvanceApplicationStatus}) and try once more, since the conflicting write
     * has very likely already landed by then. If it fails again, or any other exception occurs,
     * this is logged and swallowed per the "never block feedback submission" contract above — the
     * feedback itself is already saved by the caller; only the status auto-advance is skipped.
     */
    private void autoAdvanceApplicationStatus(Interview interview, Integer actorId) {
        try {
            doAutoAdvanceApplicationStatus(interview, actorId);
        } catch (ObjectOptimisticLockingFailureException firstAttemptEx) {
            log.warn("Auto-advance application status hit an optimistic-lock conflict for interview {} " +
                            "(concurrent update to the application) — retrying once: {}",
                    interview.getId(), firstAttemptEx.getMessage());
            try {
                doAutoAdvanceApplicationStatus(interview, actorId);
            } catch (ObjectOptimisticLockingFailureException retryEx) {
                // Tagged distinctly so this is easy to grep for: the interviewer's recommendation
                // (e.g. HIRE) was recorded in feedback, but the application status was NOT
                // automatically advanced and may need manual follow-up.
                log.warn("OPTIMISTIC_LOCK_FAILURE: auto-advance application status failed for interview {} " +
                                "after one retry — feedback was saved but the status was NOT auto-advanced; " +
                                "may require manual review: {}",
                        interview.getId(), retryEx.getMessage());
            } catch (Exception retryEx) {
                log.warn("Auto-advance application status failed on retry for interview {}: {}",
                        interview.getId(), retryEx.getMessage());
            }
        } catch (Exception e) {
            log.warn("Auto-advance application status failed for interview {}: {}", interview.getId(), e.getMessage());
        }
    }

    private void doAutoAdvanceApplicationStatus(Interview interview, Integer actorId) {
            String action = interview.getFeedbackRecommendAction();
            if (action == null) return;

            JobApplication application = interview.getJobApplication();
            if (application == null) return;

            // Re-fetch fresh application to avoid stale state
            JobApplication freshApp = jobApplicationRepository.findById(application.getId()).orElse(null);
            if (freshApp == null) return;

            String currentStatus = freshApp.getApplicationStatus();
            String newStatus = null;

            switch (action.toUpperCase()) {
                case "HIRE":
                    newStatus = "OFFERED";
                    break;
                case "REJECT":
                    newStatus = "REJECTED";
                    break;
                case "PROCEED_NEXT_ROUND":
                case "HOLD":
                default:
                    return; // No auto-advance; admin decides manually
            }

            // Restrict auto-advance to the case where this round's feedback is actually the
            // decision the application is currently waiting on. submitFeedback deliberately allows
            // overwrite-on-resubmit for ANY completed/no-show round (including a stale or
            // non-decisive earlier round), but without this guard the generic isValidTransition
            // check below only looks at the CURRENT status — it has no notion of "is this the round
            // driving the decision". That let a stale HIRE resubmission on an old round silently
            // revert an already-HIRED application back to OFFERED (isValidTransition(HIRED,
            // OFFERED) is true — it's the deliberate admin manual-undo transition, not something a
            // feedback resubmission should trigger), and let a stale REJECT resubmission on an
            // earlier round silently rescind an offer already communicated on a later round
            // (isValidTransition(OFFERED, REJECTED) is true). Mirrors scheduleInterview's own
            // isPreInterviewStatus guard (~line 263), which restricts ITS auto-advance to only fire
            // from a genuinely pre-decision status. Here the only genuinely pre-decision status is
            // INTERVIEW itself — HIRED/OFFERED/REJECTED/WITHDRAWN mean some decision (this round's
            // or a later one) has already been made, so a feedback resubmission should not mutate
            // status again. Does not throw: feedback submission itself must still succeed per the
            // "never blocks feedback submission" contract documented on autoAdvanceApplicationStatus.
            if (!"INTERVIEW".equalsIgnoreCase(currentStatus)) {
                log.info("Auto-advance skipped for application {}: current status is {} (not INTERVIEW) — " +
                                "this feedback submission is not the decision currently pending for this application, " +
                                "likely a stale/non-decisive round; feedback was still saved by the caller",
                        freshApp.getId(), currentStatus);
                return;
            }

            if (!JobApplicationStatusValidator.isValidTransition(currentStatus, newStatus)) {
                log.info("Auto-advance skipped for application {}: {} → {} is not a valid transition",
                        freshApp.getId(), currentStatus, newStatus);
                return;
            }

            // Defensive same-status short-circuit, matching AdminJobServiceImpl.updateApplicationStatus
            // (~line 943) and PlacementJobServiceImpl.updateApplicationStatus (~line 1021) — skip the
            // mutation/event/notification when there is no actual change. Largely redundant with the
            // INTERVIEW-only guard above for the HIRED/OFFERED same-status cases (those never reach here
            // since currentStatus would already fail the check above), but kept for consistency with the
            // other two service classes and to cover any other same-status case.
            if (newStatus.equalsIgnoreCase(currentStatus)) {
                log.debug("Auto-advance skipped for application {}: status unchanged ({} → {})",
                        freshApp.getId(), currentStatus, newStatus);
                return;
            }

            freshApp.setApplicationStatus(newStatus);
            freshApp.setStatusUpdatedBy(actorId);
            freshApp.setStatusUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            // Manual admin rejection always persists a rejectionReason; this auto-reject path
            // (interview feedback recommending REJECT) left it null, so a candidate auto-rejected
            // from interview feedback had no reason visible anywhere despite feedback comments
            // existing on the interview itself.
            // Student V1 hotfix: this used to copy the interviewer's raw feedbackComments straight
            // into rejectionReason, which JobApplication/LearnerApplicationWithInterviewsDTO and the
            // status-history views all surface to the candidate verbatim as "Feedback from the
            // team" — an interviewer's private panel notes were never meant to be read by the
            // candidate. Same split JobApplication.internalReason and ApplicationTransitionService
            // already use elsewhere: raw comments go to internalReason (never serialised to the
            // learner), rejectionReason gets a safe, honest, generic student-facing line.
            String rejectionReason = null;
            if ("REJECTED".equals(newStatus)) {
                String comments = interview.getFeedbackComments();
                String internalNote = (comments != null && !comments.trim().isEmpty()) ? comments.trim() : null;
                if (internalNote != null && internalNote.length() > 1000) internalNote = internalNote.substring(0, 1000);
                rejectionReason = "Not selected after interview";
                freshApp.setRejectionReason(rejectionReason);
                if (internalNote != null) freshApp.setInternalReason(internalNote);
                // Round 5 audit fix: NO_SHOW (unlike SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED) does
                // NOT block scheduleInterview from opening a new round (see
                // findActiveInterviewsForApplication's status set), so a stale Round 1 can sit
                // NO_SHOW with feedback still unsubmitted while Round 2 is actively
                // SCHEDULED/CONFIRMED. Submitting a REJECT recommendation against that stale Round 1
                // auto-advances the application straight to REJECTED here — but without this cascade,
                // Round 2 stayed live (confirmable/reschedulable by the candidate) on an application
                // that had already moved to a terminal REJECTED state. Every OTHER path that can
                // produce REJECTED (AdminJobServiceImpl/PlacementJobServiceImpl.updateApplicationStatus,
                // JobServiceImpl.withdrawApplication/respondToOffer) already cascades via their own
                // cancelNonTerminalInterviewsForApplication[Locked]; this was the one gap.
                cancelNonTerminalInterviewsForApplication(freshApp);
            }
            jobApplicationRepository.save(freshApp);

            if (eventPublisher != null) {
                eventPublisher.publishEvent(new ApplicationStatusChangedEvent(
                        freshApp.getId(), currentStatus, newStatus, actorId, rejectionReason));
            }
            // Same afterCommit + async pattern as every other status-notification dispatch in this
            // class (scheduleInterview ~line 276, revertToShortlistedIfNoActiveInterviewsRemain
            // ~line 650) and in AdminJobServiceImpl.sendJobApplicationStatusNotifications — calling
            // the blocking, synchronous sendStatusNotification(...) directly here (as this
            // previously did) ran retrying HTTP dispatch calls inside this still-open @Transactional
            // submitFeedback call, and could describe a status change that had not yet committed
            // (or, if the surrounding transaction later failed, one that never committed at all).
            if (jobNotificationHelper != null) {
                final Integer notifyApplicationId = freshApp.getId();
                final String notifyStatus = newStatus;
                afterCommitOrNow(() -> jobNotificationHelper.sendStatusNotificationAsync(notifyApplicationId, notifyStatus));
            }
            log.info("Auto-advanced application {} from {} to {} based on feedback action {}",
                    freshApp.getId(), currentStatus, newStatus, action);
    }

    // Mirrors AdminJobServiceImpl.cancelNonTerminalInterviewsForApplication /
    // PlacementJobServiceImpl's identical copy: cancel every SCHEDULED/CONFIRMED/
    // RESCHEDULE_REQUESTED interview left on an application that just became REJECTED, so a
    // rejected candidate never keeps a live, confirmable/reschedulable interview slot. Used by
    // doAutoAdvanceApplicationStatus's REJECT path — the one REJECTED-producing path in the
    // codebase that previously had no such cascade (every admin/learner-initiated REJECTED path
    // already had its own copy of this same cascade in the other two services).
    // AUDIT FIX (round 2 self-review of round 5): this cascade runs inside
    // doAutoAdvanceApplicationStatus, which fetches freshApp via a PLAIN jobApplicationRepository
    // .findById (optimistic-locking + one retry, not a pessimistic lock — see
    // autoAdvanceApplicationStatus's javadoc). Under MySQL InnoDB REPEATABLE READ, a plain
    // (non-locking) interview lookup here would be bound to this transaction's first-read
    // snapshot and could miss a brand-new interview a concurrent scheduleInterview call just
    // committed for this same application — the exact same visibility gap
    // InterviewRepository.findNonTerminalByJobApplicationIdForUpdate was introduced to close for
    // the other three withdrawal cascades (see its javadoc). Using the locking variant here closes
    // the same gap for this cascade: a REJECT-recommendation feedback submission against a stale
    // NO_SHOW round must not leave a just-scheduled Round 2 live and dangling on a terminal
    // REJECTED application. This does not introduce a new deadlock risk: it locks only the
    // Interview rows themselves (no JobApplication row lock is taken here), and no other code path
    // takes a pessimistic lock on an existing Interview row without a JobApplication lock already
    // held in Application-then-Interview order, so no reversed pair of locks can exist between
    // this method and any other caller.
    private void cancelNonTerminalInterviewsForApplication(JobApplication application) {
        for (Interview iv : interviewRepository.findNonTerminalByJobApplicationIdForUpdate(application.getId())) {
            String previousStatus = iv.getInterviewStatus();
            iv.setInterviewStatus("CANCELLED");
            Interview savedCancelled = interviewRepository.save(iv);
            auditInterview("INTERVIEW_CANCELLED", savedCancelled, java.util.Map.of(
                    "previousStatus", String.valueOf(previousStatus),
                    "cause", "application_rejected_via_stale_round_feedback"));
            final Integer cancelledInterviewId = savedCancelled.getId();
            afterCommitOrNow(() -> interviewRepository.findByIdWithAllAssociations(cancelledInterviewId)
                    .ifPresent(this::sendInterviewCancelledNotifications));
        }
    }

    private static String formatRoundName(String interviewType) {
        if (interviewType == null || interviewType.isBlank()) return null;
        String normalized = interviewType.trim().toLowerCase();
        switch (normalized) {
            case "screening": return "Screening Round";
            case "technical": return "Technical Round";
            case "hr": return "HR Round";
            case "managerial": return "Managerial Round";
            case "final": return "Final Round";
            default: return interviewType.trim() + " Round";
        }
    }

    /**
     * Submit interview feedback. Allows overwrite if feedback was already submitted (Gap #4, #26).
     * Re-submitting updates the existing feedback; no 409 is returned.
     */
    @Override
    @Transactional
    public Interview markCompleted(Integer interviewId, Integer organizationId, Integer completedBy) {
        log.info("Admin {} marking interview {} as COMPLETED", completedBy, interviewId);

        Interview interview = getInterviewById(interviewId, organizationId);
        String current = interview.getInterviewStatus();

        // Idempotent
        if ("COMPLETED".equalsIgnoreCase(current)) {
            return interview;
        }
        if (!"SCHEDULED".equalsIgnoreCase(current) && !"CONFIRMED".equalsIgnoreCase(current)) {
            throw new IllegalArgumentException(
                "Only SCHEDULED or CONFIRMED interviews can be marked as Completed. Current status: " + current);
        }
        // Without this, feedback (and the HIRE/REJECT recommendation it can carry, which
        // auto-advances the application) could be recorded before the interview it's supposedly
        // based on has actually happened — contradicting schedule -> happen -> complete ordering.
        if (interview.getScheduledDate() != null && interview.getScheduledDate().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Cannot mark an interview completed before its scheduled time has passed.");
        }

        interview.setInterviewStatus("COMPLETED");
        Interview saved = interviewRepository.save(interview);
        log.info("Interview {} marked as COMPLETED by admin {}", interviewId, completedBy);

        // Notify learner that their interview has been marked complete
        try {
            Interview hydratedCompleted = interviewRepository.findByIdWithAllAssociations(saved.getId()).orElse(saved);
            if (notificationService != null && hydratedCompleted.getLearner() != null) {
                String jobTitle = hydratedCompleted.getJobApplication() != null && hydratedCompleted.getJobApplication().getJob() != null
                        ? hydratedCompleted.getJobApplication().getJob().getJobTitle() : "Interview";
                String companyName = hydratedCompleted.getJobApplication() != null && hydratedCompleted.getJobApplication().getJob() != null
                        ? hydratedCompleted.getJobApplication().getJob().getCompanyName() : "";
                String title = "Interview completed";
                String body = "Your interview for " + jobTitle + (companyName != null && !companyName.isEmpty() ? " at " + companyName : "") + " has been marked as completed.";
                Integer classId = hydratedCompleted.getLearner().getClassId() != null ? hydratedCompleted.getLearner().getClassId() : 0;
                Integer appId = hydratedCompleted.getJobApplication() != null ? hydratedCompleted.getJobApplication().getId() : null;
                Integer jobId = hydratedCompleted.getJob() != null ? hydratedCompleted.getJob().getId() : null;
                notificationService.createNotification(title, body, classId, 0, hydratedCompleted.getLearner().getId(), "JOB",
                        jobTitle + (companyName != null && !companyName.isEmpty() ? " at " + companyName : ""),
                        appId, jobId, null, saved.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to send interview-completed notification for interview {}: {}", interviewId, e.getMessage());
        }

        return saved;
    }

    @Override
    @Transactional
    public Interview cancelRescheduleRequest(Integer interviewId, Integer learnerId, Integer organizationId) {
        log.info("Learner {} cancelling reschedule request for interview {}", learnerId, interviewId);

        Interview interview = getInterviewById(interviewId, organizationId);

        // Verify learner ownership
        if (interview.getLearner() == null || !java.util.Objects.equals(learnerId, interview.getLearner().getId())) {
            throw new IllegalArgumentException("This interview does not belong to you");
        }

        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        ResolvedLearnerScope learnerScope = scopeResolutionService.resolveFullScope(learner);
        Integer learnerOrgId = learnerScope.hasOrganization() ? learnerScope.getOrganizationId() : learner.getOrganizationId();
        if (learnerOrgId == null || !organizationId.equals(learnerOrgId)) {
            throw new IllegalArgumentException("You do not belong to this organization. Please contact your placement coordinator.");
        }

        if (!"RESCHEDULE_REQUESTED".equals(interview.getInterviewStatus())) {
            throw new IllegalArgumentException(
                "Can only cancel a reschedule request when status is RESCHEDULE_REQUESTED. Current: " + interview.getInterviewStatus());
        }

        // Revert to SCHEDULED (safe default — learner can re-confirm if needed)
        interview.setInterviewStatus("SCHEDULED");
        Interview saved = interviewRepository.save(interview);
        log.info("Reschedule request cancelled for interview {} by learner {}", interviewId, learnerId);
        return saved;
    }

    /** Valid recommendation actions for interview feedback. */
    private static final List<String> VALID_RECOMMEND_ACTIONS = Arrays.asList(
            "PROCEED_NEXT_ROUND", "HIRE", "REJECT", "HOLD"
    );

    @Override
    @Transactional
    public Interview submitFeedback(Integer interviewId, Integer organizationId, Integer rating, String comments, String recommendAction, Integer submittedBy) {
        Interview interview = getInterviewById(interviewId, organizationId);

        // Feedback is only meaningful after the interview has taken place
        String status = interview.getInterviewStatus();
        if (!"COMPLETED".equalsIgnoreCase(status) && !"NO_SHOW".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException(
                "Feedback can only be submitted for COMPLETED or NO_SHOW interviews. " +
                "Please mark the interview as Completed first. Current status: " + status);
        }

        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        if (recommendAction != null && !VALID_RECOMMEND_ACTIONS.contains(recommendAction.toUpperCase())) {
            throw new IllegalArgumentException(
                "Invalid recommendation action. Must be one of: " + String.join(", ", VALID_RECOMMEND_ACTIONS));
        }

        interview.setFeedbackRating(rating);
        interview.setFeedbackComments(comments != null ? comments.trim() : null);
        interview.setFeedbackRecommendAction(recommendAction != null ? recommendAction.toUpperCase() : null);
        interview.setFeedbackSubmittedAt(LocalDateTime.now(ZoneOffset.UTC));
        interview.setFeedbackSubmittedBy(submittedBy);
        Interview saved = interviewRepository.save(interview);
        // Overwrite-on-resubmit is intentional (see class javadoc above) and is NOT being changed
        // here — but resubmission can silently re-flip an already-advanced application status
        // (autoAdvanceApplicationStatus below) with a contradictory candidate notification, and
        // until now left zero trace of who/when/what recommendAction was set, unlike every other
        // mutating method in this class (scheduleInterview/updateInterview/cancelInterview), which
        // all call auditInterview. This is at minimum a traceability fix for resubmissions.
        auditInterview("INTERVIEW_FEEDBACK_SUBMITTED", saved, java.util.Map.of(
                "rating", String.valueOf(rating),
                "recommendAction", String.valueOf(saved.getFeedbackRecommendAction()),
                "submittedBy", String.valueOf(submittedBy)));
        autoAdvanceApplicationStatus(saved, submittedBy);
        return saved;
    }

    @Override
    public void notifyInterviewCancelledByCascade(Integer interviewId, String previousStatus) {
        interviewRepository.findByIdWithAllAssociations(interviewId).ifPresent(interview -> {
            auditInterview("INTERVIEW_CANCELLED", interview, java.util.Map.of(
                    "previousStatus", String.valueOf(previousStatus),
                    "cause", "application_status_cascade"));
            sendInterviewCancelledNotifications(interview);
        });
    }

    @Override
    public java.util.List<String> getInterviewerNames(Integer organizationId) {
        if (organizationId == null) {
            return java.util.Collections.emptyList();
        }
        return interviewRepository.findDistinctInterviewerNames(organizationId);
    }
}


