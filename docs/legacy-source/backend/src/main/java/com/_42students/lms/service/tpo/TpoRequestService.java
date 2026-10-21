package com._42students.lms.service.tpo;

import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.StudentRequest;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.tpo.StudentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * One queue for every student-to-TPO ask: withdrawal, offer extension, registration change,
 * absence dispute, correction, external offer, PAP. Shown on Home as a single "Requests" card
 * type instead of five separate ones. See TPO V1 - Locked.docx §6 and the engineering review's
 * synthesis (student_request).
 */
@Service
@RequiredArgsConstructor
public class TpoRequestService {

    private final StudentRequestRepository requestRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicationTransitionService transitionService;
    private final NotificationOutboxService outboxService;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final TpoAuditService audit;
    private final com._42students.lms.repository.tpo.ExternalPlacementRepository externalPlacementRepository;

    /** Applies an approved registration change (lazy: the students service uses this one). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoStudentsReadService studentsRead;

    @Transactional
    public StudentRequest create(Integer learnerId, String type, Integer jobId, Integer applicationId,
                                  Object payload, String reason) {
        if (reason != null && reason.length() > 1000) throw new IllegalArgumentException("Keep the reason under 1000 characters");
        org.springframework.jdbc.core.namedparam.MapSqlParameterSource q = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", learnerId);
        // The drive is the application's own: a request naming one drive's application and another drive's id read as the wrong drive.
        if (applicationId != null) {
            List<Integer> own = jdbc.queryForList("SELECT job_id FROM job_application WHERE id = :a", q.addValue("a", applicationId), Integer.class);
            if (!own.isEmpty()) jobId = own.get(0);
        }
        // One open request of a kind per drive: sending it again only added copies to the placement cell's queue (and rang the bell each time).
        // BE-0044: the student's row is locked first, so two submissions at once take turns and the second sees the first.
        jdbc.queryForList("SELECT id FROM learner WHERE id = :l FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", learnerId));
        Long open = jdbc.queryForObject("SELECT COUNT(*) FROM student_request WHERE learner_id = :l AND type = :t AND status = 'PENDING' AND (job_id <=> :j) FOR UPDATE",
                q.addValue("t", type).addValue("j", jobId), Long.class);
        if (open != null && open > 0) throw new IllegalStateException("You already sent this request. The placement cell will answer it.");
        StudentRequest r = new StudentRequest();
        r.setLearnerId(learnerId);
        r.setType(type);
        r.setJobId(jobId);
        r.setApplicationId(applicationId);
        r.setPayloadJson(payload);
        r.setReason(reason);
        r.setStatus("PENDING");
        r.setCreatedAt(LocalDateTime.now());
        // escalate_at stays empty until escalateUndecidedWithdrawals sends it to every TPO admin (a round within 24 hours and still undecided).
        StudentRequest saved = requestRepository.save(r);
        List<java.util.Map<String, Object>> who = jdbc.queryForList("SELECT college_id AS collegeId, first_name AS name FROM learner WHERE id = :l",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", learnerId));
        if (!who.isEmpty() && who.get(0).get("collegeId") != null) {
            audit.bell(((Number) who.get(0).get("collegeId")).intValue(), "STUDENT_REQUEST", "New " + type.toLowerCase().replace('_', ' ') + " request",
                    String.valueOf(who.get(0).get("name")) + " sent a request.", "/tpo/requests");
        }
        return saved;
    }

    public List<StudentRequest> pending() {
        return requestRepository.findByStatusOrderByCreatedAtAsc("PENDING");
    }

    public List<StudentRequest> pendingForCollege(Integer collegeId) {
        return requestRepository.findPendingForCollege(collegeId);
    }

    public List<StudentRequest> forLearner(Integer learnerId) {
        return requestRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId);
    }

    /**
     * Approve a request, with the type-specific side effect. Withdrawal approval moves the
     * application to WITHDRAWN (student excused, not a no-show). Off-campus offer approval
     * (Student V1 §5) records a verified ExternalPlacement whose CTC counts toward the same
     * held-offer/uplift rules as an on-campus offer — see PlacementCascadePolicy/
     * PlacementRulesService. Other types are recorded but their side effects (registration
     * change, correction applied) are handled by the calling controller, which has the richer
     * context.
     */
    @Transactional
    public StudentRequest decide(Long requestId, boolean approve, Integer decidedBy, String decisionReason) {
        // BE-0044: two people deciding at once take turns on the request row; the second then sees it decided (from the
        // locked read, not an older snapshot) and is refused before any side effect runs.
        List<String> lockedStatus = jdbc.queryForList("SELECT status FROM student_request WHERE id = :id FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", requestId), String.class);
        if (lockedStatus.isEmpty()) throw new IllegalArgumentException("Request not found");
        if (!"PENDING".equals(lockedStatus.get(0))) throw new IllegalStateException("This request was already decided");
        StudentRequest r = requestRepository.findById(requestId).orElseThrow(() -> new IllegalArgumentException("Request not found"));
        // A decided request stays decided: deciding again used to flip an approved withdrawal to rejected (the student stayed
        // withdrawn) or send a second decision notice.
        if (!"PENDING".equals(r.getStatus())) {
            throw new IllegalStateException("This request was already decided");
        }
        if (approve && "WITHDRAWAL".equals(r.getType()) && r.getApplicationId() != null) {
            JobApplication target = jobApplicationRepository.findById(r.getApplicationId()).orElse(null);
            if (target != null && "HIRED".equals(target.getApplicationStatus())) {
                throw new IllegalStateException("This student is placed: reverse the acceptance on the Offers tab first, then approve");
            }
        }
        r.setStatus(approve ? "APPROVED" : "REJECTED");
        r.setDecidedBy(decidedBy);
        r.setDecidedAt(LocalDateTime.now());
        r.setDecisionReason(decisionReason);
        requestRepository.save(r);

