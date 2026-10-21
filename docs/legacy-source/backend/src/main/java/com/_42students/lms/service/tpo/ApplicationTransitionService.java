package com._42students.lms.service.tpo;

import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.NotificationOutboxEntry;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.tpo.NotificationOutboxRepository;
import com._42students.lms.service.JobApplicationStatusHistoryService;
import com._42students.lms.util.JobApplicationStatusValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * One place for every TPO/recruiter-driven application status change: validate, write, record history,
 * and queue the student notification. This is deliberately separate from the legacy
 * AdminJobServiceImpl/PlacementJobServiceImpl paths (left untouched) so V1 endpoints don't
 * inherit their assumptions; see docs/tpo-v1/BUILD-LOG.md for why those weren't consolidated
 * tonight. internalReason is stored on the application row and is NEVER passed to
 * recordStatusChange's rejectionReason (student-facing) parameter, or read by any learner DTO —
 * this is the split that closes the S8 rejection-reason leak for every new write path.
 */
@Service
@RequiredArgsConstructor
public class ApplicationTransitionService {

    /** Stages a student is still in play at: the only ones a placement-cell move or "Not selected" may start from. */
    public static final Set<String> OPEN_STAGES = Set.of("APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED");
    /** Where "Move to..." may put a student. Offered/Placed come from offers, Waitlisted from results, Withdrawn from the student. */
    public static final Set<String> MOVE_TARGETS = Set.of("SHORTLISTED", "ASSESSMENT", "INTERVIEW");

    private static final String STATUS_EVENT = "APPLICATION_STATUS_CHANGED";

    private final JobApplicationRepository jobApplicationRepository;
    private final JobApplicationStatusHistoryService statusHistoryService;
    private final NotificationOutboxService outboxService;
    private final NotificationOutboxRepository outboxRepository;

    /**
     * @param studentMessage user-facing wording only, e.g. "Not shortlisted" or "Not cleared: Technical round"
     * @param internalReason recruiter/TPO-only; never surfaced to the learner
     */
    // noRollbackFor: an invalid move is refused before anything is written, and callers (results apply) skip that one student and carry on.
    // Without it the refusal marks the caller's whole transaction rollback-only and the request fails with a 500.
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public JobApplication transition(Integer applicationId, String newStatus, Integer actorId,
                                      String studentMessage, String internalReason, boolean notifyStudent) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        String oldStatus = application.getApplicationStatus();
        boolean changed = !Objects.equals(oldStatus, newStatus); // passing a second round of the same kind keeps the bucket
        if (changed && !JobApplicationStatusValidator.isValidTransition(oldStatus, newStatus)) {
            throw new IllegalArgumentException("Cannot move from " + oldStatus + " to " + newStatus);
        }
        application.setApplicationStatus(newStatus);
        application.setStatusUpdatedAt(LocalDateTime.now());
        application.setStatusUpdatedBy(actorId);
        if (studentMessage != null) application.setRejectionReason(studentMessage);
        if (internalReason != null) application.setInternalReason(internalReason);
        jobApplicationRepository.save(application);

