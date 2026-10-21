package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Interview notices to students (13 Oct 2026). The owner's rule: a student gets email only for signing in and for interviews, so
 * these are the placement emails a student receives: the slot being set or changed (ROUND_SCHEDULED, sent by TpoScheduleService)
 * and the evening-before reminder (ROUND_REMINDER, here). Both carry the same details, read from what is saved: the slot's time,
 * else the round's date; the student's room, else the slot's, else the round's venue; the meeting link for a virtual round.
 *
 * Times are stored in UTC (the TPO's browser sends them so); emails show India time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewReminderService {

    static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM, h:mm a", Locale.ENGLISH);

    private static final String STARTS = "COALESCE(s.starts_at, r.scheduled_date)";
    private static final String DETAILS = "SELECT ra.id AS assignmentId, a.learner_id AS learnerId, r.id AS roundId, r.name AS round, " +
            "j.company_name AS company, j.job_title AS role, " + STARTS + " AS startsAt, " +
            "COALESCE(NULLIF(NULLIF(ra.room, ''), 'null'), s.room, r.venue) AS room, r.mode AS mode, r.meeting_url AS meetingUrl, r.what_to_bring AS whatToBring " +
            "FROM round_assignment ra JOIN job_application a ON a.id = ra.application_id JOIN job_round r ON r.id = ra.round_id " +
            "JOIN job j ON j.id = r.job_id LEFT JOIN round_slot s ON s.id = ra.slot_id ";

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationOutboxService outbox;

    /** The notice for one student's interview in a round, or null when it can't be read (the caller keeps what it had). */
    static Map<String, Object> payloadFor(NamedParameterJdbcTemplate jdbc, Long roundId, Integer applicationId) {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(DETAILS + "WHERE ra.round_id = :r AND ra.application_id = :a",
                    new MapSqlParameterSource("r", roundId).addValue("a", applicationId));
            return rows.isEmpty() ? null : payload(rows.get(0));
        } catch (RuntimeException e) {
            log.warn("Interview details for round {} application {} could not be read: {}", roundId, applicationId, e.getMessage());
            return null;
        }
    }

    /**
     * In-app keys: round, company, role, startsAt (UTC, shown as India time), room. Email keys: name (added at sending), company,
     * role, round, when, venue, whatToBring.
     */
    static Map<String, Object> payload(Map<String, Object> row) {
        Map<String, Object> p = new HashMap<>();
        p.put("roundId", row.get("roundId"));
        p.put("company", text(row.get("company")));
        p.put("role", text(row.get("role")));
        p.put("round", text(row.get("round")));
        LocalDateTime starts = utc(row.get("startsAt"));
        p.put("startsAt", starts == null ? "" : starts.toString());
        p.put("room", text(row.get("room")));
        p.put("when", starts == null ? "Time to be confirmed" : when(starts));
        p.put("venue", venue(row));
        String bring = text(row.get("whatToBring"));
        p.put("whatToBring", bring.isEmpty() ? "Nothing specific" : bring); // the email shows the row either way
        return p;
    }

    /** "Tue 14 Oct, 10:30 AM" in India time. */
    static String when(LocalDateTime utc) {
        return utc.atZone(ZoneOffset.UTC).withZoneSameInstant(INDIA).format(WHEN);
    }

    static String venue(Map<String, Object> row) {
        String room = text(row.get("room"));
        String link = text(row.get("meetingUrl"));
        if ("VIRTUAL".equals(text(row.get("mode"))) && !link.isEmpty()) return "Online: " + link;
        if (!room.isEmpty()) return room;
        if (!link.isEmpty()) return "Online: " + link;
        return "Venue to be confirmed";
    }

    /**
     * Every evening (TpoScheduledJobs, 7 pm India time): one reminder to each student whose interview is tomorrow, India time.
     * Only students who were told about the slot, still in the drive (active application, drive live, round not completed), and
     * not already reminded of this start time: a moved interview is reminded again, the same one never twice.
     */
    @Transactional
    public int remindTomorrow() {
        return remindFor(LocalDate.now(INDIA).plusDays(1));
    }

    int remindFor(LocalDate indiaDay) {
        LocalDateTime from = indiaDay.atStartOfDay(INDIA).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime to = from.plusDays(1);
        List<Map<String, Object>> rows = jdbc.queryForList(DETAILS +
                        "WHERE ra.notified_at IS NOT NULL AND " + STARTS + " >= :from AND " + STARTS + " < :to " +
                        "AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED') " +
                        "AND j.lifecycle_status = 'PUBLISHED' AND (r.status IS NULL OR r.status <> 'COMPLETED') " +
                        "AND (ra.reminded_for IS NULL OR ra.reminded_for <> " + STARTS + ")",
                new MapSqlParameterSource("from", from).addValue("to", to));
        int n = 0;
        for (Map<String, Object> row : rows) {
            LocalDateTime starts = utc(row.get("startsAt"));
            if (starts == null || row.get("learnerId") == null) continue;
            outbox.enqueue("ROUND_REMINDER", "LEARNER", ((Number) row.get("learnerId")).intValue(), "APP", payload(row), null, false);
            jdbc.update("UPDATE round_assignment SET reminded_for = :t WHERE id = :id",
                    new MapSqlParameterSource("t", starts).addValue("id", row.get("assignmentId")));
            n++;
        }
        if (n > 0) log.info("Interview reminders queued for {}: {}", indiaDay, n);
        return n;
    }

    /**
     * Every morning (TpoScheduledJobs, 8 am India time): one in-app nudge (ROUND_TODAY, no email) to each student whose interview
     * starts later today, India time. Same students as the evening reminder; reminded_today_for keeps it to once per start time,
     * so a moved interview is nudged again on its new day (owner, 19 Oct 2026).
     */
    @Transactional
    public int remindToday() {
        return remindToday(java.time.ZonedDateTime.now(INDIA));
    }

    int remindToday(java.time.ZonedDateTime nowIndia) {
        LocalDateTime from = nowIndia.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime to = nowIndia.toLocalDate().plusDays(1).atStartOfDay(INDIA).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        List<Map<String, Object>> rows = jdbc.queryForList(DETAILS +
                        "WHERE ra.notified_at IS NOT NULL AND " + STARTS + " >= :from AND " + STARTS + " < :to " +
                        "AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED') " +
                        "AND j.lifecycle_status = 'PUBLISHED' AND (r.status IS NULL OR r.status <> 'COMPLETED') " +
                        "AND (ra.reminded_today_for IS NULL OR ra.reminded_today_for <> " + STARTS + ")",
                new MapSqlParameterSource("from", from).addValue("to", to));
        int n = 0;
        for (Map<String, Object> row : rows) {
            LocalDateTime starts = utc(row.get("startsAt"));
            if (starts == null || row.get("learnerId") == null) continue;
            outbox.enqueue("ROUND_TODAY", "LEARNER", ((Number) row.get("learnerId")).intValue(), "APP", payload(row), null, false);
            jdbc.update("UPDATE round_assignment SET reminded_today_for = :t WHERE id = :id",
                    new MapSqlParameterSource("t", starts).addValue("id", row.get("assignmentId")));
            n++;
        }
        if (n > 0) log.info("Interview morning reminders queued for {}: {}", nowIndia.toLocalDate(), n);
        return n;
    }

    private static LocalDateTime utc(Object v) {
        if (v instanceof LocalDateTime t) return t;
        if (v instanceof Timestamp t) return t.toLocalDateTime();
        return null;
    }

    private static String text(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v).trim();
        return "null".equals(s) ? "" : s;
    }
}
