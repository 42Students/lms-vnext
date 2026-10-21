package com._42students.lms.service.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Who is in placements (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).
 *
 * A decision (Eligible, or Ineligible with a reason) sits on a batch, a class or one learner; the most specific wins:
 * learner, then class, then batch. Nothing up the chain means Not decided. A learner who joins a class later simply follows
 * it. Every change is an event grouped by the action that made it, so a bulk change can be undone in one step.
 *
 * A learner can use placements only when the college has the Placements module (super admin) and they resolve to Eligible.
 */
@Service
@RequiredArgsConstructor
public class PlacementEligibilityService {

    public static final String BATCH = "BATCH", CLASS = "CLASS", LEARNER = "LEARNER";
    public static final String ELIGIBLE = "ELIGIBLE", INELIGIBLE = "INELIGIBLE", NOT_DECIDED = "NOT_DECIDED";
    public static final List<String> SCOPES = List.of(BATCH, CLASS, LEARNER);
    public static final String MODULE_KEY = "module.placements.enabled";

    private final NamedParameterJdbcTemplate jdbc;
    private final FeatureFlagService featureFlags;
    private final PlacementRulesService rules;
    /** Marks for the batch grid's academic columns; optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private AcademicMarksService academicMarks;

    // ---------------------------------------------------------------- resolution

    /** One learner's resolved decision. */
    public static class Resolved {
        public String status = NOT_DECIDED;
        public String level; // LEARNER | CLASS | BATCH, or null when not decided
        public String reason;
        public String note;
        public String decidedByName;
        public Object decidedAt;
        public Integer classId;
        public Long batchId;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("eligibility", status);
            m.put("eligibilityLevel", level);
            m.put("eligibilityReason", reason);
            m.put("eligibilityNote", note);
            m.put("eligibilityBy", decidedByName);
            m.put("eligibilityAt", decidedAt);
            return m;
        }
    }

    private Map<String, Map<String, Object>> decisions(Integer collegeId) {
        Map<String, Map<String, Object>> out = new HashMap<>();
        for (Map<String, Object> d : jdbc.queryForList("SELECT scope_type, scope_id, status, reason, note, decided_by_name, decided_at FROM placement_eligibility WHERE college_id = :c",
                new MapSqlParameterSource("c", collegeId))) {
            out.put(d.get("scope_type") + ":" + ((Number) d.get("scope_id")).longValue(), d);
        }
        return out;
    }

    private static void apply(Resolved r, Map<String, Object> d, String level) {
        r.status = String.valueOf(d.get("status"));
        r.level = level;
        r.reason = (String) d.get("reason");
        r.note = (String) d.get("note");
        r.decidedByName = (String) d.get("decided_by_name");
        r.decidedAt = d.get("decided_at");
    }

    /** Every learner of the college resolved in two queries: learnerId -> decision. Used by the grids and lists. */
    public Map<Integer, Resolved> resolveCollege(Integer collegeId) {
        Map<String, Map<String, Object>> dec = decisions(collegeId);
        Map<Integer, Resolved> out = new HashMap<>();
        for (Map<String, Object> l : jdbc.queryForList(
                "SELECT l.id, l.class_id AS classId, c.batch_id AS batchId FROM learner l LEFT JOIN class c ON c.id = l.class_id " +
                "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId))) {
            Resolved r = new Resolved();
            int id = ((Number) l.get("id")).intValue();
            r.classId = l.get("classId") == null ? null : ((Number) l.get("classId")).intValue();
            r.batchId = l.get("batchId") == null ? null : ((Number) l.get("batchId")).longValue();
            Map<String, Object> d;
            if ((d = dec.get(LEARNER + ":" + id)) != null) apply(r, d, LEARNER);
            else if (r.classId != null && (d = dec.get(CLASS + ":" + r.classId)) != null) apply(r, d, CLASS);
            else if (r.batchId != null && (d = dec.get(BATCH + ":" + r.batchId)) != null) apply(r, d, BATCH);
            out.put(id, r);
        }
        return out;
    }

    /** One learner, for access checks. */
    public Resolved resolve(Integer learnerId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT l.college_id AS collegeId, l.class_id AS classId, c.batch_id AS batchId FROM learner l LEFT JOIN class c ON c.id = l.class_id WHERE l.id = :l",
                new MapSqlParameterSource("l", learnerId));
        Resolved r = new Resolved();
        if (rows.isEmpty()) return r;
        Map<String, Object> l = rows.get(0);
        r.classId = l.get("classId") == null ? null : ((Number) l.get("classId")).intValue();
        r.batchId = l.get("batchId") == null ? null : ((Number) l.get("batchId")).longValue();
        List<Map<String, Object>> dec = jdbc.queryForList(
                "SELECT scope_type, scope_id, status, reason, note, decided_by_name, decided_at FROM placement_eligibility " +
                "WHERE (scope_type = 'LEARNER' AND scope_id = :l) OR (scope_type = 'CLASS' AND scope_id = :cl) OR (scope_type = 'BATCH' AND scope_id = :b)",
                new MapSqlParameterSource("l", learnerId).addValue("cl", r.classId == null ? -1 : r.classId).addValue("b", r.batchId == null ? -1 : r.batchId));
        for (String level : List.of(LEARNER, CLASS, BATCH)) { // most specific first
            Optional<Map<String, Object>> d = dec.stream().filter(x -> level.equals(x.get("scope_type"))).findFirst();
            if (d.isPresent()) { apply(r, d.get(), level); break; }
        }
        return r;
    }

    public boolean collegeHasPlacements(Integer collegeId) {
        return collegeId != null && featureFlags.isEnabled(MODULE_KEY, collegeId);
    }

    /** The one check every student-facing placement surface uses: the college has the module and the learner is Eligible. */
    public boolean learnerInPlacements(Integer learnerId, Integer collegeId) {
        return collegeHasPlacements(collegeId) && ELIGIBLE.equals(resolve(learnerId).status);
    }

    // ---------------------------------------------------------------- deciding

    /** One change: a scope and what it becomes (status null = back to Not decided at that level). */
    public static class Change {
        public String scopeType;
        public Long scopeId;
        public String status;
        public String reason;
        public String note;
    }

    private static boolean isSuperAdmin(UserPrincipal p) { return p != null && p.getId() != null && p.getId() == 0; }

    private String actorName(UserPrincipal p) {
        if (isSuperAdmin(p)) return "42LMS admin";
        List<String> n = jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM faculty WHERE id = :f",
                new MapSqlParameterSource("f", p.getId()), String.class);
        return n.isEmpty() || n.get(0) == null || n.get(0).isBlank() ? "Placement cell" : n.get(0);
    }

    private static String actorType(UserPrincipal p) {
        if (isSuperAdmin(p)) return "SUPER_ADMIN";
        return "ADMIN".equalsIgnoreCase(p.getFacultyType()) ? "ADMIN" : "TPO";
    }

    /** The scope must belong to this college. */
    private boolean scopeInCollege(Integer collegeId, String scopeType, Long scopeId) {
        String sql = switch (scopeType) {
            case LEARNER -> "SELECT COUNT(*) FROM learner WHERE id = :id AND college_id = :c";
            case CLASS -> "SELECT COUNT(*) FROM class c JOIN batch b ON b.id = c.batch_id JOIN new_program p ON p.id = b.program_id JOIN department d ON d.id = p.dept_id WHERE c.id = :id AND d.college_id = :c";
            case BATCH -> "SELECT COUNT(*) FROM batch b JOIN new_program p ON p.id = b.program_id JOIN department d ON d.id = p.dept_id WHERE b.id = :id AND d.college_id = :c";
            default -> throw new IllegalArgumentException("Unknown level");
        };
        Long n = jdbc.queryForObject(sql, new MapSqlParameterSource("id", scopeId).addValue("c", collegeId), Long.class);
        return n != null && n > 0;
    }

    /**
     * Apply decisions as one action (one undo step). Ineligible needs a reason; a reason is cleaned and capped. Unchanged
     * scopes are skipped. Returns the action id and how many changed.
     */
    @Transactional
    public Map<String, Object> decide(UserPrincipal by, Integer collegeId, List<Change> changes) {
        if (changes == null || changes.isEmpty()) throw new IllegalArgumentException("Nothing to change");
        if (changes.size() > 20000) throw new IllegalArgumentException("Too many changes at once");
        String actionId = UUID.randomUUID().toString();
        String name = actorName(by);
        String type = actorType(by);
        int changed = 0;
        Set<String> seen = new HashSet<>();
        for (Change ch : changes) {
            String scope = ch.scopeType == null ? "" : ch.scopeType.trim().toUpperCase(Locale.ROOT);
            if (!SCOPES.contains(scope) || ch.scopeId == null) throw new IllegalArgumentException("Unknown level");
            if (!seen.add(scope + ":" + ch.scopeId)) continue;
            String status = ch.status == null || ch.status.isBlank() || NOT_DECIDED.equalsIgnoreCase(ch.status) ? null : ch.status.trim().toUpperCase(Locale.ROOT);
            if (status != null && !ELIGIBLE.equals(status) && !INELIGIBLE.equals(status)) throw new IllegalArgumentException("Choose Eligible, Ineligible or Not decided");
            String reason = clean(ch.reason, 200);
            String note = clean(ch.note, 300);
            if (INELIGIBLE.equals(status) && reason == null) throw new IllegalArgumentException("Give a reason for marking students ineligible");
            if (!INELIGIBLE.equals(status)) reason = null;
            if (!scopeInCollege(collegeId, scope, ch.scopeId)) throw new IllegalArgumentException("Not found");

            List<Map<String, Object>> cur = jdbc.queryForList("SELECT status, reason, note FROM placement_eligibility WHERE scope_type = :t AND scope_id = :id",
                    new MapSqlParameterSource("t", scope).addValue("id", ch.scopeId));
            String bStatus = cur.isEmpty() ? null : (String) cur.get(0).get("status");
            String bReason = cur.isEmpty() ? null : (String) cur.get(0).get("reason");
            String bNote = cur.isEmpty() ? null : (String) cur.get(0).get("note");
            if (Objects.equals(bStatus, status) && Objects.equals(bReason, reason) && Objects.equals(bNote, note)) continue;

            MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("t", scope).addValue("id", ch.scopeId).addValue("s", status)
                    .addValue("r", reason).addValue("n", note).addValue("bt", type).addValue("bi", by == null ? null : by.getId()).addValue("bn", name);
            if (status == null) {
                jdbc.update("DELETE FROM placement_eligibility WHERE scope_type = :t AND scope_id = :id", p);
            } else {
                jdbc.update("INSERT INTO placement_eligibility (college_id, scope_type, scope_id, status, reason, note, decided_by_type, decided_by_id, decided_by_name, decided_at) " +
                        "VALUES (:c, :t, :id, :s, :r, :n, :bt, :bi, :bn, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), reason = VALUES(reason), note = VALUES(note), " +
                        "decided_by_type = VALUES(decided_by_type), decided_by_id = VALUES(decided_by_id), decided_by_name = VALUES(decided_by_name), decided_at = NOW()", p);
            }
            jdbc.update("INSERT INTO placement_eligibility_event (college_id, action_id, scope_type, scope_id, before_status, before_reason, before_note, after_status, after_reason, after_note, actor_type, actor_id, actor_name) " +
                    "VALUES (:c, :a, :t, :id, :bs, :br, :bnote, :s, :r, :n, :bt, :bi, :bn)",
                    p.addValue("a", actionId).addValue("bs", bStatus).addValue("br", bReason).addValue("bnote", bNote));
            changed++;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("actionId", changed > 0 ? actionId : null);
        out.put("changed", changed);
        return out;
    }

    private static String clean(String s, int max) {
        if (s == null) return null;
        String t = s.trim().replaceAll("\\s+", " ");
        if (t.isEmpty()) return null;
        return t.length() > max ? t.substring(0, max) : t;
    }

    /** The last action at this college that can still be undone (for the "Undo" after a bulk change). */
    public Map<String, Object> lastAction(Integer collegeId) {
        List<Map<String, Object>> r = jdbc.queryForList(
                "SELECT action_id AS actionId, MAX(actor_name) AS actorName, MAX(created_at) AS at, COUNT(*) AS changes FROM placement_eligibility_event " +
                "WHERE college_id = :c AND undone_at IS NULL GROUP BY action_id ORDER BY MAX(id) DESC LIMIT 1", new MapSqlParameterSource("c", collegeId));
        return r.isEmpty() ? null : r.get(0);
    }

    /**
     * Undo one action: every scope it touched goes back to what it was. Only the college's most recent action can be undone, so a
     * later change is never silently overwritten.
     */
    @Transactional
    public Map<String, Object> undo(UserPrincipal by, Integer collegeId, String actionId) {
        Map<String, Object> last = lastAction(collegeId);
        if (last == null || !Objects.equals(last.get("actionId"), actionId)) throw new IllegalStateException("Only the latest change can be undone");
        List<Map<String, Object>> events = jdbc.queryForList("SELECT * FROM placement_eligibility_event WHERE college_id = :c AND action_id = :a AND undone_at IS NULL ORDER BY id DESC",
                new MapSqlParameterSource("c", collegeId).addValue("a", actionId));
        String name = actorName(by);
        for (Map<String, Object> e : events) {
            MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("t", e.get("scope_type")).addValue("id", e.get("scope_id"))
                    .addValue("s", e.get("before_status")).addValue("r", e.get("before_reason")).addValue("n", e.get("before_note"))
                    .addValue("bt", actorType(by)).addValue("bi", by == null ? null : by.getId()).addValue("bn", name);
            if (e.get("before_status") == null) {
                jdbc.update("DELETE FROM placement_eligibility WHERE scope_type = :t AND scope_id = :id", p);
            } else {
                jdbc.update("INSERT INTO placement_eligibility (college_id, scope_type, scope_id, status, reason, note, decided_by_type, decided_by_id, decided_by_name, decided_at) " +
                        "VALUES (:c, :t, :id, :s, :r, :n, :bt, :bi, :bn, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), reason = VALUES(reason), note = VALUES(note), " +
                        "decided_by_type = VALUES(decided_by_type), decided_by_id = VALUES(decided_by_id), decided_by_name = VALUES(decided_by_name), decided_at = NOW()", p);
            }
        }
        jdbc.update("UPDATE placement_eligibility_event SET undone_at = NOW() WHERE college_id = :c AND action_id = :a", new MapSqlParameterSource("c", collegeId).addValue("a", actionId));
        return Map.of("undone", events.size());
    }

    /** History for a batch (its own, its classes' and its learners' decisions), newest first. */
    public List<Map<String, Object>> history(Integer collegeId, Long batchId, int limit) {
        return jdbc.queryForList(
                "SELECT e.scope_type AS scopeType, e.scope_id AS scopeId, e.before_status AS beforeStatus, e.after_status AS afterStatus, e.after_reason AS reason, " +
                "  e.actor_name AS actorName, e.created_at AS at, e.undone_at AS undoneAt, " +
                "  CASE e.scope_type WHEN 'LEARNER' THEN (SELECT TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) FROM learner l WHERE l.id = e.scope_id) " +
                "    WHEN 'CLASS' THEN (SELECT c.name FROM class c WHERE c.id = e.scope_id) ELSE (SELECT b.batch_name FROM batch b WHERE b.id = e.scope_id) END AS scopeName " +
                "FROM placement_eligibility_event e WHERE e.college_id = :c AND (" +
                "  (e.scope_type = 'BATCH' AND e.scope_id = :b) OR (e.scope_type = 'CLASS' AND e.scope_id IN (SELECT id FROM class WHERE batch_id = :b)) " +
                "  OR (e.scope_type = 'LEARNER' AND e.scope_id IN (SELECT l.id FROM learner l JOIN class c ON c.id = l.class_id WHERE c.batch_id = :b))) " +
                "ORDER BY e.id DESC LIMIT " + Math.max(1, Math.min(limit, 500)),
                new MapSqlParameterSource("c", collegeId).addValue("b", batchId));
    }

    // ---------------------------------------------------------------- import

    /**
     * An eligibility sheet (roll number, decision, reason): which rows match a learner of the college and what would change.
     * Decision accepts Eligible / Ineligible / Not decided (and Yes / No).
     */
    public Map<String, Object> importPreview(Integer collegeId, List<Map<String, Object>> rows) {
        Map<Integer, Resolved> resolved = resolveCollege(collegeId);
        Map<String, Map<String, Object>> byRoll = new HashMap<>();
        for (Map<String, Object> l : jdbc.queryForList("SELECT id, roll_number AS roll, first_name AS firstName, last_name AS lastName FROM learner " +
                "WHERE college_id = :c AND roll_number IS NOT NULL AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId))) {
            byRoll.put(String.valueOf(l.get("roll")).trim().toLowerCase(Locale.ROOT), l);
        }
        List<Map<String, Object>> matched = new ArrayList<>();
        List<Map<String, Object>> unmatched = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < (rows == null ? 0 : rows.size()); i++) {
            Map<String, Object> row = rows.get(i);
            String roll = row.get("roll") == null ? "" : String.valueOf(row.get("roll")).trim();
            String decision = normalizeDecision(row.get("decision"));
            String reason = clean(row.get("reason") == null ? null : String.valueOf(row.get("reason")), 200);
            if (roll.isEmpty()) { unmatched.add(Map.of("row", i, "reason", "Roll number is missing")); continue; }
            if (!seen.add(roll.toLowerCase(Locale.ROOT))) { unmatched.add(Map.of("row", i, "roll", roll, "reason", "Roll number appears twice")); continue; }
            Map<String, Object> l = byRoll.get(roll.toLowerCase(Locale.ROOT));
            if (l == null) { unmatched.add(Map.of("row", i, "roll", roll, "reason", "No student with this roll number")); continue; }
            if (decision == null) { unmatched.add(Map.of("row", i, "roll", roll, "reason", "Decision must be Eligible, Ineligible or Not decided")); continue; }
            if (INELIGIBLE.equals(decision) && reason == null) { unmatched.add(Map.of("row", i, "roll", roll, "reason", "Ineligible needs a reason")); continue; }
            Resolved cur = resolved.getOrDefault(((Number) l.get("id")).intValue(), new Resolved());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("row", i);
            m.put("learnerId", ((Number) l.get("id")).intValue());
            m.put("roll", roll);
            m.put("name", (l.get("firstName") + " " + (l.get("lastName") == null ? "" : l.get("lastName"))).trim());
            m.put("from", cur.status);
            m.put("to", decision);
            m.put("reason", reason);
            m.put("unchanged", decision.equals(cur.status) && (!INELIGIBLE.equals(decision) || Objects.equals(reason, cur.reason)));
            matched.add(m);
        }
        return Map.of("matched", matched, "unmatched", unmatched);
    }

    @Transactional
    public Map<String, Object> importCommit(UserPrincipal by, Integer collegeId, List<Map<String, Object>> rows) {
        Map<String, Object> preview = importPreview(collegeId, rows);
        @SuppressWarnings("unchecked") List<Map<String, Object>> unmatched = (List<Map<String, Object>>) preview.get("unmatched");
        if (!unmatched.isEmpty()) throw new IllegalStateException(unmatched.size() + " row(s) can't be used. Fix or remove them first.");
        @SuppressWarnings("unchecked") List<Map<String, Object>> matched = (List<Map<String, Object>>) preview.get("matched");
        List<Change> changes = new ArrayList<>();
        for (Map<String, Object> m : matched) {
            if (Boolean.TRUE.equals(m.get("unchanged"))) continue;
            Change c = new Change();
            c.scopeType = LEARNER;
            c.scopeId = ((Number) m.get("learnerId")).longValue();
            c.status = NOT_DECIDED.equals(m.get("to")) ? null : String.valueOf(m.get("to"));
            c.reason = (String) m.get("reason");
            changes.add(c);
        }
        if (changes.isEmpty()) return Map.of("changed", 0);
        return decide(by, collegeId, changes);
    }

    static String normalizeDecision(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        return switch (s) {
            case "ELIGIBLE", "YES", "Y" -> ELIGIBLE;
            case "INELIGIBLE", "NOT_ELIGIBLE", "NO", "N" -> INELIGIBLE;
            case "NOT_DECIDED", "UNDECIDED", "", "-" -> NOT_DECIDED;
            default -> null;
        };
    }

    // ---------------------------------------------------------------- batches

    /** The college's batches from Academic Setup with their department and program. */
    public List<Map<String, Object>> collegeBatches(Integer collegeId) {
        return jdbc.queryForList(
                "SELECT b.id AS batchId, b.batch_name AS name, b.start_date AS startDate, b.end_date AS endDate, b.academic_year AS academicYear, b.status AS academicStatus, " +
                "  p.id AS programId, p.name AS program, d.id AS departmentId, d.name AS department, " +
                "  pb.registration_deadline AS registrationDeadline, pb.invited_at AS invitedAt, pb.finished_at AS finishedAt, (pb.rules_json IS NOT NULL) AS customRules " +
                "FROM batch b JOIN new_program p ON p.id = b.program_id JOIN department d ON d.id = p.dept_id " +
                "LEFT JOIN placement_batch pb ON pb.batch_id = b.id " +
                "WHERE d.college_id = :c AND (p.is_deleted = 0 OR p.is_deleted IS NULL) AND (d.is_deleted = 0 OR d.is_deleted IS NULL) " +
                "ORDER BY b.end_date DESC, d.name, b.batch_name", new MapSqlParameterSource("c", collegeId));
    }

    /**
     * The Batches page: each batch with its journey numbers (eligible, ineligible, not decided, invited, registered, verified,
     * placed) and where it is (IN_PLACEMENTS, NOT_STARTED, FINISHED). Learners outside any batch are counted separately.
     */
    public Map<String, Object> overview(Integer collegeId, String placedStatusesSql) {
        Map<Integer, Resolved> res = resolveCollege(collegeId);
        Map<Integer, String> profile = new HashMap<>();
        jdbc.query("SELECT v.learner_id AS l, SUM(v.status IN ('VERIFIED','UPDATE_PENDING')) AS ok FROM profile_verification v JOIN learner x ON x.id = v.learner_id WHERE x.college_id = :c GROUP BY v.learner_id",
                new MapSqlParameterSource("c", collegeId), rs -> { if (rs.getInt("ok") >= ProfileVerificationService.SECTIONS.size()) profile.put(rs.getInt("l"), "VERIFIED"); });
        // Registered = chose Placements, or is already applying (the same rule as the Students page).
        Set<Integer> registered = new HashSet<>(jdbc.queryForList("SELECT DISTINCT r.learner_id FROM placement_registration r JOIN learner l ON l.id = r.learner_id WHERE l.college_id = :c AND r.choice = 'PLACEMENTS'",
                new MapSqlParameterSource("c", collegeId), Integer.class));
        registered.addAll(jdbc.queryForList("SELECT DISTINCT a.learner_id FROM job_application a JOIN learner l ON l.id = a.learner_id WHERE l.college_id = :c AND (a.is_deleted = 0 OR a.is_deleted IS NULL)",
                new MapSqlParameterSource("c", collegeId), Integer.class));
        // Placed follows each batch's own rule (released or accepted), the college's unless the batch changed it.
        String releasedSql = TpoWorkspaceService.placedOfferStatuses("OFFER_RELEASED");
        String acceptedSql = TpoWorkspaceService.placedOfferStatuses("OFFER_ACCEPTED");
        Set<Integer> placedReleased = new HashSet<>(jdbc.queryForList("SELECT DISTINCT a.learner_id FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN learner l ON l.id = a.learner_id " +
                "WHERE l.college_id = :c AND o.status IN " + releasedSql, new MapSqlParameterSource("c", collegeId), Integer.class));
        Set<Integer> placedAccepted = new HashSet<>(jdbc.queryForList("SELECT DISTINCT a.learner_id FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN learner l ON l.id = a.learner_id " +
                "WHERE l.college_id = :c AND o.status IN " + acceptedSql, new MapSqlParameterSource("c", collegeId), Integer.class));

        List<Map<String, Object>> batches = collegeBatches(collegeId);
        Map<Long, Map<String, Object>> byId = new LinkedHashMap<>();
        Map<Long, Boolean> countsAtAccepted = new HashMap<>();
        for (Map<String, Object> b : batches) {
            long id = ((Number) b.get("batchId")).longValue();
            countsAtAccepted.put(id, "OFFER_ACCEPTED".equals(rules.rulesForBatch(collegeId, id).getCountsAsPlacedAt()));
        }
        for (Map<String, Object> b : batches) {
            Map<String, Object> m = new LinkedHashMap<>(b);
            for (String k : List.of("students", "eligible", "ineligible", "notDecided", "registered", "verified", "placed")) m.put(k, 0L);
            byId.put(((Number) b.get("batchId")).longValue(), m);
        }
        Map<String, Long> noBatch = new LinkedHashMap<>();
        for (String k : List.of("students", "eligible", "ineligible", "notDecided")) noBatch.put(k, 0L);
        res.forEach((learnerId, r) -> {
            Map<String, Object> m = r.batchId == null ? null : byId.get(r.batchId);
            if (m == null) {
                noBatch.merge("students", 1L, Long::sum);
                noBatch.merge(r.status.equals(ELIGIBLE) ? "eligible" : r.status.equals(INELIGIBLE) ? "ineligible" : "notDecided", 1L, Long::sum);
                return;
            }
            inc(m, "students");
            inc(m, r.status.equals(ELIGIBLE) ? "eligible" : r.status.equals(INELIGIBLE) ? "ineligible" : "notDecided");
            if (ELIGIBLE.equals(r.status)) {
                if (registered.contains(learnerId)) inc(m, "registered");
                if ("VERIFIED".equals(profile.get(learnerId))) inc(m, "verified");
                if ((Boolean.TRUE.equals(countsAtAccepted.get(r.batchId)) ? placedAccepted : placedReleased).contains(learnerId)) inc(m, "placed");
            }
        });
        for (Map<String, Object> m : byId.values()) {
            boolean finished = m.get("finishedAt") != null;
            long eligible = ((Number) m.get("eligible")).longValue();
            m.put("state", finished ? "FINISHED" : eligible > 0 ? "IN_PLACEMENTS" : "NOT_STARTED");
            m.put("invited", m.get("invitedAt") != null ? m.get("eligible") : 0L);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("batches", new ArrayList<>(byId.values()));
        out.put("outsideBatches", noBatch);
        out.put("lastAction", lastAction(collegeId));
        return out;
    }

    private static void inc(Map<String, Object> m, String k) { m.put(k, ((Number) m.get(k)).longValue() + 1); }

    /** One batch: its own decision, its classes with their decisions and numbers, and its history. */
    public Map<String, Object> batch(Integer collegeId, Long batchId, String placedStatusesSql) {
        if (!scopeInCollege(collegeId, BATCH, batchId)) throw new IllegalArgumentException("Not found");
        Map<String, Object> over = overview(collegeId, placedStatusesSql);
        @SuppressWarnings("unchecked") Map<String, Object> b = ((List<Map<String, Object>>) over.get("batches")).stream()
                .filter(x -> ((Number) x.get("batchId")).longValue() == batchId).findFirst().orElseThrow(() -> new IllegalArgumentException("Not found"));
        Map<String, Map<String, Object>> dec = decisions(collegeId);
        Map<Integer, Resolved> res = resolveCollege(collegeId);
        List<Map<String, Object>> classes = new ArrayList<>();
        for (Map<String, Object> c : jdbc.queryForList("SELECT id, name FROM class WHERE batch_id = :b AND (is_deleted = 0 OR is_deleted IS NULL) AND (class_type IS NULL OR class_type = 'SECTION') ORDER BY name",
                new MapSqlParameterSource("b", batchId))) {
            int classId = ((Number) c.get("id")).intValue();
            Map<String, Object> m = new LinkedHashMap<>(c);
            m.put("classId", classId);
            Map<String, Object> own = dec.get(CLASS + ":" + classId);
            m.put("decision", own == null ? null : own.get("status"));
            m.put("decisionReason", own == null ? null : own.get("reason"));
            long students = 0, eligible = 0, ineligible = 0, notDecided = 0;
            for (Resolved r : res.values()) {
                if (!Objects.equals(r.classId, classId)) continue;
                students++;
                if (ELIGIBLE.equals(r.status)) eligible++; else if (INELIGIBLE.equals(r.status)) ineligible++; else notDecided++;
            }
            m.put("students", students); m.put("eligible", eligible); m.put("ineligible", ineligible); m.put("notDecided", notDecided);
            classes.add(m);
        }
        Map<String, Object> own = dec.get(BATCH + ":" + batchId);
        Map<String, Object> out = new LinkedHashMap<>(b);
        out.put("decision", own == null ? null : own.get("status"));
        out.put("decisionReason", own == null ? null : own.get("reason"));
        out.put("classes", classes);
        out.put("history", history(collegeId, batchId, 50));
        out.put("lastAction", over.get("lastAction"));
        return out;
    }

    /**
     * The eligibility grid of one batch: every student in it (all decisions, not only Eligible), with their class, the resolved
     * decision and where it came from, their own student-level decision, and where they are on the journey.
     */
    public List<Map<String, Object>> batchStudents(Integer collegeId, Long batchId, String placedStatusesSql) {
        if (!scopeInCollege(collegeId, BATCH, batchId)) throw new IllegalArgumentException("Not found");
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("b", batchId);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT l.id AS learnerId, TRIM(CONCAT(COALESCE(l.first_name,''),' ',COALESCE(l.last_name,''))) AS name, l.roll_number AS rollNumber, " +
                "  l.department AS branch, l.gender AS gender, l.contact_mail AS email, l.contact_mobile AS phone, r.cgpa AS cgpa, " +
                "  cl.id AS classId, cl.name AS className, " +
                "  (EXISTS (SELECT 1 FROM placement_registration pr WHERE pr.learner_id = l.id AND pr.choice = 'PLACEMENTS') " +
                "    OR EXISTS (SELECT 1 FROM job_application ax WHERE ax.learner_id = l.id AND (ax.is_deleted = 0 OR ax.is_deleted IS NULL))) AS registered, " +
                "  EXISTS (SELECT 1 FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status IN " + placedStatusesSql + ") AS placed, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.learner_id = l.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applications, " +
                "  (SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status IN ('RELEASED','ACCEPTED')) AS offers " +
                "FROM learner l JOIN class cl ON cl.id = l.class_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE l.college_id = :c AND cl.batch_id = :b AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
                "ORDER BY cl.name, l.roll_number, l.first_name", p);
        Map<Integer, Integer> verifiedSections = new HashMap<>();
        jdbc.query("SELECT v.learner_id AS l, SUM(v.status IN ('VERIFIED','UPDATE_PENDING')) AS ok FROM profile_verification v JOIN learner x ON x.id = v.learner_id " +
                "JOIN class cl ON cl.id = x.class_id WHERE x.college_id = :c AND cl.batch_id = :b GROUP BY v.learner_id", p,
                rs -> { verifiedSections.put(rs.getInt("l"), rs.getInt("ok")); });
        Map<Integer, Resolved> res = resolveCollege(collegeId);
        Map<String, Map<String, Object>> dec = decisions(collegeId);
        Map<Integer, Map<String, Object>> marks = academicMarks == null ? Map.of() : academicMarks.marksFor(collegeId);
        for (Map<String, Object> row : rows) {
            int id = ((Number) row.get("learnerId")).intValue();
            row.putAll(res.getOrDefault(id, new Resolved()).toMap());
            Map<String, Object> own = dec.get(LEARNER + ":" + (long) id);
            row.put("ownDecision", own == null ? null : own.get("status"));
            row.put("ownReason", own == null ? null : own.get("reason"));
            row.put("ownNote", own == null ? null : own.get("note"));
            row.put("registered", truthy(row.get("registered")));
            row.put("placed", truthy(row.get("placed")));
            row.put("profileVerified", verifiedSections.getOrDefault(id, 0) >= ProfileVerificationService.SECTIONS.size());
            row.putAll(marks.getOrDefault(id, Map.of("marks", Map.of())));
        }
        return rows;
    }

    private static boolean truthy(Object v) {
        return v instanceof Boolean ? (Boolean) v : v instanceof Number && ((Number) v).intValue() != 0;
    }

    /** Registration deadline, finished / reopened. Creates the batch's placement row on first use. */
    @Transactional
    public void updateBatch(Integer collegeId, Long batchId, LocalDateTime deadline, Boolean finished, boolean deadlineGiven) {
        if (!scopeInCollege(collegeId, BATCH, batchId)) throw new IllegalArgumentException("Not found");
        jdbc.update("INSERT IGNORE INTO placement_batch (batch_id, college_id) VALUES (:b, :c)", new MapSqlParameterSource("b", batchId).addValue("c", collegeId));
        if (deadlineGiven) {
            if (deadline != null && deadline.isBefore(LocalDateTime.now())) throw new IllegalArgumentException("The registration deadline has to be in the future");
            jdbc.update("UPDATE placement_batch SET registration_deadline = :d WHERE batch_id = :b", new MapSqlParameterSource("b", batchId).addValue("d", deadline));
        }
        if (finished != null) {
            jdbc.update("UPDATE placement_batch SET finished_at = " + (finished ? "NOW()" : "NULL") + " WHERE batch_id = :b", new MapSqlParameterSource("b", batchId));
        }
    }

    /**
     * A batch's own rules (only the values it changes from the college's). An empty body goes back to the college rules. Values are
     * checked like the college rules: placed when released or accepted, 1-5 held offers, 0-200% uplift, 12-168 hours to respond.
     */
    @Transactional
    public void saveBatchRules(UserPrincipal by, Integer collegeId, Long batchId, Map<String, Object> body) {
        if (!scopeInCollege(collegeId, BATCH, batchId)) throw new IllegalArgumentException("Not found");
        Map<String, Object> clean = new LinkedHashMap<>();
        if (body != null) {
            Object placedAt = body.get("countsAsPlacedAt");
            if (placedAt != null) {
                if (!List.of("OFFER_RELEASED", "OFFER_ACCEPTED").contains(String.valueOf(placedAt))) throw new IllegalArgumentException("Counts as placed must be when the offer is released or accepted");
                clean.put("countsAsPlacedAt", String.valueOf(placedAt));
            }
            range(body, clean, "maxHeldOffers", 1, 5, "Offers a student can hold must be 1 to 5");
            range(body, clean, "upliftPct", 0, 200, "The uplift must be 0 to 200%");
            range(body, clean, "minResponseHours", 12, 168, "Time to respond must be 12 to 168 hours");
        }
        String json;
        try { json = clean.isEmpty() ? null : new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(clean); }
        catch (Exception e) { throw new IllegalArgumentException("Could not read the rules"); }
        MapSqlParameterSource p = new MapSqlParameterSource("b", batchId).addValue("c", collegeId).addValue("r", json);
        jdbc.update("INSERT IGNORE INTO placement_batch (batch_id, college_id) VALUES (:b, :c)", p);
        jdbc.update("UPDATE placement_batch SET rules_json = :r WHERE batch_id = :b", p);
    }

    private static void range(Map<String, Object> body, Map<String, Object> out, String key, int min, int max, String message) {
        Object v = body.get(key);
        if (v == null || String.valueOf(v).isBlank()) return;
        int n;
        try { n = v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(String.valueOf(v).trim()); }
        catch (NumberFormatException e) { throw new IllegalArgumentException(message); }
        if (n < min || n > max) throw new IllegalArgumentException(message);
        out.put(key, n);
    }

    /** Batches marked finished: their learners stay out of the working set and the counts. */
    public Set<Long> finishedBatchIds(Integer collegeId) {
        return new HashSet<>(jdbc.queryForList("SELECT batch_id FROM placement_batch WHERE college_id = :c AND finished_at IS NOT NULL", new MapSqlParameterSource("c", collegeId), Long.class));
    }
}
