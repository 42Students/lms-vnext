package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Home, Calendar and Reports (TPO V1 - Locked.docx §2, §7, §8). One class on purpose: Home's four numbers and
 * Reports must use the same definitions ("Placed" per the college's setting; Placement % = unique students placed
 * / registered for placements), so they are computed in one place.
 */
@Service
@RequiredArgsConstructor
public class TpoInsightsService {

    // A drive with no season (created before seasons existed, or by the admin console) counts as part of the CURRENT season, the
    // same way the Drives page lists it. Every drive-season filter below uses that rule, so Home, Reports and Drives agree.

    private final NamedParameterJdbcTemplate jdbc;
    private final PlacementRulesService rules;

    /** Home per batch and the registration card (registration is per batch). Optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private PlacementEligibilityService placementEligibility;

    /** Final outcomes for the "outcomes" report (NAAC 5.2 / NIRF). Optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private PlacementOutcomeService outcomes;

    /** Marks as the Students page shows them, for the Unplaced and Accreditation reports. Optional so unit tests build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private AcademicMarksService academicMarks;

    /** Companies and recruiter leads as Engage counts them, for the Recruiter engagement report. Optional likewise. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoRecruiterLeadsHubService recruiterLeadsHub;

    private String placedStatuses(Integer collegeId) {
        return TpoWorkspaceService.placedOfferStatuses(rules.rulesFor(collegeId).getCountsAsPlacedAt());
    }

    private static long n(Object o) { return o == null ? 0 : ((Number) o).longValue(); }

    // ---------------------------------------------------------------- shared numbers
    /** The one definition of the placement numbers. seasonId null = every season. */
    public Map<String, Object> stats(Integer collegeId, Long seasonId) {
        return stats(collegeId, seasonId, null, null, null, null, null);
    }

    /**
     * The filtered form of the same numbers (Reports' KPI cards, previously always called with
     * only collegeId/seasonId no matter what the report's table was filtered to - a TPO could
     * filter to CSE + TCS and still see whole-college headline numbers). batch/branch are student
     * population filters, so they narrow registered/unplacedReady too; company/mode/category are
     * drive-level filters, which only make sense against offer/drive-scoped numbers (a "registered
     * for placements" count isn't scoped to a company). All six params null = identical to the
     * unfiltered stats(collegeId, seasonId) overload.
     */
    public Map<String, Object> stats(Integer collegeId, Long seasonId, String batch, String branch, String company, String mode, String category) {
        return stats(collegeId, seasonId, batch, branch, company, mode, category, null);
    }

