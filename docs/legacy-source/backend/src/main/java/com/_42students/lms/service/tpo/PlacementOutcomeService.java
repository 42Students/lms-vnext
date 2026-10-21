package com._42students.lms.service.tpo;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * A student's final placement outcome (TPO notes item 7): one fixed list that matches what NAAC 5.2 and NIRF count, so a
 * batch's numbers always add up. Placed and Debarred are worked out from what happened; Higher studies, Entrepreneurship,
 * Competitive exams and Not interested are the registration choice (the student's or the placement cell's). A college can
 * add its own labels (outcome_labels_json), each under one of those four; reports count the fixed outcome, the student's
 * record shows the label.
 *
 * Order when several apply: placed through a drive, placed off campus, the choice, debarred, seeking (registered), not registered.
 */
@Service
@RequiredArgsConstructor
public class PlacementOutcomeService {

    public static final Map<String, String> OUTCOMES = linked(
            "PLACED_ON_CAMPUS", "Placed (on campus)", "PLACED_OFF_CAMPUS", "Placed (off campus)", "HIGHER_STUDIES", "Higher studies",
            "ENTREPRENEURSHIP", "Entrepreneurship / self-employed", "COMPETITIVE_EXAMS", "Competitive exams", "NOT_INTERESTED", "Not interested",
            "SEEKING", "Looking for a job", "DEBARRED", "Debarred", "NOT_REGISTERED", "Not decided yet");
    /** The outcomes that are a registration choice, so the placement cell can set them (and a college label can sit under them). */
    public static final Set<String> CHOICE_OUTCOMES = Set.of("HIGHER_STUDIES", "ENTREPRENEURSHIP", "COMPETITIVE_EXAMS", "NOT_INTERESTED");
    /** Every value placement_registration.choice can hold. */
    public static final Set<String> CHOICES = Set.of("PLACEMENTS", "HIGHER_STUDIES", "ENTREPRENEURSHIP", "COMPETITIVE_EXAMS", "NOT_INTERESTED");
    public static final int MAX_LABELS = 30;

    private static final ObjectMapper OM = new ObjectMapper();

    private final NamedParameterJdbcTemplate jdbc;
    private final JobTypeService jobTypes; // for ensureSettingsRow
    private final TpoAuditService audit;

