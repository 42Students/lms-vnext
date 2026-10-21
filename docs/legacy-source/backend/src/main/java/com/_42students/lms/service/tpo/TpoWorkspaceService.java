package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Read models for the Drive page (TPO V1 - Locked.docx §5). Plain SQL because these are joins across
 * learner, academic record, results and offers that the entities do not model. Callers must have
 * already checked the drive belongs to their college (TpoAccessGuard).
 */
@Service
@RequiredArgsConstructor
public class TpoWorkspaceService {

    private final NamedParameterJdbcTemplate jdbc;

    /** Marks as the Students table shows them (verified, else the student's own, flagged). Optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private AcademicMarksService academicMarks;

    /** Who is in each round (lazy: the schedule service is built on the same tables). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoScheduleService schedule;

    /**
     * Applicants with every column the Applicants tab shows: the student (batch, gender, contact, resume), their marks as the
     * Students page shows them, where they are in the drive (stage, current round, last result) and the flags.
     */
    public List<Map<String, Object>> applicants(Integer jobId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT a.id AS applicationId, a.public_ref AS publicRef, a.external_ref AS externalRef, " +
                "  a.application_status AS stage, a.current_round_id AS currentRoundId, a.applied_at AS appliedAt, " +
                "  a.applied_by_college AS appliedByCollege, a.ineligible_flag_at AS ineligibleFlagAt, a.withdrawal_reason AS withdrawalReason, " +
                "  l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, " +
                "  l.department AS branch, (l.resume_url IS NOT NULL AND l.resume_url <> '') AS hasResume, l.resume_url AS resumeUrl, " +
                "  l.gender AS gender, l.contact_mail AS email, l.contact_mobile AS phone, bt.batch_name AS batchName, cl.name AS className, " +
                // Current round: the round a student still in play is scheduled into and has no result for yet; otherwise the last
                // round whose results moved them (roundState says which). It used to be only the last round with results, so a
                // student who cleared the test and was booked for the interview still showed "Test".
                "  COALESCE(CASE WHEN a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW') THEN (SELECT jr.name FROM round_assignment ra " +
                "     JOIN job_round jr ON jr.id = ra.round_id WHERE ra.application_id = a.id AND NOT EXISTS (SELECT 1 FROM round_result x " +
                "     WHERE x.application_id = a.id AND x.round_id = ra.round_id AND x.applied_at IS NOT NULL) ORDER BY jr.seq LIMIT 1) END, " +
                "     (SELECT jr.name FROM job_round jr WHERE jr.id = a.current_round_id)) AS currentRound, " +
                "  CASE WHEN a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW') AND EXISTS (SELECT 1 FROM round_assignment ra " +
                "     WHERE ra.application_id = a.id AND NOT EXISTS (SELECT 1 FROM round_result x WHERE x.application_id = a.id AND x.round_id = ra.round_id " +
                "     AND x.applied_at IS NOT NULL)) THEN 'SCHEDULED' WHEN a.current_round_id IS NOT NULL THEN 'DONE' END AS roundState, " +
                "  l.skills AS profileSkills, " +
                "  r.cgpa AS cgpa, r.source AS academicSource, " +
                // Last result: the result that set where they are now (the last round that moved them). A result recorded later for
                // an earlier round, or for a student already offered or out, no longer shows as their latest.
                "  (SELECT rr.outcome FROM round_result rr WHERE rr.application_id = a.id AND rr.round_id = a.current_round_id AND rr.applied_at IS NOT NULL " +
                "     ORDER BY rr.applied_at DESC, rr.id DESC LIMIT 1) AS lastResult, " +
                "  (SELECT COUNT(*) FROM round_result rr WHERE rr.application_id = a.id AND rr.outcome = 'ABSENT' " +
                "     AND NOT EXISTS (SELECT 1 FROM student_request sr WHERE sr.learner_id = a.learner_id AND sr.job_id = a.job_id AND sr.type IN ('WITHDRAWAL','ABSENCE_DISPUTE') AND sr.status IN ('PENDING','APPROVED','AUTO_APPROVED'))) AS noShows, " +
                "  EXISTS (SELECT 1 FROM student_request sw WHERE sw.learner_id = a.learner_id AND sw.job_id = a.job_id AND sw.type = 'WITHDRAWAL' AND sw.status = 'PENDING') AS withdrawalRequested " +
                "FROM job_application a JOIN learner l ON l.id = a.learner_id " +
                "LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id " +
                "WHERE a.job_id = :jobId AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "ORDER BY l.first_name, l.last_name",
                new MapSqlParameterSource("jobId", jobId));
        // Skill match, worked out now from the drive's wanted skills and each profile (see SkillMatch).
        List<Object> prefs = jdbc.queryForList("SELECT candidate_preferences FROM job WHERE id = :jobId", new MapSqlParameterSource("jobId", jobId), Object.class);
        Set<String> wanted = SkillMatch.wanted(prefs.isEmpty() ? null : prefs.get(0));
        for (Map<String, Object> r : rows) r.putAll(SkillMatch.of(wanted, r.remove("profileSkills")));
        if (academicMarks != null && !rows.isEmpty()) {
            Map<Integer, Map<String, Object>> marks = academicMarks.marksForLearners(rows.stream().map(r -> ((Number) r.get("learnerId")).intValue()).toList());
            for (Map<String, Object> r : rows) {
                Map<String, Object> m = new LinkedHashMap<>(marks.getOrDefault(((Number) r.get("learnerId")).intValue(), Map.of("marks", Map.of())));
                m.remove("gender"); m.remove("rule"); // gender is already the profile's; the rule is not the applicant's
                r.putAll(m);
            }
        }
        return rows;
    }

    private static final String[] FUNNEL_STAGES = {"APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED"};

    /**
     * TRUE funnel semantics for the drive page's pipeline visual: cumulative "how many
     * applications EVER reached stage X", from {@code job_application_status_history} —
     * deliberately different from {@link #stageCounts}'s snapshot (current status only). An
     * application that reached INTERVIEW and was later REJECTED must still count in the
     * INTERVIEW bucket here, or the funnel is non-monotonic (a later stage showing MORE
     * applications than an earlier one) and every stage-to-stage conversion number is wrong.
     * Mirrors {@code AdminJobServiceImpl.getHiringFunnel}'s reachedStageSql — same underlying
     * tables, same correctness issue, kept as its own copy since TPO V1 reads are scoped
     * through TpoAccessGuard rather than the legacy admin auth path.
     */
    public List<Map<String, Object>> funnel(Integer jobId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) AS applied");
        for (int i = 1; i < FUNNEL_STAGES.length; i++) {
            sql.append(", ").append(reachedStageSql(FUNNEL_STAGES[i])).append(" AS ").append(FUNNEL_STAGES[i].toLowerCase(Locale.ROOT));
        }
        sql.append(" FROM job_application WHERE job_id = :jobId AND (is_deleted = 0 OR is_deleted IS NULL)");
        Map<String, Object> row = jdbc.queryForMap(sql.toString(), new MapSqlParameterSource("jobId", jobId));
        List<Map<String, Object>> out = new ArrayList<>();
        for (String stage : FUNNEL_STAGES) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("stage", stage);
            Object c = row.get(stage.toLowerCase(Locale.ROOT));
            e.put("count", c == null ? 0L : ((Number) c).longValue());
            out.add(e);
        }
        return out;
    }

    private static String reachedStageSql(String stage) {
        return reachedStageSql(stage, "job_application");
    }

    /** Stage order for "how far did they get": Waitlisted sits with Interview, as on the drive page's journey strip. */
    private static String stageRank(String column) {
        return "(CASE " + column + " WHEN 'APPLIED' THEN 0 WHEN 'SHORTLISTED' THEN 1 WHEN 'ASSESSMENT' THEN 2 WHEN 'INTERVIEW' THEN 3 " +
                "WHEN 'WAITLISTED' THEN 3 WHEN 'OFFERED' THEN 4 WHEN 'HIRED' THEN 5 ELSE -1 END)";
    }

    /**
     * SUM of applications that reached {@code stage}: their furthest stage, current or in history, is at or past it. Matching
     * the exact stage name missed every step the history never recorded (an offer release wrote no row), so all 54 placed
     * students on prod counted as never offered and the funnel showed fewer offered than placed. The test stage is optional
     * (many drives have none), so it alone still counts only applications that really were in a test.
     */
    public static String reachedStageSql(String stage, String alias) {
        if ("ASSESSMENT".equals(stage)) {
            return "SUM(CASE WHEN " + alias + ".application_status = 'ASSESSMENT' OR EXISTS (SELECT 1 FROM job_application_status_history h " +
                    "WHERE h.application_id = " + alias + ".id AND h.new_status = 'ASSESSMENT') THEN 1 ELSE 0 END)";
        }
        int rank = switch (stage) { case "SHORTLISTED" -> 1; case "INTERVIEW" -> 3; case "OFFERED" -> 4; case "HIRED" -> 5; default -> 0; };
        return "SUM(CASE WHEN GREATEST(" + stageRank(alias + ".application_status") + ", COALESCE((SELECT MAX(" + stageRank("h.new_status") + ") " +
                "FROM job_application_status_history h WHERE h.application_id = " + alias + ".id), -1)) >= " + rank + " THEN 1 ELSE 0 END)";
    }

    public Map<String, Long> stageCounts(Integer jobId) {
        Map<String, Long> out = new LinkedHashMap<>();
        jdbc.query("SELECT application_status AS s, COUNT(*) AS c FROM job_application " +
                        "WHERE job_id = :jobId AND (is_deleted = 0 OR is_deleted IS NULL) GROUP BY application_status",
                new MapSqlParameterSource("jobId", jobId),
                rs -> { out.put(rs.getString("s"), rs.getLong("c")); });
        return out;
    }

    /** The college's held-offer rules, for the Offers tab's rules check. Optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private PlacementRulesService placementRules;

    /**
     * The Offers tab list. rulesCheck is the same check Verify and release runs (held-offer limit, uplift %, Dream drives, offers
     * that never count as placed are not held), so the tab never says "blocked" when release would go through, or the reverse:
     * HOLDS_THIS (released or accepted), CLEAR, ALLOWED (holds others, within the rules), BLOCKED, or NOT_COUNTED (an internship).
     */
    public List<Map<String, Object>> offers(Integer jobId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT o.id AS offerId, o.application_id AS applicationId, o.kind, o.role_option_name AS roleOption, " +
                "  o.ctc_lpa AS ctcLpa, o.fixed_lpa AS fixedLpa, o.variable_lpa AS variableLpa, " +
                "  o.joining_date AS joiningDate, o.respond_by AS respondBy, o.letter_url AS letterUrl, " +
                "  o.status, o.acceptance_channel AS acceptanceChannel, o.accepted_disputable_until AS disputableUntil, " +
                "  o.joining_status AS joiningStatus, o.released_at AS releasedAt, o.responded_at AS respondedAt, o.created_at AS createdAt, " +
                "  l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, " +
                "  l.department AS branch, l.contact_mail AS email, l.contact_mobile AS phone, bt.batch_name AS batchName, " +
                "  j.college_id AS collegeId, j.category AS jobCategory, j.counts_as_placed AS countsAsPlaced " +
                "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN learner l ON l.id = a.learner_id " +
                "JOIN job j ON j.id = a.job_id LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id " +
                "WHERE a.job_id = :jobId ORDER BY o.created_at DESC",
                new MapSqlParameterSource("jobId", jobId));
        for (Map<String, Object> r : rows) {
            // Offers the student holds on OTHER drives that count as placed (an internship's offer is never a held offer).
            List<Map<String, Object>> held = jdbc.queryForList(
                    "SELECT o2.ctc_lpa AS ctc, j2.company_name AS company FROM job_offer o2 JOIN job_application a2 ON a2.id = o2.application_id " +
                    "JOIN job j2 ON j2.id = a2.job_id WHERE a2.learner_id = :l AND a2.id <> :a AND o2.status IN ('RELEASED','ACCEPTED') " +
                    "AND (j2.counts_as_placed IS NULL OR j2.counts_as_placed = 1)",
                    new MapSqlParameterSource("l", r.get("learnerId")).addValue("a", r.get("applicationId")));
            r.put("otherHeldOffers", held.size());
            r.put("heldWith", held.stream().map(h -> String.valueOf(h.get("company"))).distinct().toList());
            String status = String.valueOf(r.get("status"));
            String check;
            if ("RELEASED".equals(status) || "ACCEPTED".equals(status)) check = "HOLDS_THIS";
            else if (!"SELECTED".equals(status) && !"PENDING_VERIFICATION".equals(status)) check = null;
            else if (Boolean.FALSE.equals(toBool(r.get("countsAsPlaced")))) check = "NOT_COUNTED";
            else if (held.isEmpty()) check = "CLEAR";
            else {
                java.math.BigDecimal ctc = r.get("ctcLpa") == null ? null : new java.math.BigDecimal(r.get("ctcLpa").toString());
                List<java.math.BigDecimal> heldCtcs = held.stream().map(h -> h.get("ctc") == null ? java.math.BigDecimal.ZERO : new java.math.BigDecimal(h.get("ctc").toString())).toList();
                boolean dream = r.get("jobCategory") != null && String.valueOf(r.get("jobCategory")).contains("DREAM");
                boolean blocked = placementRules != null && placementRules.isBlockedByHeldOffers((Integer) r.get("collegeId"), ((Number) r.get("learnerId")).intValue(), heldCtcs, ctc, dream);
                check = blocked ? "BLOCKED" : "ALLOWED";
            }
            r.put("rulesCheck", check);
            r.remove("collegeId"); r.remove("jobCategory");
        }
        return rows;
    }

    private static Boolean toBool(Object o) {
        if (o == null) return null;
        if (o instanceof Boolean b) return b;
        if (o instanceof Number n) return n.intValue() != 0;
        return Boolean.valueOf(o.toString());
    }

    /** Rounds with result counts, for the Rounds tab cards. */
    public List<Map<String, Object>> roundsWithCounts(Integer jobId) {
        List<Map<String, Object>> rounds = jdbc.queryForList(
                "SELECT r.id, r.seq, r.kind, r.name, r.mode, r.scheduled_date AS scheduledDate, r.venue, r.meeting_url AS meetingUrl, " +
                "  r.what_to_bring AS whatToBring, r.platform, r.test_link AS testLink, r.duration_minutes AS durationMinutes, " +
                "  r.results_due AS resultsDue, r.status, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = r.job_id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "     AND a.application_status NOT IN ('REJECTED','WITHDRAWN','NOT_SELECTED') " +
                "     AND (r.seq = 1 OR EXISTS (SELECT 1 FROM round_result rr JOIN job_round pr ON pr.id = rr.round_id WHERE rr.application_id = a.id " +
                "        AND pr.job_id = r.job_id AND pr.seq = r.seq - 1 AND rr.applied_at IS NOT NULL AND rr.outcome = 'PASS'))) AS inRound, " +
                "  (SELECT COUNT(*) FROM round_result x WHERE x.round_id = r.id AND x.applied_at IS NULL AND x.superseded_by IS NULL) AS stagedResults, " +
                "  (SELECT COUNT(*) FROM round_slot s WHERE s.round_id = r.id AND s.status = 'PROPOSED' AND s.proposed_by = 'RECRUITER') AS recruiterProposals, " +
                "  (SELECT COUNT(*) FROM reschedule_request q WHERE q.round_id = r.id AND q.status = 'PENDING') AS rescheduleRequests " +
                "FROM job_round r WHERE r.job_id = :jobId ORDER BY r.seq",
                new MapSqlParameterSource("jobId", jobId));
        // "In this round" is exactly who the round's roster and booking take (TpoScheduleService.candidates): the count above still
        // used the old "passed the round numbered one less" rule and disagreed with the roster after a talk or a hand move.
        if (schedule != null) for (Map<String, Object> r : rounds) r.put("inRound", (long) schedule.candidates(((Number) r.get("id")).longValue()).size());
        return rounds;
    }

    /** Eligible and applied by branch, the numbers on the Overview tab. Eligible = college students on the drive's branches. */
    public Map<String, Object> summary(Integer jobId, Integer collegeId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stageCounts", stageCounts(jobId));
        out.put("funnel", funnel(jobId));
        out.put("appliedByBranch", jdbc.queryForList(
                "SELECT COALESCE(l.department, 'Unknown') AS branch, COUNT(*) AS applied FROM job_application a " +
                "JOIN learner l ON l.id = a.learner_id WHERE a.job_id = :jobId AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "GROUP BY l.department ORDER BY applied DESC", new MapSqlParameterSource("jobId", jobId)));
        out.put("collegeStudentsByBranch", jdbc.queryForList(
                "SELECT COALESCE(department, 'Unknown') AS branch, COUNT(*) AS students FROM learner " +
                "WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) GROUP BY department ORDER BY students DESC",
                new MapSqlParameterSource("c", collegeId)));
        out.put("overrides", jdbc.queryForList(
                "SELECT o.learner_id AS learnerId, o.override_type AS type, o.reason, l.first_name AS firstName, l.last_name AS lastName " +
                "FROM job_eligibility_override o JOIN learner l ON l.id = o.learner_id WHERE o.job_id = :jobId",
                new MapSqlParameterSource("jobId", jobId)));
        List<Map<String, Object>> job = jdbc.queryForList("SELECT recruiter_id AS recruiterId, previous_request_json AS previous, results_auto_apply AS autoApply, role_options_json AS roleOptions, " +
                "lifecycle_status AS lifecycle, closed_at AS closedAt, eligibility_json AS eligibility, job_title AS jobTitle, job_description AS jobDescription, location, application_deadline AS applicationDeadline FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId));
        if (!job.isEmpty()) {
            Map<String, Object> jr = job.get(0);
            out.put("autoApply", jr.get("autoApply"));
            if ("CLOSED".equals(jr.get("lifecycle"))) out.put("closedSummary", closedSummary(jobId, jr.get("closedAt")));
            if (jr.get("previous") != null) out.put("previousRequest", jr.get("previous"));
            if (jr.get("recruiterId") != null) {
                List<Map<String, Object>> recruiter = jdbc.queryForList(
                        "SELECT h.id, CONCAT(h.first_name, ' ', COALESCE(h.last_name, '')) AS name, h.designation, h.contact_mail AS email, h.contact_mobile AS phone, ic.name AS company, " +
                        "a.verification, a.agency_for_company_name AS agencyFor, a.status AS accessStatus, a.revoked_at AS revokedAt, " +
                        "(SELECT l.id FROM recruiter_lead l WHERE l.recruiter_id = h.id AND l.college_id = :c LIMIT 1) AS recruiterLeadId " +
                        "FROM recruiter h LEFT JOIN company ic ON ic.id = h.company_id " +
                        "LEFT JOIN recruiter_college_access a ON a.recruiter_id = h.id AND a.college_id = :c WHERE h.id = :h",
                        new MapSqlParameterSource("h", jr.get("recruiterId")).addValue("c", collegeId));
                if (!recruiter.isEmpty()) {
                    Map<String, Object> h = new LinkedHashMap<>(recruiter.get(0));
                    Object phone = h.get("phone");
                    if (phone != null && String.valueOf(phone).length() > 4) h.put("phone", "******" + String.valueOf(phone).substring(String.valueOf(phone).length() - 4));
                    h.put("accessEnded", h.get("revokedAt") != null || (h.get("accessStatus") != null && !"ACTIVE".equals(String.valueOf(h.get("accessStatus")))));
                    out.put("hr", h);
                }
            }
        }
        out.put("offersByStatus", jdbc.queryForList(
                "SELECT o.status, COUNT(*) AS c FROM job_offer o JOIN job_application a ON a.id = o.application_id " +
                "WHERE a.job_id = :jobId GROUP BY o.status", new MapSqlParameterSource("jobId", jobId)));
        return out;
    }

    /** The read-only summary of a closed drive: where every applicant ended, how each round went, and the offers. Computed from the data, so it never goes stale. */
    private Map<String, Object> closedSummary(Integer jobId, Object closedAt) {
        Map<String, Object> s = new LinkedHashMap<>();
        MapSqlParameterSource p = new MapSqlParameterSource("j", jobId);
        s.put("closedAt", closedAt);
        s.put("applicants", jdbc.queryForObject("SELECT COUNT(*) FROM job_application WHERE job_id = :j AND (is_deleted = 0 OR is_deleted IS NULL)", p, Long.class));
        s.put("byStatus", jdbc.queryForList("SELECT application_status AS status, COUNT(*) AS c FROM job_application WHERE job_id = :j AND (is_deleted = 0 OR is_deleted IS NULL) GROUP BY application_status", p));
        s.put("rounds", jdbc.queryForList(
                "SELECT r.seq, r.name, " +
                "  SUM(CASE WHEN x.outcome = 'PASS' THEN 1 ELSE 0 END) AS passed, SUM(CASE WHEN x.outcome = 'FAIL' THEN 1 ELSE 0 END) AS failed, " +
                "  SUM(CASE WHEN x.outcome = 'ABSENT' THEN 1 ELSE 0 END) AS absent, SUM(CASE WHEN x.outcome = 'HOLD' THEN 1 ELSE 0 END) AS waitlisted " +
                "FROM job_round r LEFT JOIN round_result x ON x.round_id = r.id AND x.applied_at IS NOT NULL AND x.superseded_by IS NULL " +
                "WHERE r.job_id = :j GROUP BY r.id, r.seq, r.name ORDER BY r.seq", p));
        s.put("offers", jdbc.queryForList("SELECT o.status, COUNT(*) AS c FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.job_id = :j GROUP BY o.status", p));
        return s;
    }

    /** Offers that should be considered "placed" for reports; kept here so Home and Reports share one definition. */
    public static String placedOfferStatuses(String countsAsPlacedAt) {
        String statuses = "OFFER_ACCEPTED".equals(countsAsPlacedAt) || "ACCEPTED".equals(countsAsPlacedAt)
                ? "('ACCEPTED')" : "('RELEASED','ACCEPTED')";
        // Used as "o.status IN <this>" with o = job_offer: an offer from a drive whose job type does not count as placed
        // (Internship, or a college's own type answered No) never counts.
        return statuses + " AND NOT EXISTS (SELECT 1 FROM job_application ia JOIN job ij ON ij.id = ia.job_id WHERE ia.id = o.application_id AND ij.counts_as_placed = 0)";
    }
}