        if (approve && "WITHDRAWAL".equals(r.getType()) && r.getApplicationId() != null) {
            transitionService.transition(r.getApplicationId(), "WITHDRAWN", decidedBy, null,
                    "Withdrawal approved by TPO", true);
            JobApplication app = jobApplicationRepository.findById(r.getApplicationId()).orElse(null);
            if (app != null) app.setWithdrawalReason("TPO_APPROVED");
            // A student withdrawing while holding an offer: the offer is closed too, so the Offers tab and the expiry sweep agree.
            jdbc.update("UPDATE job_offer SET status = 'DECLINED', responded_at = NOW() WHERE application_id = :a AND status IN ('SELECTED','RELEASED')",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("a", r.getApplicationId()));
        }
        if (approve && "EXTERNAL_OFFER".equals(r.getType()) && r.getLearnerId() != null) {
            verifyExternalOffer(r, decidedBy);
        }
        // What the Requests screen says approving does: more time on the offer, and the After college choice changes. Both used
        // to be recorded as approved and told to the student, with nothing changed.
        if (approve && "OFFER_EXTENSION".equals(r.getType()) && r.getJobId() != null && r.getLearnerId() != null) {
            jdbc.update("UPDATE job_offer o JOIN job_application a ON a.id = o.application_id " +
                            "SET o.respond_by = GREATEST(COALESCE(o.respond_by, NOW()), NOW()) + INTERVAL 48 HOUR " +
                            "WHERE a.job_id = :j AND a.learner_id = :l AND o.status = 'RELEASED'",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", r.getJobId()).addValue("l", r.getLearnerId()));
        }
        if (approve && "REGISTRATION_CHANGE".equals(r.getType()) && r.getLearnerId() != null && studentsRead != null
                && r.getPayloadJson() instanceof Map<?, ?> p && p.get("choice") != null
                && PlacementOutcomeService.CHOICES.contains(String.valueOf(p.get("choice")))) {
            Integer collegeId = jdbc.queryForObject("SELECT college_id FROM learner WHERE id = :l",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", r.getLearnerId()), Integer.class);
            studentsRead.register(collegeId, r.getLearnerId(), String.valueOf(p.get("choice")), decidedBy);
        }
        if (r.getLearnerId() != null) {
            outboxService.enqueue("REQUEST_DECIDED", "LEARNER", r.getLearnerId(), "APP",
                    Map.of("requestId", requestId, "status", r.getStatus(), "reason", decisionReason == null ? "" : decisionReason),
                    null, false);
        }
        return r;
    }

    /**
     * Student V1 §5: reads {companyName, ctcLpa, letterUrl} from the request's own payload
     * (already collected on the student's "I got an offer outside campus" form) and records the
     * verified placement. Silently no-ops if the payload is missing a company name — an approved
     * request with nothing usable in it is still recorded as APPROVED, it just does not create a
     * placement row a future eligibility check would then rely on.
     */
    private void verifyExternalOffer(StudentRequest r, Integer decidedBy) {
        Object payload = r.getPayloadJson();
        if (!(payload instanceof Map)) return;
        Map<?, ?> map = (Map<?, ?>) payload;
        Object companyRaw = map.get("companyName");
        if (companyRaw == null || String.valueOf(companyRaw).trim().isEmpty()) return;

        Integer collegeId = null;
        try {
            collegeId = jdbc.queryForObject("SELECT college_id FROM learner WHERE id = :l",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", r.getLearnerId()), Integer.class);
        } catch (Exception ignored) { /* learner not found is defensive-only; the request already carries a valid learnerId */ }
        if (collegeId == null) return;

        com._42students.lms.model.tpo.ExternalPlacement placement = new com._42students.lms.model.tpo.ExternalPlacement();
        placement.setLearnerId(r.getLearnerId());
        placement.setCollegeId(collegeId);
        placement.setRequestId(r.getId());
        placement.setCompanyName(String.valueOf(companyRaw).trim());
        Object ctcRaw = map.get("ctcLpa");
        if (ctcRaw != null) {
            try {
                placement.setCtcLpa(new java.math.BigDecimal(String.valueOf(ctcRaw)));
            } catch (NumberFormatException ignored) { /* left null: an unparsable CTC does not block recording the placement itself */ }
        }
        Object letterRaw = map.get("letterUrl");
        // The student typed this link; the placement cell clicks it. A javascript: or data: value is dropped, not stored.
        if (letterRaw != null) {
            try { placement.setLetterUrl(TpoOfferService.webLink(String.valueOf(letterRaw))); } catch (IllegalArgumentException ignored) { placement.setLetterUrl(null); }
        }
        placement.setVerifiedBy(decidedBy);
        placement.setVerifiedAt(LocalDateTime.now());
        externalPlacementRepository.save(placement);
    }

    /**
     * PVN-B009: settles every pending request tied to a drive that has ended (closed or
     * cancelled), recording a system decision (no decidedBy) with the given reason. A closed drive
     * approves them all (TPO V1 §5); a cancelled drive only grants pending withdrawals, since
     * offer-extension / correction asks on a drive that no longer exists are not something to
     * "approve" on the student's behalf. Must run BEFORE the drive's open applications are ended:
     * approving a withdrawal moves the application to WITHDRAWN, valid only from an open status.
     */
    @Transactional
    public void settleForEndedDrive(Integer jobId, String reason, boolean onlyWithdrawals) {
        // Only the drive's own matters are settled with it. Closing used to approve every pending request naming the drive, so an
        // off-campus offer claim was recorded as verified with nobody looking at it; one refusal (a placed student's withdrawal)
        // stopped the whole close. A request that can't be approved stays for the placement cell.
        java.util.Set<String> driveMatters = onlyWithdrawals ? java.util.Set.of("WITHDRAWAL") : java.util.Set.of("WITHDRAWAL", "ABSENCE_DISPUTE", "OFFER_EXTENSION");
        for (StudentRequest r : pending()) {
            if (!jobId.equals(r.getJobId()) || !driveMatters.contains(r.getType())) continue;
            StudentRequest done;
            try {
                done = decide(r.getId(), true, null, reason);
            } catch (IllegalStateException leftForTheTpo) {
                continue;
            }
            // Shown as "Approved (drive closed)" on the Requests screen, which was waiting for this status.
            done.setStatus("AUTO_APPROVED");
            requestRepository.save(done);
        }
    }

    /**
     * A withdrawal that is still undecided 24 hours before a round the student is in goes to every TPO admin (the bell is shared by the whole
     * placement cell) and is flagged. While it is pending the student is excused, never a no-show (see TpoWorkspaceService noShows).
     */
    // Timed by TpoScheduledJobs (one replica only).
    @org.springframework.transaction.annotation.Transactional
    public void escalateUndecidedWithdrawals() {
        List<java.util.Map<String, Object>> rows = jdbc.queryForList(
                "SELECT r.id, l.college_id AS collegeId, l.first_name AS name, j.id AS jobId, CONCAT(j.company_name, ' · ', j.job_title) AS drive FROM student_request r " +
                "JOIN learner l ON l.id = r.learner_id JOIN job j ON j.id = r.job_id WHERE r.type = 'WITHDRAWAL' AND r.status = 'PENDING' AND r.escalate_at IS NULL " +
                "AND EXISTS (SELECT 1 FROM job_round jr WHERE jr.job_id = j.id AND jr.scheduled_date > UTC_TIMESTAMP() AND jr.scheduled_date <= UTC_TIMESTAMP() + INTERVAL 24 HOUR)",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource());
        for (java.util.Map<String, Object> r : rows) {
            jdbc.update("UPDATE student_request SET escalate_at = NOW() WHERE id = :id", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", r.get("id")));
            audit.bell(((Number) r.get("collegeId")).intValue(), "REQUEST_ESCALATED", "Decide " + r.get("name") + "'s withdrawal before the round",
                    "A round of " + r.get("drive") + " starts within 24 hours.", "/tpo/requests");
        }
    }
}
