package com._42students.lms.service.tpo;

import com._42students.lms.common.MarksConversion;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Marks as earned and one comparable percentage (TPO notes, 5 Oct 2026). The college's CGPA -> % rule lives in
 * tpo_college_settings.cgpa_to_pct (Settings > Placement rules); verified marks keep each level as earned in
 * learner_academic_record.marks_json and the comparable percentage in its *_pct columns, which drive eligibility uses.
 * The Students tables read {@link #marksFor}: the verified (or imported) mark when there is one, otherwise the student's own
 * Education entry marked as not verified, so a TPO sees it without trusting it blindly.
 */
@Service
@RequiredArgsConstructor
public class AcademicMarksService {

    public static final List<String> LEVELS = List.of("10TH", "12TH", "DIPLOMA", "UG", "PG");
    private static final Map<String, String> COLUMN = Map.of("10TH", "tenth_pct", "12TH", "twelfth_pct", "DIPLOMA", "diploma_pct", "UG", "ug_pct");
    private static final ObjectMapper OM = new ObjectMapper();

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoSettingsHubService settingsHub;
    private final TpoAuditService audit;

    /** Re-checks drive eligibility after the rule changes every %; lazy because TpoStudentsReadService uses this service. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoStudentsReadService studentsRead;

    /** The college's rule key (CGPA x 9.5 when never chosen). */
    public String rule(Integer collegeId) {
        if (collegeId == null) return MarksConversion.DEFAULT_RULE;
        List<String> v = jdbc.queryForList("SELECT cgpa_to_pct FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        return MarksConversion.rule(v.isEmpty() ? null : v.get(0));
    }

    public String ruleOfLearner(Integer learnerId) {
        List<Integer> c = jdbc.queryForList("SELECT college_id FROM learner WHERE id = :l", new MapSqlParameterSource("l", learnerId), Integer.class);
        return rule(c.isEmpty() ? null : c.get(0));
    }

    /** Settings: the rule and the choices, for the dropdown. */
    public Map<String, Object> ruleView(Integer collegeId) {
        List<Map<String, Object>> options = new ArrayList<>();
        MarksConversion.RULES.forEach((k, v) -> options.add(Map.of("value", k, "label", v)));
        return Map.of("rule", rule(collegeId), "options", options);
    }

    /** Changes the rule and recomputes every comparable percentage of the college from the marks as earned. Returns how many students changed. */
    @Transactional
    public int saveRule(Integer collegeId, String ruleKey, Integer actorId) {
        if (ruleKey == null || !MarksConversion.RULES.containsKey(ruleKey)) throw new IllegalArgumentException("Pick one of the listed ways to read a CGPA");
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Long.class);
        if (n == null || n == 0) settingsHub.saveCollege(collegeId, new HashMap<>(), actorId);
        jdbc.update("UPDATE tpo_college_settings SET cgpa_to_pct = :r WHERE college_id = :c", new MapSqlParameterSource("c", collegeId).addValue("r", ruleKey));
        int changed = recompute(collegeId);
        audit.log(collegeId, "TPO", actorId, "CGPA_RULE_CHANGED", "SETTINGS", null, MarksConversion.RULES.get(ruleKey) + ": " + changed + " students recomputed");
        // New percentages can change who meets a drive's minimum %: re-check every open application (flagged, never removed).
        if (studentsRead != null) {
            List<Integer> inDrives = jdbc.queryForList("SELECT DISTINCT a.learner_id FROM job_application a JOIN learner l ON l.id = a.learner_id JOIN job j ON j.id = a.job_id " +
                    "WHERE l.college_id = :c AND j.lifecycle_status = 'PUBLISHED' AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW')",
                    new MapSqlParameterSource("c", collegeId), Integer.class);
            studentsRead.recalculateEligibility(collegeId, inDrives, actorId);
        }
        return changed;
    }

    /** Recomputes the *_pct columns of the college's verified records from marks_json. */
    @Transactional
    public int recompute(Integer collegeId) {
        String rule = rule(collegeId);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT r.learner_id AS l, r.marks_json AS m FROM learner_academic_record r JOIN learner x ON x.id = r.learner_id " +
                "WHERE x.college_id = :c AND r.marks_json IS NOT NULL", new MapSqlParameterSource("c", collegeId));
        int changed = 0;
        for (Map<String, Object> row : rows) {
            Map<String, Map<String, Object>> marks = parse(row.get("m"));
            MapSqlParameterSource p = new MapSqlParameterSource("l", row.get("l"));
            List<String> sets = new ArrayList<>();
            for (String level : LEVELS) {
                Map<String, Object> m = marks.get(level);
                if (m == null || !COLUMN.containsKey(level)) continue; // PG has no column: its % is worked out when read
                sets.add(COLUMN.get(level) + " = :" + level.toLowerCase(Locale.ROOT).replace("1", "x"));
                p.addValue(level.toLowerCase(Locale.ROOT).replace("1", "x"), MarksConversion.toPercent(str(m.get("grade")), str(m.get("scale")), str(m.get("max")), rule));
            }
            if (sets.isEmpty()) continue;
            changed += jdbc.update("UPDATE learner_academic_record SET " + String.join(", ", sets) + " WHERE learner_id = :l", p);
        }
        return changed;
    }

    /** Stores each level's mark as earned for a learner whose Education was just verified. */
    public void storeMarks(Integer learnerId, Map<String, Map<String, Object>> marks) {
        if (marks == null || marks.isEmpty()) return;
        try {
            jdbc.update("UPDATE learner_academic_record SET marks_json = :m WHERE learner_id = :l",
                    new MapSqlParameterSource("l", learnerId).addValue("m", OM.writeValueAsString(marks)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    /**
     * Per learner of the college: { marks: { "10TH": { shown, pct, converted, verified }, ... }, degree, qualifyingExam,
     * passingYear, gapYears, marksVerified }. Verified (or imported) values come first; otherwise the student's own Education.
     */
    public Map<Integer, Map<String, Object>> marksFor(Integer collegeId) {
        return marksWhere(collegeId, null);
    }

    /**
     * The same marks for chosen learners (drive eligibility), each read with its own college's rule. Each row also carries
     * "gender" from the profile and "rule", the college's CGPA rule key.
     */
    public Map<Integer, Map<String, Object>> marksForLearners(java.util.Collection<Integer> learnerIds) {
        Map<Integer, Map<String, Object>> out = new HashMap<>();
        if (learnerIds == null || learnerIds.isEmpty()) return out;
        Map<Integer, List<Integer>> byCollege = new HashMap<>();
        Map<Integer, String> gender = new HashMap<>();
        jdbc.query("SELECT id, college_id, gender FROM learner WHERE id IN (:ids)", new MapSqlParameterSource("ids", learnerIds), rs -> {
            int c = rs.getInt("college_id");
            byCollege.computeIfAbsent(rs.wasNull() ? -1 : c, k -> new ArrayList<>()).add(rs.getInt("id"));
            gender.put(rs.getInt("id"), rs.getString("gender"));
        });
        byCollege.forEach((college, ids) -> {
            Integer c = college == -1 ? null : college;
            String rule = rule(c);
            Map<Integer, Map<String, Object>> part = marksWhere(c, ids);
            for (Integer id : ids) {
                Map<String, Object> row = new LinkedHashMap<>(part.getOrDefault(id, Map.of("marks", Map.of())));
                row.put("gender", gender.get(id));
                row.put("rule", rule);
                out.put(id, row);
            }
        });
        return out;
    }

    private Map<Integer, Map<String, Object>> marksWhere(Integer collegeId, java.util.Collection<Integer> onlyLearners) {
        String rule = rule(collegeId);
        MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId).addValue("ids", onlyLearners);
        String scope = onlyLearners == null ? "x.college_id = :c" : "x.id IN (:ids)";
        Map<Integer, Map<String, Object>> record = new HashMap<>();
        jdbc.query("SELECT r.learner_id AS l, r.cgpa, r.tenth_pct AS t, r.twelfth_pct AS w, r.diploma_pct AS d, r.ug_pct AS u, r.passing_year AS py, r.gap_years AS gy, " +
                        "r.source, r.marks_json AS m, r.is_lateral_entry AS lat FROM learner_academic_record r JOIN learner x ON x.id = r.learner_id WHERE " + scope, c,
                rs -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("cgpa", rs.getBigDecimal("cgpa")); m.put("10TH", rs.getBigDecimal("t")); m.put("12TH", rs.getBigDecimal("w"));
                    m.put("DIPLOMA", rs.getBigDecimal("d")); m.put("UG", rs.getBigDecimal("u"));
                    m.put("passingYear", rs.getObject("py")); m.put("gapYears", rs.getObject("gy")); m.put("source", rs.getString("source"));
                    m.put("earned", parse(rs.getString("m")));
                    m.put("lateral", rs.getBoolean("lat"));
                    record.put(rs.getInt("l"), m);
                });
        // The student's own Education, latest entry per level.
        Map<Integer, Map<String, Map<String, Object>>> own = new HashMap<>();
        Map<Integer, String> degree = new HashMap<>();
        Map<Integer, String> exam = new HashMap<>();
        jdbc.query("SELECT q.learner_id AS l, q.education_type AS t, q.grading_type AS gt, q.grade AS g, q.max_grade AS mx, q.program AS pr, q.specialization AS sp, " +
                        "q.end_year AS ey, q.qualifying_exam AS qe FROM qualification q JOIN learner x ON x.id = q.learner_id " +
                        "WHERE " + scope + " AND (q.is_deleted = 0 OR q.is_deleted IS NULL) ORDER BY q.id", c,
                rs -> {
                    int l = rs.getInt("l");
                    String level = levelOf(rs.getString("t"));
                    if (level == null) return;
                    Map<String, Object> e = new HashMap<>();
                    e.put("grade", rs.getString("g")); e.put("scale", rs.getString("gt")); e.put("max", rs.getString("mx")); e.put("endYear", rs.getString("ey"));
                    own.computeIfAbsent(l, k -> new HashMap<>()).put(level, e);
                    if ("UG".equals(level) || "PG".equals(level)) { // the later entry (PG after UG) is the degree shown
                        String d = degreeText(rs.getString("pr"), rs.getString("sp"));
                        if (!d.isBlank()) degree.put(l, d);
                    }
                    if (rs.getString("qe") != null && !rs.getString("qe").isBlank()) exam.put(l, rs.getString("qe"));
                });
        Set<Integer> learners = new HashSet<>(record.keySet());
        learners.addAll(own.keySet());
        Map<Integer, Map<String, Object>> out = new HashMap<>();
        for (Integer l : learners) {
            Map<String, Object> rec = record.get(l);
            @SuppressWarnings("unchecked") Map<String, Map<String, Object>> earned = rec == null ? Map.of() : (Map<String, Map<String, Object>>) rec.get("earned");
            Map<String, Map<String, Object>> mine = own.getOrDefault(l, Map.of());
            Map<String, Object> marks = new LinkedHashMap<>();
            boolean anyUnverified = false;
            for (String level : LEVELS) {
                BigDecimal pct = rec == null ? null : (BigDecimal) rec.get(level);
                Map<String, Object> e0 = rec == null ? null : earned.get(level);
                if (pct == null && e0 != null && !COLUMN.containsKey(level)) pct = MarksConversion.toPercent(str(e0.get("grade")), str(e0.get("scale")), str(e0.get("max")), rule);
                Map<String, Object> m = new LinkedHashMap<>();
                if (pct != null || e0 != null) {
                    Map<String, Object> e = e0;
                    m.put("shown", e == null ? pct.stripTrailingZeros().toPlainString() + "%" : MarksConversion.shown(str(e.get("grade")), str(e.get("scale")), str(e.get("max"))));
                    m.put("pct", pct);
                    m.put("converted", e != null && MarksConversion.converted(str(e.get("grade")), str(e.get("scale"))));
                    m.put("verified", true);
                } else if (mine.get(level) != null && str(mine.get(level).get("grade")) != null) {
                    Map<String, Object> e = mine.get(level);
                    m.put("shown", MarksConversion.shown(str(e.get("grade")), str(e.get("scale")), str(e.get("max"))));
                    m.put("pct", MarksConversion.toPercent(str(e.get("grade")), str(e.get("scale")), str(e.get("max")), rule));
                    m.put("converted", MarksConversion.converted(str(e.get("grade")), str(e.get("scale"))));
                    m.put("verified", false);
                    anyUnverified = true;
                } else continue;
                marks.put(level, m);
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("marks", marks);
            row.put("degree", degree.get(l));
            row.put("qualifyingExam", exam.get(l));
            Object py = rec == null ? null : rec.get("passingYear");
            row.put("passingYearVerified", py != null);
            if (py == null && mine.get("PG") != null) py = intOrNull(str(mine.get("PG").get("endYear")));
            if (py == null && mine.get("UG") != null) py = intOrNull(str(mine.get("UG").get("endYear")));
            row.put("passingYear", py);
            row.put("gapYears", rec == null ? null : rec.get("gapYears"));
            // CGPA out of 10: the verified one, else the student's own degree CGPA (not verified yet).
            Object cgpa = rec == null ? null : rec.get("cgpa");
            row.put("cgpaVerified", cgpa != null);
            Map<String, Object> ug = mine.get("UG");
            if (cgpa == null && ug != null) cgpa = MarksConversion.cgpaOutOf10(str(ug.get("grade")), str(ug.get("scale")), str(ug.get("max")));
            if (cgpa != null) row.put("cgpa", cgpa);
            row.put("marksVerified", !marks.isEmpty() && !anyUnverified);
            // Which mark counts as their 12th-level, exactly as drive eligibility decides (EligibilityService.Academic.twelfthLevel):
            // the Diploma for lateral entry or for a Diploma and no 12th, else the 12th.
            boolean lateral = rec != null && Boolean.TRUE.equals(rec.get("lateral"));
            row.put("twelfthLevel", lateral || (pctIn(marks, "DIPLOMA") && !pctIn(marks, "12TH")) ? "DIPLOMA" : "12TH");
            row.put("lateralEntry", lateral);
            out.put(l, row);
        }
        return out;
    }

    private static boolean pctIn(Map<String, Object> marks, String level) {
        return marks.get(level) instanceof Map<?, ?> m && m.get("pct") != null;
    }

    private static final Map<String, String> PROGRAMS = Map.ofEntries(
            Map.entry("BTECH", "B.Tech"), Map.entry("BE", "B.E."), Map.entry("MTECH", "M.Tech"), Map.entry("ME", "M.E."),
            Map.entry("BSC", "B.Sc"), Map.entry("MSC", "M.Sc"), Map.entry("BCOM", "B.Com"), Map.entry("MCOM", "M.Com"),
            Map.entry("BA", "B.A."), Map.entry("MA", "M.A."), Map.entry("BCA", "BCA"), Map.entry("MCA", "MCA"),
            Map.entry("BBA", "BBA"), Map.entry("MBA", "MBA"), Map.entry("BPHARM", "B.Pharm"), Map.entry("MPHARM", "M.Pharm"));

    /** "B.Tech · CSE" from the stored program code and "Computer Science &amp; Engineering (CSE)". */
    public static String degreeText(String program, String specialization) {
        String p = program == null ? "" : program.trim();
        p = PROGRAMS.getOrDefault(p.toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", ""), p);
        String sp = specialization == null ? "" : specialization.replace("&amp;", "&").trim();
        java.util.regex.Matcher short_ = java.util.regex.Pattern.compile("\\(([A-Z&]{2,8})\\)\\s*$").matcher(sp);
        if (short_.find()) sp = short_.group(1);
        if ("Other".equalsIgnoreCase(sp) || "General".equalsIgnoreCase(sp)) sp = "";
        return String.join(" · ", Arrays.stream(new String[]{p, sp}).filter(x -> !x.isBlank()).toList());
    }

    /** 10TH, 12TH, DIPLOMA, UG or PG, or null for anything else. */
    public static String levelOf(String educationType) {
        String t = educationType == null ? "" : educationType.trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("10")) return "10TH";
        if (t.startsWith("12")) return "12TH";
        if (t.startsWith("DIPLOMA")) return "DIPLOMA";
        if (t.equals("UG")) return "UG";
        if (t.equals("PG")) return "PG";
        return null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Map<String, Object>> parse(Object raw) {
        if (raw == null) return new HashMap<>();
        try { return OM.readValue(raw.toString(), Map.class); } catch (Exception e) { return new HashMap<>(); }
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }

    private static Integer intOrNull(String s) {
        try { return s == null ? null : Integer.valueOf(s.trim()); } catch (NumberFormatException e) { return null; }
    }
}