        if (changed) {
            statusHistoryService.recordStatusChange(applicationId, oldStatus, newStatus, actorId, studentMessage);
        }
        // A student whose stage did not change has nothing new to be told ("your status changed" to the same stage).
        if (changed && notifyStudent && application.getLearner() != null) {
            outboxService.enqueue(STATUS_EVENT, "LEARNER", application.getLearner().getId(),
                    "APP", Map.of("applicationId", applicationId, "status", newStatus), null, false);
        }
        return application;
    }

    /**
     * A change the system makes by its own rules (an offer released, withdrawn, expired or reversed), not a placement-cell
     * move, so the move rules above do not apply. It still stamps who and when and writes the history row: without that row
     * the drive funnel never counted a placed student as offered, and the student's timeline skipped the step.
     */
    @Transactional
    public void record(JobApplication application, String newStatus, Integer actorId, String studentMessage) {
        String oldStatus = application.getApplicationStatus();
        if (Objects.equals(oldStatus, newStatus)) return;
        application.setApplicationStatus(newStatus);
        application.setStatusUpdatedAt(LocalDateTime.now());
        application.setStatusUpdatedBy(actorId);
        if (studentMessage != null) application.setRejectionReason(studentMessage);
        jobApplicationRepository.save(application);
        statusHistoryService.recordStatusChange(application.getId(), oldStatus, newStatus, actorId, studentMessage);
    }

    /** What a bulk move did: the undo group, how many moved, and every student it left alone with the reason. */
    public record BulkResult(String undoGroupId, int moved, List<Map<String, Object>> skipped) {
        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("undoGroupId", undoGroupId);
            out.put("moved", moved);
            out.put("skipped", skipped);
            return out;
        }
    }

    /**
     * Bulk version used by "Move to..." and "Not selected", sharing one undo group. Only students at an open stage move:
     * a student who is already offered, placed, not selected or withdrawn is reported back, never moved (the old code
     * let "Not selected" overwrite an offered student and left their offer live). A student already at the target stage
     * is reported too, and is not told again. Each student's notice carries where they came from, so Undo can put them back.
     */
    @Transactional
    public BulkResult bulkTransition(List<Integer> applicationIds, String newStatus, Integer actorId,
                                     String studentMessage, String internalReason, boolean holdForUndo) {
        String undoGroup = outboxService.newUndoGroupId();
        int moved = 0;
        List<Map<String, Object>> skipped = new ArrayList<>();
        for (Integer id : applicationIds) {
            JobApplication application = jobApplicationRepository.findById(id).orElse(null);
            if (application == null) continue;
            String oldStatus = application.getApplicationStatus();
            String refusal = Objects.equals(oldStatus, newStatus) ? "Already at this stage"
                    : !OPEN_STAGES.contains(String.valueOf(oldStatus)) ? "Not in play (" + stageWord(oldStatus) + ")"
                    : !JobApplicationStatusValidator.isValidTransition(oldStatus, newStatus) ? "Can't move from " + stageWord(oldStatus)
                    : null;
            if (refusal != null) {
                skipped.add(Map.of("applicationId", id, "reason", refusal));
                continue;
            }
            String previousMessage = application.getRejectionReason();
            application.setApplicationStatus(newStatus);
            application.setStatusUpdatedAt(LocalDateTime.now());
            application.setStatusUpdatedBy(actorId);
            if (studentMessage != null) application.setRejectionReason(studentMessage);
            if (internalReason != null) application.setInternalReason(internalReason);
            jobApplicationRepository.save(application);
            statusHistoryService.recordStatusChange(id, oldStatus, newStatus, actorId, studentMessage);
            if (application.getLearner() != null) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("applicationId", id);
                payload.put("status", newStatus);
                payload.put("fromStatus", oldStatus);
                payload.put("fromMessage", previousMessage); // the student's own earlier wording; internal reasons never go in a student's row
                outboxService.enqueue(STATUS_EVENT, "LEARNER", application.getLearner().getId(), "APP", payload, undoGroup, holdForUndo);
            }
            moved++;
        }
        return new BulkResult(undoGroup, moved, skipped);
    }

    /**
     * Undo a bulk move while its notices are still held: every student goes back to the stage they came from (when nothing
     * else has moved them since), with a history row, and the notices are cancelled, so nobody is told. Before this, Undo
     * cancelled only the notices: the students stayed moved and were never told, which is worse than no Undo at all.
     * The group must belong to this drive. Returns how many went back, or -1 when the window has passed.
     */
    @Transactional
    public int undo(Integer jobId, String undoGroupId, Integer actorId) {
        List<NotificationOutboxEntry> held = outboxRepository.findByUndoGroupIdAndStatus(undoGroupId, "PENDING");
        if (held.isEmpty()) return -1;
        List<Object[]> moves = new ArrayList<>();
        for (NotificationOutboxEntry e : held) {
            if (!STATUS_EVENT.equals(e.getEvent()) || !"APP".equals(e.getChannel()) || !(e.getPayloadJson() instanceof Map<?, ?> p)) continue;
            Object appId = p.get("applicationId");
            if (!(appId instanceof Number n)) continue;
            JobApplication app = jobApplicationRepository.findById(n.intValue()).orElse(null);
            if (app == null || app.getJob() == null || !Objects.equals(app.getJob().getId(), jobId)) {
                throw new IllegalArgumentException("Undo group not found");
            }
            moves.add(new Object[]{app, p});
        }
        outboxService.cancelUndoGroup(undoGroupId);
        int restored = 0;
        for (Object[] m : moves) {
            JobApplication app = (JobApplication) m[0];
            Map<?, ?> p = (Map<?, ?>) m[1];
            Object from = p.get("fromStatus");
            if (from == null || !Objects.equals(app.getApplicationStatus(), p.get("status"))) continue; // moved again since: leave it
            String oldStatus = app.getApplicationStatus();
            app.setApplicationStatus(from.toString());
            app.setRejectionReason(p.get("fromMessage") == null ? null : p.get("fromMessage").toString());
            if ("REJECTED".equals(oldStatus)) app.setInternalReason(null); // the "Not selected" reason belonged to the move being undone
            app.setStatusUpdatedAt(LocalDateTime.now());
            app.setStatusUpdatedBy(actorId);
            jobApplicationRepository.save(app);
            statusHistoryService.recordStatusChange(app.getId(), oldStatus, from.toString(), actorId, null);
            restored++;
        }
        return restored;
    }

    public static String stageWord(String status) {
        return switch (String.valueOf(status)) {
            case "OFFERED" -> "offered";
            case "HIRED" -> "placed";
            case "REJECTED" -> "not selected";
            case "WITHDRAWN" -> "withdrawn";
            case "WAITLISTED" -> "waitlisted";
            case "ASSESSMENT" -> "test";
            default -> String.valueOf(status).toLowerCase(java.util.Locale.ROOT);
        };
    }
}
