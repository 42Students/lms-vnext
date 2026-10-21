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
 * The recruiter's bell at ONE college: replies from the placement cell and what the cell did on the
 * recruiter's own drives and offers (shared the list, confirmed a slot, an offer answered). It is
 * derived from data that already exists; only "read through" is stored. Nothing here reads another
 * college, another recruiter's drive, or anything a student wrote beyond the fact an offer was answered.
 */
@Service
@RequiredArgsConstructor
public class RecruiterNotificationService {

    private static final int DAYS = 30;
    private static final int FIRST_VISIT_UNREAD_DAYS = 7;

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoMessagesService messages;

    private static LocalDateTime dt(Object o) {
        if (o instanceof Timestamp) return ((Timestamp) o).toLocalDateTime();
        if (o instanceof LocalDateTime) return (LocalDateTime) o;
        return null;
    }

    private static String driveLink(Object jobId, String tab) {
        return jobId == null ? "/recruiter/home" : "/recruiter/drives/" + jobId + (tab == null ? "" : "?tab=" + tab);
    }

    /** The audit events a recruiter is told about: shared by the feed and its unread count. */
    private static final String AUDIT_FROM_WHERE =
                "FROM tpo_audit_log a " +
                "LEFT JOIN job j1 ON a.entity_type = 'DRIVE' AND j1.id = a.entity_id " +
                "LEFT JOIN job_round r ON a.entity_type = 'ROUND' AND r.id = a.entity_id LEFT JOIN job j2 ON j2.id = r.job_id " +
                "LEFT JOIN job_offer o ON a.entity_type = 'OFFER' AND o.id = a.entity_id " +
                "LEFT JOIN job_application ap ON ap.id = o.application_id LEFT JOIN job j3 ON j3.id = ap.job_id " +
                "WHERE a.college_id = :c AND a.actor_type <> 'RECRUITER' AND a.created_at >= DATE_SUB(NOW(), INTERVAL " + DAYS + " DAY) " +
                "AND a.action IN ('SLOT_CONFIRMED','APPLICANTS_SHARED','ROUND_ASSIGNMENT_SAVED','OFFER_ACCEPTED','OFFER_DECLINED','REQUEST_AUTO_APPROVED'," +
                "'REQUEST_APPROVED','REQUEST_REJECTED','DRIVE_PUBLISHED','DRIVE_CANCELLED','DRIVE_CLOSED','RECRUITER_REVIEW_INVITED') " +
                "AND ((j1.recruiter_id = :h AND j1.college_id = :c) OR (j2.recruiter_id = :h AND j2.college_id = :c) OR (j3.recruiter_id = :h AND j3.college_id = :c)) ";

    /** Institutional requests made, and company requests the placement cell settled, on this recruiter's drives here. */
    private static final String CHANGES_SELECT =
            "SELECT cr.id, cr.direction, cr.status, j.id AS jobId, j.job_title AS title, " +
            "  CASE WHEN cr.direction = 'COLLEGE_TO_COMPANY' THEN cr.created_at ELSE cr.resolved_at END AS at " +
            "FROM drive_change_request cr JOIN job j ON j.id = cr.job_id " +
            "WHERE cr.college_id = :c AND j.recruiter_id = :h AND j.college_id = :c " +
            "AND ((cr.direction = 'COLLEGE_TO_COMPANY' AND cr.created_at >= :since) " +
            "  OR (cr.direction = 'COMPANY_TO_COLLEGE' AND cr.status IN ('ACCEPTED','ANSWERED','REPLIED') AND cr.resolved_at >= :since)) ";

    /**
     * {feed, unread, unreadTotal}: newest first, at most 40 items from the last 30 days. BE-0137: unread counts the shown
     * items; unreadTotal counts every unread one (some may be older than the 40 shown). The bell marks everything read
     * on opening only when nothing unread is hidden.
     */
    public Map<String, Object> feed(long recruiterId, Integer collegeId) {
        LocalDateTime since = PlacementDateTimeUtils.nowUtc().minusDays(DAYS);
        List<Map<String, Object>> items = new ArrayList<>();
        Map<Object, LocalDateTime> when = new java.util.IdentityHashMap<>();

        for (Map<String, Object> a : jdbc.queryForList(
                "SELECT a.id, a.action, a.created_at AS at, " +
                "  COALESCE(j1.job_title, j2.job_title, j3.job_title) AS title, COALESCE(j1.id, j2.id, j3.id) AS jobId " +
                AUDIT_FROM_WHERE +
                "ORDER BY a.id DESC LIMIT 40",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId))) {
            String action = String.valueOf(a.get("action"));
            String title; String tab;
            switch (action) {
                case "SLOT_CONFIRMED": title = "An interview slot was confirmed"; tab = "rounds"; break;
                case "APPLICANTS_SHARED": title = "The placement cell shared the applicant list"; tab = "applicants"; break;
                case "ROUND_ASSIGNMENT_SAVED": title = "Students were assigned to a round"; tab = "rounds"; break;
                case "OFFER_ACCEPTED": title = "An offer was accepted"; tab = "offers"; break;
                case "OFFER_DECLINED": title = "An offer was declined"; tab = "offers"; break;
                case "REQUEST_REJECTED": title = "The placement cell declined your drive request"; tab = "overview"; break;
                case "DRIVE_PUBLISHED": title = "Your drive is live for students"; tab = "overview"; break;
                case "DRIVE_CANCELLED": title = "A drive was cancelled"; tab = "overview"; break;
                case "DRIVE_CLOSED": title = "A drive is completed"; tab = "offers"; break;
                case "RECRUITER_REVIEW_INVITED": title = "The placement cell asks you to review a drive"; tab = "overview"; break;
                default: title = "Your drive request was approved"; tab = "overview";
            }
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", "a-" + a.get("id"));
            n.put("title", title);
            n.put("body", a.get("title") == null ? null : String.valueOf(a.get("title")));
            n.put("link", driveLink(a.get("jobId"), tab));
            n.put("createdAt", PlacementDateTimeUtils.toUtcIso(dt(a.get("at"))));
            when.put(n, dt(a.get("at")));
            items.add(n);
        }

