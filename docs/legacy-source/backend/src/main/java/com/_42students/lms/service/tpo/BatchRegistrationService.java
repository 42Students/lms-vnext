package com._42students.lms.service.tpo;

import com._42students.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Registration is per batch (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md, "Journey"): the placement cell invites a batch's
 * eligible students with a deadline, reminds the ones who have not chosen yet, and each student's window is their batch's.
 * There is no season: a college runs many batches, each on its own calendar.
 */
@Service
@RequiredArgsConstructor
public class BatchRegistrationService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final NamedParameterJdbcTemplate jdbc;
    private final PlacementEligibilityService eligibility;
    private final NotificationOutboxService outbox;
    private final TpoAuditService audit;

    /** A student's registration window, from their batch. */
    public static class Window {
        public boolean open;
        public boolean invited;
        public boolean finished;
        public LocalDateTime deadline;
        public Long batchId;
        public String batchName;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("registrationOpen", open);
            m.put("invited", invited);
            m.put("deadline", deadline);
            m.put("batchId", batchId);
            m.put("batchName", batchName);
            return m;
        }
    }

    public Window windowFor(Integer learnerId) {
        Window w = new Window();
        List<Map<String, Object>> r = jdbc.queryForList(
                "SELECT b.id AS batchId, b.batch_name AS batchName, pb.invited_at AS invitedAt, pb.registration_deadline AS deadline, pb.finished_at AS finishedAt " +
                "FROM learner l JOIN class c ON c.id = l.class_id JOIN batch b ON b.id = c.batch_id LEFT JOIN placement_batch pb ON pb.batch_id = b.id " +
                "WHERE l.id = :l", new MapSqlParameterSource("l", learnerId));
        if (r.isEmpty()) return w;
        Map<String, Object> row = r.get(0);
        w.batchId = ((Number) row.get("batchId")).longValue();
        w.batchName = (String) row.get("batchName");
        w.invited = row.get("invitedAt") != null;
        w.finished = row.get("finishedAt") != null;
        w.deadline = toLdt(row.get("deadline"));
        w.open = w.invited && !w.finished && (w.deadline == null || w.deadline.isAfter(LocalDateTime.now()));
        return w;
    }

    private static LocalDateTime toLdt(Object o) {
        if (o == null) return null;
        if (o instanceof LocalDateTime) return (LocalDateTime) o;
        if (o instanceof java.sql.Timestamp) return ((java.sql.Timestamp) o).toLocalDateTime();
        return LocalDateTime.parse(String.valueOf(o).replace(' ', 'T'));
    }

    /** Eligible students of the batch who have not chosen yet (Placements, Higher studies or Not interested). */
    List<Integer> notYetChosen(Integer collegeId, Long batchId) {
        Map<Integer, PlacementEligibilityService.Resolved> res = eligibility.resolveCollege(collegeId);
        List<Integer> ids = jdbc.queryForList(
                "SELECT l.id FROM learner l JOIN class c ON c.id = l.class_id WHERE l.college_id = :c AND c.batch_id = :b " +
                "AND (l.is_deleted = 0 OR l.is_deleted IS NULL) AND NOT EXISTS (SELECT 1 FROM placement_registration r WHERE r.learner_id = l.id) " +
                // Already applying counts as having chosen Placements (as on the Students page).
                "AND NOT EXISTS (SELECT 1 FROM job_application ax WHERE ax.learner_id = l.id AND (ax.is_deleted = 0 OR ax.is_deleted IS NULL))",
                new MapSqlParameterSource("c", collegeId).addValue("b", batchId), Integer.class);
        List<Integer> out = new ArrayList<>();
        for (Integer id : ids) {
            PlacementEligibilityService.Resolved r = res.get(id);
            if (r != null && PlacementEligibilityService.ELIGIBLE.equals(r.status)) out.add(id);
        }
        return out;
    }

    private Map<String, Object> batchRow(Integer collegeId, Long batchId) {
        List<Map<String, Object>> b = jdbc.queryForList(
                "SELECT b.id, b.batch_name AS name, pb.invited_at AS invitedAt, pb.finished_at AS finishedAt FROM batch b JOIN new_program p ON p.id = b.program_id " +
                "JOIN department d ON d.id = p.dept_id LEFT JOIN placement_batch pb ON pb.batch_id = b.id WHERE b.id = :b AND d.college_id = :c",
                new MapSqlParameterSource("b", batchId).addValue("c", collegeId));
        if (b.isEmpty()) throw new IllegalArgumentException("Not found");
        return b.get(0);
    }

    /**
     * Invite the batch's eligible students to register by the deadline. Sets (or moves) the deadline; the first invite opens
     * registration for the batch. Everyone eligible who has not chosen yet is told. Returns { invited, deadline }.
     */
    @Transactional
    public Map<String, Object> invite(UserPrincipal by, Integer collegeId, Long batchId, LocalDateTime deadline) {
        Map<String, Object> b = batchRow(collegeId, batchId);
        if (b.get("finishedAt") != null) throw new IllegalStateException("This batch is finished. Reopen it first.");
        if (deadline == null) throw new IllegalArgumentException("Set the registration deadline");
        if (!deadline.isAfter(LocalDateTime.now())) throw new IllegalArgumentException("The registration deadline has to be in the future");
        List<Integer> who = notYetChosen(collegeId, batchId);
        if (who.isEmpty() && b.get("invitedAt") == null) {
            long eligibleCount = eligibility.resolveCollege(collegeId).values().stream()
                    .filter(r -> Objects.equals(r.batchId, batchId) && PlacementEligibilityService.ELIGIBLE.equals(r.status)).count();
            if (eligibleCount == 0) throw new IllegalStateException("Nobody in this batch is eligible yet. Decide who is in placements first.");
        }
        MapSqlParameterSource p = new MapSqlParameterSource("b", batchId).addValue("c", collegeId).addValue("d", deadline);
        jdbc.update("INSERT IGNORE INTO placement_batch (batch_id, college_id) VALUES (:b, :c)", p);
        jdbc.update("UPDATE placement_batch SET registration_deadline = :d, invited_at = COALESCE(invited_at, NOW()) WHERE batch_id = :b", p);
        String when = deadline.format(DAY);
        for (Integer id : who) {
            outbox.enqueue("REGISTRATION_OPEN", "LEARNER", id, "APP", Map.of("deadline", when, "batch", String.valueOf(b.get("name"))), null, false);
        }
        audit.log(collegeId, actorType(by), by == null ? null : by.getId(), "BATCH_INVITED", "BATCH", batchId, who.size() + " students, register by " + when);
        return Map.of("invited", who.size(), "deadline", deadline);
    }

    /** Remind the eligible students of an invited batch who have not chosen yet. */
    @Transactional
    public Map<String, Object> remind(UserPrincipal by, Integer collegeId, Long batchId) {
        Map<String, Object> b = batchRow(collegeId, batchId);
        if (b.get("invitedAt") == null) throw new IllegalStateException("Invite the batch first");
        if (b.get("finishedAt") != null) throw new IllegalStateException("This batch is finished");
        LocalDateTime deadline = toLdt(jdbc.queryForObject("SELECT registration_deadline FROM placement_batch WHERE batch_id = :b", new MapSqlParameterSource("b", batchId), Object.class));
        if (deadline != null && !deadline.isAfter(LocalDateTime.now())) throw new IllegalStateException("The deadline has passed. Move it first.");
        // Once a day: every press used to remind every student who had not chosen yet, again.
        Long today = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_audit_log WHERE college_id = :c AND action = 'BATCH_REMINDED' AND entity_type = 'BATCH' " +
                "AND entity_id = :b AND created_at > NOW() - INTERVAL 20 HOUR", new MapSqlParameterSource("c", collegeId).addValue("b", batchId), Long.class);
        if (today != null && today > 0) throw new IllegalStateException("This batch was already reminded today. Students get one reminder a day at most.");
        List<Integer> who = notYetChosen(collegeId, batchId);
        String when = deadline == null ? "soon" : deadline.format(DAY);
        for (Integer id : who) {
            outbox.enqueue("REGISTRATION_REMINDER", "LEARNER", id, "APP", Map.of("deadline", when, "batch", String.valueOf(b.get("name"))), null, false);
        }
        audit.log(collegeId, actorType(by), by == null ? null : by.getId(), "BATCH_REMINDED", "BATCH", batchId, who.size() + " students");
        return Map.of("reminded", who.size());
    }

    private static String actorType(UserPrincipal p) {
        if (p == null) return "SYSTEM";
        if (p.getId() != null && p.getId() == 0) return "SUPER_ADMIN";
        return "TPO";
    }
}
