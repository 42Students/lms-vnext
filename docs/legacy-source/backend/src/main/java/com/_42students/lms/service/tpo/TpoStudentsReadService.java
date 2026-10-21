package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.LearnerAcademicRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Students page (TPO V1 - Locked.docx §6): the table with saved views, readiness, the student panel, notes,
 * registration on a student's behalf, bulk actions and the per-semester academic import. Every learner id that
 * arrives from a client must already have been checked against the caller's college (see requireAll).
 */
@Service
@RequiredArgsConstructor
public class TpoStudentsReadService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoStudentService studentService;
    private final TpoSeasonService seasonService;
    private final NotificationOutboxService outbox;
    private final TpoAuditService audit;
    private final EligibilityService eligibilityService;
    private final com._42students.lms.repository.JobRepository jobRepository;
    private final ProfileVerificationService profileVerification;
    private final PlacementEligibilityService placementEligibility;
    private final PlacementOutcomeService outcomes;
    private final AcademicMarksService academicMarks;

    /** Throws "Not found" unless every id is a live learner of this college. */
    public void requireAll(Integer collegeId, Collection<Integer> learnerIds) {
        if (learnerIds == null || learnerIds.isEmpty()) throw new IllegalArgumentException("Choose at least one student");
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM learner WHERE college_id = :c AND id IN (:ids)",
                new MapSqlParameterSource("c", collegeId).addValue("ids", new HashSet<>(learnerIds)), Long.class);
        if (n == null || n != new HashSet<>(learnerIds).size()) throw new IllegalArgumentException("Not found");
    }

    // ---------------------------------------------------------------- table
    /**
     * One row per student. {@code department} (optional) limits the list to one department.
     * status: DEBARRED > PLACED > HIGHER_STUDIES / ENTREPRENEURSHIP / COMPETITIVE_EXAMS / NOT_INTERESTED > REGISTERED > NOT_REGISTERED.
     * outcome: the final placement outcome (PlacementOutcomeService), with the college's label and the detail.
     */
    public Map<String, Object> table(Integer collegeId, String department, String placedStatuses) {
        return table(collegeId, department, placedStatuses, true);
    }

    /** eligibleOnly: the Students page lists only students in placements; false lists everyone (pickers). */
    public Map<String, Object> table(Integer collegeId, String department, String placedStatuses, boolean eligibleOnly) {
        return table(collegeId, department, placedStatuses, eligibleOnly, null);
    }

    /** onlyLearnerId: one student's row exactly as the Students page builds it (the student panel shows the same facts). */
    private Map<String, Object> table(Integer collegeId, String department, String placedStatuses, boolean eligibleOnly, Integer onlyLearnerId) {
        String deptSql = (department == null ? "" : " AND l.department = :dept") + (onlyLearnerId == null ? "" : " AND l.id = :only");
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("dept", department).addValue("only", onlyLearnerId);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, " +
                "  l.department AS branch, l.contact_mail AS email, l.contact_mobile AS phone, (l.resume_url IS NOT NULL AND l.resume_url <> '') AS hasResume, " +
                "  r.cgpa AS cgpa, r.source AS academicSource, r.batch AS batch, " +
                "  (r.cgpa IS NOT NULL AND r.tenth_pct IS NOT NULL AND (r.twelfth_pct IS NOT NULL OR r.diploma_pct IS NOT NULL)) AS profileComplete, " +
                "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") AS registration, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.learner_id = l.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applications, " +
                "  (SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id " +
                "     AND o.status IN ('RELEASED','ACCEPTED')) AS offers, " +
                "  (SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id " +
                "     AND o.status IN " + placedStatuses + ") AS placedOffers, " +
                "  (SELECT COUNT(*) FROM placement_debarment d WHERE d.learner_id = l.id AND d.lifted_at IS NULL " +
                "     AND (d.until_date IS NULL OR d.until_date >= CURDATE()) AND (d.until_date IS NOT NULL OR d.until_drives IS NULL OR d.drives_counted < d.until_drives)) AS activeDebarments, " +
                "  l.gender AS gender, l.dob AS dob, " +
                "  (l.github IS NOT NULL AND TRIM(l.github) <> '') AS hasGithub, (l.linkedin IS NOT NULL AND TRIM(l.linkedin) <> '') AS hasLinkedin, " +
                "  (l.portfolio IS NOT NULL AND TRIM(l.portfolio) <> '') AS hasPortfolio, " +
                "  COALESCE(JSON_LENGTH(l.skills), 0) AS skillsCount, COALESCE(JSON_LENGTH(l.certifications), 0) AS certificationsCount, " +
                "  COALESCE(JSON_LENGTH(l.projects), 0) AS projectsCount, COALESCE(JSON_LENGTH(l.experiences), 0) AS experienceCount, " +
                "  JSON_EXTRACT(l.skills, '$[*].skill') AS skillNames, l.coding_profiles AS codingProfilesRaw, " +
                "  l.class_id AS classId, cl.name AS className, cl.batch_id AS batchId, bt.batch_name AS batchName, bt.end_date AS batchEndDate, " +
                "  bt.program_id AS programId, np.name AS programName, " +
                "  (SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status = 'RELEASED') AS offersWaiting, " +
                "  pb.invited_at AS batchInvitedAt " +
                "FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id LEFT JOIN placement_batch pb ON pb.batch_id = cl.batch_id " +
                "LEFT JOIN new_program np ON np.id = bt.program_id " +
                "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL)" + deptSql +
                " ORDER BY l.first_name, l.last_name", p);

        // Profile verification (Education + Identity) for the Profile column and the Verified filter: one query for the college.
        Map<Integer, String> profileStatus = profileVerification.profileStatuses(collegeId);
        // Sections each student submitted and the college has not decided yet (what Verify / Send back act on).
        Map<Integer, List<String>> waiting = new HashMap<>();
        jdbc.query("SELECT v.learner_id AS l, v.section AS s FROM profile_verification v JOIN learner x ON x.id = v.learner_id " +
                "WHERE x.college_id = :c AND v.status IN ('SUBMITTED','UPDATE_PENDING')", new MapSqlParameterSource("c", collegeId),
                rs -> { waiting.computeIfAbsent(rs.getInt("l"), k -> new ArrayList<>()).add(rs.getString("s")); });
        // Who is in placements (batch, class or own decision) and which batches have finished.
        Map<Integer, PlacementEligibilityService.Resolved> eligibility = placementEligibility.resolveCollege(collegeId);
        Set<Long> finishedBatches = placementEligibility.finishedBatchIds(collegeId);
        Map<Integer, PlacementOutcomeService.Outcome> outcomeOf = outcomes.forCollege(collegeId, placedStatuses);
        Map<Integer, Map<String, Object>> marksOf = academicMarks.marksFor(collegeId);
        Map<Integer, Double> prepAvg = prepAverages(collegeId);
        int threshold = prepThreshold(collegeId);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String k : List.of("ALL", "NOT_REGISTERED", "REGISTERED", "NOT_READY", "UNPLACED", "PLACED", "HIGHER_STUDIES", "DEBARRED")) counts.put(k, 0);
        // The Students page is the working set: only students the placement cell made Eligible (batch, class or their own).
        if (eligibleOnly) rows.removeIf(row -> !PlacementEligibilityService.ELIGIBLE.equals(
                eligibility.getOrDefault(((Number) row.get("learnerId")).intValue(), new PlacementEligibilityService.Resolved()).status));
        for (Map<String, Object> row : rows) {
            String reg = (String) row.get("registration");
            boolean debarred = num(row.get("activeDebarments")) > 0;
            boolean placed = num(row.get("placedOffers")) > 0;
            String status = debarred ? "DEBARRED" : placed ? "PLACED" : reg != null && PlacementOutcomeService.CHOICE_OUTCOMES.contains(reg) ? reg
                    : "PLACEMENTS".equals(reg) ? "REGISTERED" : "NOT_REGISTERED";
            row.put("status", status);

            List<String> missing = new ArrayList<>();
            if (!bool(row.get("hasResume"))) missing.add("No resume");
            // Academics as the page shows them (marks: verified first, else the student's own Education): 10th, the 12th or a
            // Diploma, and UG. It read the old cgpa/tenth/twelfth columns, so a student whose marks showed on the page could still
            // be "Academics incomplete" (and the other way round).
            Map<String, Object> mk = marksOf.getOrDefault(((Number) row.get("learnerId")).intValue(), Map.of());
            boolean academicsComplete = mk.get("marks") instanceof Map<?, ?> m && m.get("10TH") != null && m.get("UG") != null
                    && (m.get("12TH") != null || m.get("DIPLOMA") != null);
            row.put("profileComplete", academicsComplete);
            if (!academicsComplete) missing.add("Academics incomplete");
            if (prepAvg != null) {
                Double avg = prepAvg.get(((Number) row.get("learnerId")).intValue());
                row.put("prepAverage", avg == null ? null : Math.round(avg));
                if (avg == null) missing.add("No prep tests yet");
                else if (avg < threshold) missing.add("Prep tests " + Math.round(avg) + "%");
            }
            row.put("readiness", missing.isEmpty() ? "READY" : missing.size() == 1 ? "NEEDS_WORK" : "NOT_READY");
            PlacementOutcomeService.Outcome oc = outcomeOf.get(((Number) row.get("learnerId")).intValue());
            if (oc != null) row.putAll(oc.toMap());
            // Marks as earned with a comparable % (verified first, else the student's own Education, flagged).
            row.putAll(marksOf.getOrDefault(((Number) row.get("learnerId")).intValue(), Map.of("marks", Map.of())));
            row.put("readinessNote", missing.isEmpty() ? "Ready" : String.join(" · ", missing));
            row.remove("placedOffers"); row.remove("activeDebarments");
            row.put("skills", skillNames(row.remove("skillNames")));
            row.put("codingPlatforms", new ArrayList<>(codingProfiles(row.remove("codingProfilesRaw")).keySet()));
            row.put("profileStatus", profileStatus.getOrDefault(((Number) row.get("learnerId")).intValue(), "INCOMPLETE"));
            row.put("waitingSections", waiting.getOrDefault(((Number) row.get("learnerId")).intValue(), List.of()));
            row.put("offersWaiting", num(row.get("offersWaiting")));
            row.put("debarred", debarred);
            PlacementEligibilityService.Resolved pe = eligibility.getOrDefault(((Number) row.get("learnerId")).intValue(), new PlacementEligibilityService.Resolved());
            row.putAll(pe.toMap());
            row.put("batchFinished", row.get("batchId") != null && finishedBatches.contains(((Number) row.get("batchId")).longValue()));
            // Where the student is on the journey: Eligible -> Invited -> Registered -> Verified -> Placed.
            boolean registered = "PLACEMENTS".equals(reg) || placed;
            row.put("stage", placed ? "PLACED" : registered && "VERIFIED".equals(row.get("profileStatus")) ? "VERIFIED"
                    : registered ? "REGISTERED" : row.get("batchInvitedAt") != null ? "INVITED" : "ELIGIBLE");
            for (String k : List.of("hasGithub", "hasLinkedin", "hasPortfolio")) row.put(k, bool(row.get(k)));
            for (String k : List.of("skillsCount", "certificationsCount", "projectsCount", "experienceCount")) row.put(k, num(row.get(k)));

            if (Boolean.TRUE.equals(row.get("batchFinished"))) continue; // finished batches stay out of the counts
            bump(counts, "ALL");
            if ("NOT_REGISTERED".equals(status)) bump(counts, "NOT_REGISTERED");
            if ("REGISTERED".equals(status) || "PLACED".equals(status)) bump(counts, "REGISTERED");
            if ("REGISTERED".equals(status) && !"READY".equals(row.get("readiness"))) bump(counts, "NOT_READY");
            if ("REGISTERED".equals(status)) bump(counts, "UNPLACED");
            if ("PLACED".equals(status)) bump(counts, "PLACED");
            if ("HIGHER_STUDIES".equals(status)) bump(counts, "HIGHER_STUDIES");
            if ("DEBARRED".equals(status)) bump(counts, "DEBARRED");
        }
        attachJourneys(collegeId, rows);
        return Map.of("students", rows, "counts", counts);
    }

    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();

    /** {"LEETCODE": "asha_k"} from learner.coding_profiles, only known platforms with a username, in platform order. A bad value gives none. */
    static Map<String, String> codingProfiles(Object raw) {
        Map<String, String> out = new LinkedHashMap<>();
        if (raw == null) return out;
        try {
            Map<?, ?> m = JSON.readValue(raw.toString(), Map.class);
            for (com._42students.lms.common.CodingPlatforms.Platform p : com._42students.lms.common.CodingPlatforms.ALL) {
                Object u = m.get(p.key());
                if (u != null && !u.toString().isBlank()) out.put(p.key(), u.toString().trim());
            }
        } catch (Exception e) { return out; }
        return out;
    }

    /** ["Java", "SQL"] from JSON_EXTRACT(skills, '$[*].skill'); blanks dropped, trimmed, de-duplicated. A bad value gives no skills. */
    static List<String> skillNames(Object raw) {
        if (raw == null) return List.of();
        try {
            List<?> list = JSON.readValue(String.valueOf(raw), List.class);
            LinkedHashSet<String> out = new LinkedHashSet<>();
            for (Object o : list) if (o != null && !String.valueOf(o).isBlank()) out.add(String.valueOf(o).trim());
            return new ArrayList<>(out);
        } catch (Exception e) {
            return List.of();
        }
    }

    private static final int JOURNEY_MAX = 20;

    /**
     * "Who got until where, for which company": every student row gets {@code journey} (newest first, one entry per drive) and {@code best}
     * (the furthest one, newest on a tie). Two queries for the whole college, never one per student. Outcomes only: the panelist's private
     * comment on a result is never read here.
     */
    private void attachJourneys(Integer collegeId, List<Map<String, Object>> rows) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId);
        Map<Integer, Map<String, Object>> latestResult = new HashMap<>();
        jdbc.query("SELECT rr.application_id AS applicationId, r.seq AS seq, r.kind AS kind, r.name AS name, rr.outcome AS outcome " +
                "FROM round_result rr JOIN job_round r ON r.id = rr.round_id JOIN job_application a ON a.id = rr.application_id " +
                "JOIN learner l ON l.id = a.learner_id " +
                "WHERE l.college_id = :c AND rr.applied_at IS NOT NULL AND rr.superseded_by IS NULL ORDER BY r.seq, rr.id", p, rs -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("seq", rs.getInt("seq")); m.put("kind", rs.getString("kind")); m.put("name", rs.getString("name")); m.put("outcome", rs.getString("outcome"));
                    latestResult.put(rs.getInt("applicationId"), m); // ordered by seq, so the last one wins: the furthest round
                });
        Map<Integer, List<Map<String, Object>>> byLearner = new HashMap<>();
        jdbc.query("SELECT a.id AS applicationId, a.learner_id AS learnerId, a.job_id AS jobId, j.company_name AS company, j.job_title AS role, " +
                "  a.application_status AS stage, cr.seq AS currentSeq, cr.kind AS currentKind, cr.name AS currentName, " +
                "  (SELECT COUNT(*) FROM job_round x WHERE x.job_id = a.job_id) AS roundsTotal, " +
                "  (SELECT o.status FROM job_offer o WHERE o.application_id = a.id AND o.status IN ('RELEASED','ACCEPTED') ORDER BY o.id DESC LIMIT 1) AS offerStatus " +
                "FROM job_application a JOIN job j ON j.id = a.job_id JOIN learner l ON l.id = a.learner_id " +
                "LEFT JOIN job_round cr ON cr.id = a.current_round_id " +
                "WHERE l.college_id = :c AND (a.is_deleted = 0 OR a.is_deleted IS NULL) ORDER BY a.applied_at DESC, a.id DESC", p, rs -> {
                    Map<String, Object> res = latestResult.get(rs.getInt("applicationId"));
                    Integer currentSeq = (Integer) rs.getObject("currentSeq");
                    Map<String, Object> entry = StudentJourneyRules.entry(rs.getInt("jobId"), rs.getString("company"), rs.getString("role"), rs.getString("stage"),
                            rs.getString("offerStatus"),
                            res == null ? null : (Integer) res.get("seq"), res == null ? null : (String) res.get("kind"), res == null ? null : (String) res.get("name"),
                            res == null ? null : (String) res.get("outcome"),
                            currentSeq, rs.getString("currentKind"), rs.getString("currentName"), rs.getInt("roundsTotal"));
                    List<Map<String, Object>> list = byLearner.computeIfAbsent(rs.getInt("learnerId"), k -> new ArrayList<>());
                    if (list.size() < JOURNEY_MAX) list.add(entry);
                });
        for (Map<String, Object> row : rows) {
            List<Map<String, Object>> journey = byLearner.getOrDefault(((Number) row.get("learnerId")).intValue(), List.of());
            row.put("journey", journey);
            Map<String, Object> best = null;
            for (Map<String, Object> e : journey) if (best == null || ((Number) e.get("depth")).intValue() > ((Number) best.get("depth")).intValue()) best = e;
            row.put("best", best);
        }
    }

    /** Per-student average (best attempt per test) on the courses the college chose as prep. Null when the college has not chosen any. */
    private Map<Integer, Double> prepAverages(Integer collegeId) {
        List<String> raw = jdbc.queryForList("SELECT prep_course_ids_json FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        if (raw.isEmpty() || raw.get(0) == null) return null;
        List<Integer> courses = new ArrayList<>();
        try { for (Object o : new com.fasterxml.jackson.databind.ObjectMapper().readValue(raw.get(0), List.class)) courses.add(Integer.valueOf(String.valueOf(o))); } catch (Exception e) { return null; }
        if (courses.isEmpty()) return null;
        Map<Integer, Double> out = new HashMap<>();
        jdbc.query("SELECT t.learner_id, AVG(t.best) * 100 AS avg FROM (SELECT qa.learner_id, qa.quiz_id, MAX(qa.score / NULLIF(qa.max_score, 0)) AS best FROM quiz_attempts qa " +
                        "JOIN quizzes q ON q.id = qa.quiz_id JOIN learner l ON l.id = qa.learner_id WHERE l.college_id = :c AND q.course_id IN (:courses) AND qa.status = 'SUBMITTED' " +
                        "AND (qa.is_deleted = 0 OR qa.is_deleted IS NULL) GROUP BY qa.learner_id, qa.quiz_id) t GROUP BY t.learner_id",
                new MapSqlParameterSource("c", collegeId).addValue("courses", courses),
                rs -> { out.put(rs.getInt("learner_id"), rs.getDouble("avg")); });
        return out;
    }

    private int prepThreshold(Integer collegeId) {
        List<Integer> t = jdbc.queryForList("SELECT prep_threshold_pct FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Integer.class);
        return t.isEmpty() || t.get(0) == null ? 60 : t.get(0);
    }

    /** What a student has been assigned as prep and how far they are: lessons completed out of lessons in the course. */
    private List<Map<String, Object>> prepProgress(Integer learnerId) {
        return jdbc.queryForList(
                "SELECT pa.id, pa.course_id AS courseId, c.course_name AS courseName, pa.due_at AS dueAt, pa.created_at AS assignedAt, " +
                "  (SELECT COUNT(*) FROM lesson_contents lc JOIN lesson ls ON ls.id = lc.lesson_id WHERE ls.course_id = pa.course_id AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL)) AS total, " +
                "  (SELECT COUNT(DISTINCT lc.id) FROM lesson_contents lc JOIN lesson ls ON ls.id = lc.lesson_id JOIN learner_content_progress p ON p.lesson_content_id = lc.id AND p.learner_id = :l AND p.completed_at IS NOT NULL " +
                "     WHERE ls.course_id = pa.course_id AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL)) AS done " +
                "FROM prep_assignment pa LEFT JOIN course c ON c.id = pa.course_id WHERE pa.learner_id = :l ORDER BY pa.created_at DESC",
                new MapSqlParameterSource("l", learnerId));
    }

    private static void bump(Map<String, Integer> m, String k) { m.merge(k, 1, Integer::sum); }
    private static int num(Object o) { return o == null ? 0 : ((Number) o).intValue(); }
    private static boolean bool(Object o) { return o instanceof Boolean b ? b : o instanceof Number n && n.intValue() != 0; }

    // ---------------------------------------------------------------- panel
    public Map<String, Object> detail(Integer collegeId, Integer learnerId) {
        return detail(collegeId, learnerId, null);
    }

    /**
     * The student panel. "row" is this student's Students-page row (outcome, marks as the page shows them, profile check,
     * offers, readiness), so the panel and the page never disagree: the panel used to read CGPA and 10th/12th from the old
     * columns, count withdrawn and expired offers as offers, and work out its own "profile ready" score.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> detail(Integer collegeId, Integer learnerId, String placedStatuses) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (placedStatuses != null) {
            List<Map<String, Object>> one = (List<Map<String, Object>>) table(collegeId, null, placedStatuses, false, learnerId).get("students");
            out.put("row", one.isEmpty() ? null : one.get(0));
        }
        List<Map<String, Object>> profile = jdbc.queryForList(
                "SELECT l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, " +
                "  l.department AS branch, l.contact_mail AS email, l.contact_mobile AS phone, l.resume_url AS resumeUrl, " +
                "  l.linkedin, l.github, l.portfolio, l.coding_profiles AS codingProfilesRaw, r.cgpa, r.source AS academicSource, " +
                "  r.tenth_pct AS tenthPct, r.twelfth_pct AS twelfthPct, r.diploma_pct AS diplomaPct, " +
                "  r.ug_pct AS ugPct, r.gap_years AS gapYears, r.passing_year AS passingYear, r.batch " +
                "FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE l.id = :id AND l.college_id = :c", new MapSqlParameterSource("id", learnerId).addValue("c", collegeId));
        if (profile.isEmpty()) throw new IllegalArgumentException("Not found");
        Map<String, Object> prof = profile.get(0);
        prof.put("codingProfiles", com._42students.lms.common.CodingPlatforms.describe(codingProfiles(prof.remove("codingProfilesRaw"))));
        out.put("profile", prof);
        out.put("applications", jdbc.queryForList(
                "SELECT a.id AS applicationId, a.job_id AS jobId, j.job_title AS jobTitle, j.company_name AS companyName, " +
                "  a.application_status AS stage, a.applied_by_college AS appliedByCollege, a.withdrawal_reason AS withdrawalReason, " +
                "  a.applied_at AS appliedAt, a.status_updated_at AS stageChangedAt, " +
                "  o.id AS offerId, o.status AS offerStatus, o.ctc_lpa AS ctcLpa " +
                "FROM job_application a JOIN job j ON j.id = a.job_id " +
                "LEFT JOIN job_offer o ON o.id = (SELECT MAX(o2.id) FROM job_offer o2 WHERE o2.application_id = a.id) " +
                "WHERE a.learner_id = :id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) ORDER BY a.applied_at DESC",
                new MapSqlParameterSource("id", learnerId)));
        out.put("notes", jdbc.queryForList("SELECT n.id, n.note, n.created_by AS createdBy, n.created_at AS createdAt, " +
                "  TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS createdByName FROM tpo_student_note n " +
                "LEFT JOIN faculty f ON f.id = n.created_by WHERE n.learner_id = :id AND n.college_id = :c ORDER BY n.created_at DESC",
                new MapSqlParameterSource("id", learnerId).addValue("c", collegeId)));
        out.put("history", audit.list(collegeId, "STUDENT", learnerId.longValue(), 100));
        out.put("prep", prepProgress(learnerId));
        out.put("debarments", jdbc.queryForList("SELECT id, reason, until_date AS untilDate, until_drives AS untilDrives, " +
                "created_at AS createdAt, lifted_at AS liftedAt, lifted_reason AS liftedReason FROM placement_debarment " +
                "WHERE learner_id = :id ORDER BY created_at DESC", new MapSqlParameterSource("id", learnerId)));
        out.put("registration", jdbc.queryForList("SELECT choice, source, consent_at AS consentAt, outcome_label AS outcomeLabel, outcome_detail AS outcomeDetail FROM placement_registration " +
                "WHERE learner_id = :id ORDER BY id DESC LIMIT 1", new MapSqlParameterSource("id", learnerId)));
        out.put("requests", requestsQueue(collegeId, true, null, learnerId));
        return out;
    }

    @Transactional
    public void addNote(Integer collegeId, Integer learnerId, String note, Integer actorId) {
        if (note == null || note.isBlank()) throw new IllegalArgumentException("Write a note first");
        jdbc.update("INSERT INTO tpo_student_note (college_id, learner_id, note, created_by) VALUES (:c, :l, :n, :a)",
                new MapSqlParameterSource("c", collegeId).addValue("l", learnerId).addValue("n", note.trim()).addValue("a", actorId));
        audit.log(collegeId, "TPO", actorId, "NOTE_ADDED", "STUDENT", learnerId.longValue(), null);
    }

    // ---------------------------------------------------------------- registration and bulk
    @Transactional
    public void register(Integer collegeId, Integer learnerId, String choice, Integer actorId) {
        register(collegeId, learnerId, choice, null, null, actorId);
    }

    /**
     * The placement cell sets a student's registration / final outcome (TPO notes item 7): Placements, Higher studies,
     * Entrepreneurship, Competitive exams or Not interested, optionally with one of the college's own labels for it and a
     * detail (the exam, the business, the university).
     */
    @Transactional
    public void register(Integer collegeId, Integer learnerId, String choice, String label, String detail, Integer actorId) {
        String[] clean = outcomes.checkOutcome(collegeId, choice, label, detail);
        Long seasonId = seasonService.current(collegeId).getId();
        studentService.register(learnerId, seasonId, choice, "TPO");
        jdbc.update("UPDATE placement_registration SET outcome_label = :l, outcome_detail = :d WHERE learner_id = :id AND season_id = :s",
                new MapSqlParameterSource("l", clean[0]).addValue("d", clean[1]).addValue("id", learnerId).addValue("s", seasonId));
        audit.log(collegeId, "TPO", actorId, "REGISTERED_BY_TPO", "STUDENT", learnerId.longValue(),
                PlacementOutcomeService.OUTCOMES.getOrDefault(choice, "Placements") + (clean[0] != null ? " (" + clean[0] + ")" : "") + (clean[1] != null ? ": " + clean[1] : ""));
    }

    @Transactional
    public int bulkMarkHigherStudies(Integer collegeId, List<Integer> learnerIds, Integer actorId) {
        requireAll(collegeId, learnerIds);
        for (Integer id : new HashSet<>(learnerIds)) register(collegeId, id, "HIGHER_STUDIES", actorId);
        return new HashSet<>(learnerIds).size();
    }

    /**
     * Undo of a bulk registration change: each student's registration goes back to what it was. choice null means they had not
     * registered: the registration this action wrote for them is removed. rows: [{ learnerId, choice }].
     */
    @Transactional
    public int restoreRegistrations(Integer collegeId, List<Map<String, Object>> rows, Integer actorId) {
        if (rows == null || rows.isEmpty()) throw new IllegalArgumentException("Nothing to undo");
        List<Integer> ids = new ArrayList<>();
        for (Map<String, Object> r : rows) ids.add(((Number) Objects.requireNonNull(r.get("learnerId"), "learnerId")).intValue());
        requireAll(collegeId, ids);
        Long seasonId = seasonService.current(collegeId).getId();
        for (Map<String, Object> r : rows) {
            Integer id = ((Number) r.get("learnerId")).intValue();
            String choice = r.get("choice") == null ? null : r.get("choice").toString();
            if (choice == null || choice.isBlank() || "NOT_REGISTERED".equals(choice)) {
                jdbc.update("DELETE FROM placement_registration WHERE learner_id = :l AND season_id = :s AND source = 'TPO'",
                        new MapSqlParameterSource("l", id).addValue("s", seasonId));
            } else {
                register(collegeId, id, choice, r.get("label") == null ? null : r.get("label").toString(), r.get("detail") == null ? null : r.get("detail").toString(), actorId);
                // Who chose it comes back too: a student's own choice stays theirs after an undo.
                Object source = r.get("source");
                if (source != null && List.of("SELF", "TPO", "BACKFILL").contains(source.toString()))
                    jdbc.update("UPDATE placement_registration SET source = :src WHERE learner_id = :l AND season_id = :s",
                            new MapSqlParameterSource("src", source.toString()).addValue("l", id).addValue("s", seasonId));
            }
        }
        audit.log(collegeId, "TPO", actorId, "REGISTRATION_RESTORED", "STUDENT", null, ids.size() + " students put back (undo)");
        return ids.size();
    }

    @Transactional
    public int bulkNudge(Integer collegeId, List<Integer> learnerIds, String message, Integer actorId) {
        requireAll(collegeId, learnerIds);
        if (message == null || message.isBlank()) throw new IllegalArgumentException("Write the message first");
        if (message.trim().length() > 1000) throw new IllegalArgumentException("Keep the message under 1,000 characters");
        for (Integer id : new HashSet<>(learnerIds)) {
            outbox.enqueue("NUDGE", "LEARNER", id, "APP", Map.of("message", message.trim()), null, false);
        }
        audit.log(collegeId, "TPO", actorId, "NUDGE_SENT", "STUDENT", null, new HashSet<>(learnerIds).size() + " students");
        return new HashSet<>(learnerIds).size();
    }

    @Transactional
    public Map<String, Object> bulkAssignPrep(Integer collegeId, List<Integer> learnerIds, Integer courseId, Integer assessmentId,
                              java.time.LocalDateTime dueAt, Integer actorId) {
        requireAll(collegeId, learnerIds);
        if (courseId == null && assessmentId == null) throw new IllegalArgumentException("Choose a course or a test");
        // Only a course of this college's organisation (the list the page offers): any course id used to be accepted.
        if (courseId != null) {
            Long own = jdbc.queryForObject("SELECT COUNT(*) FROM course c JOIN college col ON col.org_id = c.created_by_org_id WHERE c.id = :c AND col.id = :col AND (c.is_deleted = 0 OR c.is_deleted IS NULL)",
                    new MapSqlParameterSource("c", courseId).addValue("col", collegeId), Long.class);
            if (own == null || own == 0) throw new IllegalArgumentException("Choose one of your college's courses");
        }
        // dueAt arrives in UTC (serverTime on the page); a due time already gone is a mistake, not an assignment.
        if (dueAt != null && dueAt.isBefore(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(5)))
            throw new IllegalArgumentException("The due date has already passed");
        // Students who already have this course or test are skipped, by name, rather than given it twice.
        Set<Integer> already = new HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT learner_id FROM prep_assignment WHERE learner_id IN (:ids) AND (course_id <=> :c) AND (assessment_id <=> :a)",
                new MapSqlParameterSource("ids", new ArrayList<>(new HashSet<>(learnerIds))).addValue("c", courseId).addValue("a", assessmentId), Integer.class));
        List<Map<String, Object>> skipped = new ArrayList<>();
        int assigned = 0;
        for (Integer id : new LinkedHashSet<>(learnerIds)) {
            if (already.contains(id)) { skipped.add(Map.of("learnerId", id, "reason", "Already assigned this")); continue; }
            assigned++;
            jdbc.update("INSERT INTO prep_assignment (learner_id, course_id, assessment_id, due_at, assigned_by) VALUES (:l, :c, :a, :d, :by)",
                    new MapSqlParameterSource("l", id).addValue("c", courseId).addValue("a", assessmentId).addValue("d", dueAt).addValue("by", actorId));
            outbox.enqueue("PREP_ASSIGNED", "LEARNER", id, "APP", Map.of("courseId", String.valueOf(courseId), "assessmentId", String.valueOf(assessmentId)), null, false);
        }
        audit.log(collegeId, "TPO", actorId, "PREP_ASSIGNED", "STUDENT", null, assigned + " students");
        return Map.of("assigned", assigned, "skipped", skipped);
    }

    @Transactional
    public int bulkDebar(Integer collegeId, List<Integer> learnerIds, String reason, java.time.LocalDate until, Integer drives, Integer actorId) {
        requireAll(collegeId, learnerIds);
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("A reason is required");
        if (until == null && drives == null) throw new IllegalArgumentException("Set an end date or a number of drives");
        if (until != null && until.isBefore(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))))
            throw new IllegalArgumentException("The end date has already passed");
        if (drives != null && drives < 1) throw new IllegalArgumentException("Debar for at least one drive");
        for (Integer id : new HashSet<>(learnerIds)) {
            studentService.debar(id, reason.trim(), until, drives, actorId);
            outbox.enqueue("DEBARRED", "LEARNER", id, "APP", Map.of("reason", reason.trim()), null, false);
            audit.log(collegeId, "TPO", actorId, "DEBARRED", "STUDENT", id.longValue(), reason.trim());
        }
        return new HashSet<>(learnerIds).size();
    }

    /** Set After college for many students (same as the cell, with the college's own label). Placed and debarred are worked out, so skipped. */
    @Transactional
    public Map<String, Object> bulkRegister(Integer collegeId, List<Integer> learnerIds, String choice, String label, String detail, Integer actorId) {
        requireAll(collegeId, learnerIds);
        Long seasonId = seasonService.current(collegeId).getId();
        int done = 0;
        List<Map<String, Object>> skipped = new ArrayList<>();
        List<Map<String, Object>> before = new ArrayList<>();
        for (Integer id : new LinkedHashSet<>(learnerIds)) {
            if (studentService.isDebarred(id)) { skipped.add(Map.of("learnerId", id, "reason", "Debarred")); continue; }
            // What is stored now (not what the sheet shows: "Looking for a job" can come from applying, with no row), for an exact undo.
            List<Map<String, Object>> was = jdbc.queryForList("SELECT choice, outcome_label AS label, outcome_detail AS detail, source FROM placement_registration WHERE learner_id = :l AND season_id = :s",
                    new MapSqlParameterSource("l", id).addValue("s", seasonId));
            Map<String, Object> b = new HashMap<>();
            b.put("learnerId", id);
            if (!was.isEmpty()) b.putAll(was.get(0));
            before.add(b);
            register(collegeId, id, choice, label, detail, actorId);
            done++;
        }
        return Map.of("done", done, "skipped", skipped, "before", before);
    }

    /** Lift every active debarment of these students, with one reason. */
    @Transactional
    public int bulkLiftDebarments(Integer collegeId, List<Integer> learnerIds, String reason, Integer actorId) {
        requireAll(collegeId, learnerIds);
        if (reason == null || reason.trim().length() < 3) throw new IllegalArgumentException("Say why the debarment is lifted");
        int lifted = 0;
        for (Integer id : new LinkedHashSet<>(learnerIds)) {
            for (var d : studentService.activeDebarments(id)) {
                studentService.liftDebarment(d.getId(), reason.trim());
                lifted++;
            }
            audit.log(collegeId, "TPO", actorId, "DEBARMENT_LIFTED", "STUDENT", id.longValue(), reason.trim());
        }
        return lifted;
    }

    /** The same note on each student. */
    @Transactional
    public int bulkNote(Integer collegeId, List<Integer> learnerIds, String note, Integer actorId) {
        requireAll(collegeId, learnerIds);
        if (note == null || note.isBlank()) throw new IllegalArgumentException("Write a note first");
        for (Integer id : new LinkedHashSet<>(learnerIds)) addNote(collegeId, id, note, actorId);
        return new LinkedHashSet<>(learnerIds).size();
    }

    /** What each student's override on a drive is now ({learnerId, type, reason}, type null when none), for an exact undo. */
    public List<Map<String, Object>> overridesOf(Integer jobId, List<Integer> learnerIds) {
        Map<Integer, Map<String, Object>> now = new HashMap<>();
        if (!learnerIds.isEmpty()) jdbc.query("SELECT learner_id AS l, override_type AS t, reason AS r FROM job_eligibility_override WHERE job_id = :j AND learner_id IN (:ids)",
                new MapSqlParameterSource("j", jobId).addValue("ids", learnerIds), rs -> {
                    Map<String, Object> m = new HashMap<>(); m.put("learnerId", rs.getInt("l")); m.put("type", rs.getString("t")); m.put("reason", rs.getString("r"));
                    now.put(rs.getInt("l"), m);
                });
        List<Map<String, Object>> out = new ArrayList<>();
        for (Integer id : new LinkedHashSet<>(learnerIds)) {
            Map<String, Object> m = now.get(id);
            if (m == null) { m = new HashMap<>(); m.put("learnerId", id); m.put("type", null); m.put("reason", null); }
            out.add(m);
        }
        return out;
    }

    // ---------------------------------------------------------------- academic import (per semester, by roll)
    private static final List<String> FIELDS = List.of("cgpa", "tenthPct", "twelfthPct",
            "diplomaPct", "ugPct", "gapYears", "passingYear", "gender", "batch");

    /** Preview: for each roll, what would change. Unknown rolls come back under "unmatched". */
    public Map<String, Object> academicPreview(Integer collegeId, List<Map<String, Object>> rows) {
        List<Map<String, Object>> changes = new ArrayList<>();
        List<Map<String, Object>> unmatched = new ArrayList<>();
        Set<String> seenRolls = new HashSet<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            String roll = row.get("roll") == null ? null : String.valueOf(row.get("roll")).trim();
            if (roll == null || roll.isEmpty()) { unmatched.add(Map.of("row", i, "reason", "Roll number is missing")); continue; }
            if (!seenRolls.add(roll.toLowerCase(Locale.ROOT))) { unmatched.add(Map.of("row", i, "roll", roll, "reason", "Roll number appears twice")); continue; }
            List<Map<String, Object>> found = jdbc.queryForList(
                    "SELECT l.id, l.first_name, l.last_name, r.cgpa, r.tenth_pct, r.twelfth_pct, " +
                    "r.diploma_pct, r.ug_pct, r.gap_years, r.passing_year, r.gender, r.batch FROM learner l " +
                    "LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                    "WHERE l.college_id = :c AND LOWER(l.roll_number) = LOWER(:roll) AND (l.is_deleted = 0 OR l.is_deleted IS NULL)",
                    new MapSqlParameterSource("c", collegeId).addValue("roll", roll));
            if (found.size() != 1) { unmatched.add(Map.of("row", i, "roll", roll, "reason", found.isEmpty() ? "No student with this roll" : "More than one student has this roll")); continue; }
            // Values a mark can actually take: an out-of-range or non-number value used to be saved (or fail the whole import).
            String bad = badAcademicValue(row);
            if (bad != null) { unmatched.add(Map.of("row", i, "roll", roll, "reason", bad)); continue; }
            Map<String, Object> cur = found.get(0);
            Map<String, Object> diff = new LinkedHashMap<>();
            String[] cols = {"cgpa", "tenth_pct", "twelfth_pct", "diploma_pct", "ug_pct", "gap_years", "passing_year", "gender", "batch"};
            for (int f = 0; f < FIELDS.size(); f++) {
                Object incoming = row.get(FIELDS.get(f));
                if (incoming == null || String.valueOf(incoming).isBlank()) continue;
                Object old = cur.get(cols[f]);
                if (old == null || !sameValue(old, incoming)) diff.put(FIELDS.get(f), Map.of("from", old == null ? "" : String.valueOf(old), "to", String.valueOf(incoming)));
            }
            changes.add(Map.of("row", i, "learnerId", cur.get("id"), "roll", roll,
                    "name", (cur.get("first_name") + " " + (cur.get("last_name") == null ? "" : cur.get("last_name"))).trim(),
                    "changes", diff, "unchanged", diff.isEmpty()));
        }
        return Map.of("matched", changes, "unmatched", unmatched);
    }

    /** The first value of an import row that no student could have, in words; null when every value is possible. */
    static String badAcademicValue(Map<String, Object> row) {
        Object[][] ranges = {{"cgpa", "CGPA", 0, 10}, {"tenthPct", "10th %", 0, 100}, {"twelfthPct", "12th %", 0, 100}, {"diplomaPct", "Diploma %", 0, 100},
                {"ugPct", "UG %", 0, 100}, {"gapYears", "Gap years", 0, 15}, {"passingYear", "Passing year", 1980, 2100}};
        for (Object[] r : ranges) {
            Object v = row.get((String) r[0]);
            if (v == null || String.valueOf(v).isBlank()) continue;
            BigDecimal n;
            try { n = new BigDecimal(String.valueOf(v).trim().replace("%", "")); } catch (NumberFormatException e) { return r[1] + " is not a number"; }
            if (n.compareTo(BigDecimal.valueOf((Integer) r[2])) < 0 || n.compareTo(BigDecimal.valueOf((Integer) r[3])) > 0) {
                return r[1] + " must be between " + r[2] + " and " + r[3];
            }
        }
        return null;
    }

    private static boolean sameValue(Object a, Object b) {
        try { return new BigDecimal(String.valueOf(a)).compareTo(new BigDecimal(String.valueOf(b))) == 0; }
        catch (NumberFormatException e) { return String.valueOf(a).equalsIgnoreCase(String.valueOf(b)); }
    }

    @Transactional
    public int academicImport(Integer collegeId, List<Map<String, Object>> rows, Integer actorId) {
        Map<String, Object> preview = academicPreview(collegeId, rows);
        @SuppressWarnings("unchecked") List<Map<String, Object>> unmatched = (List<Map<String, Object>>) preview.get("unmatched");
        if (!unmatched.isEmpty()) throw new IllegalStateException(unmatched.size() + " row(s) can't be matched. Fix or remove them first.");
        @SuppressWarnings("unchecked") List<Map<String, Object>> matched = (List<Map<String, Object>>) preview.get("matched");
        String batchId = UUID.randomUUID().toString();
        int n = 0;
        for (Map<String, Object> m : matched) {
            if (Boolean.TRUE.equals(m.get("unchanged"))) continue;
            Integer learnerId = ((Number) m.get("learnerId")).intValue();
            Map<String, Object> row = rows.get((Integer) m.get("row"));
            LearnerAcademicRecord in = new LearnerAcademicRecord();
            in.setCgpa(dec(row.get("cgpa")));
            in.setTenthPct(dec(row.get("tenthPct"))); in.setTwelfthPct(dec(row.get("twelfthPct"))); in.setDiplomaPct(dec(row.get("diplomaPct")));
            in.setUgPct(dec(row.get("ugPct"))); in.setGapYears(intv(row.get("gapYears"))); in.setPassingYear(intv(row.get("passingYear")));
            if (row.get("gender") != null && !String.valueOf(row.get("gender")).isBlank()) in.setGender(String.valueOf(row.get("gender")).trim());
            studentService.upsertVerified(learnerId, in, batchId);
            if (row.get("batch") != null && !String.valueOf(row.get("batch")).isBlank()) {
                jdbc.update("UPDATE learner_academic_record SET batch = :b WHERE learner_id = :l",
                        new MapSqlParameterSource("b", String.valueOf(row.get("batch")).trim()).addValue("l", learnerId));
            }
            audit.log(collegeId, "TPO", actorId, "ACADEMIC_RECORD_IMPORTED", "STUDENT", learnerId.longValue(), String.valueOf(m.get("changes")));
            n++;
        }
        // A corrected record can change who is eligible. Applicants who no longer qualify are flagged (never removed) and told.
        int flagged = recalculateEligibility(collegeId, matched.stream().filter((m) -> !Boolean.TRUE.equals(m.get("unchanged"))).map((m) -> ((Number) m.get("learnerId")).intValue()).toList(), actorId);
        if (flagged > 0) audit.bell(collegeId, "INELIGIBLE_FLAGGED", flagged + " applicant(s) no longer meet a drive's rules", "The updated academic records changed eligibility. They are flagged, not removed.", "/tpo/drives");
        return n;
    }

    /**
     * After academic records change: every open application of these learners is re-checked against its drive. Newly ineligible applicants
     * get a flag (and a notice) once; nothing is removed. Returns how many were flagged.
     */
    @Transactional
    public int recalculateEligibility(Integer collegeId, List<Integer> learnerIds, Integer actorId) {
        if (learnerIds == null || learnerIds.isEmpty()) return 0;
        List<Map<String, Object>> apps = jdbc.queryForList(
                "SELECT a.id AS applicationId, a.job_id AS jobId, a.learner_id AS learnerId, a.ineligible_flag_at AS flagged, l.department AS branch FROM job_application a " +
                "JOIN job j ON j.id = a.job_id JOIN learner l ON l.id = a.learner_id WHERE l.college_id = :c AND a.learner_id IN (:ids) " +
                "AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW') AND j.lifecycle_status = 'PUBLISHED'",
                new MapSqlParameterSource("c", collegeId).addValue("ids", new HashSet<>(learnerIds)));
        Map<Integer, com._42students.lms.model.Job> jobs = new HashMap<>();
        int flagged = 0;
        for (Map<String, Object> a : apps) {
            int jobId = ((Number) a.get("jobId")).intValue();
            com._42students.lms.model.Job job = jobs.computeIfAbsent(jobId, (id) -> jobRepository.findById(id).orElse(null));
            if (job == null) continue;
            int learnerId = ((Number) a.get("learnerId")).intValue();
            boolean eligible = eligibilityService.evaluate(job, learnerId, (String) a.get("branch")).eligible;
            int appId = ((Number) a.get("applicationId")).intValue();
            if (!eligible && a.get("flagged") == null) {
                jdbc.update("UPDATE job_application SET ineligible_flag_at = NOW() WHERE id = :id", new MapSqlParameterSource("id", appId));
                outbox.enqueue("NOW_INELIGIBLE", "LEARNER", learnerId, "APP", Map.of("jobId", jobId), null, false);
                audit.log(collegeId, "SYSTEM", null, "APPLICANT_FLAGGED_INELIGIBLE", "DRIVE", (long) jobId, "learner " + learnerId);
                flagged++;
            } else if (eligible && a.get("flagged") != null) {
                jdbc.update("UPDATE job_application SET ineligible_flag_at = NULL WHERE id = :id", new MapSqlParameterSource("id", appId));
            }
        }
        return flagged;
    }

    private static BigDecimal dec(Object o) {
        try { return o == null || String.valueOf(o).isBlank() ? null : new BigDecimal(String.valueOf(o).trim()); } catch (NumberFormatException e) { return null; }
    }
    private static Integer intv(Object o) {
        try { return o == null || String.valueOf(o).isBlank() ? null : new BigDecimal(String.valueOf(o).trim()).intValue(); } catch (NumberFormatException e) { return null; }
    }

    // ---------------------------------------------------------------- requests queue
    /** The Requests page: every student request with who asked and which drive it is about. Pending first; decided ones for the last 30 days. */
    public List<Map<String, Object>> requestsQueue(Integer collegeId, boolean includeDecided) {
        return requestsQueue(collegeId, includeDecided, 30, null);
    }

    /**
     * The Requests page. Each row carries what a decision needs without opening the student: their registration and
     * whether they are already placed, and for a drive request the next round's time (so a withdrawal before tomorrow's
     * interview reads as urgent). Decided rows go back {@code decidedDays} days (null: all, up to the row limit), with
     * who decided. {@code learnerId} limits it to one student (the student panel).
     */
    public List<Map<String, Object>> requestsQueue(Integer collegeId, boolean includeDecided, Integer decidedDays, Integer learnerId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("d", includeDecided ? 1 : 0)
                .addValue("days", decidedDays == null ? 36500 : decidedDays).addValue("l", learnerId);
        return jdbc.queryForList(
                "SELECT r.id, r.type, r.status, r.reason, r.decision_reason AS decisionReason, r.decided_at AS decidedAt, r.escalate_at AS escalateAt, r.created_at AS createdAt, " +
                "  r.payload_json AS payload, l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, l.department AS branch, " +
                "  j.id AS jobId, CONCAT(j.company_name, ' · ', j.job_title) AS drive, " +
                "  (SELECT MIN(jr.scheduled_date) FROM job_round jr WHERE jr.job_id = r.job_id AND jr.scheduled_date > NOW() AND jr.status <> 'COMPLETED') AS nextRoundAt, " +
                "  (SELECT jr.name FROM job_round jr WHERE jr.job_id = r.job_id AND jr.scheduled_date > NOW() AND jr.status <> 'COMPLETED' ORDER BY jr.scheduled_date LIMIT 1) AS nextRoundName, " +
                "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), 'NOT_REGISTERED') AS registration, " +
                "  EXISTS (SELECT 1 FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status = 'ACCEPTED') AS placed, " +
                "  TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS decidedByName " +
                "FROM student_request r JOIN learner l ON l.id = r.learner_id LEFT JOIN job j ON j.id = r.job_id LEFT JOIN faculty f ON f.id = r.decided_by " +
                "WHERE l.college_id = :c AND (:l IS NULL OR l.id = :l) " +
                "  AND (r.status = 'PENDING' OR (:d = 1 AND COALESCE(r.decided_at, r.created_at) >= NOW() - INTERVAL :days DAY)) " +
                "ORDER BY (r.status = 'PENDING') DESC, r.created_at DESC LIMIT 500", p);
    }

    /** Pending requests at the college, for the sidebar badge (one count, not the whole queue). */
    public long pendingRequestCount(Integer collegeId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM student_request r JOIN learner l ON l.id = r.learner_id WHERE l.college_id = :c AND r.status = 'PENDING'",
                new MapSqlParameterSource("c", collegeId), Long.class);
        return n == null ? 0 : n;
    }

    public List<Map<String, Object>> prepCourses(Integer organizationId) {
        return jdbc.queryForList("SELECT id, course_name AS name FROM course WHERE created_by_org_id = :o AND (is_deleted = 0 OR is_deleted IS NULL) " +
                "AND course_name IS NOT NULL ORDER BY course_name LIMIT 500", new MapSqlParameterSource("o", organizationId));
    }
}
