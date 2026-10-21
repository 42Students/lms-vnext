package com._42students.lms.service.recruiter;

import com._42students.lms.service.tpo.RecruiterDriveWorkService;
import com._42students.lms.service.tpo.TpoWorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read models for the recruiter V2 workspace that are not about a single applicant: the offers on a drive, the company profile,
 * the recruiter's colleagues at this college, and funnel reports. All of it is scoped to one college and, for drives and offers,
 * to the recruiter's own drives. Colleagues are only ever people of the SAME company who hold an active grant at THIS college.
 */
@Service
@RequiredArgsConstructor
public class RecruiterWorkspaceService {

    private final NamedParameterJdbcTemplate jdbc;
    private final RecruiterDriveWorkService work;
    private final TpoWorkspaceService workspace;

    private static long n(Object o) { return o == null ? 0 : ((Number) o).longValue(); }

    /** Offers on one of the recruiter's drives. Names for selected candidates only; never a phone number or email. */
    public List<Map<String, Object>> offers(long recruiterId, Integer collegeId, Integer jobId) {
        work.requireOwn(recruiterId, collegeId, jobId);
        return jdbc.queryForList(
                "SELECT o.id, a.public_ref AS applicantId, TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) AS name, l.roll_number AS roll, " +
                "  o.kind, o.status, o.ctc_lpa AS ctcLpa, o.role_option_name AS roleOption, o.respond_by AS respondBy, o.joining_date AS joiningDate, o.joining_status AS joiningStatus " +
                "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN learner l ON l.id = a.learner_id " +
                "WHERE a.job_id = :j ORDER BY o.id", new MapSqlParameterSource("j", jobId));
    }

    /**
     * The recruiter's own private ratings and notes on a drive's applicants, keyed by the applicant id they were given. Only the
     * author ever reads them back: nothing here is visible to the placement cell, the student or a colleague.
     */
    public List<Map<String, Object>> notes(long recruiterId, Integer collegeId, Integer jobId) {
        work.requireOwn(recruiterId, collegeId, jobId);
        return jdbc.queryForList(
                "SELECT a.public_ref AS applicantId, n.rating, n.note FROM recruiter_applicant_note n JOIN job_application a ON a.id = n.application_id " +
                "WHERE n.recruiter_id = :h AND n.job_id = :j ORDER BY n.id",
                new MapSqlParameterSource("h", recruiterId).addValue("j", jobId));
    }

