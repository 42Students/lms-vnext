package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Profile verification (docs/tpo-ux/PROFILE-VERIFICATION-DESIGN.md): the college verifies a student's Education and Identity.
 *
 * A student completes a section and submits it; a verifier (college admin, super admin, or a TPO admin when the college allows it)
 * verifies it or sends it back with a reason. Verified Education writes the marks into learner_academic_record as VERIFIED, the
 * record eligibility and the Students list already read. After verification the student can still edit their profile; the verified
 * values stay in force until they send the changes as an update and it is verified.
 */
@Service
@RequiredArgsConstructor
public class ProfileVerificationService {

    public static final String EDUCATION = "EDUCATION";
    public static final String IDENTITY = "IDENTITY";
    public static final List<String> SECTIONS = List.of(EDUCATION, IDENTITY);

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoStudentService studentService;
    private final NotificationOutboxService outbox;
    private final TpoTeamService team;
    private final AcademicMarksService academicMarks;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ---------------------------------------------------------------- who may verify

    /** Thrown as 403 by the controller. */
    public static class NotAllowed extends RuntimeException {
        public NotAllowed(String m) { super(m); }
    }

    private static boolean isSuperAdmin(UserPrincipal p) { return p != null && p.getId() != null && p.getId() == 0; }
    private static boolean isCollegeAdmin(UserPrincipal p) { return p != null && "FACULTY".equalsIgnoreCase(p.getUserType()) && "ADMIN".equalsIgnoreCase(p.getFacultyType()); }

    /** A TPO admin (the TPO login, the college admin, or faculty made a placement team admin). */
    private boolean isTpoAdmin(UserPrincipal p) {
        if (p == null || !"FACULTY".equalsIgnoreCase(p.getUserType())) return false;
        if ("TPO".equalsIgnoreCase(p.getFacultyType())) return true;
        try { return TpoTeamService.TPO_ADMIN.equals(team.roleOf(p)); } catch (Exception e) { return false; }
    }

    public boolean tpoCanVerify(Integer collegeId) {
        List<Integer> v = jdbc.queryForList("SELECT tpo_can_verify_profiles FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Integer.class);
        return v.isEmpty() || v.get(0) == null || v.get(0) != 0;
    }

    /**
     * The college this verifier works on: their own (college admin, TPO) or the one asked for (super admin). Refuses anyone else,
     * and a TPO when the college admin switched TPO verification off.
     */
    /** Re-checks drive eligibility after verified marks change; lazy because TpoStudentsReadService uses this service too. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoStudentsReadService studentsRead;

    public Integer verifierCollege(UserPrincipal p, Integer requestedCollegeId) {
        if (isSuperAdmin(p)) {
            if (requestedCollegeId == null && p.getCollegeId() == null) throw new IllegalArgumentException("Choose a college");
            return requestedCollegeId != null ? requestedCollegeId : p.getCollegeId();
        }
        if (p == null || p.getCollegeId() == null) throw new NotAllowed("Not allowed");
        if (isCollegeAdmin(p)) return p.getCollegeId();
        if (isTpoAdmin(p)) {
            if (!tpoCanVerify(p.getCollegeId())) throw new NotAllowed("Your college admin has not allowed the placement cell to verify profiles");
            return p.getCollegeId();
        }
        throw new NotAllowed("Only the college admin or the placement cell can verify profiles");
    }

    /** For the setting itself: the college admin and super admin change it; a TPO admin can read it even while it is off. */
    public Integer verifierCollegeOrAdmin(UserPrincipal p, Integer requestedCollegeId) {
        if (isSuperAdmin(p) || isCollegeAdmin(p)) return verifierCollege(p, requestedCollegeId);
        if (isTpoAdmin(p) && p.getCollegeId() != null) return p.getCollegeId();
        throw new NotAllowed("Not allowed");
    }

    /** True when this person may open students' verification documents at this college (used by the file download check). */
    public boolean canVerifyAt(UserPrincipal p, Integer collegeId) {
        try { return Objects.equals(verifierCollege(p, collegeId), collegeId); } catch (RuntimeException e) { return false; }
    }

    private String verifierType(UserPrincipal p) { return isSuperAdmin(p) ? "SUPER_ADMIN" : isCollegeAdmin(p) ? "ADMIN" : "TPO"; }

    private String verifierName(UserPrincipal p) {
        if (isSuperAdmin(p)) return "42LMS admin";
        List<String> n = jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM faculty WHERE id = :f",
                new MapSqlParameterSource("f", p.getId()), String.class);
        String name = n.isEmpty() ? null : n.get(0);
        return name == null || name.isBlank() ? (isCollegeAdmin(p) ? "College admin" : "Placement cell") : name;
    }

