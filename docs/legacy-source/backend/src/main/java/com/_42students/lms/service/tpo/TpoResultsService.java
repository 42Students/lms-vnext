package com._42students.lms.service.tpo;

import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.model.tpo.RoundResult;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.tpo.JobRoundRepository;
import com._42students.lms.repository.tpo.RoundResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Results staging: recruiter decisions, panelist scoresheets, drive-day marks and Excel imports all
 * land as round_result rows with their source, and wait here until the TPO (or a per-drive
 * auto-apply toggle) applies them. See TPO V1 - Locked.docx §5 "Results staging".
 */
@Service
@RequiredArgsConstructor
public class TpoResultsService {

    private final RoundResultRepository roundResultRepository;
    private final JobRoundRepository jobRoundRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicationTransitionService transitionService;

    /** One staged result. Never visible to the student until applied. */
    @Transactional
    public RoundResult stage(Long roundId, Integer applicationId, String outcome, Integer waitlistRank,
                              Double score, String reasonCategory, String comment, String source,
                              String submittedByType, Integer submittedById) {
        // BE-0032: two submissions for one student take turns here, so exactly one result stays current.
        jobApplicationRepository.findByIdForUpdate(applicationId);
        RoundResult result = new RoundResult();
        result.setApplicationId(applicationId);
        result.setRoundId(roundId);
        result.setOutcome(outcome);
        result.setWaitlistRank(waitlistRank);
        result.setScore(score);
        result.setReasonCategory(reasonCategory);
        result.setComment(comment);
        result.setSource(source);
        result.setSubmittedByType(submittedByType);
        result.setSubmittedById(submittedById);
        result.setSubmittedAt(LocalDateTime.now());
        result = roundResultRepository.save(result);

        // Mark any earlier still-pending result for the same application+round as superseded,
        // so "apply" only ever sees the latest submission (e.g. a re-uploaded Excel correcting
        // a mistake) instead of silently applying a stale one.
        roundResultRepository.supersedeOthers(roundId, applicationId, result.getId());
        return result;
    }

    public List<RoundResult> pending(Long roundId) {
        return roundResultRepository.findByRoundIdAndAppliedAtIsNull(roundId).stream()
                .filter(r -> r.getSupersededBy() == null)
                .toList();
    }

