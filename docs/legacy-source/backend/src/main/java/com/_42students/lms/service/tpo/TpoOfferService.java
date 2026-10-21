package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.model.tpo.RoundResult;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.tpo.JobOfferRepository;
import com._42students.lms.repository.tpo.RoundResultRepository;
import com._42students.lms.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Offers as they really happen: selection before a letter exists, LOIs, release separate from
 * status, a minimum response window, waitlist promotion that skips rule-blocked students, offer
 * withdrawal by the company, and a bounded reversal of a wrong acceptance. See
 * TPO V1 - Locked.docx §5 "Offers" and the reviewer panel's round-2 resolution (conflict #3, #4).
 *
 * Known V1 gap (documented, not hidden — see docs/tpo-v1/BUILD-LOG.md): accepting in-app still
 * calls the existing JobServiceImpl.respondToOffer, whose cascade withdraws ALL of a learner's
 * other active applications, not only the ones the dream-uplift rule would actually block.
 * Making that cascade rule-aware means editing a heavily audited method
 * (withdrawOtherActiveApplications) under time pressure with no regression suite run tonight —
 * flagged as a dedicated follow-up rather than risked here.
 */
@Service
@RequiredArgsConstructor
public class TpoOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final RoundResultRepository roundResultRepository;
    private final JobService jobService;
    private final PlacementRulesService placementRulesService;
    private final NotificationOutboxService outboxService;
    private final TpoAuditService audit;
    private final TpoMailService mail;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final ApplicationTransitionService transitions;

    /** Bulk "Record selections": each row becomes a SELECTED offer, letter optional. */
    // noRollbackFor: the refusals below come before any write, so a list can skip that one student and carry on.
    @Transactional(noRollbackFor = IllegalStateException.class)
    public JobOffer recordSelection(Integer applicationId, String roleOptionName, BigDecimal ctcLpa,
                                     String kind, Integer createdById, String createdByType) {
        // A selection is for a student still in play who holds no live offer on this application: selecting again created a
        // second offer row, and a rejected or withdrawn student could be selected.
        // Row lock first: a double click (or two people) recording the same student at once both saw "no live offer" and made two.
        jdbc.queryForList("SELECT id FROM job_application WHERE id = :a FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("a", applicationId), Integer.class);
        JobApplication app = jobApplicationRepository.findById(applicationId).orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (!ApplicationTransitionService.OPEN_STAGES.contains(String.valueOf(app.getApplicationStatus()))) {
            throw new IllegalStateException("This student is " + String.valueOf(app.getApplicationStatus()).toLowerCase() + ", so they can't be selected");
        }
        boolean live = jobOfferRepository.findByApplicationId(applicationId).stream()
                .anyMatch(o -> java.util.Set.of("SELECTED", "PENDING_VERIFICATION", "RELEASED", "ACCEPTED").contains(o.getStatus()));
        if (live) throw new IllegalStateException("This student already has an offer on this drive");
        JobOffer offer = new JobOffer();
        offer.setApplicationId(applicationId);
        offer.setKind(kind == null ? "OFFER" : kind);
        offer.setRoleOptionName(roleOptionName);
        offer.setCtcLpa(ctcLpa);
        offer.setStatus("SELECTED");
        offer.setCreatedByType(createdByType == null ? "TPO" : createdByType);
        offer.setCreatedById(createdById);
        offer.setCreatedAt(LocalDateTime.now());
        offer.setUpdatedAt(LocalDateTime.now());
        return jobOfferRepository.save(offer);
    }

    /** A link a person will click: http(s) only, at most 2048 characters (the admin path's rule). Null or blank clears it. */
    public static String webLink(String raw) {
        String v = raw == null ? null : raw.trim();
        if (v == null || v.isEmpty()) return null;
        if (v.length() > 2048 || !v.matches("(?i)^https?://\\S+$")) throw new IllegalArgumentException("The letter must be a web link (https://...)");
        return v;
    }

    @Transactional
    public JobOffer attachLetter(Long offerId, String letterUrl) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        offer.setLetterUrl(webLink(letterUrl)); // it becomes a link the student clicks: only http(s), never javascript: or data:
        return jobOfferRepository.save(offer);
    }

    /**
     * Verify (company/role/CTC match the drive; letter present or pending) then release. This is
     * the only path that sets the application's status to OFFERED, so the existing learner
     * accept/decline UI keeps working unchanged.
     */
    @Transactional
    public JobOffer verifyAndRelease(Long offerId, Integer verifierFacultyId) {
        // Row lock first, so a double click releases once (the second waits, then reads Released and is refused) instead of two notices.
        jdbc.queryForList("SELECT id FROM job_offer WHERE id = :o FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("o", offerId), Long.class);
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        // Only a recorded selection is released. Releasing again used to reopen a withdrawn, expired or answered offer
        // with a fresh respond-by date and a second "you have an offer" notice.
        if (!"SELECTED".equals(offer.getStatus())) {
            throw new IllegalStateException("This offer is " + String.valueOf(offer.getStatus()).toLowerCase() + ", so it can't be released again");
        }
        JobApplication application = jobApplicationRepository.findById(offer.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        Job job = application.getJob();
        Integer collegeId = job == null ? null : job.getCollegeId();
        // A cancelled drive releases nothing (its selections are withdrawn when it is cancelled; this covers older ones).
        if (job != null && "CANCELLED".equals(job.getLifecycleStatus())) throw new IllegalStateException("This drive was cancelled, so its selections can't be released");
        // The student must still be in play: a not-selected or withdrawn student was given an offer they could not answer.
        if (!ApplicationTransitionService.OPEN_STAGES.contains(String.valueOf(application.getApplicationStatus()))) {
            throw new IllegalStateException("This student is " + ApplicationTransitionService.stageWord(application.getApplicationStatus()) + ", so this selection can't be released");
        }

        // Blocked check: does the student already hold an offer this one doesn't clear?
        if (collegeId != null && application.getLearner() != null) {
            List<JobOffer> allForLearner = jobOfferRepository.findByApplicationId(offer.getApplicationId());
            // Held offers across the learner's OTHER applications:
            List<Integer> otherAppIds = jobApplicationRepository.findByLearnerId(application.getLearner().getId()).stream()
                    .filter(a -> a.getJob() == null || !Boolean.FALSE.equals(a.getJob().getCountsAsPlaced())) // offers that never count as placed are never held offers
                    .map(JobApplication::getId).filter(id -> !id.equals(application.getId())).toList();
            List<BigDecimal> heldCtcs = otherAppIds.stream()
                    .flatMap(id -> jobOfferRepository.findByApplicationId(id).stream())
                    .filter(o -> "RELEASED".equals(o.getStatus()) || "ACCEPTED".equals(o.getStatus()))
                    .map(o -> o.getCtcLpa() == null ? BigDecimal.ZERO : o.getCtcLpa())
                    .toList();
            boolean isDream = job.getCategory() != null && job.getCategory().contains("DREAM");
            boolean internship = Boolean.FALSE.equals(job.getCountsAsPlaced()); // Internship, or a college type that does not count
            if (!internship && placementRulesService.isBlockedByHeldOffers(collegeId, application.getLearner().getId(), heldCtcs, offer.getCtcLpa(), isDream)) {
                throw new IllegalStateException("Not allowed by college rules: student already holds an offer this one doesn't clear");
            }
            offer.setRespondBy(placementRulesService.minimumRespondBy(collegeId, application.getLearner().getId(), LocalDateTime.now()));
        } else {
            offer.setRespondBy(LocalDateTime.now().plusHours(48));
        }

        offer.setStatus("RELEASED");
        offer.setVerifiedBy(verifierFacultyId);
        offer.setReleasedAt(LocalDateTime.now());
        jobOfferRepository.save(offer);

        // Move the application to OFFERED via the existing transition machinery so history and
        // the learner's Offers screen behave exactly as before.
        String current = application.getApplicationStatus();
        if (!"OFFERED".equals(current)) {
            // A company can select a student after any round (a test-only drive has no interview), so every open stage may move to Offered.
            // The legacy status rules only allow Interview and Waitlisted, which is why they are not used here.
            if (!java.util.Set.of("APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED").contains(String.valueOf(current))) {
                throw new IllegalStateException("This student is " + String.valueOf(current).toLowerCase() + ", so an offer can't be released");
            }
            application.setOfferLetterUrl(offer.getLetterUrl());
            application.setOfferLetterSentAt(LocalDateTime.now());
            transitions.record(application, "OFFERED", verifierFacultyId, null);
        }
        if (application.getLearner() != null) {
            Map<String, Object> released = new java.util.LinkedHashMap<>();
            released.put("offerId", offer.getId()); released.put("applicationId", application.getId());
            released.put("company", job == null ? "" : job.getCompanyName()); released.put("role", job == null ? "" : job.getJobTitle());
            released.put("ctc", offer.getCtcLpa() == null ? "" : offer.getCtcLpa().toPlainString());
            released.put("respondBy", offer.getRespondBy() == null ? "" : offer.getRespondBy().toString().replace('T', ' '));
            outboxService.enqueue("OFFER_RELEASED", "LEARNER", application.getLearner().getId(), "APP", released, null, false);
        }
        return offer;
    }

    /** In-app accept/decline: delegates to the existing, already-audited respondToOffer path. */
    @Transactional
    public JobOffer respondInApp(Long offerId, Integer learnerId, boolean accept) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!"RELEASED".equalsIgnoreCase(String.valueOf(offer.getStatus()))) {
            throw new IllegalStateException("This offer can no longer be responded to (current status: " + offer.getStatus() + ")");
        }
        if (offer.getRespondBy() != null && !LocalDateTime.now().isBefore(offer.getRespondBy())) {
            throw new IllegalStateException("The offer response deadline has passed");
        }
        jobService.respondToOffer(learnerId, offer.getApplicationId(), accept);
        offer.setStatus(accept ? "ACCEPTED" : "DECLINED");
        offer.setAcceptanceChannel("IN_APP");
        offer.setRespondedAt(LocalDateTime.now());
        if (accept) {
            offer.setCascadeId(UUID.randomUUID().toString());
        }
        JobOffer saved = jobOfferRepository.save(offer);
        jobApplicationRepository.findById(offer.getApplicationId()).ifPresent(a -> {
            if (a.getJob() != null && a.getLearner() != null) {
                audit.bell(a.getJob().getCollegeId(), accept ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
                        (a.getLearner().getFirstName() == null ? "A student" : a.getLearner().getFirstName()) + (accept ? " accepted" : " declined") + " an offer",
                        a.getJob().getCompanyName() + " · " + a.getJob().getJobTitle(), "/tpo/drives/" + a.getJob().getId() + "?tab=offers");
                audit.log(a.getJob().getCollegeId(), "STUDENT", learnerId, accept ? "OFFER_ACCEPTED" : "OFFER_DECLINED", "OFFER", offerId, null);
            }
        });
        return saved;
    }

    /**
     * "Accepted outside 42LMS": recruiter/TPO import an acceptance the company reported. The application
     * itself is NOT moved to HIRED here — only the offer row is marked ACCEPTED with a 48h
     * dispute window (round-2 student-reviewer resolution). {@link #finalizeExternalAcceptances()}
     * runs the real accept cascade once that window closes undisputed. A student who disputes
     * within the window (via a student_request of type WITHDRAWAL/CORRECTION against this offer)
     * gets it reverted by the TPO before the sweep ever finalizes it — the sweep only touches
     * offers still ACCEPTED+EXTERNAL_IMPORT+past-window, so a disputed-and-reverted one is
     * naturally skipped.
     */
    @Transactional
    public JobOffer recordExternalAcceptance(Long offerId, Integer actorId) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        // Only a released offer the student has not answered can be accepted on their behalf: a withdrawn, expired or declined
        // one used to turn "accepted" and then sit stuck, the 48-hour sweep unable to place the student.
        if (!"RELEASED".equals(offer.getStatus())) {
            throw new IllegalStateException("This offer is " + String.valueOf(offer.getStatus()).toLowerCase() + ", so it can't be marked accepted");
        }
        offer.setStatus("ACCEPTED");
        offer.setAcceptanceChannel("EXTERNAL_IMPORT");
        offer.setAcceptedDisputableUntil(LocalDateTime.now().plusHours(48));
        offer.setRespondedAt(LocalDateTime.now());
        jobOfferRepository.save(offer);
        JobApplication application = jobApplicationRepository.findById(offer.getApplicationId()).orElse(null);
        if (application != null && application.getLearner() != null) {
            outboxService.enqueue("OFFER_ACCEPTED_REPORTED", "LEARNER", application.getLearner().getId(), "APP",
                    Map.of("offerId", offerId, "disputeWindowHours", 48), null, false);
        }
        return offer;
    }

    /**
     * Runs the real accept cascade (via the existing respondToOffer) for every external-import
     * acceptance whose dispute window has closed. Polled every 30 minutes; safe to run more than
     * once since respondToOffer is a no-op once the application is already HIRED.
     */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public void finalizeExternalAcceptances() {
        for (JobOffer offer : jobOfferRepository.findExternalAcceptancesPastDisputeWindow()) {
            JobApplication application = jobApplicationRepository.findById(offer.getApplicationId()).orElse(null);
            if (application == null || application.getLearner() == null) continue;
            if ("HIRED".equalsIgnoreCase(String.valueOf(application.getApplicationStatus()))) continue;
            try {
                jobService.respondToOffer(application.getLearner().getId(), application.getId(), true);
                offer.setCascadeId(UUID.randomUUID().toString());
                jobOfferRepository.save(offer);
            } catch (Exception e) {
                // Left ACCEPTED/EXTERNAL_IMPORT so the sweep retries next tick; a stuck row here
                // means the application moved to a state respondToOffer no longer accepts (e.g.
                // it was separately rejected) and needs the TPO's manual attention.
            }
        }
    }

    /** Company withdraws an offer; the TPO confirms. Un-places and unblocks the student. */
    @Transactional
    public JobOffer withdrawOffer(Long offerId, String reason, Integer actorId) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!java.util.Set.of("SELECTED", "RELEASED", "ACCEPTED").contains(String.valueOf(offer.getStatus()))) {
            throw new IllegalStateException("This offer is already " + String.valueOf(offer.getStatus()).toLowerCase());
        }
        offer.setStatus("WITHDRAWN");
        offer.setRevokeReason(reason);
        jobOfferRepository.save(offer);
        JobApplication application = jobApplicationRepository.findById(offer.getApplicationId()).orElse(null);
        if (application != null) {
            if ("OFFERED".equals(application.getApplicationStatus()) || "HIRED".equals(application.getApplicationStatus())) {
                application.setOfferLetterUrl(null);
                application.setOfferLetterSentAt(null);
                transitions.record(application, "REJECTED", actorId, "Offer withdrawn by the company");
            }
            if (application.getLearner() != null) {
                outboxService.enqueue("OFFER_WITHDRAWN", "LEARNER", application.getLearner().getId(), "APP",
                        Map.of("offerId", offerId, "reason", reason == null ? "" : reason), null, false);
            }
        }
        return offer;
    }

    @Transactional
    public JobOffer setJoiningStatus(Long offerId, String joiningStatus) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        // Joining is recorded for an accepted offer only, and only as one of the three answers (the column held whatever was sent).
        if (!"ACCEPTED".equals(offer.getStatus())) throw new IllegalStateException("Joining is recorded once the student has accepted");
        if (joiningStatus != null && !java.util.Set.of("JOINED", "DEFERRED", "NOT_JOINED").contains(joiningStatus)) throw new IllegalArgumentException("Choose Joined, Deferred or Not joined");
        offer.setJoiningStatus(joiningStatus);
        return jobOfferRepository.save(offer);
    }

    /**
     * Reversal within 48h of an accept, restoring every application the accept cascade withdrew.
     * cascade_id groups those rows via job_application_status_history (recorded at the time of
     * the cascade by the legacy respondToOffer path) — matching by changed_at proximity, since
     * the legacy path doesn't write cascade_id itself. This is a best-effort restore for V1.
     */
    @Transactional
    public JobOffer reverseAcceptance(Long offerId, String reason, Integer actorId) {
        JobOffer offer = jobOfferRepository.findById(offerId).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!"ACCEPTED".equals(offer.getStatus())) {
            throw new IllegalStateException("Only an accepted offer can be reversed");
        }
        if (offer.getRespondedAt() != null && offer.getRespondedAt().isBefore(LocalDateTime.now().minusHours(48))) {
            throw new IllegalStateException("The 48-hour reversal window has passed");
        }
        JobApplication application = jobApplicationRepository.findById(offer.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        LocalDateTime acceptedAt = offer.getRespondedAt();
        if ("HIRED".equals(application.getApplicationStatus())) {
            transitions.record(application, "OFFERED", actorId, null); // HIRED -> OFFERED is an allowed transition
        }
        offer.setStatus("RELEASED");
        offer.setRespondedAt(null);
        // The student answers again, so they get time to: the old respond-by has usually passed, and the expiry sweep took the
        // offer away within 15 minutes of the reversal.
        LocalDateTime fresh = LocalDateTime.now().plusHours(48);
        if (offer.getRespondBy() == null || offer.getRespondBy().isBefore(fresh)) offer.setRespondBy(fresh);
        jobOfferRepository.save(offer);
        if (acceptedAt != null && application.getLearner() != null) restoreCascade(application, acceptedAt, actorId);
        if (application.getLearner() != null) {
            outboxService.enqueue("ACCEPTANCE_REVERSED", "LEARNER", application.getLearner().getId(), "APP",
                    Map.of("offerId", offerId, "reason", reason == null ? "" : reason), null, false);
        }
        return offer;
    }

    /**
     * Puts back what the accept cascade did to the student's other applications (it withdrew open ones as "placed elsewhere" and
     * declined other pending offers), found in their status history in the minutes after the accept. Each is restored only if
     * nothing has changed it since. The reversal used to promise this and do none of it, so a mistaken accept, reversed,
     * still left the student out of every other drive.
     */
    private void restoreCascade(JobApplication accepted, LocalDateTime acceptedAt, Integer actorId) {
        List<Map<String, Object>> moved = jdbc.queryForList(
                "SELECT a.id AS applicationId, h.old_status AS oldStatus, h.new_status AS newStatus FROM job_application_status_history h " +
                "JOIN job_application a ON a.id = h.application_id WHERE a.learner_id = :l AND a.id <> :acc " +
                "AND h.changed_at BETWEEN :from AND :to AND h.new_status IN ('WITHDRAWN','REJECTED') AND a.application_status = h.new_status " +
                "AND (a.withdrawal_reason = 'PLACED_ELSEWHERE' OR a.rejection_reason = 'Offer declined by candidate') ORDER BY h.id",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", accepted.getLearner().getId()).addValue("acc", accepted.getId())
                        .addValue("from", acceptedAt.minusMinutes(1)).addValue("to", acceptedAt.plusMinutes(10)));
        java.util.Set<Integer> done = new java.util.HashSet<>();
        for (Map<String, Object> m : moved) {
            int appId = ((Number) m.get("applicationId")).intValue();
            if (!done.add(appId) || m.get("oldStatus") == null) continue;
            JobApplication other = jobApplicationRepository.findById(appId).orElse(null);
            if (other == null) continue;
            other.setIsDeleted(false);
            other.setWithdrawalReason(null);
            other.setStatusBeforeWithdrawal(null);
            if ("REJECTED".equals(m.get("newStatus"))) other.setRejectionReason(null);
            transitions.record(other, String.valueOf(m.get("oldStatus")), actorId, null);
            if ("OFFERED".equals(m.get("oldStatus"))) {
                jdbc.update("UPDATE job_offer SET status = 'RELEASED', responded_at = NULL, respond_by = GREATEST(COALESCE(respond_by, NOW()), NOW() + INTERVAL 48 HOUR) " +
                                "WHERE application_id = :a AND status = 'DECLINED' AND responded_at >= :from",
                        new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("a", appId).addValue("from", acceptedAt.minusMinutes(1)));
            }
        }
    }

    /** Declined/expired -> offer to the next waitlisted student, skipping rule-blocked ones. */
    public List<RoundResult> waitlistByRank(Long finalRoundId) {
        return roundResultRepository.findByRoundIdAndAppliedAtIsNull(finalRoundId).stream()
                .filter(r -> "HOLD".equals(r.getOutcome()))
                .sorted((a, b) -> {
                    Integer ra = a.getWaitlistRank() == null ? Integer.MAX_VALUE : a.getWaitlistRank();
                    Integer rb = b.getWaitlistRank() == null ? Integer.MAX_VALUE : b.getWaitlistRank();
                    return ra.compareTo(rb);
                })
                .toList();
    }

    /** Marks expired every RELEASED offer past its respond_by. */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public int expireOverdue() {
        List<JobOffer> expired = jobOfferRepository.findExpired();
        for (JobOffer o : expired) {
            o.setStatus("EXPIRED");
            jobOfferRepository.save(o);
            JobApplication app = jobApplicationRepository.findById(o.getApplicationId()).orElse(null);
            // The student already answered somewhere else (an accept on the older offers screen, a withdrawal, an accept
            // elsewhere that closed this one): the offer row just catches up, and nobody is told it "expired".
            if (app != null && !"OFFERED".equals(app.getApplicationStatus())) {
                o.setStatus("HIRED".equals(app.getApplicationStatus()) ? "ACCEPTED" : "DECLINED");
                jobOfferRepository.save(o);
                continue;
            }
            if (app != null) {
                app.setOfferLetterUrl(null);
                app.setOfferLetterSentAt(null);
                transitions.record(app, "REJECTED", null, "Offer expired");
                if (app.getLearner() != null) {
                    outboxService.enqueue("OFFER_EXPIRED", "LEARNER", app.getLearner().getId(), "APP",
                            Map.of("offerId", o.getId()), null, false);
                }
                tellRecruiterOfferLapsed(app); // recruiter V1 §1 email table: "Offer responses still pending at the deadline"
            }
        }
        return expired.size();
    }

    /** recruiter V1 §1: the recruiter learns the same day a released offer got no response and lapsed. A courtesy, never lets a delivery failure undo the expiry. */
    private void tellRecruiterOfferLapsed(JobApplication app) {
        if (app.getJob() == null || app.getJob().getRecruiterId() == null) return;
        List<Map<String, Object>> recruiter = jdbc.queryForList("SELECT contact_mail AS email, first_name AS name FROM recruiter WHERE id = :h",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", app.getJob().getRecruiterId()));
        if (recruiter.isEmpty() || recruiter.get(0).get("email") == null) return;
        Map<String, String> m = new java.util.LinkedHashMap<>();
        m.put("name", String.valueOf(recruiter.get(0).get("name") == null ? "" : recruiter.get(0).get("name")));
        m.put("company", String.valueOf(app.getJob().getCompanyName())); m.put("role", String.valueOf(app.getJob().getJobTitle()));
        m.put("student", app.getLearner() == null ? "A candidate" : (String.valueOf(app.getLearner().getFirstName() == null ? "" : app.getLearner().getFirstName()) + " " + (app.getLearner().getLastName() == null ? "" : app.getLearner().getLastName())).trim());
        m.put("driveLink", mail.collegeLink(app.getJob().getCollegeId(), "/recruiter/drives/" + app.getJob().getId()));
        mail.sendAsCollege("recruiter-offer-lapsed", String.valueOf(recruiter.get(0).get("email")), m, app.getJob().getCollegeId());
    }
}