    /** batchId: an Academic Setup batch (the learner's class's batch); null = every batch. */
    public Map<String, Object> stats(Integer collegeId, Long seasonId, String batch, String branch, String company, String mode, String category, Long batchId) {
        String placed = placedStatuses(collegeId);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId)
                .addValue("b", batch).addValue("br", branch).addValue("co", company).addValue("m", mode).addValue("cat", category).addValue("bid", batchId);
        String popFilter = " AND (:br IS NULL OR l.department = :br) AND (:b IS NULL OR r.batch = :b) AND (:bid IS NULL OR l.class_id IN (SELECT cx.id FROM class cx WHERE cx.batch_id = :bid)) ";
        String driveFilter = " AND (:co IS NULL OR LOWER(j.company_name) = LOWER(:co)) AND (:m IS NULL OR j.drive_mode = :m) AND (:cat IS NULL OR j.category = :cat) ";
        long registered = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " + popFilter +
                "AND COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id AND (:s IS NULL OR pr.season_id = :s) ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") = 'PLACEMENTS'", p, Long.class));
        long placedUnique = n(jdbc.queryForObject(
                "SELECT COUNT(DISTINCT a.learner_id) FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "JOIN learner l ON l.id = a.learner_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND o.status IN " + placed + popFilter + driveFilter, p, Long.class));
        long acceptedUnique = n(jdbc.queryForObject(
                "SELECT COUNT(DISTINCT a.learner_id) FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "JOIN learner l ON l.id = a.learner_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND o.status = 'ACCEPTED'" + popFilter + driveFilter, p, Long.class));
        long offers = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "JOIN learner l ON l.id = a.learner_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND o.status IN ('RELEASED','ACCEPTED')" + popFilter + driveFilter, p, Long.class));
        long live = n(jdbc.queryForObject("SELECT COUNT(*) FROM job j WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) " +
                "AND j.lifecycle_status = 'PUBLISHED' AND (j.is_deleted = 0 OR j.is_deleted IS NULL)" + driveFilter, p, Long.class));
        long unplacedReady = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " + popFilter +
                "AND COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id AND (:s IS NULL OR pr.season_id = :s) ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") = 'PLACEMENTS' " +
                "AND l.resume_url IS NOT NULL AND l.resume_url <> '' AND r.cgpa IS NOT NULL AND r.tenth_pct IS NOT NULL " +
                "AND NOT EXISTS (SELECT 1 FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.learner_id = l.id AND o.status IN " + placed + ")", p, Long.class));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("registered", registered);
        out.put("placedUnique", placedUnique);
        out.put("acceptedUnique", acceptedUnique);
        out.put("offers", offers);
        out.put("liveDrives", live);
        out.put("unplacedReady", unplacedReady);
        out.put("placedPct", registered == 0 ? 0 : Math.round(placedUnique * 1000.0 / registered) / 10.0);
        return out;
    }

    /**
     * Compensation intelligence uses one student's BEST offer, exactly like the CTC report.
     * Stipend-only/internship records without a positive ctc_lpa are excluded. The Home dashboard
     * and Reports therefore cannot disagree on median/highest/average CTC.
     */
    public Map<String, Object> compensationSnapshot(Integer collegeId, Long seasonId) {
        String placed = placedStatuses(collegeId);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId);
        List<Map<String, Object>> best = jdbc.queryForList(
                "SELECT a.learner_id AS learnerId, MAX(o.ctc_lpa) AS ctc " +
                "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND o.status IN " + placed +
                " AND o.ctc_lpa IS NOT NULL AND o.ctc_lpa > 0 GROUP BY a.learner_id", p);
        return compensationSummary(best, true);
    }

    private Map<String, Object> compensationSummary(List<Map<String, Object>> best, boolean includeBands) {
        List<Double> values = new ArrayList<>();
        for (Map<String, Object> row : best) {
            Object raw = row.get("ctc");
            if (raw instanceof Number) values.add(((Number) raw).doubleValue());
        }
        Collections.sort(values);

        double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double median = values.isEmpty() ? 0
                : values.size() % 2 == 1
                ? values.get(values.size() / 2)
                : (values.get(values.size() / 2 - 1) + values.get(values.size() / 2)) / 2;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("highest", values.isEmpty() ? 0 : values.get(values.size() - 1));
        out.put("average", Math.round(average * 100) / 100.0);
        out.put("median", Math.round(median * 100) / 100.0);
        out.put("students", values.size());

        if (includeBands) {
            long under4 = values.stream().filter(v -> v < 4).count();
            long fourTo6 = values.stream().filter(v -> v >= 4 && v < 6).count();
            long sixTo10 = values.stream().filter(v -> v >= 6 && v < 10).count();
            long tenTo20 = values.stream().filter(v -> v >= 10 && v < 20).count();
            long twentyPlus = values.stream().filter(v -> v >= 20).count();
            List<Map<String, Object>> bands = new ArrayList<>();
            bands.add(Map.of("label", "<4 LPA", "count", under4));
            bands.add(Map.of("label", "4–6 LPA", "count", fourTo6));
            bands.add(Map.of("label", "6–10 LPA", "count", sixTo10));
            bands.add(Map.of("label", "10–20 LPA", "count", tenTo20));
            bands.add(Map.of("label", "20+ LPA", "count", twentyPlus));
            out.put("bands", bands);
        }
        return out;
    }

    /**
     * Compares placement pace at the SAME elapsed day of two consecutive placement seasons.
     * This deliberately avoids comparing an in-progress season against the previous season's
     * final total, which makes a normal mid-season dashboard look artificially weak.
     */
    public Map<String, Object> seasonVelocity(Integer collegeId, Long seasonId) {
        return seasonVelocity(collegeId, seasonId, LocalDate.now());
    }

    Map<String, Object> seasonVelocity(Integer collegeId, Long seasonId, LocalDate today) {
        if (seasonId == null) return null;

        MapSqlParameterSource selectedParams = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId);
        List<Map<String, Object>> selectedRows = jdbc.queryForList(
                "SELECT id, name, start_date AS startDate, end_date AS endDate FROM placement_season WHERE id = :s AND college_id = :c",
                selectedParams);
        if (selectedRows.isEmpty() || selectedRows.get(0).get("startDate") == null) return null;

        Map<String, Object> selected = selectedRows.get(0);
        LocalDate selectedStart = toLocalDate(selected.get("startDate"));
        LocalDate selectedEnd = toLocalDate(selected.get("endDate"));
        if (selectedStart == null || today.isBefore(selectedStart)) return null;

        LocalDate asOf = selectedEnd != null && selectedEnd.isBefore(today) ? selectedEnd : today;
        long elapsedDays = java.time.temporal.ChronoUnit.DAYS.between(selectedStart, asOf);

        MapSqlParameterSource previousParams = new MapSqlParameterSource("c", collegeId)
                .addValue("s", seasonId)
                .addValue("start", selectedStart);
        List<Map<String, Object>> previousRows = jdbc.queryForList(
                "SELECT id, name, start_date AS startDate, end_date AS endDate FROM placement_season " +
                "WHERE college_id = :c AND id <> :s AND start_date IS NOT NULL AND start_date < :start " +
                "ORDER BY start_date DESC LIMIT 1",
                previousParams);
        if (previousRows.isEmpty()) return null;

        Map<String, Object> previous = previousRows.get(0);
        LocalDate previousStart = toLocalDate(previous.get("startDate"));
        if (previousStart == null) return null;

        LocalDateTime selectedCutoff = asOf.plusDays(1).atStartOfDay();
        LocalDateTime previousCutoff = previousStart.plusDays(elapsedDays + 1).atStartOfDay();
        long currentPlaced = placedByCutoff(collegeId, seasonId, selectedCutoff);
        long previousPlaced = placedByCutoff(collegeId, ((Number) previous.get("id")).longValue(), previousCutoff);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("elapsedDays", elapsedDays);
        out.put("currentSeasonId", seasonId);
        out.put("currentSeason", String.valueOf(selected.get("name")));
        out.put("previousSeasonId", ((Number) previous.get("id")).longValue());
        out.put("previousSeason", String.valueOf(previous.get("name")));
        out.put("currentPlaced", currentPlaced);
        out.put("previousPlaced", previousPlaced);
        out.put("deltaPlaced", currentPlaced - previousPlaced);
        return out;
    }

    private long placedByCutoff(Integer collegeId, Long seasonId, LocalDateTime cutoffExclusive) {
        String placed = placedStatuses(collegeId);
        String countsAt = rules.rulesFor(collegeId).getCountsAsPlacedAt();
        String eventTime = ("OFFER_ACCEPTED".equals(countsAt) || "ACCEPTED".equals(countsAt))
                ? "COALESCE(o.responded_at, o.released_at, o.created_at)"
                : "COALESCE(o.released_at, o.created_at)";
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId)
                .addValue("s", seasonId)
                .addValue("cutoff", cutoffExclusive);
        return n(jdbc.queryForObject(
                "SELECT COUNT(DISTINCT a.learner_id) FROM job_offer o " +
                "JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND (j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND o.status IN " + placed +
                " AND " + eventTime + " < :cutoff",
                p, Long.class));
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate) return (LocalDate) value;
        if (value instanceof java.sql.Date) return ((java.sql.Date) value).toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }

    private static final String[] FUNNEL_STAGES = {"APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED"};

    /**
     * The Home dashboard's hero visual: the whole season's pipeline, one drive-level funnel
     * (TpoWorkspaceService.funnel) added up across every drive. Same cumulative "ever reached
     * stage X" semantics via job_application_status_history, not a current-status snapshot, for
     * the same reason: a snapshot is non-monotonic and every stage-to-stage conversion number
     * on it would be wrong. seasonId null = every season, matching {@link #stats}.
     */
    public List<Map<String, Object>> seasonFunnel(Integer collegeId, Long seasonId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId);
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) AS applied");
        for (int i = 1; i < FUNNEL_STAGES.length; i++) {
            String stage = FUNNEL_STAGES[i];
            sql.append(", ").append(TpoWorkspaceService.reachedStageSql(stage, "a")).append(" AS ").append(stage.toLowerCase(Locale.ROOT));
        }
        sql.append(" FROM job_application a JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND (a.is_deleted = 0 OR a.is_deleted IS NULL)");
        Map<String, Object> row = jdbc.queryForMap(sql.toString(), p);
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

    // ---------------------------------------------------------------- home
    public Map<String, Object> home(Integer collegeId, Integer facultyId, boolean team, Long seasonId) {
        Map<String, Object> out = new LinkedHashMap<>();
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("f", facultyId).addValue("team", team ? 1 : 0).addValue("s", seasonId);

        out.put("driveDay", jdbc.queryForList(
                "SELECT j.id AS jobId, j.company_name AS company, j.job_title AS title, r.id AS roundId, r.name AS roundName " +
                "FROM job_round r JOIN job j ON j.id = r.job_id WHERE j.college_id = :c AND r.mode = 'ON_CAMPUS' AND DATE(r.scheduled_date) = CURDATE() " +
                "AND j.lifecycle_status = 'PUBLISHED'", p));

        List<Map<String, Object>> cards = new ArrayList<>();
        String mine = " AND (:team = 1 OR j.owner_faculty_id = :f OR j.owner_faculty_id IS NULL) ";
        long reqs = n(jdbc.queryForObject("SELECT COUNT(*) FROM job j WHERE j.college_id = :c AND j.lifecycle_status = 'REQUEST'" + mine, p, Long.class));
        if (reqs > 0) cards.add(card("DRIVE_REQUESTS", "Drive requests to review", reqs, "/tpo/drives?tab=requests", 2));
        long access = n(jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_college_access WHERE college_id = :c AND verification = 'PENDING'", p, Long.class));
        if (access > 0) cards.add(card("RECRUITER_ACCESS", "Recruiters waiting for your approval", access, "/tpo/settings?tab=recruiters", 2));
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name, (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status <> 'WITHDRAWN') AS applicants " +
                "FROM job j WHERE j.college_id = :c AND j.lifecycle_status = 'PUBLISHED' AND j.application_deadline < UTC_TIMESTAMP() " +
                "AND NOT EXISTS (SELECT 1 FROM tpo_share_link sl WHERE sl.job_id = j.id AND sl.revoked_at IS NULL)" + mine + " HAVING applicants > 0", p)) {
            cards.add(driveCard("SHARE_APPLICANTS", "Share " + d.get("applicants") + " applicants with " + d.get("name"), (Integer) d.get("id"), 1));
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name FROM job j WHERE j.college_id = :c AND j.lifecycle_status = 'PUBLISHED' " +
                "AND DATE(CONVERT_TZ(j.application_deadline, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30'))" + mine, p)) {
            cards.add(driveCard("DEADLINE_TODAY", "Deadline today: " + d.get("name") + " (remind non-applicants)", (Integer) d.get("id"), 0));
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name, COUNT(*) AS c FROM round_slot s JOIN job_round r ON r.id = s.round_id " +
                "JOIN job j ON j.id = r.job_id WHERE j.college_id = :c AND s.proposed_by = 'RECRUITER' AND s.status = 'PROPOSED'" + mine + " GROUP BY j.id, j.company_name, j.job_title", p)) {
            cards.add(driveCard("SLOTS_TO_CONFIRM", "Confirm slots for " + d.get("name"), (Integer) d.get("id"), 1));
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name, r.name AS roundName, COUNT(*) AS c, " +
                "TIMESTAMPDIFF(HOUR, MIN(x.submitted_at), NOW()) AS waitingHours FROM round_result x JOIN job_round r ON r.id = x.round_id " +
                "JOIN job j ON j.id = r.job_id WHERE j.college_id = :c AND x.applied_at IS NULL AND x.superseded_by IS NULL" + mine +
                " GROUP BY j.id, j.company_name, j.job_title, r.id, r.name", p)) {
            Map<String, Object> c = driveCard("RESULTS_READY", d.get("roundName") + " results ready to apply for " + d.get("name") + " (waiting " + d.get("waitingHours") + " h)", (Integer) d.get("id"), 1);
            c.put("count", d.get("c"));
            cards.add(c);
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name, COUNT(*) AS c FROM job_offer o JOIN job_application a ON a.id = o.application_id " +
                "JOIN job j ON j.id = a.job_id WHERE j.college_id = :c AND o.status IN ('SELECTED','PENDING_VERIFICATION')" + mine + " GROUP BY j.id, j.company_name, j.job_title", p)) {
            Map<String, Object> c = driveCard("SELECTIONS_TO_VERIFY", "Verify " + d.get("c") + " selections for " + d.get("name"), (Integer) d.get("id"), 1);
            c.put("count", d.get("c"));
            cards.add(c);
        }
        long requests = n(jdbc.queryForObject("SELECT COUNT(*) FROM student_request r JOIN learner l ON l.id = r.learner_id WHERE l.college_id = :c AND r.status = 'PENDING'", p, Long.class));
        if (requests > 0) {
            // Urgent: already escalated, or the drive's next round is within 24 hours (a withdrawal before tomorrow's interview).
            long urgentRequests = n(jdbc.queryForObject("SELECT COUNT(*) FROM student_request r JOIN learner l ON l.id = r.learner_id WHERE l.college_id = :c AND r.status = 'PENDING' " +
                    "AND (r.escalate_at IS NOT NULL OR EXISTS (SELECT 1 FROM job_round jr WHERE jr.job_id = r.job_id AND jr.status <> 'COMPLETED' AND jr.scheduled_date > NOW() AND jr.scheduled_date < NOW() + INTERVAL 24 HOUR))", p, Long.class));
            cards.add(card("REQUESTS", urgentRequests > 0 ? "Student requests to decide (" + urgentRequests + " urgent: a round within 24 hours)" : "Student requests to decide",
                    requests, "/tpo/requests", urgentRequests > 0 ? 0 : 1));
        }
        long msgs = n(jdbc.queryForObject("SELECT COUNT(*) FROM tpo_message_thread t WHERE t.college_id = :c AND (SELECT m.sender_type FROM tpo_message m WHERE m.thread_id = t.id AND m.kind = 'MESSAGE' ORDER BY m.id DESC LIMIT 1) = 'RECRUITER' " +
                "AND t.last_message_at < NOW() - INTERVAL 1 DAY", p, Long.class));
        if (msgs > 0) cards.add(card("RECRUITER_MESSAGES", "Recruiter messages waiting more than a day", msgs, "/tpo/messages", 1));
        long fu = n(jdbc.queryForObject("SELECT COUNT(*) FROM follow_up f JOIN recruiter_lead l ON l.id = f.recruiter_lead_id WHERE l.college_id = :c AND f.done_at IS NULL AND f.due_at <= NOW() " +
                "AND (:team = 1 OR l.owner_faculty_id = :f OR l.owner_faculty_id IS NULL)", p, Long.class));
        if (fu > 0) cards.add(card("FOLLOW_UPS", "Follow-ups due", fu, "/tpo/recruiters?due=1", 1));
        // Registration is per batch: batches with eligible students that were never invited cannot register, so they cannot apply.
        List<Map<String, Object>> working = new ArrayList<>();
        if (placementEligibility != null) {
            @SuppressWarnings("unchecked") List<Map<String, Object>> all = (List<Map<String, Object>>) placementEligibility.overview(collegeId, placedStatuses(collegeId)).get("batches");
            for (Map<String, Object> b : all) if ("IN_PLACEMENTS".equals(b.get("state"))) working.add(b);
            long notInvited = 0, waiting = 0;
            for (Map<String, Object> b : working) if (b.get("invitedAt") == null) { notInvited++; waiting += n(b.get("eligible")); }
            if (notInvited > 0) {
                cards.add(card("REGISTRATION_CLOSED", "Invite " + notInvited + " batch" + (notInvited == 1 ? "" : "es") + " to register: " + waiting + " eligible students can't register yet",
                        waiting, "/tpo/batches", 0));
            }
        }
        // A live drive with no application deadline never closes, so its applicants are never shared and nothing moves.
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name FROM job j WHERE j.college_id = :c AND j.lifecycle_status = 'PUBLISHED' " +
                "AND j.application_deadline IS NULL AND (j.is_deleted = 0 OR j.is_deleted IS NULL)" + mine + " ORDER BY j.id DESC", p)) {
            Map<String, Object> c = driveCard("NO_DEADLINE", "Set an application deadline for " + d.get("name"), (Integer) d.get("id"), 1);
            c.put("link", "/tpo/drives/" + d.get("id") + "/edit");
            cards.add(c);
        }
        // Applications close in the next three days: the last chance to remind students who have not applied (today has its own card).
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, CONCAT(j.company_name, ' · ', j.job_title) AS name, DATEDIFF(DATE(CONVERT_TZ(j.application_deadline, '+00:00', '+05:30')), DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30'))) AS days, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants " +
                "FROM job j WHERE j.college_id = :c AND j.lifecycle_status = 'PUBLISHED' AND (j.is_deleted = 0 OR j.is_deleted IS NULL) " +
                "AND DATE(CONVERT_TZ(j.application_deadline, '+00:00', '+05:30')) > DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) AND DATE(CONVERT_TZ(j.application_deadline, '+00:00', '+05:30')) <= DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) + INTERVAL 3 DAY" + mine, p)) {
            long days = n(d.get("days"));
            cards.add(driveCard("CLOSING_SOON", "Applications close " + (days == 1 ? "tomorrow" : "in " + days + " days") + " for " + d.get("name")
                    + " (" + d.get("applicants") + " applied): remind students who have not", (Integer) d.get("id"), 1));
        }
        cards.sort(Comparator.comparingInt(c -> (Integer) c.get("priority")));
        out.put("needsYou", cards);

        out.put("followUps", jdbc.queryForList(
                "SELECT f.id, f.due_at AS dueAt, f.note, l.id AS recruiterLeadId, l.name, l.company_name AS company, l.phone_norm AS phone, (f.due_at < NOW()) AS overdue " +
                "FROM follow_up f JOIN recruiter_lead l ON l.id = f.recruiter_lead_id WHERE l.college_id = :c AND f.done_at IS NULL AND f.due_at <= NOW() + INTERVAL 1 DAY " +
                "AND (:team = 1 OR l.owner_faculty_id = :f OR l.owner_faculty_id IS NULL) ORDER BY f.due_at LIMIT 20", p));
        out.put("numbers", stats(collegeId, seasonId));
        out.put("compensation", compensationSnapshot(collegeId, seasonId));
        out.put("seasonVelocity", seasonVelocity(collegeId, seasonId));
        out.put("funnel", seasonFunnel(collegeId, seasonId));
        out.put("thisWeek", calendar(collegeId, LocalDate.now(), LocalDate.now().plusDays(7), false).stream()
                .filter(e -> !"FOLLOW_UP".equals(e.get("type")) && !"BLOCKED".equals(e.get("type"))).toList());
        // One grouped query (it used to run two sub-queries per student). A blank department is "Unknown", like a missing one.
        out.put("byBranch", jdbc.queryForList(
                "SELECT COALESCE(NULLIF(TRIM(l.department), ''), 'Unknown') AS branch, " +
                "  COALESCE(SUM(COALESCE(rg.choice, CASE WHEN ap.learner_id IS NOT NULL THEN 'PLACEMENTS' END) = 'PLACEMENTS'), 0) AS registered, " +
                "  COALESCE(SUM(pl.learner_id IS NOT NULL), 0) AS placed " +
                "FROM learner l " +
                "LEFT JOIN (SELECT pr.learner_id, pr.choice FROM placement_registration pr " +
                "           JOIN (SELECT learner_id, MAX(id) AS mid FROM placement_registration GROUP BY learner_id) last ON last.mid = pr.id) rg ON rg.learner_id = l.id " +
                "LEFT JOIN (SELECT DISTINCT learner_id FROM job_application WHERE is_deleted = 0 OR is_deleted IS NULL) ap ON ap.learner_id = l.id " +
                "LEFT JOIN (SELECT DISTINCT a.learner_id FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE o.status IN " + placedStatuses(collegeId) + ") pl ON pl.learner_id = l.id " +
                "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
                "GROUP BY COALESCE(NULLIF(TRIM(l.department), ''), 'Unknown')", p));
        List<Map<String, Object>> checklist = new ArrayList<>();
        checklist.add(step("Decide who is in placements", n(jdbc.queryForObject("SELECT COUNT(*) FROM placement_eligibility WHERE college_id = :c AND status = 'ELIGIBLE'", p, Long.class)) > 0, "/tpo/batches"));
        checklist.add(step("Import academic details", n(jdbc.queryForObject("SELECT COUNT(*) FROM learner_academic_record r JOIN learner l ON l.id = r.learner_id WHERE l.college_id = :c AND r.source = 'VERIFIED'", p, Long.class)) > 0, "/tpo/students"));
        checklist.add(step("Choose the placement rules", n(jdbc.queryForObject("SELECT COUNT(*) FROM college_placement_rules WHERE college_id = :c", p, Long.class)) > 0, "/tpo/settings#rules"));
        checklist.add(step("Invite a batch to register", n(jdbc.queryForObject("SELECT COUNT(*) FROM placement_batch WHERE college_id = :c AND invited_at IS NOT NULL", p, Long.class)) > 0, "/tpo/batches"));
        checklist.add(step("Add your first recruiter", n(jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c", p, Long.class)) > 0, "/tpo/recruiters"));
        checklist.add(step("Pick your team", n(jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_member WHERE college_id = :c", p, Long.class)) > 0, "/tpo/settings#team"));
        out.put("checklist", checklist);
        out.put("batches", working); // Home per batch: the batches in placements and where each is on the journey
        out.put("companyFunnel", companyFunnel(collegeId, seasonId));
        return out;
    }

    // ---------------------------------------------------------------- company funnel story (HOME-17)
    /**
     * RecruiterLeads → Active conversations → Drives → Offers → Hires — the company-side journey, not
     * shown anywhere on Home before. RecruiterLeads and "active conversations" are season-agnostic (the
     * CRM is; a recruiter lead from last season who comes back this season is still the same relationship),
     * Drives/Offers/Hires follow the season filter like every other Home number.
     * "Active conversations" mirrors TpoRecruiterLeadsHubService's own stage derivation (never typed as a
     * stage in the table, always worked out from facts) rather than inventing a separate
     * definition: anything not NOT_NOW that has moved past a bare "New" record - contacted,
     * invited, joined, or has any real (non-system) activity logged.
     */
    public Map<String, Object> companyFunnel(Integer collegeId, Long seasonId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId);
        long recruiterLeads = n(jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c", p, Long.class));
        long active = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM recruiter_lead l WHERE l.college_id = :c AND l.manual_stage <> 'NOT_NOW' AND (" +
                "l.manual_stage = 'CONTACTED' OR l.invite_sent_at IS NOT NULL OR l.recruiter_id IS NOT NULL OR " +
                "EXISTS (SELECT 1 FROM recruiter_lead_activity a WHERE a.recruiter_lead_id = l.id AND a.is_system = 0))", p, Long.class));
        long drives = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM job j WHERE j.college_id = :c AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) " +
                "AND j.lifecycle_status NOT IN ('REJECTED', 'SENT_BACK', 'CANCELLED') AND (j.is_deleted = 0 OR j.is_deleted IS NULL)", p, Long.class));
        Map<String, Object> stats = stats(collegeId, seasonId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("recruiterLeads", recruiterLeads);
        out.put("activeConversations", Math.min(active, recruiterLeads));
        out.put("drives", drives);
        out.put("offers", stats.get("offers"));
        out.put("hires", stats.get("placedUnique"));
        return out;
    }

    private static Map<String, Object> card(String type, String title, long count, String link, int priority) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type); m.put("title", title); m.put("count", count); m.put("link", link); m.put("priority", priority);
        return m;
    }
    private static Map<String, Object> driveCard(String type, String title, Integer jobId, int priority) {
        Map<String, Object> m = card(type, title, 1, "/tpo/drives/" + jobId, priority);
        m.put("jobId", jobId);
        return m;
    }
    private static Map<String, Object> step(String label, boolean done, String link) {
        return Map.of("label", label, "done", done, "link", link);
    }

    // ---------------------------------------------------------------- calendar
    /** Everything dated in [from, to]: rounds, talks, deadlines, follow-ups, blocked dates. */
    public List<Map<String, Object>> calendar(Integer collegeId, LocalDate from, LocalDate to, boolean includeFollowUps) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("from", from).addValue("to", to.plusDays(1));
        List<Map<String, Object>> ev = new ArrayList<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.kind, r.name, r.scheduled_date AS startsAt, r.mode, r.venue, j.id AS jobId, j.company_name AS company, j.job_title AS title, j.owner_faculty_id AS ownerId " +
                "FROM job_round r JOIN job j ON j.id = r.job_id WHERE j.college_id = :c AND r.scheduled_date >= :from AND r.scheduled_date < :to " +
                "AND j.lifecycle_status IN ('DRAFT','PUBLISHED') AND (j.is_deleted = 0 OR j.is_deleted IS NULL)", p)) {
            Map<String, Object> e = new LinkedHashMap<>(r);
            e.put("type", "TALK".equals(r.get("kind")) ? "TALK" : "ROUND");
            e.put("title", r.get("company") + " · " + r.get("name"));
            e.put("draggable", false);
            ev.add(e);
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id AS jobId, j.company_name AS company, j.job_title AS title, j.application_deadline AS startsAt, j.owner_faculty_id AS ownerId FROM job j " +
                "WHERE j.college_id = :c AND j.application_deadline >= :from AND j.application_deadline < :to AND j.lifecycle_status = 'PUBLISHED'", p)) {
            Map<String, Object> e = new LinkedHashMap<>(d);
            e.put("type", "DEADLINE"); e.put("title", "Deadline: " + d.get("company")); e.put("draggable", false);
            ev.add(e);
        }
        if (includeFollowUps) {
            for (Map<String, Object> f : jdbc.queryForList(
                    "SELECT f.id, f.due_at AS startsAt, f.note, l.id AS recruiterLeadId, l.name AS person, l.company_name AS company, l.owner_faculty_id AS ownerId FROM follow_up f " +
                    "JOIN recruiter_lead l ON l.id = f.recruiter_lead_id WHERE l.college_id = :c AND f.done_at IS NULL AND f.due_at >= :from AND f.due_at < :to", p)) {
                Map<String, Object> e = new LinkedHashMap<>(f);
                e.put("type", "FOLLOW_UP"); e.put("title", "Follow up: " + f.get("person")); e.put("draggable", true);
                ev.add(e);
            }
        }
        for (Map<String, Object> b : blockedDates(collegeId)) {
            LocalDate d = LocalDate.parse(String.valueOf(b.get("date")));
            if (!d.isBefore(from) && !d.isAfter(to)) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("type", "BLOCKED"); e.put("title", b.get("label") == null ? "Blocked" : String.valueOf(b.get("label")));
                e.put("startsAt", d.atStartOfDay()); e.put("draggable", false);
                ev.add(e);
            }
        }
        ev.sort(Comparator.comparing(e -> String.valueOf(e.get("startsAt"))));
        return ev;
    }

    /** Blocked (exam) dates across the college's seasons: [{date, label}]. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> blockedDates(Integer collegeId) {
        List<String> raw = jdbc.queryForList("SELECT blocked_dates FROM placement_season WHERE college_id = :c AND blocked_dates IS NOT NULL",
                new MapSqlParameterSource("c", collegeId), String.class);
        List<Map<String, Object>> out = new ArrayList<>();
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        for (String r : raw) {
            try { for (Object o : om.readValue(r, List.class)) { Map<String, Object> m = (Map<String, Object>) o; if (m.get("date") != null) out.add(m); } }
            catch (Exception ignored) { /* a malformed value must not break the calendar */ }
        }
        return out;
    }

    public Map<String, Object> blockedCheck(Integer collegeId, LocalDate date) {
        for (Map<String, Object> b : blockedDates(collegeId)) {
            if (date.toString().equals(String.valueOf(b.get("date")))) return Map.of("blocked", true, "label", b.get("label") == null ? "Blocked date" : b.get("label"));
        }
        return Map.of("blocked", false);
    }

    // ---------------------------------------------------------------- reports
    public static final List<String> REPORTS = List.of("placement-summary", "by-branch", "by-company", "ctc", "unplaced", "offers-acceptance", "joining-status", "recruiter-leads", "failure-reasons", "accreditation", "outcomes");

    public Map<String, Object> report(Integer collegeId, String name, Long seasonId, String batch, String branch, String company, String mode, String category) {
        return report(collegeId, name, seasonId, batch, branch, company, mode, category, null);
    }

    /** batchId: only students of this Academic Setup batch (reports per batch); null = every batch. */
    public Map<String, Object> report(Integer collegeId, String name, Long seasonId, String batch, String branch, String company, String mode, String category, Long batchId) {
        if (!REPORTS.contains(name)) throw new IllegalArgumentException("Not found");
        String placed = placedStatuses(collegeId);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("s", seasonId).addValue("b", batch).addValue("bid", batchId)
                .addValue("br", branch).addValue("co", company).addValue("m", mode).addValue("cat", category);
        String filter = " AND (:s IS NULL OR j.season_id = :s OR (j.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1))) AND (:b IS NULL OR r.batch = :b) AND (:bid IS NULL OR l.class_id IN (SELECT cx.id FROM class cx WHERE cx.batch_id = :bid)) AND (:br IS NULL OR l.department = :br) " +
                "AND (:co IS NULL OR LOWER(j.company_name) = LOWER(:co)) AND (:m IS NULL OR j.drive_mode = :m) AND (:cat IS NULL OR j.category = :cat) ";
        String from = " FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id JOIN learner l ON l.id = a.learner_id " +
                "LEFT JOIN learner_academic_record r ON r.learner_id = l.id WHERE j.college_id = :c ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", name);
        // unique students placed and total offers, scoped to the same filters as the table below -
        // this used to always pass only (collegeId, seasonId), so filtering the table to one
        // branch/company still showed whole-college headline numbers (one of the most serious
        // trust issues in the report UI).
        out.put("stats", stats(collegeId, seasonId, batch, branch, company, mode, category, batchId));
        switch (name) {
            case "placement-summary" -> out.put("rows", jdbc.queryForList(
                    "SELECT o.status AS status, COUNT(*) AS offers, COUNT(DISTINCT a.learner_id) AS students " + from + filter + " GROUP BY o.status", p));
            case "by-branch" -> {
                // Every branch with students looking for a job (not only the ones with offers): registered, placed, the rate and the pay.
                Map<String, Map<String, Object>> byBranch = new LinkedHashMap<>();
                jdbc.query("SELECT COALESCE(l.department, 'Unknown') AS branch, COUNT(*) AS n FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                        "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) AND (:br IS NULL OR l.department = :br) AND (:b IS NULL OR r.batch = :b) " +
                        "AND (:bid IS NULL OR l.class_id IN (SELECT cx.id FROM class cx WHERE cx.batch_id = :bid)) " +
                        "AND COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") = 'PLACEMENTS' " +
                        "GROUP BY l.department", p, rs -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("branch", rs.getString("branch")); m.put("registered", rs.getLong("n")); m.put("placed", 0L); m.put("offers", 0L); m.put("avgCtc", null); m.put("maxCtc", null);
                    byBranch.put(rs.getString("branch"), m);
                });
                for (Map<String, Object> r : jdbc.queryForList(
                        "SELECT COALESCE(l.department, 'Unknown') AS branch, COUNT(DISTINCT a.learner_id) AS placed, COUNT(*) AS offers, ROUND(AVG(NULLIF(o.ctc_lpa, 0)), 2) AS avgCtc, MAX(o.ctc_lpa) AS maxCtc " + from + filter + " AND o.status IN " + placed + " GROUP BY l.department", p)) {
                    Map<String, Object> m = byBranch.computeIfAbsent((String) r.get("branch"), k -> { Map<String, Object> x = new LinkedHashMap<>(); x.put("branch", k); x.put("registered", 0L); return x; });
                    m.put("placed", r.get("placed")); m.put("offers", r.get("offers")); m.put("avgCtc", r.get("avgCtc")); m.put("maxCtc", r.get("maxCtc"));
                }
                List<Map<String, Object>> rows = new ArrayList<>(byBranch.values());
                for (Map<String, Object> m : rows) {
                    long reg = n(m.get("registered")); long pl = n(m.get("placed"));
                    m.put("placedPct", reg == 0 ? null : Math.round(pl * 1000.0 / reg) / 10.0);
                }
                rows.sort((x, y) -> Long.compare(n(y.get("placed")), n(x.get("placed"))));
                out.put("rows", rows);
            }
            case "by-company" -> {
                // One company however it was typed ("Infosys", "Infosys Ltd"); drives that ran, students who applied, placed, pay.
                Map<String, Map<String, Object>> byCompany = new LinkedHashMap<>();
                java.util.function.Function<String, Map<String, Object>> companyRow = (cn) -> byCompany.computeIfAbsent(TpoRecruiterLeadsHubService.companyKey(cn), k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("company", cn == null ? "Company not set" : cn.trim()); m.put("drives", 0L); m.put("applied", 0L); m.put("placed", 0L); m.put("offers", 0L);
                    m.put("avgCtc", null); m.put("maxCtc", null); m.put("_sum", 0.0); m.put("_n", 0L);
                    return m;
                });
                String driveOnly = " AND (:co IS NULL OR LOWER(j.company_name) = LOWER(:co)) AND (:m IS NULL OR j.drive_mode = :m) AND (:cat IS NULL OR j.category = :cat) ";
                for (Map<String, Object> r : jdbc.queryForList("SELECT j.company_name AS company, COUNT(DISTINCT j.id) AS drives, COUNT(DISTINCT a.learner_id) AS applied " +
                        "FROM job j LEFT JOIN job_application a ON a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                        "WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) AND j.lifecycle_status IN ('PUBLISHED','CLOSED') " + driveOnly + "GROUP BY j.company_name", p)) {
                    Map<String, Object> m = companyRow.apply((String) r.get("company"));
                    m.put("drives", n(m.get("drives")) + n(r.get("drives"))); m.put("applied", n(m.get("applied")) + n(r.get("applied")));
                }
                for (Map<String, Object> r : jdbc.queryForList("SELECT j.company_name AS company, COUNT(DISTINCT a.learner_id) AS placed, COUNT(*) AS offers, " +
                        "SUM(NULLIF(o.ctc_lpa, 0)) AS sumCtc, COUNT(NULLIF(o.ctc_lpa, 0)) AS nCtc, MAX(o.ctc_lpa) AS maxCtc " + from + filter + " AND o.status IN " + placed + " GROUP BY j.company_name", p)) {
                    Map<String, Object> m = companyRow.apply((String) r.get("company"));
                    m.put("placed", n(m.get("placed")) + n(r.get("placed"))); m.put("offers", n(m.get("offers")) + n(r.get("offers")));
                    m.put("_sum", (Double) m.get("_sum") + (r.get("sumCtc") == null ? 0 : ((Number) r.get("sumCtc")).doubleValue()));
                    m.put("_n", n(m.get("_n")) + n(r.get("nCtc")));
                    Object mx = r.get("maxCtc");
                    if (mx != null && (m.get("maxCtc") == null || ((Number) mx).doubleValue() > ((Number) m.get("maxCtc")).doubleValue())) m.put("maxCtc", mx);
                }
                List<Map<String, Object>> rows = new ArrayList<>(byCompany.values());
                for (Map<String, Object> m : rows) {
                    long k = n(m.remove("_n")); double sum = (Double) m.remove("_sum");
                    m.put("avgCtc", k == 0 ? null : Math.round(sum / k * 100) / 100.0);
                }
                rows.removeIf(m -> n(m.get("drives")) == 0 && n(m.get("placed")) == 0);
                rows.sort((x, y) -> Long.compare(n(y.get("placed")), n(x.get("placed"))) != 0 ? Long.compare(n(y.get("placed")), n(x.get("placed"))) : Long.compare(n(y.get("applied")), n(x.get("applied"))));
                out.put("rows", rows);
            }
            case "ctc" -> {
                // Each student's best offer; internships (stipend-only, no CTC) never count.
                List<Map<String, Object>> best = jdbc.queryForList(
                        "SELECT a.learner_id AS learnerId, MAX(o.ctc_lpa) AS ctc " + from + filter + " AND o.status IN " + placed + " AND o.ctc_lpa IS NOT NULL AND o.ctc_lpa > 0 GROUP BY a.learner_id", p);
                Map<String, Object> summary = compensationSummary(best, true);
                out.put("bands", summary.remove("bands"));
                out.put("rows", List.of(summary));
            }
            case "unplaced" -> out.put("rows", withMarks(jdbc.queryForList(
                    "SELECT l.id AS learnerId, TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name,''))) AS name, l.roll_number AS roll, l.department AS branch, bt.batch_name AS batchName, " +
                    "  (l.resume_url IS NOT NULL AND l.resume_url <> '') AS hasResume, " +
                    "  (SELECT COUNT(*) FROM job_application ap WHERE ap.learner_id = l.id AND (ap.is_deleted = 0 OR ap.is_deleted IS NULL)) AS applications, " +
                    "  (SELECT COUNT(*) FROM job_application ap WHERE ap.learner_id = l.id AND (ap.is_deleted = 0 OR ap.is_deleted IS NULL) AND ap.application_status IN ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')) AS inProgress, " +
                    "  (SELECT MAX(ap.applied_at) FROM job_application ap WHERE ap.learner_id = l.id AND (ap.is_deleted = 0 OR ap.is_deleted IS NULL)) AS lastApplied " +
                    "FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id " +
                    "WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
                    "AND (:br IS NULL OR l.department = :br) AND (:b IS NULL OR r.batch = :b) AND (:bid IS NULL OR l.class_id IN (SELECT cx.id FROM class cx WHERE cx.batch_id = :bid)) " +
                    "AND COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id AND (:s IS NULL OR pr.season_id = :s) ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") = 'PLACEMENTS' " +
                    // Season-scoped like every other report: unfiltered this checked "ever placed,
                    // any season, ever" - a student placed last year would silently never appear
                    // in this year's Unplaced report even though they're newly unplaced this season.
                    "AND NOT EXISTS (SELECT 1 FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job pj ON pj.id = a.job_id " +
                    "WHERE a.learner_id = l.id AND o.status IN " + placed + " AND (:s IS NULL OR pj.season_id = :s OR (pj.season_id IS NULL AND EXISTS (SELECT 1 FROM placement_season cur WHERE cur.id = :s AND cur.is_current = 1)))) ORDER BY l.first_name", p)));
            case "offers-acceptance" -> {
                List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT j.company_name AS company, SUM(o.status IN ('RELEASED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN','REVOKED')) AS released, SUM(o.status = 'RELEASED') AS waiting, " +
                    "SUM(o.status = 'ACCEPTED') AS accepted, SUM(o.status = 'DECLINED') AS declined, SUM(o.status = 'EXPIRED') AS expired, SUM(o.status = 'WITHDRAWN') AS withdrawn " +
                    from + filter + " GROUP BY j.company_name ORDER BY released DESC", p);
                // Acceptance: of the offers the students have answered (accepted, declined, expired), how many were accepted.
                for (Map<String, Object> m : rows) {
                    long answered = n(m.get("accepted")) + n(m.get("declined")) + n(m.get("expired"));
                    m.put("acceptancePct", answered == 0 ? null : Math.round(n(m.get("accepted")) * 1000.0 / answered) / 10.0);
                }
                out.put("rows", rows);
            }
            // COUNT(DISTINCT a.learner_id), not COUNT(*): the row is labelled "students" and must
            // count unique students, not accepted offers - a learner holding two accepted offers
            // (e.g. after a cascade/waitlist edge case) was previously counted twice.
            case "joining-status" -> out.put("rows", jdbc.queryForList(
                    "SELECT j.company_name AS company, COUNT(DISTINCT a.learner_id) AS accepted, COUNT(DISTINCT CASE WHEN o.joining_status = 'JOINED' THEN a.learner_id END) AS joined, " +
                    "COUNT(DISTINCT CASE WHEN o.joining_status = 'DEFERRED' THEN a.learner_id END) AS deferred, COUNT(DISTINCT CASE WHEN o.joining_status = 'NOT_JOINED' THEN a.learner_id END) AS notJoined, " +
                    "COUNT(DISTINCT CASE WHEN o.joining_status IS NULL THEN a.learner_id END) AS notRecorded " + from + filter + " AND o.status = 'ACCEPTED' GROUP BY j.company_name ORDER BY accepted DESC", p));
            case "failure-reasons" -> out.put("rows", jdbc.queryForList(
                    // Who did not get through each round, and why: "Not cleared" results by reason, and no-shows (Absent). The share is
                    // of everyone with a result in that round, in that branch. Every filter applies (it used to ignore them all).
                    "SELECT COALESCE(l.department, 'Unknown') AS branch, j.company_name AS company, jr.name AS round, " +
                    "  CASE WHEN rr.outcome = 'ABSENT' THEN 'Absent (no-show)' ELSE COALESCE(rr.reason_category, 'Reason not given') END AS reason, COUNT(*) AS students, " +
                    "  ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM round_result x JOIN job_application xa ON xa.id = x.application_id JOIN learner xl ON xl.id = xa.learner_id " +
                    "     WHERE x.round_id = rr.round_id AND xl.department <=> l.department AND x.applied_at IS NOT NULL), 0) AS pctOfRound " +
                    "FROM round_result rr JOIN job_application a ON a.id = rr.application_id JOIN learner l ON l.id = a.learner_id JOIN job j ON j.id = a.job_id " +
                    "JOIN job_round jr ON jr.id = rr.round_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                    "WHERE j.college_id = :c AND rr.outcome IN ('FAIL','ABSENT') AND rr.applied_at IS NOT NULL " + filter +
                    "GROUP BY l.department, j.company_name, rr.round_id, jr.name, reason ORDER BY students DESC", p));
            // The page promises "recruiter leads -> invited -> joined -> hired" but the query never actually
            // computed "hired" - mirrors TpoRecruiterLeadsHubService's own per-recruiter lead HIRED_SQL definition
            // (a recruiter lead's company, by recruiter_id once joined or by company name before that),
            // aggregated across every recruiter lead for the college rather than per row.
            case "recruiter-leads" -> {
                // Company by company, counted exactly as Engage counts them: contacts, invited, joined, drives that ran, students placed.
                if (recruiterLeadsHub == null) { out.put("rows", List.of()); break; }
                Map<String, long[]> invite = new HashMap<>();
                for (Map<String, Object> l : recruiterLeadsHub.table(collegeId)) {
                    long[] v = invite.computeIfAbsent(TpoRecruiterLeadsHubService.companyKey((String) l.get("companyName")), k -> new long[3]);
                    v[0]++; if (l.get("inviteSentAt") != null) v[1]++; if (l.get("recruiterId") != null) v[2]++;
                }
                List<Map<String, Object>> rows = new ArrayList<>();
                for (Map<String, Object> c : recruiterLeadsHub.companies(collegeId)) {
                    long[] v = invite.getOrDefault(String.valueOf(c.get("key")), new long[3]);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("company", c.get("name")); m.put("contacts", v[0]); m.put("invited", v[1]); m.put("joined", v[2]);
                    m.put("drives", c.get("drives")); m.put("placed", c.get("studentsHired"));
                    rows.add(m);
                }
                rows.sort((x, y) -> Long.compare(n(y.get("placed")), n(x.get("placed"))) != 0 ? Long.compare(n(y.get("placed")), n(x.get("placed"))) : Long.compare(n(y.get("drives")), n(x.get("drives"))));
                out.put("rows", rows);
            }
            case "accreditation" -> {
                // NAAC 5.2.1 / NIRF: one row per placed student with their best offer (it was one row per offer), the programme as the
                // degree from the profile (with the branch), the batch, the employer and a contact for them, the package and joining.
                List<Map<String, Object>> offers = jdbc.queryForList(
                    "SELECT a.learner_id AS learnerId, TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name,''))) AS studentName, l.roll_number AS rollNumber, " +
                    "l.department AS branch, bt.batch_name AS batch, j.company_name AS employer, o.ctc_lpa AS packageLpa, o.status AS offerStatus, o.joining_status AS joiningStatus, " +
                    "COALESCE((SELECT h.contact_mail FROM recruiter h WHERE h.id = j.recruiter_id), (SELECT tl.email_norm FROM recruiter_lead tl WHERE tl.college_id = j.college_id AND LOWER(TRIM(tl.company_name)) = LOWER(TRIM(j.company_name)) AND tl.email_norm IS NOT NULL ORDER BY tl.recruiter_id IS NULL, tl.id LIMIT 1)) AS employerContact " +
                    from.replace("WHERE j.college_id = :c", "LEFT JOIN class cl ON cl.id = l.class_id LEFT JOIN batch bt ON bt.id = cl.batch_id WHERE j.college_id = :c") +
                    filter + " AND o.status IN " + placed + " ORDER BY l.department, l.first_name, o.ctc_lpa DESC", p);
                Map<Object, Map<String, Object>> best = new LinkedHashMap<>();
                for (Map<String, Object> o : offers) {
                    Map<String, Object> cur = best.get(o.get("learnerId"));
                    double ctc = o.get("packageLpa") == null ? -1 : ((Number) o.get("packageLpa")).doubleValue();
                    double curCtc = cur == null || cur.get("packageLpa") == null ? -1 : ((Number) cur.get("packageLpa")).doubleValue();
                    if (cur == null || ctc > curCtc) best.put(o.get("learnerId"), o);
                }
                List<Map<String, Object>> rows = new ArrayList<>(best.values());
                Map<Integer, Map<String, Object>> marks = academicMarks == null || rows.isEmpty() ? Map.of()
                        : academicMarks.marksForLearners(rows.stream().map(r -> ((Number) r.get("learnerId")).intValue()).toList());
                for (Map<String, Object> r : rows) {
                    Map<String, Object> m = marks.getOrDefault(((Number) r.get("learnerId")).intValue(), Map.of());
                    r.put("programme", m.get("degree") != null ? m.get("degree") : r.get("branch"));
                    r.put("offersHeld", offers.stream().filter(o -> o.get("learnerId").equals(r.get("learnerId"))).count());
                }
                out.put("rows", rows);
            }
            case "outcomes" -> {
                // Every student of the filter (a batch, a branch) with their final outcome, and the count per fixed outcome:
                // what NAAC 5.2 / NIRF ask for (placed, higher studies, entrepreneurship, competitive exams).
                List<Map<String, Object>> students = jdbc.queryForList(
                        "SELECT l.id AS learnerId, TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name,''))) AS name, l.roll_number AS roll, l.department AS branch, " +
                        "bt.batch_name AS batchName FROM learner l LEFT JOIN learner_academic_record r ON r.learner_id = l.id LEFT JOIN class cl ON cl.id = l.class_id " +
                        "LEFT JOIN batch bt ON bt.id = cl.batch_id WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) " +
                        "AND (:br IS NULL OR l.department = :br) AND (:b IS NULL OR r.batch = :b) AND (:bid IS NULL OR cl.batch_id = :bid) ORDER BY l.department, l.first_name", p);
                Map<Integer, PlacementOutcomeService.Outcome> of = outcomes == null ? Map.of() : outcomes.forCollege(collegeId, placed);
                Map<String, Integer> counts = new LinkedHashMap<>();
                PlacementOutcomeService.OUTCOMES.keySet().forEach(k -> counts.put(k, 0));
                for (Map<String, Object> row : students) {
                    PlacementOutcomeService.Outcome o = of.get(((Number) row.get("learnerId")).intValue());
                    if (o == null) continue;
                    row.putAll(o.toMap());
                    counts.merge(o.key(), 1, Integer::sum);
                }
                List<Map<String, Object>> summary = new ArrayList<>();
                counts.forEach((k, n) -> summary.add(Map.of("outcome", k, "outcomeName", PlacementOutcomeService.OUTCOMES.get(k), "students", n)));
                out.put("summary", summary);
                out.put("rows", students);
            }
            default -> throw new IllegalArgumentException("Not found");
        }
        return out;
    }

    /** The Students-page marks on each row (lowest %, 10th, 12th / Diploma, UG; verified or not). */
    private List<Map<String, Object>> withMarks(List<Map<String, Object>> rows) {
        if (academicMarks == null || rows.isEmpty()) return rows;
        Map<Integer, Map<String, Object>> marks = academicMarks.marksForLearners(rows.stream().map(r -> ((Number) r.get("learnerId")).intValue()).toList());
        for (Map<String, Object> r : rows) {
            Map<String, Object> m = marks.getOrDefault(((Number) r.get("learnerId")).intValue(), Map.of());
            r.put("marks", m.getOrDefault("marks", Map.of()));
            r.put("marksVerified", m.get("marksVerified"));
            r.put("hasResume", r.get("hasResume") != null && ((Number) r.get("hasResume")).intValue() == 1);
        }
        return rows;
    }

    // ---------------------------------------------------------------- global search (Ctrl+K)
    /** RecruiterLeads, drives, students and companies matching the text, a few of each. */
    /** Turn what someone typed into a LIKE pattern that matches it literally: % and _ are searched for, not treated as wildcards. */
    static String likeContains(String q) {
        String t = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return "%" + t.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }

    /**
     * The top bar's finder: students (name or roll number), recruiters, companies and drives. A company is found whether it is only a recruiter lead,
     * only a drive, or both (most colleges run drives for companies they never added as recruiter leads).
     */
    public Map<String, Object> search(Integer collegeId, String q) {
        if (q == null || q.trim().length() < 2) return Map.of("recruiterLeads", List.of(), "drives", List.of(), "students", List.of(), "companies", List.of());
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("q", likeContains(q));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("recruiterLeads", jdbc.queryForList("SELECT id, name, company_name AS company FROM recruiter_lead WHERE college_id = :c AND (LOWER(name) LIKE :q ESCAPE '!' OR LOWER(company_name) LIKE :q ESCAPE '!' OR email_norm LIKE :q ESCAPE '!') ORDER BY name LIMIT 5", p));
        out.put("drives", jdbc.queryForList("SELECT id, company_name AS company, job_title AS title, lifecycle_status AS status FROM job WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) " +
                "AND (LOWER(company_name) LIKE :q ESCAPE '!' OR LOWER(job_title) LIKE :q ESCAPE '!') ORDER BY id DESC LIMIT 5", p));
        out.put("students", jdbc.queryForList("SELECT id, id AS learnerId, first_name AS firstName, last_name AS lastName, roll_number AS rollNumber, department AS branch FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) " +
                "AND (LOWER(CONCAT(first_name, ' ', COALESCE(last_name, ''))) LIKE :q ESCAPE '!' OR LOWER(roll_number) LIKE :q ESCAPE '!') ORDER BY first_name LIMIT 5", p));
        out.put("companies", jdbc.queryForList("SELECT name FROM (" +
                "  SELECT company_name AS name FROM recruiter_lead WHERE college_id = :c AND company_name IS NOT NULL AND LOWER(company_name) LIKE :q ESCAPE '!' " +
                "  UNION SELECT company_name AS name FROM job WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND company_name IS NOT NULL AND LOWER(company_name) LIKE :q ESCAPE '!'" +
                ") x ORDER BY name LIMIT 5", p));
        return out;
    }
}