    /**
     * Applies every pending result for a round in one action. PASS moves to the stage of the next
     * round (the last round's own stage after the last one); FAIL/ABSENT
     * -> REJECTED with student wording "Not cleared: <round name>"; HOLD -> WAITLISTED. Absent
     * rows never silently fail a student who was simply missing from a pass-list (see the
     * TPO-14/H13 "not in file" rule) — callers must have already resolved that in the import
     * step before staging an ABSENT/FAIL row for them.
     */
    @Transactional
    public Map<String, Object> applyRound(Long roundId, Integer actorId, boolean notify) {
        // Locked: a double click applied the same results twice (two sets of notices) because both calls read them as pending.
        JobRound round = jobRoundRepository.findByIdForUpdate(roundId).orElseThrow(() -> new IllegalArgumentException("Round not found"));
        List<RoundResult> pending = pending(roundId);
        // Clearing a round puts the student at the stage of the round that comes next (talks skipped: they move nobody), which is
        // what the apply window promises ("cleared Test and go on to Interview"). It used to leave them at the stage of the round
        // they had just cleared, so a student who passed the test still read "Test" all through the interview round.
        // After the last round they stay at its stage, waiting for an offer.
        JobRound next = jobRoundRepository.findByJobIdOrderBySeqAsc(round.getJobId()).stream()
                .filter(x -> x.getSeq() != null && round.getSeq() != null && x.getSeq() > round.getSeq() && !"TALK".equals(x.getKind()))
                .findFirst().orElse(null);
        String studentBucket = bucketForRoundKind(next != null ? next.getKind() : round.getKind());
        int applied = 0;
        List<Map<String, Object>> skipped = new java.util.ArrayList<>();
        List<Map<String, Object>> unchanged = new java.util.ArrayList<>();
        for (RoundResult r : pending) {
            JobApplication app = jobApplicationRepository.findById(r.getApplicationId()).orElse(null);
            if (app == null) continue;
            String current = app.getApplicationStatus();
            // A result never touches a student who is past the rounds: a late "not cleared" used to overwrite an offered
            // student (Offered -> Not selected is a legal legacy move) and leave their offer live.
            // The result is still recorded (so the round can finish); only the stage is left alone, and the student is listed.
            if (!ApplicationTransitionService.OPEN_STAGES.contains(String.valueOf(current))) {
                r.setAppliedAt(LocalDateTime.now());
                r.setAppliedBy(actorId);
                roundResultRepository.save(r);
                unchanged.add(Map.of("applicationId", r.getApplicationId(), "reason", "Already " + stageWord(current) + "; stage not changed"));
                continue;
            }
            // Results for a round that comes before the student's current one (uploaded late) must not pull them back a stage.
            boolean earlierRound = isEarlierThanCurrent(round, app.getCurrentRoundId());
            String newStatus;
            String studentMessage;
            switch (r.getOutcome()) {
                case "PASS" -> {
                    // A talk never advances anyone on its own, and an earlier round's pass keeps the stage they already reached.
                    boolean keep = "TALK".equals(round.getKind()) || earlierRound;
                    newStatus = keep ? ("APPLIED".equals(current) ? "SHORTLISTED" : current) : studentBucket;
                    studentMessage = null;
                }
                case "HOLD" -> { newStatus = "WAITLISTED"; studentMessage = "Waitlisted"; }
                default -> { newStatus = "REJECTED"; studentMessage = "Not cleared: " + round.getName(); }
            }
            try {
                // A first round can run before anyone was shortlisted: clearing it (or being waitlisted in it) shortlists the student
                // on the way, without a separate message. Before this, the move from Applied was refused and the pass was dropped silently.
                if ("APPLIED".equals(current) && !"REJECTED".equals(newStatus) && !"APPLIED".equals(newStatus) && !"SHORTLISTED".equals(newStatus)) {
                    transitionService.transition(app.getId(), "SHORTLISTED", actorId, null, "Cleared " + round.getName(), false);
                }
                transitionService.transition(app.getId(), newStatus, actorId, studentMessage,
                        "Result source: " + r.getSource() + (r.getComment() != null ? " — " + r.getComment() : ""), notify);
                if (!earlierRound) app.setCurrentRoundId(roundId);
                jobApplicationRepository.save(app);
                r.setAppliedAt(LocalDateTime.now());
                r.setAppliedBy(actorId);
                roundResultRepository.save(r);
                applied++;
            } catch (IllegalArgumentException e) {
                // Invalid transition (e.g. already moved by another action): left waiting for the placement cell, and reported.
                skipped.add(Map.of("applicationId", r.getApplicationId(), "reason", String.valueOf(e.getMessage())));
            }
        }
        // A round is complete only when nothing is left waiting in it.
        if (skipped.isEmpty()) {
            round.setStatus("COMPLETED");
            jobRoundRepository.save(round);
        }
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("applied", applied);
        out.put("skipped", skipped);
        out.put("unchanged", unchanged);
        return out;
    }

    private static String stageWord(String status) {
        return switch (String.valueOf(status)) {
            case "OFFERED" -> "offered";
            case "HIRED" -> "placed";
            case "REJECTED" -> "not selected";
            case "WITHDRAWN" -> "withdrawn";
            default -> String.valueOf(status).toLowerCase(java.util.Locale.ROOT);
        };
    }

    /** True when the student is already in a later round of this drive than the one these results are for. */
    private boolean isEarlierThanCurrent(JobRound round, Long currentRoundId) {
        if (currentRoundId == null || currentRoundId.equals(round.getId())) return false;
        JobRound currentRound = jobRoundRepository.findById(currentRoundId).orElse(null);
        return currentRound != null && currentRound.getSeq() != null && round.getSeq() != null && currentRound.getSeq() > round.getSeq();
    }

    private String bucketForRoundKind(String kind) {
        return switch (kind) {
            case "INTERVIEW" -> "INTERVIEW";
            case "TALK" -> "SHORTLISTED"; // a talk never advances anyone on its own
            default -> "ASSESSMENT"; // TEST, VENDOR_TEST, GD
        };
    }
}