        // Change requests (N14): what the placement cell asks of the company, and its answers to the company's own requests.
        for (Map<String, Object> c : jdbc.queryForList(CHANGES_SELECT + "ORDER BY at DESC LIMIT 40",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("since", Timestamp.valueOf(since)))) {
            boolean asked = "COLLEGE_TO_COMPANY".equals(c.get("direction"));
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", "c-" + c.get("id") + (asked ? "" : "-r"));
            n.put("title", asked ? "The placement cell asked for a change"
                    : "REPLIED".equals(c.get("status")) ? "The placement cell declined your request" // REPLIED is how a decline is stored
                    : "ACCEPTED".equals(c.get("status")) ? "The placement cell accepted your request" : "The placement cell answered your request");
            n.put("body", c.get("title") == null ? null : String.valueOf(c.get("title")));
            n.put("link", driveLink(c.get("jobId"), "requests"));
            n.put("createdAt", PlacementDateTimeUtils.toUtcIso(dt(c.get("at"))));
            when.put(n, dt(c.get("at")));
            items.add(n);
        }

        for (Map<String, Object> t : messages.threadsForRecruiter(collegeId, recruiterId)) {
            LocalDateTime at = dt(t.get("lastMessageAt"));
            long unread = t.get("unread") == null ? 0 : ((Number) t.get("unread")).longValue();
            if (unread == 0 || at == null || at.isBefore(since)) continue;
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", "m-" + t.get("id"));
            n.put("title", "New message: " + t.get("subject"));
            n.put("body", t.get("lastBody") == null ? null : String.valueOf(t.get("lastBody")));
            n.put("link", t.get("jobId") == null ? "/recruiter/messages" : driveLink(t.get("jobId"), "messages"));
            n.put("createdAt", PlacementDateTimeUtils.toUtcIso(at));
            when.put(n, at);
            items.add(n);
        }

        items.sort(Comparator.comparing((Map<String, Object> n) -> when.get(n)).reversed());
        List<Map<String, Object>> feed = items.size() > 40 ? new ArrayList<>(items.subList(0, 40)) : items;

        LocalDateTime readThrough = readThrough(recruiterId, collegeId);
        feed.forEach(n -> n.put("isNew", when.get(n).isAfter(readThrough))); // the panel marks these, then opening it reads them all
        long unread = feed.stream().filter(n -> Boolean.TRUE.equals(n.get("isNew"))).count();
        // Every unread one: unread messages (all of them are in items) plus every audit event after the marker, not just the 40.
        long unreadMessages = items.stream().filter(n -> String.valueOf(n.get("id")).startsWith("m-") && when.get(n).isAfter(readThrough)).count();
        Long unreadAudit = jdbc.queryForObject("SELECT COUNT(*) " + AUDIT_FROM_WHERE + "AND a.created_at > :rt",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("rt", Timestamp.valueOf(readThrough)), Long.class);
        Long unreadChanges = jdbc.queryForObject("SELECT COUNT(*) FROM (" + CHANGES_SELECT + ") x WHERE x.at > :rt",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("since", Timestamp.valueOf(since)).addValue("rt", Timestamp.valueOf(readThrough)), Long.class);
        long unreadTotal = Math.max(unread, unreadMessages + (unreadAudit == null ? 0 : unreadAudit) + (unreadChanges == null ? 0 : unreadChanges));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("feed", feed);
        out.put("unread", unread);
        out.put("unreadTotal", unreadTotal);
        return out;
    }

    /** Just the badge number, for the top bar's 30-second refresh: the same rule as the feed, without sending the feed. */
    public long unreadCount(long recruiterId, Integer collegeId) {
        return ((Number) feed(recruiterId, collegeId).get("unreadTotal")).longValue(); // BE-0137: the badge counts them all
    }

    private LocalDateTime readThrough(long recruiterId, Integer collegeId) {
        // The marker and the feed's own timestamps both come from the database clock, so they can never disagree by a time zone.
        List<Timestamp> rows = jdbc.query("SELECT COALESCE((SELECT read_through FROM recruiter_notification_read WHERE recruiter_id = :h AND college_id = :c), " +
                "DATE_SUB(NOW(), INTERVAL " + FIRST_VISIT_UNREAD_DAYS + " DAY))",
                new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), (rs, i) -> rs.getTimestamp(1));
        return rows.get(0).toLocalDateTime();
    }

    /** Everything up to now counts as read, for this recruiter at this college only. */
    public void markAllRead(long recruiterId, Integer collegeId) {
        jdbc.update("INSERT INTO recruiter_notification_read (recruiter_id, college_id, read_through) VALUES (:h, :c, NOW()) " +
                        "ON DUPLICATE KEY UPDATE read_through = VALUES(read_through)",
                new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId));
    }
}
