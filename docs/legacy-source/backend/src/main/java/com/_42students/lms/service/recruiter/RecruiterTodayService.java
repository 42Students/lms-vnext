package com._42students.lms.service.recruiter;

import com._42students.lms.service.tpo.TpoMessagesService;
import com._42students.lms.util.PlacementDateTimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * What a recruiter needs to do right now at ONE college, and what is coming up (recruiter V2 "Today" and
 * "Calendar"). Everything is derived from the recruiter's own drives at that college: nothing here
 * reads another college or another recruiter's drive, and every number is a real count (no
 * estimates). A task says what to do, how urgent it is, and where it recruiter leads; tasks that only wait on
 * the placement cell say so and carry no button.
 */
@Service
@RequiredArgsConstructor
public class RecruiterTodayService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoMessagesService messages;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.TpoSettingsHubService settingsHub;

    private static final String MINE_JOB =
            " j.recruiter_id = :h AND j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) ";

    private MapSqlParameterSource who(long recruiterId, Integer collegeId) {
        return new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId);
    }

    private static long n(Object o) { return o == null ? 0 : ((Number) o).longValue(); }

    /** Stored placement times are UTC wall-clock values; the browser gets them as unambiguous instants and shows its own local time. */
    private static String iso(Object o) {
        return PlacementDateTimeUtils.toUtcIso(when(o));
    }

    private static LocalDateTime when(Object o) {
        if (o instanceof Timestamp) return ((Timestamp) o).toLocalDateTime();
        if (o instanceof LocalDateTime) return (LocalDateTime) o;
        return null;
    }

    private static Map<String, Object> task(String id, String tone, String title, String detail, String action,
                                            Object jobId, String tab) {
        return task(id, tone, title, detail, action, jobId, tab, null, null);
    }

    /** {@code at} is an instant shown by the browser in the viewer's own zone, prefixed by {@code atLabel} ("Due", "Reply by"). */
    private static Map<String, Object> task(String id, String tone, String title, String detail, String action,
                                            Object jobId, String tab, Object at, String atLabel) {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("id", id);
        t.put("tone", tone);          // urgent | soon | fine
        t.put("title", title);
        t.put("detail", detail);
        t.put("action", action);      // null = waiting on someone else, nothing for the recruiter to press
        t.put("jobId", jobId);
        t.put("tab", tab);            // overview | applicants | rounds | offers | messages
        t.put("at", iso(at));
        t.put("atLabel", at == null ? null : atLabel);
        return t;
    }

    private static int toneRank(String tone) {
        return "urgent".equals(tone) ? 0 : "soon".equals(tone) ? 1 : 2;
    }

    private static String plural(long n, String one, String many) { return n + " " + (n == 1 ? one : many); }

    public Map<String, Object> today(long recruiterId, Integer collegeId) {
        MapSqlParameterSource p = who(recruiterId, collegeId);
        List<Map<String, Object>> tasks = new ArrayList<>();

        // Institutional requests (recruiter phase 1, N14): the college asked for a change or a detail; answered in place.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT j.id, j.job_title AS title, COUNT(cr.id) AS n, SUM(cr.kind = 'ASK') AS asks, MIN(cr.note) AS note FROM job j " +
                "JOIN drive_change_request cr ON cr.job_id = j.id AND cr.status = 'OPEN' AND cr.direction = 'COLLEGE_TO_COMPANY' WHERE" + MINE_JOB +
                "GROUP BY j.id, j.job_title ORDER BY j.id DESC", p)) {
            long count = n(r.get("n"));
            boolean allAsks = n(r.get("asks")) == count;
            String what = allAsks ? (count == 1 ? "1 detail" : count + " details") : (count == 1 ? "1 change" : count + " changes");
            String note = r.get("note") == null ? null : String.valueOf(r.get("note"));
            tasks.add(task("changes-" + r.get("id"), "soon", (allAsks ? "The placement cell needs " : "The placement cell suggested ") + what,
                    r.get("title") + (note != null && !note.isBlank() ? " · “" + note + "”" : ""), "Answer", r.get("id"), "requests"));
        }

        // The placement cell posted a drive and asked this recruiter to review it before it goes live (N5 c).
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT j.id, j.job_title AS title FROM job j WHERE" + MINE_JOB + "AND j.lifecycle_status = 'DRAFT' " +
                "AND EXISTS (SELECT 1 FROM tpo_audit_log a WHERE a.college_id = j.college_id AND a.entity_type = 'DRIVE' AND a.entity_id = j.id AND a.action = 'RECRUITER_REVIEW_INVITED') " +
                "ORDER BY j.id DESC", p)) {
            tasks.add(task("reviewdrive-" + r.get("id"), "soon", "Review the drive the placement cell posted",
                    r.get("title") + " · ask for any change before it goes live", "Review it", r.get("id"), "overview"));
        }

        // New applicants no recruiter decision exists for yet. Reviewable only once the cell shared the list.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT j.id, j.job_title AS title, COUNT(a.id) AS n, " +
                "  (SELECT COUNT(*) FROM tpo_share_link s WHERE s.job_id = j.id AND s.revoked_at IS NULL AND s.expires_at > NOW()) AS shared " +
                "FROM job j JOIN job_application a ON a.job_id = j.id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status = 'APPLIED' " +
                "AND NOT EXISTS (SELECT 1 FROM round_result x WHERE x.application_id = a.id AND x.submitted_by_type = 'RECRUITER' AND x.superseded_by IS NULL) " +
                "GROUP BY j.id, j.job_title ORDER BY n DESC", p)) {
            long count = n(r.get("n"));
            // The college may let recruiters see applicants as they apply (N6).
            boolean shared = n(r.get("shared")) > 0 || (settingsHub != null && settingsHub.recruiterSeesApplicantsDirectly(collegeId));
            tasks.add(task("review-" + r.get("id"), "urgent", plural(count, "new applicant", "new applicants") + " to review",
                    r.get("title") + (shared ? "" : " · the placement cell has not shared the list yet"),
                    shared ? "Review now" : null, r.get("id"), "applicants"));
        }

        // Interview rounds with no slots yet.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.name, r.scheduled_date AS at, j.id AS jobId, j.job_title AS title FROM job_round r JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND r.kind = 'INTERVIEW' AND r.status <> 'COMPLETED' " +
                "AND (r.scheduled_date IS NULL OR r.scheduled_date >= NOW()) " +
                "AND NOT EXISTS (SELECT 1 FROM round_slot s WHERE s.round_id = r.id) ORDER BY r.scheduled_date IS NULL, r.scheduled_date LIMIT 5", p)) {
            tasks.add(task("slots-" + r.get("id"), "soon", "Propose interview slots for " + r.get("name"),
                    String.valueOf(r.get("title")), "Add slots", r.get("jobId"), "rounds", r.get("at"), "Planned for"));
        }

        // Round results still to send (due soon or overdue).
        LocalDateTime now = PlacementDateTimeUtils.nowUtc();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.name, r.results_due AS due, j.id AS jobId, j.job_title AS title FROM job_round r JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND r.kind <> 'TALK' AND r.status <> 'COMPLETED' AND r.results_due IS NOT NULL " +
                "AND r.results_due <= DATE_ADD(NOW(), INTERVAL 2 DAY) AND r.results_due >= DATE_SUB(NOW(), INTERVAL 14 DAY) " +
                "AND NOT EXISTS (SELECT 1 FROM round_result x WHERE x.round_id = r.id AND x.submitted_by_type = 'RECRUITER' AND x.superseded_by IS NULL) ORDER BY r.results_due", p)) {
            LocalDateTime due = when(r.get("due"));
            boolean overdue = due != null && due.isBefore(now);
            tasks.add(task("results-" + r.get("id"), overdue ? "urgent" : "soon", "Send results for " + r.get("name"),
                    String.valueOf(r.get("title")), "Send results", r.get("jobId"), "applicants", r.get("due"), overdue ? "Overdue since" : "Due"));
        }

        // Offers waiting for a reply.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT j.id AS jobId, j.job_title AS title, COUNT(o.id) AS n, MIN(o.respond_by) AS soonest FROM job_offer o JOIN job_application a ON a.id = o.application_id " +
                "JOIN job j ON j.id = a.job_id WHERE" + MINE_JOB + "AND o.status = 'RELEASED' GROUP BY j.id, j.job_title", p)) {
            LocalDateTime soonest = when(r.get("soonest"));
            boolean close = soonest != null && soonest.isBefore(now.plusDays(2));
            tasks.add(task("offers-" + r.get("jobId"), close ? "soon" : "fine", plural(n(r.get("n")), "offer", "offers") + " waiting on a reply",
                    String.valueOf(r.get("title")), "See offers", r.get("jobId"), "offers", soonest, "Reply by"));
        }

        // Things only the placement cell can move: said plainly, no button.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.name, j.id AS jobId, j.job_title AS title, COUNT(x.id) AS n FROM round_result x JOIN job_round r ON r.id = x.round_id JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND x.applied_at IS NULL AND x.superseded_by IS NULL AND x.submitted_by_type = 'RECRUITER' GROUP BY r.id, r.name, j.id, j.job_title", p)) {
            tasks.add(task("withcell-" + r.get("id"), "fine", "Results for " + r.get("name") + " are with the placement cell",
                    r.get("title") + " · " + plural(n(r.get("n")), "result", "results") + " waiting for them to apply", null, r.get("jobId"), "applicants"));
        }
        long selectionsWithCell = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id WHERE" + MINE_JOB +
                "AND o.created_by_type = 'RECRUITER' AND o.status IN ('SELECTED','PENDING_VERIFICATION')", p, Long.class));
        if (selectionsWithCell > 0) {
            tasks.add(task("selections-withcell", "fine", plural(selectionsWithCell, "selection is", "selections are") + " with the placement cell",
                    "They verify before any student is told", null, null, "offers"));
        }

        long unread = messages.threadsForRecruiter(collegeId, recruiterId).stream().mapToLong(t -> n(t.get("unread"))).sum();
        if (unread > 0) {
            tasks.add(task("messages", "soon", plural(unread, "unread message", "unread messages"), "From the placement cell", "Open messages", null, "messages"));
        }

        tasks.sort(Comparator.comparingInt(t -> toneRank(String.valueOf(t.get("tone")))));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tasks", tasks);
        out.put("needsYou", tasks.stream().filter(t -> t.get("action") != null).count());
        LocalDateTime dayStart = PlacementDateTimeUtils.todayUtc().atStartOfDay();
        out.put("thisWeek", calendar(recruiterId, collegeId, dayStart, dayStart.plusDays(8)));
        out.put("liveDrive", liveDrive(p));
        return out;
    }

    private static Integer collegeIdOf(MapSqlParameterSource p) {
        Object c = p.getValue("c");
        return c == null ? null : ((Number) c).intValue();
    }

    /** The recruiter's busiest live drive at this college, as numbers they already know. */
    private Map<String, Object> liveDrive(MapSqlParameterSource p) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT j.id, j.job_title AS title, j.application_deadline AS deadline, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status <> 'WITHDRAWN') AS applied, " +
                "  (SELECT COUNT(*) FROM tpo_share_link s WHERE s.job_id = j.id AND s.revoked_at IS NULL AND s.expires_at > NOW()) AS shared " +
                "FROM job j WHERE" + MINE_JOB + "AND j.lifecycle_status = 'PUBLISHED' ORDER BY applied DESC, j.id DESC LIMIT 1", p);
        if (rows.isEmpty()) return null;
        Map<String, Object> r = rows.get(0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("jobId", r.get("id"));
        out.put("title", r.get("title"));
        out.put("applied", n(r.get("applied")));
        out.put("deadline", iso(r.get("deadline")));
        out.put("listShared", n(r.get("shared")) > 0 || (settingsHub != null && settingsHub.recruiterSeesApplicantsDirectly(collegeIdOf(p))));
        return out;
    }

    /**
     * Rounds, interview slots, application deadlines and result due dates of the recruiter's drives at this
     * college that fall in [from, to), soonest first.
     */
    public List<Map<String, Object>> calendar(long recruiterId, Integer collegeId, LocalDateTime from, LocalDateTime to) {
        MapSqlParameterSource p = who(recruiterId, collegeId).addValue("from", from).addValue("to", to);
        List<Map<String, Object>> events = new ArrayList<>();

        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.name, r.kind, r.mode, r.venue, r.scheduled_date AS at, r.duration_minutes AS minutes, j.id AS jobId, j.job_title AS title FROM job_round r JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND r.scheduled_date >= :from AND r.scheduled_date < :to", p)) {
            LocalDateTime at = when(r.get("at"));
            Integer minutes = r.get("minutes") == null ? null : ((Number) r.get("minutes")).intValue();
            events.add(event("round-" + r.get("id"), "ROUND", String.valueOf(r.get("name")), at, minutes == null || at == null ? null : at.plusMinutes(minutes),
                    r.get("jobId"), String.valueOf(r.get("title")), String.valueOf(r.get("kind")), r.get("mode") == null ? null : String.valueOf(r.get("mode")), r.get("venue") == null ? null : String.valueOf(r.get("venue"))));
        }
        for (Map<String, Object> s : jdbc.queryForList(
                "SELECT s.id, s.starts_at AS startsAt, s.ends_at AS endsAt, s.status, s.room, r.name AS roundName, j.id AS jobId, j.job_title AS title FROM round_slot s JOIN job_round r ON r.id = s.round_id JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND s.starts_at >= :from AND s.starts_at < :to", p)) {
            events.add(event("slot-" + s.get("id"), "SLOT", s.get("roundName") + " slot", when(s.get("startsAt")), when(s.get("endsAt")),
                    s.get("jobId"), String.valueOf(s.get("title")), String.valueOf(s.get("status")), null, s.get("room") == null ? null : String.valueOf(s.get("room"))));
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT j.id, j.job_title AS title, j.application_deadline AS at FROM job j WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND j.application_deadline >= :from AND j.application_deadline < :to", p)) {
            events.add(event("deadline-" + d.get("id"), "DEADLINE", "Applications close", when(d.get("at")), null,
                    d.get("id"), String.valueOf(d.get("title")), null, null, null));
        }
        for (Map<String, Object> d : jdbc.queryForList(
                "SELECT r.id, r.name, r.results_due AS at, j.id AS jobId, j.job_title AS title FROM job_round r JOIN job j ON j.id = r.job_id WHERE" + MINE_JOB +
                "AND j.lifecycle_status = 'PUBLISHED' AND r.kind <> 'TALK' AND r.results_due >= :from AND r.results_due < :to", p)) {
            events.add(event("due-" + d.get("id"), "RESULTS_DUE", "Results due: " + d.get("name"), when(d.get("at")), null,
                    d.get("jobId"), String.valueOf(d.get("title")), null, null, null));
        }
        events.sort(Comparator.comparing((Map<String, Object> e) -> String.valueOf(e.get("start"))));
        return events;
    }

    private static Map<String, Object> event(String id, String type, String title, LocalDateTime start, LocalDateTime end,
                                             Object jobId, String jobTitle, String status, String mode, String where) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("id", id);
        e.put("type", type);          // ROUND | SLOT | DEADLINE | RESULTS_DUE
        e.put("title", title);
        e.put("start", PlacementDateTimeUtils.toUtcIso(start));
        e.put("end", PlacementDateTimeUtils.toUtcIso(end));
        e.put("jobId", jobId);
        e.put("jobTitle", jobTitle);
        e.put("status", status);
        e.put("mode", mode);
        e.put("where", where);
        return e;
    }
}
