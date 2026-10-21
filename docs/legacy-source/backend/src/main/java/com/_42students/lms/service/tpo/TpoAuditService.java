package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/** "Everything logs itself" (TPO V1 - Locked.docx §1 principles, §11) plus the Bell feed of things that happened. */
@Service
@RequiredArgsConstructor
public class TpoAuditService {

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * Logs it unless the same person logged the same action on the same thing within the last {@code minutes}: for actions
     * that repeat by themselves (the drive editor autosaves every few seconds), one entry per stretch of work.
     */
    public void logAtMostEvery(int minutes, Integer collegeId, String actorType, Integer actorId, String action, String entityType, Long entityId, String detail) {
        if (collegeId == null) return;
        Long recent = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_audit_log WHERE college_id = :c AND actor_type = :at AND actor_id <=> :ai " +
                        "AND action = :a AND entity_type = :et AND entity_id <=> :ei AND created_at > DATE_SUB(NOW(), INTERVAL :m MINUTE)",
                new MapSqlParameterSource().addValue("c", collegeId).addValue("at", actorType).addValue("ai", actorId)
                        .addValue("a", action).addValue("et", entityType).addValue("ei", entityId).addValue("m", minutes), Long.class);
        if (recent != null && recent > 0) return;
        log(collegeId, actorType, actorId, action, entityType, entityId, detail);
    }

    public void log(Integer collegeId, String actorType, Integer actorId, String action, String entityType, Long entityId, String detail) {
        if (collegeId == null) return;
        jdbc.update("INSERT INTO tpo_audit_log (college_id, actor_type, actor_id, action, entity_type, entity_id, detail) " +
                        "VALUES (:c, :at, :ai, :a, :et, :ei, :d)",
                new MapSqlParameterSource().addValue("c", collegeId).addValue("at", actorType).addValue("ai", actorId)
                        .addValue("a", action).addValue("et", entityType).addValue("ei", entityId)
                        .addValue("d", detail == null ? null : cap(singular(detail))));
    }

    private static String cap(String d) { return d.substring(0, Math.min(d.length(), 1000)); }

    private static final java.util.regex.Pattern ONE_PLURAL = java.util.regex.Pattern.compile(
            "(?<![\\d.])1 (student|recruiter|row|selection|slot|drive|application|offer|request|course|test|batch|class)e?s\\b");

    /** "1 students" -> "1 student": detail lines are built as n + " students" in many places, and the audit page read them out as written. */
    static String singular(String detail) {
        return ONE_PLURAL.matcher(detail).replaceAll("1 $1");
    }

    public List<Map<String, Object>> list(Integer collegeId, String entityType, Long entityId, int limit) {
        return list(collegeId, entityType, entityId, limit, null, null);
    }

    /**
     * With dates (from and to inclusive, India days, stored times are UTC): everything in that range, up to 5000 events, so an
     * audit of "September" is complete. Without: the latest events, up to 500.
     */
    /** BE-0034: how many events match, so a list cut at its limit can say it is incomplete (and by how much). */
    public long count(Integer collegeId, String entityType, Long entityId, java.time.LocalDate from, java.time.LocalDate to) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId);
        String where = "college_id = :c";
        java.time.ZoneId india = java.time.ZoneId.of("Asia/Kolkata");
        if (from != null) { where += " AND created_at >= :from"; p.addValue("from", from.atStartOfDay(india).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()); }
        if (to != null) { where += " AND created_at < :to"; p.addValue("to", to.plusDays(1).atStartOfDay(india).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()); }
        if (entityType != null && !entityType.isBlank()) { where += " AND entity_type = :et"; p.addValue("et", entityType); }
        if (entityId != null) { where += " AND entity_id = :ei"; p.addValue("ei", entityId); }
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_audit_log WHERE " + where, p, Long.class);
        return n == null ? 0 : n;
    }

    public List<Map<String, Object>> list(Integer collegeId, String entityType, Long entityId, int limit, java.time.LocalDate from, java.time.LocalDate to) {
        boolean ranged = from != null || to != null;
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("lim", Math.min(Math.max(limit, 1), ranged ? 5000 : 500));
        String where = "college_id = :c";
        java.time.ZoneId india = java.time.ZoneId.of("Asia/Kolkata");
        if (from != null) { where += " AND created_at >= :from"; p.addValue("from", from.atStartOfDay(india).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()); }
        if (to != null) { where += " AND created_at < :to"; p.addValue("to", to.plusDays(1).atStartOfDay(india).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()); }
        if (entityType != null && !entityType.isBlank()) { where += " AND entity_type = :et"; p.addValue("et", entityType); }
        if (entityId != null) { where += " AND entity_id = :ei"; p.addValue("ei", entityId); }
        // actorName: the person's name, so the log reads "Asha Rao" instead of "TPO #12". Null for SYSTEM or when the account is gone.
        return jdbc.queryForList("SELECT a.id, a.actor_type AS actorType, a.actor_id AS actorId, " +
                "CASE a.actor_type " +
                "  WHEN 'TPO' THEN (SELECT TRIM(CONCAT(f.first_name, ' ', COALESCE(f.last_name, ''))) FROM faculty f WHERE f.id = a.actor_id) " +
                "  WHEN 'RECRUITER' THEN (SELECT TRIM(CONCAT(h.first_name, ' ', COALESCE(h.last_name, ''))) FROM recruiter h WHERE h.id = a.actor_id) " +
                "  WHEN 'STUDENT' THEN (SELECT TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) FROM learner l WHERE l.id = a.actor_id) " +
                "END AS actorName, " +
                "a.action, a.entity_type AS entityType, a.entity_id AS entityId, a.detail, a.created_at AS createdAt FROM tpo_audit_log a WHERE " +
                where.replace("college_id", "a.college_id").replace("entity_type", "a.entity_type").replace("entity_id", "a.entity_id").replace("created_at", "a.created_at") +
                " ORDER BY a.created_at DESC, a.id DESC LIMIT :lim", p);
    }

    // ---- Bell ----
    public void bell(Integer collegeId, String type, String title, String body, String link) {
        if (collegeId == null) return;
        jdbc.update("INSERT INTO tpo_bell (college_id, type, title, body, link) VALUES (:c, :t, :ti, :b, :l)",
                new MapSqlParameterSource().addValue("c", collegeId).addValue("t", type).addValue("ti", title)
                        .addValue("b", body).addValue("l", link));
    }

    /** A bell item for one person in the placement team (a mention, an ask); nobody else sees it. */
    public void bellTo(Integer collegeId, Integer facultyId, String type, String title, String body, String link) {
        if (collegeId == null || facultyId == null) return;
        jdbc.update("INSERT INTO tpo_bell (college_id, type, title, body, link, target_faculty_id) VALUES (:c, :t, :ti, :b, :l, :f)",
                new MapSqlParameterSource().addValue("c", collegeId).addValue("t", type).addValue("ti", cut(title, 200))
                        .addValue("b", cut(body, 500)).addValue("l", cut(link, 200)).addValue("f", facultyId));
    }

    private static String cut(String v, int max) {
        return v == null || v.length() <= max ? v : v.substring(0, max - 1) + "…";
    }

    /**
     * The bell feed with each item's read state for one person. Read state is per person (tpo_bell_read): one teammate opening a notification
     * no longer clears it for the rest of the placement team. Rows read before per-person state existed (tpo_bell.read_at) stay read for
     * everyone, and anything older than {@link #BELL_UNREAD_DAYS} days counts as read, so a new teammate does not start with a wall of old items.
     */
    public List<Map<String, Object>> bellFeed(Integer collegeId, String readerType, Integer readerId, int limit) {
        return jdbc.queryForList("SELECT b.id, b.type, b.title, b.body, b.link, b.created_at AS createdAt, " +
                        "  COALESCE(r.read_at, b.read_at, CASE WHEN b.created_at < DATE_SUB(NOW(), INTERVAL " + BELL_UNREAD_DAYS + " DAY) THEN b.created_at END) AS readAt " +
                        "FROM tpo_bell b LEFT JOIN tpo_bell_read r ON r.bell_id = b.id AND r.reader_type = :t AND r.reader_id = :f " +
                        "WHERE b.college_id = :c AND (b.target_faculty_id IS NULL OR b.target_faculty_id = :f) ORDER BY b.created_at DESC, b.id DESC LIMIT :lim",
                new MapSqlParameterSource("c", collegeId).addValue("t", readerType).addValue("f", readerId).addValue("lim", Math.min(Math.max(limit, 1), 200)));
    }

    /** The college's feed without anyone's read state (used where only the items matter). */
    public List<Map<String, Object>> bellFeed(Integer collegeId, int limit) {
        return bellFeed(collegeId, null, null, limit);
    }

    public static final int BELL_UNREAD_DAYS = 30;

    // Items for one person (target_faculty_id) count only for them.
    private static final String UNREAD_FOR_PERSON = "b.college_id = :c AND (b.target_faculty_id IS NULL OR b.target_faculty_id = :f) AND b.read_at IS NULL AND b.created_at >= DATE_SUB(NOW(), INTERVAL " + BELL_UNREAD_DAYS + " DAY) " +
            "AND NOT EXISTS (SELECT 1 FROM tpo_bell_read r WHERE r.bell_id = b.id AND r.reader_type = :t AND r.reader_id = :f)";

    /** One notification read by this person (opening it from the feed). Scoped to the college so ids from another college do nothing. */
    public int bellMarkRead(Integer collegeId, String readerType, Integer readerId, Long id) {
        return jdbc.update("INSERT IGNORE INTO tpo_bell_read (bell_id, reader_type, reader_id) SELECT b.id, :t, :f FROM tpo_bell b WHERE b.id = :id AND " + UNREAD_FOR_PERSON,
                new MapSqlParameterSource("c", collegeId).addValue("t", readerType).addValue("f", readerId).addValue("id", id));
    }

    /** Unread bell items for this person: a single COUNT, never the whole feed. */
    public int bellUnreadCount(Integer collegeId, String readerType, Integer readerId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_bell b WHERE " + UNREAD_FOR_PERSON,
                new MapSqlParameterSource("c", collegeId).addValue("t", readerType).addValue("f", readerId), Integer.class);
        return n == null ? 0 : n;
    }

    /** Everything this person has not read yet becomes read, for them only. */
    public int bellMarkAllRead(Integer collegeId, String readerType, Integer readerId) {
        return jdbc.update("INSERT IGNORE INTO tpo_bell_read (bell_id, reader_type, reader_id) SELECT b.id, :t, :f FROM tpo_bell b WHERE " + UNREAD_FOR_PERSON,
                new MapSqlParameterSource("c", collegeId).addValue("t", readerType).addValue("f", readerId));
    }
}