    /** Saves (or, when both are empty, removes) the recruiter's rating and note on one applicant of their own drive. */
    @org.springframework.transaction.annotation.Transactional
    public void saveNote(long recruiterId, Integer collegeId, Integer jobId, String applicantId, Integer rating, String note) {
        work.requireOwn(recruiterId, collegeId, jobId);
        if (rating != null && (rating < 1 || rating > 5)) throw new IllegalArgumentException("Rating must be 1 to 5");
        String clean = note == null ? null : note.trim();
        if (clean != null && clean.length() > 1000) throw new IllegalArgumentException("A note can be up to 1000 characters");
        if (clean != null && clean.isEmpty()) clean = null;
        List<Integer> app = jdbc.queryForList("SELECT id FROM job_application WHERE job_id = :j AND public_ref = :r AND (is_deleted = 0 OR is_deleted IS NULL)",
                new MapSqlParameterSource("j", jobId).addValue("r", applicantId), Integer.class);
        if (app.isEmpty()) throw new IllegalArgumentException("Applicant " + applicantId + " is not on this drive");
        MapSqlParameterSource p = new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId).addValue("j", jobId).addValue("a", app.get(0))
                .addValue("r", rating).addValue("n", clean);
        if (rating == null && clean == null) {
            jdbc.update("DELETE FROM recruiter_applicant_note WHERE recruiter_id = :h AND application_id = :a", p);
        } else {
            jdbc.update("INSERT INTO recruiter_applicant_note (recruiter_id, college_id, job_id, application_id, rating, note) VALUES (:h, :c, :j, :a, :r, :n) " +
                    "ON DUPLICATE KEY UPDATE rating = VALUES(rating), note = VALUES(note)", p);
        }
    }

    /** The company as students see it. Managed centrally, so read-only here. */
    public Map<String, Object> company(long recruiterId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT c.id, c.name, c.website, c.industry, c.logo_url AS logoUrl, c.verified_by_42 = 1 AS verifiedBy42, " +
                "  (SELECT GROUP_CONCAT(d.domain ORDER BY d.id SEPARATOR ', ') FROM company_domain d WHERE d.company_id = c.id) AS domains " +
                "FROM company c JOIN recruiter u ON u.company_id = c.id " +
                "WHERE u.id = :h AND (c.is_deleted = 0 OR c.is_deleted IS NULL)", new MapSqlParameterSource("h", recruiterId));
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** Colleagues from the same company who can work with THIS college. Nobody from another company, nobody from another college. */
    public List<Map<String, Object>> team(long recruiterId, Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.designation, u.contact_mail AS email, " +
                "  (SELECT COUNT(*) FROM job j WHERE j.recruiter_id = u.id AND j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL)) AS drives " +
                "FROM recruiter u JOIN recruiter_college_access g ON g.recruiter_id = u.id " +
                "WHERE u.company_id = (SELECT me.company_id FROM recruiter me WHERE me.id = :h) AND u.company_id IS NOT NULL " +
                "AND g.college_id = :c AND g.status = 'ACTIVE' AND (g.valid_until IS NULL OR g.valid_until > NOW()) AND (g.is_deleted = 0 OR g.is_deleted IS NULL) " +
                "AND (u.is_deleted = 0 OR u.is_deleted IS NULL) AND u.suspended_at IS NULL ORDER BY (u.id = :h) DESC, u.first_name",
                new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId));
        for (Map<String, Object> r : rows) r.put("you", n(r.get("id")) == recruiterId);
        return rows;
    }

    /** Funnel and offer outcomes for each of the recruiter's drives at this college, plus the combined funnel. */
    public Map<String, Object> reports(long recruiterId, Integer collegeId) {
        List<Map<String, Object>> drives = work.drives(recruiterId, collegeId);
        List<Map<String, Object>> perDrive = new ArrayList<>();
        Map<String, Long> totals = new LinkedHashMap<>();
        for (Map<String, Object> d : drives) {
            Integer jobId = ((Number) d.get("id")).intValue();
            List<Map<String, Object>> funnel = workspace.funnel(jobId);
            for (Map<String, Object> f : funnel) totals.merge(String.valueOf(f.get("stage")), n(f.get("count")), Long::sum);
            Map<String, Object> offers = jdbc.queryForMap(
                    "SELECT COALESCE(SUM(o.status = 'RELEASED'), 0) AS awaiting, COALESCE(SUM(o.status = 'ACCEPTED'), 0) AS accepted, " +
                    "COALESCE(SUM(o.status = 'DECLINED'), 0) AS declined, COALESCE(SUM(o.joining_status = 'JOINED'), 0) AS joined " +
                    "FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.job_id = :j", new MapSqlParameterSource("j", jobId));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("jobId", jobId);
            row.put("title", d.get("roleTitle"));
            row.put("lifecycle", d.get("lifecycle"));
            row.put("funnel", funnel);
            row.put("offers", Map.of("awaiting", n(offers.get("awaiting")), "accepted", n(offers.get("accepted")),
                    "declined", n(offers.get("declined")), "joined", n(offers.get("joined"))));
            perDrive.add(row);
        }
        List<Map<String, Object>> combined = new ArrayList<>();
        totals.forEach((stage, count) -> combined.add(Map.of("stage", stage, "count", count)));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("drives", perDrive);
        out.put("funnel", combined);
        return out;
    }
}