    public record Outcome(String key, String label, String customLabel, String detail) {
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("outcome", key); m.put("outcomeName", label); m.put("outcomeLabel", customLabel); m.put("outcomeDetail", detail);
            return m;
        }
    }

    /** The outcome of every student of the college. placedStatusesSql as TpoWorkspaceService.placedOfferStatuses gives it. */
    public Map<Integer, Outcome> forCollege(Integer collegeId, String placedStatusesSql) {
        MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId);
        Set<Integer> onCampus = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT a.learner_id FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN learner l ON l.id = a.learner_id " +
                "WHERE l.college_id = :c AND o.status IN " + placedStatusesSql, c, Integer.class));
        Set<Integer> offCampus = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT learner_id FROM external_placement WHERE college_id = :c AND is_deleted = 0", c, Integer.class));
        Set<Integer> debarred = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT d.learner_id FROM placement_debarment d JOIN learner l ON l.id = d.learner_id WHERE l.college_id = :c AND d.lifted_at IS NULL " +
                "AND (d.until_date IS NULL OR d.until_date >= CURDATE()) AND (d.until_date IS NOT NULL OR d.until_drives IS NULL OR d.drives_counted < d.until_drives)", c, Integer.class));
        Map<Integer, String[]> choice = new HashMap<>();
        jdbc.query("SELECT pr.learner_id AS l, pr.choice AS ch, pr.outcome_label AS lb, pr.outcome_detail AS dt FROM placement_registration pr JOIN learner x ON x.id = pr.learner_id " +
                        "WHERE x.college_id = :c AND pr.id = (SELECT MAX(p2.id) FROM placement_registration p2 WHERE p2.learner_id = pr.learner_id)", c,
                rs -> { choice.put(rs.getInt("l"), new String[]{rs.getString("ch"), rs.getString("lb"), rs.getString("dt")}); });
        Set<Integer> applied = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT a.learner_id FROM job_application a JOIN learner l ON l.id = a.learner_id WHERE l.college_id = :c AND (a.is_deleted = 0 OR a.is_deleted IS NULL)", c, Integer.class));
        List<Integer> learners = jdbc.queryForList("SELECT id FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", c, Integer.class);
        Map<Integer, Outcome> out = new HashMap<>();
        for (Integer id : learners) out.put(id, resolve(onCampus.contains(id), offCampus.contains(id), choice.get(id), debarred.contains(id), applied.contains(id)));
        return out;
    }

    /** Pure, so the order is testable. reg = { choice, label, detail } of the latest registration, or null. */
    static Outcome resolve(boolean onCampus, boolean offCampus, String[] reg, boolean debarred, boolean applied) {
        if (onCampus) return of("PLACED_ON_CAMPUS", null, null);
        if (offCampus) return of("PLACED_OFF_CAMPUS", null, null);
        String ch = reg == null ? null : reg[0];
        if (ch != null && CHOICE_OUTCOMES.contains(ch)) return of(ch, reg[1], reg[2]);
        if (debarred) return of("DEBARRED", null, null);
        if ("PLACEMENTS".equals(ch) || applied) return of("SEEKING", null, null);
        return of("NOT_REGISTERED", null, null);
    }

    private static Outcome of(String key, String label, String detail) { return new Outcome(key, OUTCOMES.get(key), label, detail); }

    // ---------------------------------------------------------------- the college's own labels
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> labels(Integer collegeId) {
        if (collegeId == null) return List.of();
        List<String> raw = jdbc.queryForList("SELECT outcome_labels_json FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        List<Map<String, Object>> out = new ArrayList<>();
        if (raw.isEmpty() || raw.get(0) == null) return out;
        try {
            for (Object o : OM.readValue(raw.get(0), List.class)) {
                if (!(o instanceof Map<?, ?> m) || !CHOICE_OUTCOMES.contains(String.valueOf(m.get("outcome")))) continue;
                Map<String, Object> l = new LinkedHashMap<>();
                l.put("id", String.valueOf(m.get("id"))); l.put("label", String.valueOf(m.get("label"))); l.put("outcome", String.valueOf(m.get("outcome")));
                l.put("outcomeName", OUTCOMES.get(String.valueOf(m.get("outcome"))));
                out.add(l);
            }
        } catch (Exception ignored) { /* unreadable: no labels */ }
        return out;
    }

    /**
     * Saves the labels. Each needs a name (2-60 characters, unique) and one of the four choice outcomes. A renamed label is
     * renamed on the students who have it; a removed one is cleared from them (their outcome itself stays).
     */
    @Transactional
    public List<Map<String, Object>> saveLabels(Integer collegeId, List<Map<String, Object>> in, Integer actorId) {
        if (in == null) throw new IllegalArgumentException("Send the list of labels");
        if (in.size() > MAX_LABELS) throw new IllegalArgumentException("Up to " + MAX_LABELS + " labels");
        Map<String, Map<String, Object>> before = new HashMap<>();
        for (Map<String, Object> l : labels(collegeId)) before.put(String.valueOf(l.get("id")), l);
        List<Map<String, Object>> clean = new ArrayList<>();
        Set<String> names = new HashSet<>();
        for (Map<String, Object> l : in) {
            String label = l.get("label") == null ? "" : String.valueOf(l.get("label")).trim().replaceAll("\\s+", " ");
            String outcome = l.get("outcome") == null ? "" : String.valueOf(l.get("outcome"));
            if (label.length() < 2 || label.length() > 60) throw new IllegalArgumentException("A label is 2-60 characters");
            if (OUTCOMES.values().stream().anyMatch(v -> v.equalsIgnoreCase(label))) throw new IllegalArgumentException("\"" + label + "\" is already one of the fixed outcomes");
            if (!names.add(label.toLowerCase(Locale.ROOT))) throw new IllegalArgumentException("\"" + label + "\" is listed twice");
            if (!CHOICE_OUTCOMES.contains(outcome)) throw new IllegalArgumentException("Pick which After college choice \"" + label + "\" goes under");
            String id = l.get("id") == null || String.valueOf(l.get("id")).isBlank() ? UUID.randomUUID().toString().substring(0, 8) : String.valueOf(l.get("id"));
            if (l.get("id") != null && !String.valueOf(l.get("id")).isBlank() && !before.containsKey(id)) throw new IllegalArgumentException("Not found");
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id); m.put("label", label); m.put("outcome", outcome);
            clean.add(m);
        }
        Set<String> kept = new HashSet<>();
        for (Map<String, Object> m : clean) {
            kept.add(String.valueOf(m.get("id")));
            Map<String, Object> old = before.get(String.valueOf(m.get("id")));
            if (old == null) continue;
            if (!old.get("label").equals(m.get("label")) || !old.get("outcome").equals(m.get("outcome"))) {
                // A renamed label follows its students; a label moved to another outcome moves their outcome too.
                jdbc.update("UPDATE placement_registration pr JOIN learner l ON l.id = pr.learner_id SET pr.outcome_label = :n, pr.choice = :o " +
                                "WHERE l.college_id = :c AND pr.outcome_label = :old",
                        new MapSqlParameterSource("c", collegeId).addValue("n", m.get("label")).addValue("o", m.get("outcome")).addValue("old", old.get("label")));
            }
        }
        for (Map<String, Object> old : before.values()) {
            if (kept.contains(String.valueOf(old.get("id")))) continue;
            jdbc.update("UPDATE placement_registration pr JOIN learner l ON l.id = pr.learner_id SET pr.outcome_label = NULL WHERE l.college_id = :c AND pr.outcome_label = :old",
                    new MapSqlParameterSource("c", collegeId).addValue("old", old.get("label")));
        }
        String json;
        try { json = OM.writeValueAsString(clean); } catch (Exception e) { throw new IllegalArgumentException("Labels are not valid"); }
        jobTypes.ensureSettingsRow(collegeId, actorId);
        jdbc.update("UPDATE tpo_college_settings SET outcome_labels_json = :j WHERE college_id = :c", new MapSqlParameterSource("c", collegeId).addValue("j", json));
        audit.log(collegeId, "TPO", actorId, "OUTCOME_LABELS_UPDATED", "SETTINGS", null, clean.size() + " labels");
        return labels(collegeId);
    }

    /**
     * Checks an outcome the placement cell sets: choice one of CHOICES; label (optional) one of the college's labels and under
     * this choice; detail up to 200 characters. Returns { label, detail } cleaned; both null for PLACEMENTS.
     */
    public String[] checkOutcome(Integer collegeId, String choice, String label, String detail) {
        if (!CHOICES.contains(choice)) throw new IllegalArgumentException("Choose Placements, Higher studies, Entrepreneurship, Competitive exams or Not interested");
        if ("PLACEMENTS".equals(choice)) return new String[]{null, null};
        String l = label == null || label.isBlank() ? null : label.trim();
        if (l != null && labels(collegeId).stream().noneMatch(x -> l.equals(x.get("label")) && choice.equals(x.get("outcome")))) {
            throw new IllegalArgumentException("\"" + l + "\" is not one of your labels for " + OUTCOMES.get(choice));
        }
        String d = detail == null || detail.isBlank() ? null : detail.trim();
        if (d != null && d.length() > 200) throw new IllegalArgumentException("Keep the detail under 200 characters");
        return new String[]{l, d};
    }

    private static Map<String, String> linked(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return Collections.unmodifiableMap(m);
    }
}