    // ---------------------------------------------------------------- what the profile holds

    private static boolean blank(Object o) { return o == null || String.valueOf(o).trim().isEmpty(); }

    private static String kindOf(Object educationType) {
        String t = educationType == null ? "" : String.valueOf(educationType).trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("10")) return "10TH";
        if (t.startsWith("12")) return "12TH";
        if (t.startsWith("DIPLOMA")) return "DIPLOMA";
        if (t.equals("UG")) return "UG";
        if (t.equals("PG")) return "PG";
        return t;
    }

    /** The education entries and resume, as verified values: what is shown to the verifier and kept once verified. */
    Map<String, Object> educationSnapshot(Integer learnerId) {
        List<Map<String, Object>> entries = new ArrayList<>();
        for (Map<String, Object> q : jdbc.queryForList(
                "SELECT id, education_type AS educationType, program, specialization, institution_name AS institutionName, start_year AS startYear, end_year AS endYear, " +
                "  is_currently_pursuing AS currentlyPursuing, grading_type AS gradingType, grade, max_grade AS maxGrade, certificate_upload AS marksheet " +
                "FROM qualification WHERE learner_id = :l AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY start_year, end_year, id",
                new MapSqlParameterSource("l", learnerId))) {
            Map<String, Object> e = new LinkedHashMap<>();
            for (String k : List.of("id", "educationType", "program", "specialization", "institutionName", "startYear", "endYear", "gradingType", "grade", "maxGrade", "marksheet")) {
                Object v = q.get(k);
                e.put(k, v == null ? null : (v instanceof Number ? v : String.valueOf(v).trim()));
            }
            Object cp = q.get("currentlyPursuing");
            e.put("currentlyPursuing", cp instanceof Boolean b ? b : cp instanceof Number n && n.intValue() != 0);
            entries.add(e);
        }
        List<String> resume = jdbc.queryForList("SELECT resume_url FROM learner WHERE id = :l", new MapSqlParameterSource("l", learnerId), String.class);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("entries", entries);
        out.put("resumeUrl", resume.isEmpty() ? null : resume.get(0));
        return out;
    }

    /** Identity with the numbers masked (the document shows the full number to the verifier). */
    Map<String, Object> identitySnapshot(Integer learnerId) {
        List<String> raw = jdbc.queryForList("SELECT identity FROM learner WHERE id = :l", new MapSqlParameterSource("l", learnerId), String.class);
        Map<?, ?> id = Map.of();
        try { if (!raw.isEmpty() && raw.get(0) != null) id = objectMapper.readValue(raw.get(0), Map.class); } catch (Exception ignored) { /* unreadable identity counts as empty */ }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("aadhaarNumber", maskTail(id.get("aadhaarNumber")));
        out.put("aadhaarDocument", blank(id.get("aadhaarUpload")) ? null : String.valueOf(id.get("aadhaarUpload")));
        out.put("panNumber", maskTail(id.get("panNumber")));
        out.put("panDocument", blank(id.get("panUpload")) ? null : String.valueOf(id.get("panUpload")));
        return out;
    }

    private static String maskTail(Object value) {
        if (blank(value)) return null;
        String s = String.valueOf(value).replaceAll("\\s", "");
        return s.length() <= 4 ? "*".repeat(s.length()) : "*".repeat(s.length() - 4) + s.substring(s.length() - 4);
    }

    Map<String, Object> snapshot(Integer learnerId, String section) {
        return EDUCATION.equals(section) ? educationSnapshot(learnerId) : identitySnapshot(learnerId);
    }

    /** What is still missing before a section can be sent ("Add the marksheet for your 12th"). Empty means complete. */
    @SuppressWarnings("unchecked")
    static List<String> missing(String section, Map<String, Object> snap) {
        List<String> out = new ArrayList<>();
        if (IDENTITY.equals(section)) {
            boolean aadhaar = !blank(snap.get("aadhaarNumber")) && !blank(snap.get("aadhaarDocument"));
            boolean pan = !blank(snap.get("panNumber")) && !blank(snap.get("panDocument"));
            if (!aadhaar && !pan) {
                if (!blank(snap.get("aadhaarNumber")) && blank(snap.get("aadhaarDocument"))) out.add("Upload your Aadhaar document");
                else if (!blank(snap.get("panNumber")) && blank(snap.get("panDocument"))) out.add("Upload your PAN document");
                else out.add("Add your Aadhaar or PAN number with its document");
            }
            return out;
        }
        List<Map<String, Object>> entries = (List<Map<String, Object>>) snap.getOrDefault("entries", List.of());
        checkEntry(out, entries, List.of("10TH"), "your 10th");
        checkEntry(out, entries, List.of("12TH", "DIPLOMA"), "your 12th or Diploma");
        checkEntry(out, entries, List.of("UG", "PG"), "your current degree");
        if (blank(snap.get("resumeUrl"))) out.add("Add a resume to your profile");
        return out;
    }

    private static void checkEntry(List<String> out, List<Map<String, Object>> entries, List<String> kinds, String label) {
        Optional<Map<String, Object>> e = entries.stream().filter(x -> kinds.contains(kindOf(x.get("educationType"))))
                .max(Comparator.comparing(x -> String.valueOf(x.get("endYear") == null ? "" : x.get("endYear"))));
        if (e.isEmpty()) { out.add("Add " + label); return; }
        if (blank(e.get().get("grade"))) out.add("Add the marks for " + label);
        if (blank(e.get().get("marksheet"))) out.add("Upload the marksheet for " + label);
    }

    // ---------------------------------------------------------------- state

    /**
     * BE-0045: submit, verify and send back for one student take turns on the student's row, and read the verification
     * row with FOR UPDATE (the latest committed state, not an older snapshot). So two verifiers can't both decide, and a
     * resubmission can't slip between a verifier's check and their write.
     */
    private void lockLearner(Integer learnerId) {
        jdbc.queryForList("SELECT id FROM learner WHERE id = :l FOR UPDATE", new MapSqlParameterSource("l", learnerId));
    }

    /** The verification row as committed now (a current read, under the student lock): see lockLearner. */
    private Map<String, Object> rowLocked(Integer learnerId, String section) {
        List<Map<String, Object>> r = jdbc.queryForList("SELECT * FROM profile_verification WHERE learner_id = :l AND section = :s FOR UPDATE",
                new MapSqlParameterSource("l", learnerId).addValue("s", section));
        return r.isEmpty() ? null : r.get(0);
    }

    private Map<String, Object> row(Integer learnerId, String section) {
        List<Map<String, Object>> r = jdbc.queryForList("SELECT * FROM profile_verification WHERE learner_id = :l AND section = :s",
                new MapSqlParameterSource("l", learnerId).addValue("s", section));
        return r.isEmpty() ? null : r.get(0);
    }

    private Object json(Object raw) {
        if (raw == null) return null;
        try { return objectMapper.readValue(String.valueOf(raw), Object.class); } catch (Exception e) { return null; }
    }

    private String toJson(Object o) {
        try { return objectMapper.writeValueAsString(o); } catch (Exception e) { throw new IllegalStateException("Could not save the snapshot"); }
    }

    /** Same values, ignoring key order and number/string formatting. */
    private boolean same(Object a, Object b) {
        if (a == null || b == null) return a == b;
        try { return objectMapper.readTree(toJson(a)).equals(objectMapper.readTree(toJson(b))); } catch (Exception e) { return false; }
    }

    /** One section as the student and the verifier see it. */
    public Map<String, Object> sectionState(Integer learnerId, String section) {
        Map<String, Object> snap = snapshot(learnerId, section);
        List<String> missing = missing(section, snap);
        Map<String, Object> r = row(learnerId, section);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("section", section);
        String status = r == null ? null : String.valueOf(r.get("status"));
        out.put("state", status != null ? status : missing.isEmpty() ? "READY" : "INCOMPLETE");
        out.put("missing", missing);
        out.put("current", snap);
        if (r != null) {
            out.put("note", r.get("note"));
            out.put("submittedAt", r.get("submitted_at"));
            out.put("verifiedAt", r.get("verified_at"));
            out.put("verifiedByName", r.get("verified_by_name"));
            out.put("decidedAt", r.get("decided_at"));
            out.put("decidedByName", r.get("decided_by_name"));
            Object verified = json(r.get("verified_snapshot"));
            out.put("verified", verified);
            out.put("submitted", json(r.get("submitted_snapshot")));
            out.put("changedSinceVerification", verified != null && !same(verified, snap));
        } else {
            out.put("changedSinceVerification", false);
        }
        return out;
    }

    /** The student's own view: both sections, and whether the profile as a whole is verified. */
    public Map<String, Object> mine(Integer learnerId) {
        List<Map<String, Object>> sections = new ArrayList<>();
        for (String s : SECTIONS) sections.add(sectionState(learnerId, s));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sections", sections);
        out.put("verified", sections.stream().allMatch(s -> List.of("VERIFIED", "UPDATE_PENDING").contains(s.get("state"))));
        return out;
    }

    private void event(Integer learnerId, String section, String action, String actorType, Integer actorId, String actorName, String note, Object snapshot) {
        jdbc.update("INSERT INTO profile_verification_event (learner_id, section, action, actor_type, actor_id, actor_name, note, snapshot) VALUES (:l, :s, :a, :t, :i, :n, :note, :snap)",
                new MapSqlParameterSource("l", learnerId).addValue("s", section).addValue("a", action).addValue("t", actorType).addValue("i", actorId)
                        .addValue("n", actorName).addValue("note", note).addValue("snap", snapshot == null ? null : toJson(snapshot)));
    }

    private static String requireSection(String section) {
        String s = section == null ? "" : section.trim().toUpperCase(Locale.ROOT);
        if (!SECTIONS.contains(s)) throw new IllegalArgumentException("Unknown section");
        return s;
    }

    // ---------------------------------------------------------------- student

    /** Send a complete section for verification, or (once verified) send the changes as an update. */
    @Transactional
    public Map<String, Object> submit(Integer learnerId, String sectionIn) {
        String section = requireSection(sectionIn);
        lockLearner(learnerId);
        Map<String, Object> snap = snapshot(learnerId, section);
        List<String> missing = missing(section, snap);
        if (!missing.isEmpty()) throw new IllegalStateException("Before sending: " + String.join("; ", missing));
        Map<String, Object> r = rowLocked(learnerId, section);
        String status = r == null ? null : String.valueOf(r.get("status"));
        String next;
        if ("VERIFIED".equals(status) || "UPDATE_PENDING".equals(status)) {
            if (same(json(r.get("verified_snapshot")), snap)) throw new IllegalStateException("Nothing has changed since it was verified");
            next = "UPDATE_PENDING";
        } else {
            next = "SUBMITTED";
        }
        MapSqlParameterSource p = new MapSqlParameterSource("l", learnerId).addValue("s", section).addValue("st", next).addValue("snap", toJson(snap));
        if (r == null) {
            jdbc.update("INSERT INTO profile_verification (learner_id, section, status, submitted_snapshot, submitted_at) VALUES (:l, :s, :st, :snap, NOW())", p);
        } else {
            jdbc.update("UPDATE profile_verification SET status = :st, submitted_snapshot = :snap, submitted_at = NOW(), note = NULL WHERE learner_id = :l AND section = :s", p);
        }
        event(learnerId, section, "UPDATE_PENDING".equals(next) ? "UPDATE_SUBMITTED" : "SUBMITTED", "LEARNER", learnerId, null, null, snap);
        return sectionState(learnerId, section);
    }

    // ---------------------------------------------------------------- verifier

    /** Learner must belong to the college the verifier works on. */
    private void requireLearnerAt(Integer learnerId, Integer collegeId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM learner WHERE id = :l AND college_id = :c", new MapSqlParameterSource("l", learnerId).addValue("c", collegeId), Long.class);
        if (n == null || n == 0) throw new IllegalArgumentException("Not found");
    }

    /** Waiting decisions (Submitted, Update pending) or, with status, any state. Newest ask last so the oldest is handled first. */
    public List<Map<String, Object>> queue(Integer collegeId, String status, String section) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("st", status).addValue("s", section);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT v.learner_id AS learnerId, v.section, v.status, v.submitted_snapshot AS snap, v.submitted_at AS submittedAt, v.decided_at AS decidedAt, v.decided_by_name AS decidedByName, v.note, " +
                "  v.verified_at AS verifiedAt, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, l.department AS branch, " +
                "  bt.batch_name AS batchName, " + // for the queue's Batch filter
                // Education: how many entries the student has and how many still have no marksheet (the usual reason to send back).
                "  CASE WHEN v.section = 'EDUCATION' THEN (SELECT COUNT(*) FROM qualification q WHERE q.learner_id = l.id AND (q.is_deleted = 0 OR q.is_deleted IS NULL)) END AS entries, " +
                "  CASE WHEN v.section = 'EDUCATION' THEN (SELECT COUNT(*) FROM qualification q WHERE q.learner_id = l.id AND (q.is_deleted = 0 OR q.is_deleted IS NULL) " +
                "    AND (q.certificate_upload IS NULL OR TRIM(q.certificate_upload) = '')) END AS missingMarksheets " +
                "FROM profile_verification v JOIN learner l ON l.id = v.learner_id LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id " +
                "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
                "  AND (:st IS NULL AND v.status IN ('SUBMITTED','UPDATE_PENDING') OR v.status = :st) AND (:s IS NULL OR v.section = :s) " +
                "ORDER BY v.submitted_at, v.learner_id LIMIT 1000", p);
        // What stops verifying without opening (a marksheet or ID document missing in what was sent), worked out like the server's
        // own check; the snapshot itself never leaves the server here.
        for (Map<String, Object> row : rows) {
            Object snap = row.remove("snap");
            boolean waiting = List.of("SUBMITTED", "UPDATE_PENDING").contains(String.valueOf(row.get("status")));
            row.put("blindProblem", waiting ? blindVerifyProblem(String.valueOf(row.get("section")), json(snap)) : null);
        }
        return rows;
    }

    /** Counts per state at the college, for the page summary. */
    public Map<String, Object> counts(Integer collegeId) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (String s : List.of("SUBMITTED", "UPDATE_PENDING", "SENT_BACK", "VERIFIED")) out.put(s, 0L);
        jdbc.query("SELECT v.status AS s, COUNT(DISTINCT v.learner_id, v.section) AS n FROM profile_verification v JOIN learner l ON l.id = v.learner_id WHERE l.college_id = :c GROUP BY v.status",
                new MapSqlParameterSource("c", collegeId), rs -> { out.put(rs.getString("s"), rs.getLong("n")); });
        return out;
    }

    /** One student for the verifier: both sections with the submitted values, the verified ones, and the history. */
    public Map<String, Object> student(Integer collegeId, Integer learnerId) {
        requireLearnerAt(learnerId, collegeId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("student", jdbc.queryForMap("SELECT id AS learnerId, first_name AS firstName, last_name AS lastName, roll_number AS rollNumber, department AS branch FROM learner WHERE id = :l",
                new MapSqlParameterSource("l", learnerId)));
        out.putAll(mine(learnerId));
        out.put("history", jdbc.queryForList("SELECT section, action, actor_type AS actorType, actor_name AS actorName, note, created_at AS createdAt FROM profile_verification_event " +
                "WHERE learner_id = :l ORDER BY id DESC LIMIT 50", new MapSqlParameterSource("l", learnerId)));
        return out;
    }

    @Transactional
    public Map<String, Object> verify(UserPrincipal by, Integer collegeId, Integer learnerId, String sectionIn) {
        return verify(by, collegeId, learnerId, sectionIn, null);
    }

    /**
     * seenSubmittedAt: when the submission the verifier was looking at was sent. If the student sent a newer one since, nothing
     * is verified: verifying used to stamp whatever was latest, values the verifier never saw. Null (verify without opening)
     * keeps the old behaviour.
     */
    @Transactional
    public Map<String, Object> verify(UserPrincipal by, Integer collegeId, Integer learnerId, String sectionIn, String seenSubmittedAt) {
        String section = requireSection(sectionIn);
        requireLearnerAt(learnerId, collegeId);
        lockLearner(learnerId);
        Map<String, Object> r = rowLocked(learnerId, section);
        if (r == null || !List.of("SUBMITTED", "UPDATE_PENDING").contains(String.valueOf(r.get("status")))) throw new IllegalStateException("There is nothing waiting to verify");
        if (seenSubmittedAt != null && !seenSubmittedAt.isBlank() && r.get("submitted_at") != null) {
            java.time.LocalDateTime seen;
            try { seen = java.time.LocalDateTime.parse(seenSubmittedAt.trim().replace(' ', 'T').replaceAll("Z$", "")); } catch (Exception e) { seen = null; }
            if (seen != null && !seen.withNano(0).equals(TpoTime.ldt(r.get("submitted_at")).withNano(0))) {
                throw new IllegalStateException("The student changed this after you opened it. Open it again to see what they sent.");
            }
        }
        Object submitted = json(r.get("submitted_snapshot"));
        String name = verifierName(by);
        jdbc.update("UPDATE profile_verification SET status = 'VERIFIED', verified_snapshot = submitted_snapshot, verified_at = NOW(), verified_by_name = :n, " +
                        "decided_at = NOW(), decided_by_type = :t, decided_by_id = :i, decided_by_name = :n, note = NULL WHERE learner_id = :l AND section = :s",
                new MapSqlParameterSource("l", learnerId).addValue("s", section).addValue("n", name).addValue("t", verifierType(by)).addValue("i", by.getId()));
        if (EDUCATION.equals(section) && submitted instanceof Map<?, ?> m) {
            writeAcademicRecord(learnerId, m);
            // Verified marks can change who meets a drive's rules; only an academic import re-checked open applications before.
            if (studentsRead != null) studentsRead.recalculateEligibility(collegeId, List.of(learnerId), by == null ? null : by.getId());
        }
        event(learnerId, section, "VERIFIED", verifierType(by), by.getId(), name, null, submitted);
        outbox.enqueue("PROFILE_VERIFIED", "LEARNER", learnerId, "APP", Map.of("section", EDUCATION.equals(section) ? "Education" : "Identity", "by", name), null, false);
        return sectionState(learnerId, section);
    }

    @Transactional
    public Map<String, Object> sendBack(UserPrincipal by, Integer collegeId, Integer learnerId, String sectionIn, String reason) {
        String section = requireSection(sectionIn);
        requireLearnerAt(learnerId, collegeId);
        if (reason == null || reason.trim().length() < 3) throw new IllegalArgumentException("Say what needs to change");
        lockLearner(learnerId);
        Map<String, Object> r = rowLocked(learnerId, section);
        if (r == null || !List.of("SUBMITTED", "UPDATE_PENDING").contains(String.valueOf(r.get("status")))) throw new IllegalStateException("There is nothing waiting to send back");
        String name = verifierName(by);
        // An update sent back leaves the profile verified with the old values; a first submission goes back to the student.
        String next = "UPDATE_PENDING".equals(String.valueOf(r.get("status"))) ? "VERIFIED" : "SENT_BACK";
        jdbc.update("UPDATE profile_verification SET status = :st, decided_at = NOW(), decided_by_type = :t, decided_by_id = :i, decided_by_name = :n, note = :note " +
                        "WHERE learner_id = :l AND section = :s",
                new MapSqlParameterSource("l", learnerId).addValue("s", section).addValue("st", next).addValue("t", verifierType(by)).addValue("i", by.getId())
                        .addValue("n", name).addValue("note", reason.trim()));
        event(learnerId, section, "SENT_BACK", verifierType(by), by.getId(), name, reason.trim(), null);
        outbox.enqueue("PROFILE_SENT_BACK", "LEARNER", learnerId, "APP", Map.of("section", EDUCATION.equals(section) ? "Education" : "Identity", "reason", reason.trim()), null, false);
        return sectionState(learnerId, section);
    }

    /**
     * Verifying without opening (Verify selected here, Verify their profile on the Students page) never covers a section with a
     * document missing: every education entry needs its marksheet, and every ID number given needs its document. Opening the
     * student and verifying stays possible; this only stops the blind path.
     */
    @SuppressWarnings("unchecked")
    public void requireDocumentsForBlindVerify(Integer collegeId, Integer learnerId, String sectionIn) {
        String section = requireSection(sectionIn);
        requireLearnerAt(learnerId, collegeId);
        Map<String, Object> r = row(learnerId, section);
        if (r == null) return; // nothing waiting: verify() says so
        String problem = blindVerifyProblem(section, json(r.get("submitted_snapshot")));
        if (problem != null) throw new IllegalArgumentException(problem);
    }

    /** Why a submitted section cannot be verified without opening it (a document missing), or null. The queue shows the same. */
    static String blindVerifyProblem(String section, Object snap) {
        if (!(snap instanceof Map<?, ?> m)) return null;
        if (EDUCATION.equals(section)) {
            Object entries = m.get("entries");
            long missing = entries instanceof List<?> l ? l.stream().filter(e -> e instanceof Map<?, ?> x && blank(x.get("marksheet"))).count() : 0;
            return missing > 0 ? (missing == 1 ? "A marksheet is" : missing + " marksheets are") + " missing: open it and send it back" : null;
        }
        if (!blank(m.get("aadhaarNumber")) && blank(m.get("aadhaarDocument"))) return "The Aadhaar document is missing: open it and send it back";
        if (!blank(m.get("panNumber")) && blank(m.get("panDocument"))) return "The PAN document is missing: open it and send it back";
        if (blank(m.get("aadhaarDocument")) && blank(m.get("panDocument"))) return "No ID document: open it and send it back";
        return null;
    }

    /** Verify several at once without opening; each is checked on its own, and the ones that cannot be verified are reported. */
    public Map<String, Object> verifyMany(UserPrincipal by, Integer collegeId, List<Map<String, Object>> items) {
        int done = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        for (Map<String, Object> it : items == null ? List.<Map<String, Object>>of() : items) {
            try {
                requireDocumentsForBlindVerify(collegeId, ((Number) it.get("learnerId")).intValue(), String.valueOf(it.get("section")));
                verify(by, collegeId, ((Number) it.get("learnerId")).intValue(), String.valueOf(it.get("section")));
                done++;
            } catch (RuntimeException e) {
                Map<String, Object> f = new LinkedHashMap<>(it);
                f.put("reason", e.getMessage());
                failed.add(f);
            }
        }
        return Map.of("verified", done, "failed", failed);
    }

    /**
     * Verified education into the academic record: each level's comparable percentage (a CGPA converted with the college's rule,
     * a percentage as it is, a letter grade none), the degree CGPA when it is out of 10, the degree's end year as the passing
     * year, and every mark as earned (marks_json), so the rule can change later and nothing is lost. A CGPA 10th used to be dropped.
     */
    @SuppressWarnings("unchecked")
    void writeAcademicRecord(Integer learnerId, Map<?, ?> snap) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) snap.get("entries");
        if (entries == null) return;
        String rule = academicMarks.ruleOfLearner(learnerId);
        LearnerAcademicRecord in = new LearnerAcademicRecord();
        Map<String, Map<String, Object>> earned = new LinkedHashMap<>();
        Integer[] pgYear = {null};
        for (Map<String, Object> e : entries) {
            String level = AcademicMarksService.levelOf(e.get("educationType") == null ? null : String.valueOf(e.get("educationType")));
            String grade = e.get("grade") == null ? null : String.valueOf(e.get("grade")).trim();
            if (level == null || grade == null || grade.isEmpty()) continue;
            String grading = e.get("gradingType") == null ? null : String.valueOf(e.get("gradingType"));
            String max = e.get("maxGrade") == null ? null : String.valueOf(e.get("maxGrade"));
            BigDecimal pct = com._42students.lms.common.MarksConversion.toPercent(grade, grading, max, rule);
            Map<String, Object> mark = new LinkedHashMap<>();
            mark.put("grade", grade); mark.put("scale", grading); mark.put("max", max);
            earned.put(level, mark);
            switch (level) {
                case "10TH" -> in.setTenthPct(pct);
                case "12TH" -> in.setTwelfthPct(pct);
                case "DIPLOMA" -> in.setDiplomaPct(pct);
                case "UG" -> {
                    String scale = com._42students.lms.common.MarksConversion.scale(grading);
                    BigDecimal g = num(grade);
                    BigDecimal m = num(max);
                    if (g != null && ("CGPA".equals(scale) || "GPA".equals(scale)) && (m == null || m.compareTo(BigDecimal.TEN) == 0)) in.setCgpa(g);
                    in.setUgPct(pct);
                    Integer year = intv(e.get("endYear"));
                    if (year != null) in.setPassingYear(year);
                }
                case "PG" -> { // no column for the PG %: it is kept as earned and worked out when shown; its year is the passing year
                    Integer year = intv(e.get("endYear"));
                    if (year != null && (pgYear[0] == null || year > pgYear[0])) pgYear[0] = year;
                }
                default -> { }
            }
        }
        if (pgYear[0] != null) in.setPassingYear(pgYear[0]);
        studentService.upsertVerified(learnerId, in, "profile-verification");
        academicMarks.storeMarks(learnerId, earned);
    }

    private static BigDecimal num(Object o) {
        if (blank(o)) return null;
        try { return new BigDecimal(String.valueOf(o).trim().replace("%", "")); } catch (NumberFormatException e) { return null; }
    }

    private static Integer intv(Object o) {
        if (blank(o)) return null;
        try { return Integer.parseInt(String.valueOf(o).trim().substring(0, Math.min(4, String.valueOf(o).trim().length()))); } catch (NumberFormatException e) { return null; }
    }

    // ---------------------------------------------------------------- setting

    public Map<String, Object> settings(Integer collegeId) {
        return Map.of("tpoCanVerify", tpoCanVerify(collegeId));
    }

    /** Only the college admin (or super admin) decides whether the placement cell may verify. */
    @Transactional
    public Map<String, Object> saveSettings(UserPrincipal by, Integer collegeId, boolean tpoCanVerify) {
        if (!isSuperAdmin(by) && !isCollegeAdmin(by)) throw new NotAllowed("Only the college admin can change who verifies profiles");
        jdbc.update("INSERT INTO tpo_college_settings (college_id, tpo_can_verify_profiles) VALUES (:c, :v) ON DUPLICATE KEY UPDATE tpo_can_verify_profiles = VALUES(tpo_can_verify_profiles)",
                new MapSqlParameterSource("c", collegeId).addValue("v", tpoCanVerify ? 1 : 0));
        return settings(collegeId);
    }

    // ---------------------------------------------------------------- the Students list

    /** learnerId -> VERIFIED | PENDING | SENT_BACK | INCOMPLETE, worked out from both sections, for the whole college in one query. */
    public Map<Integer, String> profileStatuses(Integer collegeId) {
        Map<Integer, Map<String, String>> by = new HashMap<>();
        jdbc.query("SELECT v.learner_id AS l, v.section AS s, v.status AS st FROM profile_verification v JOIN learner x ON x.id = v.learner_id WHERE x.college_id = :c",
                new MapSqlParameterSource("c", collegeId), rs -> { by.computeIfAbsent(rs.getInt("l"), k -> new HashMap<>()).put(rs.getString("s"), rs.getString("st")); });
        Map<Integer, String> out = new HashMap<>();
        by.forEach((l, m) -> out.put(l, overall(m)));
        return out;
    }

    static String overall(Map<String, String> bySection) {
        Collection<String> st = bySection.values();
        if (bySection.size() == SECTIONS.size() && st.stream().allMatch(s -> "VERIFIED".equals(s) || "UPDATE_PENDING".equals(s))) return "VERIFIED";
        if (st.contains("SENT_BACK")) return "SENT_BACK";
        if (st.contains("SUBMITTED") || st.contains("UPDATE_PENDING")) return "PENDING";
        return "INCOMPLETE";
    }
}
