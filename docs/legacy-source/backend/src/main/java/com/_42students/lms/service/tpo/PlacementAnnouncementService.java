package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Announcements (N12; V2: docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md). A placement cell writes to its students and 42
 * writes to placement cells.
 *
 * A student announcement goes to an audience that is fixed when it is sent (a recipient list), except "All students", which stays
 * live as before: students in placements, batches, branches (of students in placements), a drive's applicants (all, or those still
 * in the drive). The cell sees the reach before sending and "N of M read" after, can remind only those who haven't read, can Undo
 * for 30 seconds (the notices wait in the outbox that long), schedule it, end it ("show until"), add a button, and email it when the
 * email template is set up. SMS is not offered: free text can't go by SMS in India (DLT templates). Deleting takes the notices back.
 *
 * Times sent by the screen (send at, show until) are UTC, as everywhere (serverTime); comparisons use UTC_TIMESTAMP().
 */
@Service
@RequiredArgsConstructor
public class PlacementAnnouncementService {

    public static final String STUDENTS = "STUDENTS";
    public static final String TPOS = "TPOS";
    public static final int MAX_TITLE = 200;
    public static final int MAX_BODY = 8000;
    public static final Set<String> STUDENT_AUDIENCES = Set.of("ALL", "PLACEMENTS", "BATCHES", "BRANCHES", "DRIVE");
    public static final String EVENT = "PLACEMENT_ANNOUNCEMENT";
    static final int UNDO_SECONDS = 30;
    static final int REMIND_GAP_MINUTES = 60;

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationOutboxService outbox;
    private final PlacementEligibilityService placementEligibility;
    private final TpoAuditService audit;
    private final TpoMailService mail;

    public record Author(String type, int id) { }

    /** Who an announcement is for, as picked. */
    public static class Audience {
        public String kind;
        public List<Long> batchIds;
        public List<String> branches;
        public Integer jobId;
        public String stage; // DRIVE: APPLIED (everyone who applied) | ACTIVE (still in the drive)
        public List<Integer> collegeIds; // 42: COLLEGES
    }

    /** What the composer sends. */
    public static class Draft {
        public String title;
        public String body;
        public Boolean pinned;
        public Audience audience;
        public String linkLabel;
        public String linkUrl;
        public String sendAt;
        public String showUntil;
        public Boolean email;
        public Boolean notify;
        public Boolean tellAgain;
    }

    record Resolved(Set<Integer> learners, String label, Integer jobId, boolean live) { }

    // ================================================================ the placement cell, to its students

    /** The pickers: placement batches, branches of students in placements, recent drives. */
    public Map<String, Object> audiences(Integer collegeId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("batches", jdbc.queryForList("SELECT pb.batch_id AS id, COALESCE(b.batch_name, CONCAT('Batch ', pb.batch_id)) AS name FROM placement_batch pb " +
                "LEFT JOIN batch b ON b.id = pb.batch_id WHERE pb.college_id = :c AND pb.finished_at IS NULL ORDER BY b.batch_name", new MapSqlParameterSource("c", collegeId)));
        Set<Integer> eligible = eligible(collegeId);
        List<String> branches = eligible.isEmpty() ? List.of() : jdbc.queryForList("SELECT DISTINCT TRIM(department) FROM learner WHERE id IN (:ids) AND department IS NOT NULL " +
                "AND TRIM(department) <> '' ORDER BY TRIM(department)", new MapSqlParameterSource("ids", eligible), String.class);
        out.put("branches", branches);
        out.put("drives", jdbc.queryForList("SELECT id, CONCAT(CASE WHEN company_name IS NULL OR company_name = '' THEN '' ELSE CONCAT(company_name, ' · ') END, job_title) AS label, " +
                "lifecycle_status AS status FROM job WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND lifecycle_status IN ('PUBLISHED','CLOSED') ORDER BY id DESC LIMIT 60",
                new MapSqlParameterSource("c", collegeId)));
        out.put("emailReady", false); // students get email only for sign-in and interviews (13 Oct 2026, owner)
        return out;
    }

    /** Who it would reach now: how many students, how many of them have an email address, and the words for it. */
    public Map<String, Object> preview(Integer collegeId, Audience a) {
        Resolved r = resolve(collegeId, a);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", r.learners().size());
        out.put("label", r.label());
        out.put("withEmail", r.learners().isEmpty() ? 0 : jdbc.queryForObject("SELECT COUNT(*) FROM learner WHERE id IN (:ids) AND contact_mail IS NOT NULL AND contact_mail <> ''",
                new MapSqlParameterSource("ids", r.learners()), Integer.class));
        out.put("emailReady", false); // students get email only for sign-in and interviews (13 Oct 2026, owner)
        return out;
    }

    /** The cell's list: every announcement with its audience, state, reach and reads. */
    public List<Map<String, Object>> forCollegeStudents(Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList(cellSelect() + "WHERE a.audience = 'STUDENTS' AND a.college_id = :c AND a.is_deleted = 0 " +
                "ORDER BY (a.pinned = 1 AND (a.show_until IS NULL OR a.show_until > UTC_TIMESTAMP())) DESC, COALESCE(a.sent_at, a.send_at, a.created_at) DESC, a.id DESC",
                new MapSqlParameterSource("c", collegeId));
        Integer everyone = null;
        for (Map<String, Object> r : rows) {
            if ("ALL".equals(r.get("audienceKind")) && r.get("recipientCount") == null) {
                if (everyone == null) everyone = jdbc.queryForObject("SELECT COUNT(*) FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)",
                        new MapSqlParameterSource("c", collegeId), Integer.class);
                r.put("recipientCount", everyone);
            }
            shapeState(r);
        }
        return rows;
    }

    @Transactional
    public Map<String, Object> postToStudents(Integer collegeId, Draft d, Author by) {
        if (d == null) throw new IllegalArgumentException("Write the announcement");
        Audience a = d.audience == null ? defaultAudience() : d.audience;
        String kind = audienceKind(a);
        Resolved r = resolve(collegeId, a); // refuses an audience that isn't this college's, and an empty one
        LocalDateTime sendAt = futureOrNull(d.sendAt, "The send time has passed");
        LocalDateTime showUntil = futureOrNull(d.showUntil, "The end date has passed");
        if (sendAt != null && showUntil != null && !showUntil.isAfter(sendAt)) throw new IllegalArgumentException("It has to end after it is sent");
        String[] link = link(d.linkLabel, d.linkUrl);
        boolean email = Boolean.TRUE.equals(d.email);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("t", requireTitle(d.title)).addValue("b", requireBody(d.body))
                .addValue("p", Boolean.TRUE.equals(d.pinned) ? 1 : 0).addValue("at", by.type()).addValue("ai", by.id()).addValue("k", kind)
                .addValue("j", json(a)).addValue("l", r.label()).addValue("job", r.jobId()).addValue("ll", link[0]).addValue("lu", link[1])
                .addValue("sa", sendAt).addValue("su", showUntil).addValue("e", email ? 1 : 0);
        jdbc.update("INSERT INTO placement_announcement (college_id, audience, title, body, pinned, author_type, author_id, audience_kind, audience_json, audience_label, " +
                "job_id, link_label, link_url, send_at, show_until, email) VALUES (:c, 'STUDENTS', :t, :b, :p, :at, :ai, :k, CAST(:j AS JSON), :l, :job, :ll, :lu, :sa, :su, :e)", p);
        long id = lastId();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id);
        if (sendAt == null) {
            int told = send(id, d.notify == null || d.notify);
            out.put("studentsTold", told);
            out.put("undoSeconds", UNDO_SECONDS);
        } else {
            out.put("scheduledFor", sendAt);
        }
        out.put("recipients", r.learners().size());
        return out;
    }

    /** Sends a saved announcement now: fixes its recipients, queues the notices (held for the Undo window) and the emails. */
    @Transactional
    public int send(long id, boolean notify) {
        Map<String, Object> a = row(id);
        Integer collegeId = ((Number) a.get("college_id")).intValue();
        Audience audience = fromJson(a.get("audience_json"), String.valueOf(a.get("audience_kind")));
        Resolved r;
        try {
            r = resolve(collegeId, audience);
        } catch (IllegalArgumentException e) {
            r = new Resolved(Set.of(), String.valueOf(a.get("audience_label")), null, false); // a scheduled drive was deleted meanwhile: it goes to nobody
        }
        if (!r.live()) {
            for (Integer l : r.learners()) {
                jdbc.update("INSERT IGNORE INTO placement_announcement_recipient (announcement_id, learner_id) VALUES (:a, :l)", new MapSqlParameterSource("a", id).addValue("l", l));
            }
        }
        String group = "announcement-" + id + "-" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.update("UPDATE placement_announcement SET sent_at = UTC_TIMESTAMP(), recipient_count = :n, audience_label = :l, undo_group = :g WHERE id = :id",
                new MapSqlParameterSource("n", r.live() ? null : r.learners().size()).addValue("l", r.label()).addValue("g", group).addValue("id", id));
        if (!notify) return 0;
        Map<String, Object> payload = payload(id, String.valueOf(a.get("title")), String.valueOf(a.get("body")), false);
        int told = 0;
        for (Integer l : r.learners()) {
            outbox.enqueue(EVENT, "LEARNER", l, "APP", payload, group, true);
            told++;
        }
        return told;
    }

    /** Scheduled announcements go out when their time comes. */
    @Scheduled(fixedDelay = 60_000)
    public void sendDue() {
        for (Long id : jdbc.queryForList("SELECT id FROM placement_announcement WHERE audience = 'STUDENTS' AND is_deleted = 0 AND sent_at IS NULL " +
                "AND send_at IS NOT NULL AND send_at <= UTC_TIMESTAMP() ORDER BY send_at LIMIT 50", new MapSqlParameterSource(), Long.class)) {
            try { send(id, true); } catch (RuntimeException ignored) { /* the next pass tries again */ }
        }
    }

    /** Undo within 30 seconds of sending: the held notices are cancelled and the announcement is removed. */
    @Transactional
    public void undo(Integer collegeId, long id) {
        Map<String, Object> a = requireOwn(collegeId, id);
        Integer young = jdbc.queryForObject("SELECT COUNT(*) FROM placement_announcement WHERE id = :id AND sent_at IS NOT NULL AND sent_at >= UTC_TIMESTAMP() - INTERVAL " + UNDO_SECONDS + " SECOND",
                new MapSqlParameterSource("id", id), Integer.class);
        if (young == null || young == 0) throw new IllegalStateException("It's been sent. Delete it instead; that takes the notices back.");
        if (a.get("undo_group") != null) outbox.cancelUndoGroup(String.valueOf(a.get("undo_group")));
        jdbc.update("UPDATE placement_announcement SET is_deleted = 1, updated_at = NOW() WHERE id = :id", new MapSqlParameterSource("id", id));
        takeBackNotices(id);
    }

    /**
     * Edit. A sent one keeps its audience; a scheduled one can still change who and when. "Tell them it changed" sends a short notice
     * to the same students.
     */
    @Transactional
    public Map<String, Object> update(Integer collegeId, long id, Draft d) {
        Map<String, Object> a = requireOwn(collegeId, id);
        if (d == null) throw new IllegalArgumentException("Write the announcement");
        boolean sent = a.get("sent_at") != null;
        String[] link = link(d.linkLabel, d.linkUrl);
        LocalDateTime showUntil = futureOrNull(d.showUntil, "The end date has passed");
        MapSqlParameterSource p = new MapSqlParameterSource("id", id).addValue("t", requireTitle(d.title)).addValue("b", requireBody(d.body))
                .addValue("p", Boolean.TRUE.equals(d.pinned) ? 1 : 0).addValue("ll", link[0]).addValue("lu", link[1]).addValue("su", showUntil)
                .addValue("e", Boolean.TRUE.equals(d.email) ? 1 : truthy(a.get("email")) && sent ? 1 : 0);
        String extra = "";
        if (!sent) {
            Audience au = d.audience == null ? fromJson(a.get("audience_json"), String.valueOf(a.get("audience_kind"))) : d.audience;
            Resolved r = resolve(collegeId, au);
            LocalDateTime sendAt = futureOrNull(d.sendAt, "The send time has passed");
            if (sendAt != null && showUntil != null && !showUntil.isAfter(sendAt)) throw new IllegalArgumentException("It has to end after it is sent");
            p.addValue("k", audienceKind(au)).addValue("j", json(au)).addValue("l", r.label()).addValue("job", r.jobId()).addValue("sa", sendAt);
            extra = ", audience_kind = :k, audience_json = CAST(:j AS JSON), audience_label = :l, job_id = :job, send_at = :sa";
        }
        jdbc.update("UPDATE placement_announcement SET title = :t, body = :b, pinned = :p, link_label = :ll, link_url = :lu, show_until = :su, email = :e, updated_at = NOW()" + extra + " WHERE id = :id", p);
        int told = 0;
        if (!sent && d.sendAt == null) told = send(id, true); // a scheduled one changed to "now"
        else if (sent && Boolean.TRUE.equals(d.tellAgain)) {
            Map<String, Object> payload = payload(id, requireTitle(d.title), requireBody(d.body), true);
            for (Integer l : recipients(collegeId, id, String.valueOf(a.get("audience_kind")))) { outbox.enqueue(EVENT, "LEARNER", l, "APP", payload, null, false); told++; }
        }
        return Map.of("told", told);
    }

    /** Delete: students no longer see it, and its notices are taken back. */
    @Transactional
    public void delete(Integer collegeId, long id) {
        requireOwn(collegeId, id);
        jdbc.update("UPDATE placement_announcement SET is_deleted = 1, updated_at = NOW() WHERE id = :id", new MapSqlParameterSource("id", id));
        takeBackNotices(id);
    }

    /** Who it went to and hasn't opened it yet (at most 500), for the cell. */
    public List<Map<String, Object>> unreadBy(Integer collegeId, long id) {
        Map<String, Object> a = requireOwn(collegeId, id);
        if (a.get("sent_at") == null) return List.of();
        String who = "ALL".equals(a.get("audience_kind"))
                ? "FROM learner l WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) "
                : "FROM placement_announcement_recipient x JOIN learner l ON l.id = x.learner_id WHERE x.announcement_id = :id ";
        return jdbc.queryForList("SELECT l.id AS learnerId, TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) AS name, l.roll_number AS roll, l.department AS branch " +
                who + "AND NOT EXISTS (SELECT 1 FROM placement_announcement_read r WHERE r.announcement_id = :id AND r.reader_type = 'LEARNER' AND r.reader_id = l.id) " +
                "ORDER BY l.first_name LIMIT 500", new MapSqlParameterSource("id", id).addValue("c", collegeId));
    }

    /** Remind only those who haven't read it, at most once an hour. */
    @Transactional
    public Map<String, Object> remind(Integer collegeId, long id) {
        Map<String, Object> a = requireOwn(collegeId, id);
        if (a.get("sent_at") == null) throw new IllegalStateException("It hasn't been sent yet");
        if (a.get("show_until") != null && ((LocalDateTime) toLdt(a.get("show_until"))).isBefore(LocalDateTime.now(ZoneOffset.UTC))) throw new IllegalStateException("It has ended");
        Integer recent = jdbc.queryForObject("SELECT COUNT(*) FROM placement_announcement WHERE id = :id AND last_reminded_at >= UTC_TIMESTAMP() - INTERVAL " + REMIND_GAP_MINUTES + " MINUTE",
                new MapSqlParameterSource("id", id), Integer.class);
        if (recent != null && recent > 0) throw new IllegalStateException("They were reminded less than an hour ago");
        List<Map<String, Object>> unread = unreadBy(collegeId, id);
        Map<String, Object> payload = payload(id, String.valueOf(a.get("title")), String.valueOf(a.get("body")), false);
        payload.put("reminder", true);
        for (Map<String, Object> u : unread) outbox.enqueue(EVENT, "LEARNER", ((Number) u.get("learnerId")).intValue(), "APP", payload, null, false);
        jdbc.update("UPDATE placement_announcement SET last_reminded_at = UTC_TIMESTAMP() WHERE id = :id", new MapSqlParameterSource("id", id));
        return Map.of("reminded", unread.size());
    }

    // ================================================================ students read theirs

    private static final String FOR_STUDENT = "WHERE a.audience = 'STUDENTS' AND a.college_id = :c AND a.is_deleted = 0 AND a.sent_at IS NOT NULL " +
            "AND (a.show_until IS NULL OR a.show_until > UTC_TIMESTAMP()) " +
            "AND (a.audience_kind = 'ALL' OR EXISTS (SELECT 1 FROM placement_announcement_recipient x WHERE x.announcement_id = a.id AND x.learner_id = :rid)) ";

    /** What this student may read: theirs or "All students", sent and not ended. Pinned first. */
    public List<Map<String, Object>> forStudent(Integer collegeId, int learnerId) {
        if (collegeId == null) return List.of();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT a.id, a.title, a.body, a.pinned = 1 AS pinned, COALESCE(a.sent_at, a.created_at) AS createdAt, " +
                "CASE WHEN a.updated_at IS NOT NULL AND a.sent_at IS NOT NULL AND a.updated_at > a.sent_at THEN a.updated_at END AS updatedAt, 'Placement cell' AS authorName, " +
                "a.audience_kind AS audienceKind, a.audience_label AS audienceLabel, a.link_label AS linkLabel, a.link_url AS linkUrl, a.job_id AS jobId, a.show_until AS showUntil, " +
                "NOT EXISTS (SELECT 1 FROM placement_announcement_read r WHERE r.announcement_id = a.id AND r.reader_type = 'LEARNER' AND r.reader_id = :rid) AS unread " +
                "FROM placement_announcement a " + FOR_STUDENT + "ORDER BY a.pinned DESC, a.sent_at DESC, a.id DESC",
                new MapSqlParameterSource("c", collegeId).addValue("rid", learnerId));
        for (Map<String, Object> r : rows) {
            // "For Omega · SDE applicants": said only when it was narrowed to them.
            String kind = String.valueOf(r.get("audienceKind"));
            r.put("forYou", "ALL".equals(kind) || "PLACEMENTS".equals(kind) ? null : r.get("audienceLabel"));
            r.remove("audienceLabel");
        }
        return rows;
    }

    public int unreadForStudent(Integer collegeId, int learnerId) {
        if (collegeId == null) return 0;
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM placement_announcement a " + FOR_STUDENT +
                "AND NOT EXISTS (SELECT 1 FROM placement_announcement_read r WHERE r.announcement_id = a.id AND r.reader_type = 'LEARNER' AND r.reader_id = :rid)",
                new MapSqlParameterSource("c", collegeId).addValue("rid", learnerId), Integer.class);
        return n == null ? 0 : n;
    }

    // ================================================================ 42, to placement cells

    /** Colleges with a placement cell: a TPO account or a placement team. */
    public List<Map<String, Object>> placementCells() {
        return jdbc.queryForList("SELECT c.id, c.name AS name FROM college c WHERE EXISTS (SELECT 1 FROM faculty f WHERE f.college_id = c.id AND f.faculty_type = 14 " +
                "AND (f.is_deleted = 0 OR f.is_deleted IS NULL)) OR EXISTS (SELECT 1 FROM tpo_team_member t WHERE t.college_id = c.id) ORDER BY c.name", new MapSqlParameterSource());
    }

    /** What 42 told this person's placement cell, newest first, with what is new to them. */
    public List<Map<String, Object>> from42(Integer collegeId, int facultyId) {
        return jdbc.queryForList("SELECT a.id, a.title, a.body, a.pinned = 1 AS pinned, a.created_at AS createdAt, a.updated_at AS updatedAt, '42' AS authorName, " +
                "a.link_label AS linkLabel, a.link_url AS linkUrl, " +
                "NOT EXISTS (SELECT 1 FROM placement_announcement_read r WHERE r.announcement_id = a.id AND r.reader_type = 'FACULTY' AND r.reader_id = :rid) AS unread " +
                "FROM placement_announcement a " + FROM_42 + "ORDER BY a.pinned DESC, a.id DESC", new MapSqlParameterSource("c", collegeId).addValue("rid", facultyId));
    }

    private static final String FROM_42 = "WHERE a.audience = 'TPOS' AND a.is_deleted = 0 AND (a.show_until IS NULL OR a.show_until > UTC_TIMESTAMP()) " +
            "AND (a.audience_kind = 'ALL_COLLEGES' OR EXISTS (SELECT 1 FROM placement_announcement_college x WHERE x.announcement_id = a.id AND x.college_id = :c)) ";

    public int unreadFrom42(Integer collegeId, int facultyId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM placement_announcement a " + FROM_42 + "AND NOT EXISTS " +
                "(SELECT 1 FROM placement_announcement_read r WHERE r.announcement_id = a.id AND r.reader_type = 'FACULTY' AND r.reader_id = :f)",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId), Integer.class);
        return n == null ? 0 : n;
    }

    /** Super admin's list: "N of M placement cells read" (a college counts once anyone in it opened it). */
    public List<Map<String, Object>> allFrom42() {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT a.id, a.title, a.body, a.pinned = 1 AS pinned, a.created_at AS createdAt, a.updated_at AS updatedAt, '42' AS authorName, " +
                "a.audience_kind AS audienceKind, a.audience_label AS audienceLabel, a.recipient_count AS recipientCount, a.audience_json AS audienceJson, " +
                "a.link_label AS linkLabel, a.link_url AS linkUrl, a.show_until AS showUntil, " +
                "(SELECT COUNT(DISTINCT f.college_id) FROM placement_announcement_read r JOIN faculty f ON f.id = r.reader_id WHERE r.announcement_id = a.id AND r.reader_type = 'FACULTY') AS readCount " +
                "FROM placement_announcement a WHERE a.audience = 'TPOS' AND a.is_deleted = 0 ORDER BY a.pinned DESC, a.id DESC", new MapSqlParameterSource());
        for (Map<String, Object> r : rows) {
            r.put("ended", r.get("showUntil") != null && toLdt(r.get("showUntil")).isBefore(LocalDateTime.now(ZoneOffset.UTC)));
            r.put("collegeIds", fromJson(r.remove("audienceJson"), String.valueOf(r.get("audienceKind"))).collegeIds);
        }
        return rows;
    }

    @Transactional
    public Map<String, Object> postToTpos(Draft d, Author by) {
        if (d == null) throw new IllegalArgumentException("Write the announcement");
        List<Map<String, Object>> cells = placementCells();
        Audience a = d.audience == null ? new Audience() : d.audience;
        List<Integer> targets = new ArrayList<>();
        String kind;
        String label;
        if (a.collegeIds != null && !a.collegeIds.isEmpty()) {
            Set<Integer> known = new LinkedHashSet<>();
            for (Map<String, Object> c : cells) known.add(((Number) c.get("id")).intValue());
            for (Integer c : a.collegeIds) if (c != null && known.contains(c) && !targets.contains(c)) targets.add(c);
            if (targets.isEmpty()) throw new IllegalArgumentException("Pick at least one placement cell");
            kind = "COLLEGES";
            label = targets.size() == 1 ? nameOfCollege(cells, targets.get(0)) : targets.size() + " placement cells";
            a.collegeIds = targets;
        } else {
            for (Map<String, Object> c : cells) targets.add(((Number) c.get("id")).intValue());
            kind = "ALL_COLLEGES";
            label = "Every placement cell";
            a.collegeIds = null;
        }
        a.kind = kind;
        String[] link = link(d.linkLabel, d.linkUrl);
        LocalDateTime showUntil = futureOrNull(d.showUntil, "The end date has passed");
        String title = requireTitle(d.title);
        String body = requireBody(d.body);
        jdbc.update("INSERT INTO placement_announcement (college_id, audience, title, body, pinned, author_type, author_id, audience_kind, audience_json, audience_label, " +
                "recipient_count, link_label, link_url, show_until, sent_at) VALUES (NULL, 'TPOS', :t, :b, :p, :at, :ai, :k, CAST(:j AS JSON), :l, :n, :ll, :lu, :su, UTC_TIMESTAMP())",
                new MapSqlParameterSource("t", title).addValue("b", body).addValue("p", Boolean.TRUE.equals(d.pinned) ? 1 : 0).addValue("at", by.type()).addValue("ai", by.id())
                        .addValue("k", kind).addValue("j", json(a)).addValue("l", label).addValue("n", targets.size()).addValue("ll", link[0]).addValue("lu", link[1]).addValue("su", showUntil));
        long id = lastId();
        for (Integer c : targets) {
            jdbc.update("INSERT IGNORE INTO placement_announcement_college (announcement_id, college_id) VALUES (:a, :c)", new MapSqlParameterSource("a", id).addValue("c", c));
            audit.bell(c, "ANNOUNCEMENT_FROM_42", "From 42: " + title, preview(body), "/tpo/announcements?tab=from42");
        }
        return Map.of("id", id, "colleges", targets.size());
    }

    @Transactional
    public void updateFrom42(long id, Draft d) {
        if (d == null) throw new IllegalArgumentException("Write the announcement");
        String[] link = link(d.linkLabel, d.linkUrl);
        int n = jdbc.update("UPDATE placement_announcement SET title = :t, body = :b, pinned = :p, link_label = :ll, link_url = :lu, show_until = :su, updated_at = NOW() " +
                "WHERE id = :id AND audience = 'TPOS' AND is_deleted = 0", new MapSqlParameterSource("id", id).addValue("t", requireTitle(d.title)).addValue("b", requireBody(d.body))
                .addValue("p", Boolean.TRUE.equals(d.pinned) ? 1 : 0).addValue("ll", link[0]).addValue("lu", link[1]).addValue("su", futureOrNull(d.showUntil, "The end date has passed")));
        if (n == 0) throw new IllegalArgumentException("Announcement not found");
    }

    @Transactional
    public void deleteFrom42(long id) {
        jdbc.update("UPDATE placement_announcement SET is_deleted = 1, updated_at = NOW() WHERE id = :id AND audience = 'TPOS'", new MapSqlParameterSource("id", id));
    }

    // ================================================================ reading

    /** Marks these as read for one reader; the caller passes only ids from the reader's own list. */
    @Transactional
    public void markRead(String readerType, int readerId, List<Long> ids) {
        if (ids == null) return;
        for (Long id : ids) {
            if (id == null) continue;
            jdbc.update("INSERT IGNORE INTO placement_announcement_read (announcement_id, reader_type, reader_id) VALUES (:a, :t, :r)",
                    new MapSqlParameterSource("a", id).addValue("t", readerType).addValue("r", readerId));
        }
    }

    // ================================================================ internals

    private static String cellSelect() {
        return "SELECT a.id, a.title, a.body, a.pinned = 1 AS pinned, a.created_at AS createdAt, a.updated_at AS updatedAt, a.author_type AS authorType, " +
                "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS authorName, a.audience_kind AS audienceKind, a.audience_json AS audienceJson, " +
                "a.audience_label AS audienceLabel, a.recipient_count AS recipientCount, a.job_id AS jobId, a.link_label AS linkLabel, a.link_url AS linkUrl, " +
                "a.send_at AS sendAt, a.sent_at AS sentAt, a.show_until AS showUntil, a.email, a.last_reminded_at AS lastRemindedAt, " +
                "(a.sent_at IS NOT NULL AND a.sent_at >= UTC_TIMESTAMP() - INTERVAL " + UNDO_SECONDS + " SECOND) AS canUndo, " +
                "(SELECT COUNT(*) FROM placement_announcement_read r WHERE r.announcement_id = a.id AND r.reader_type = 'LEARNER') AS readCount " +
                "FROM placement_announcement a LEFT JOIN faculty f ON a.author_type = 'FACULTY' AND f.id = a.author_id ";
    }

    private void shapeState(Map<String, Object> r) {
        boolean sent = r.get("sentAt") != null;
        boolean ended = r.get("showUntil") != null && toLdt(r.get("showUntil")).isBefore(LocalDateTime.now(ZoneOffset.UTC));
        r.put("state", !sent ? "SCHEDULED" : ended ? "ENDED" : "SENT");
        r.put("updated", sent && r.get("updatedAt") != null && r.get("sentAt") != null && toLdt(r.get("updatedAt")).isAfter(toLdt(r.get("sentAt"))));
        r.put("email", truthy(r.get("email")));
        r.put("canUndo", truthy(r.get("canUndo")));
        Audience a = fromJson(r.remove("audienceJson"), String.valueOf(r.get("audienceKind")));
        r.put("audience", a);
    }

    /** The students an audience means right now, and how to say it. Refuses one that isn't this college's or reaches nobody. */
    Resolved resolve(Integer collegeId, Audience a) {
        String kind = audienceKind(a);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId);
        switch (kind) {
            case "ALL" -> {
                Set<Integer> all = new LinkedHashSet<>(jdbc.queryForList("SELECT id FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", p, Integer.class));
                return new Resolved(all, "All students", null, true);
            }
            case "PLACEMENTS" -> {
                Set<Integer> e = eligible(collegeId);
                if (e.isEmpty()) throw new IllegalArgumentException("No student is in placements yet");
                return new Resolved(e, "Students in placements", null, false);
            }
            case "BATCHES" -> {
                if (a.batchIds == null || a.batchIds.isEmpty()) throw new IllegalArgumentException("Pick at least one batch");
                List<Map<String, Object>> batches = jdbc.queryForList("SELECT pb.batch_id AS id, COALESCE(b.batch_name, CONCAT('Batch ', pb.batch_id)) AS name FROM placement_batch pb " +
                        "LEFT JOIN batch b ON b.id = pb.batch_id WHERE pb.college_id = :c AND pb.batch_id IN (:ids)", p.addValue("ids", a.batchIds));
                if (batches.size() != new LinkedHashSet<>(a.batchIds).size()) throw new IllegalArgumentException("Batch not found");
                Set<Integer> l = new LinkedHashSet<>(jdbc.queryForList("SELECT l.id FROM learner l JOIN class cl ON cl.id = l.class_id WHERE l.college_id = :c " +
                        "AND cl.batch_id IN (:ids) AND (l.is_deleted = 0 OR l.is_deleted IS NULL)", p, Integer.class));
                if (l.isEmpty()) throw new IllegalArgumentException("Nobody is in that batch");
                String label = batches.size() == 1 ? String.valueOf(batches.get(0).get("name")) : batches.stream().map(b -> String.valueOf(b.get("name"))).limit(3).reduce((x, y) -> x + ", " + y).orElse("")
                        + (batches.size() > 3 ? " and " + (batches.size() - 3) + " more" : "");
                return new Resolved(l, label, null, false);
            }
            case "BRANCHES" -> {
                if (a.branches == null || a.branches.isEmpty()) throw new IllegalArgumentException("Pick at least one branch");
                Set<String> wanted = new LinkedHashSet<>();
                for (String b : a.branches) if (b != null && !b.isBlank()) wanted.add(b.trim().toLowerCase(Locale.ROOT));
                Set<Integer> e = eligible(collegeId);
                Set<Integer> l = e.isEmpty() ? Set.of() : new LinkedHashSet<>(jdbc.queryForList("SELECT id FROM learner WHERE id IN (:ids) AND LOWER(TRIM(department)) IN (:b)",
                        new MapSqlParameterSource("ids", e).addValue("b", wanted), Integer.class));
                if (l.isEmpty()) throw new IllegalArgumentException("No student in placements is in that branch");
                return new Resolved(l, String.join(", ", a.branches.stream().map(String::trim).toList()) + " (in placements)", null, false);
            }
            case "DRIVE" -> {
                if (a.jobId == null) throw new IllegalArgumentException("Pick a drive");
                List<String> label = jdbc.queryForList("SELECT CONCAT(CASE WHEN company_name IS NULL OR company_name = '' THEN '' ELSE CONCAT(company_name, ' · ') END, job_title) FROM job " +
                        "WHERE id = :j AND college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", p.addValue("j", a.jobId), String.class);
                if (label.isEmpty()) throw new IllegalArgumentException("Drive not found");
                boolean active = "ACTIVE".equals(a.stage);
                Set<Integer> l = new LinkedHashSet<>(jdbc.queryForList("SELECT DISTINCT learner_id FROM job_application WHERE job_id = :j AND (is_deleted = 0 OR is_deleted IS NULL) " +
                        "AND (application_status IS NULL OR application_status NOT IN " + (active ? "('REJECTED','WITHDRAWN','NOT_SELECTED')" : "('WITHDRAWN')") + ")", p, Integer.class));
                if (l.isEmpty()) throw new IllegalArgumentException(active ? "Nobody is still in that drive" : "Nobody has applied to that drive");
                return new Resolved(l, label.get(0) + (active ? ": still in the drive" : ": everyone who applied"), a.jobId, false);
            }
            default -> throw new IllegalArgumentException("Pick who it is for");
        }
    }

    private Set<Integer> eligible(Integer collegeId) {
        Set<Integer> out = new LinkedHashSet<>();
        for (Map.Entry<Integer, PlacementEligibilityService.Resolved> e : placementEligibility.resolveCollege(collegeId).entrySet()) {
            if (PlacementEligibilityService.ELIGIBLE.equals(e.getValue().status)) out.add(e.getKey());
        }
        return out;
    }

    private List<Integer> recipients(Integer collegeId, long id, String kind) {
        if ("ALL".equals(kind)) return jdbc.queryForList("SELECT id FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId), Integer.class);
        return jdbc.queryForList("SELECT learner_id FROM placement_announcement_recipient WHERE announcement_id = :a", new MapSqlParameterSource("a", id), Integer.class);
    }

    /** Its notices, sent or waiting, are cancelled: they drop out of the students' notices. */
    private void takeBackNotices(long id) {
        jdbc.update("UPDATE notification_outbox SET status = 'CANCELLED', failure_reason = 'Announcement deleted' WHERE event = :e " +
                "AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.announcementId')) = :id AND status <> 'CANCELLED'",
                new MapSqlParameterSource("e", EVENT).addValue("id", String.valueOf(id)));
    }

    private Map<String, Object> payload(long id, String title, String body, boolean updated) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("announcementId", id);
        m.put("title", (updated ? "Updated: " : "") + title);
        m.put("preview", preview(body));
        return m;
    }

    private static Audience defaultAudience() {
        Audience a = new Audience();
        a.kind = "PLACEMENTS";
        return a;
    }

    static String audienceKind(Audience a) {
        String k = a == null || a.kind == null ? "PLACEMENTS" : a.kind.trim().toUpperCase(Locale.ROOT);
        if (!STUDENT_AUDIENCES.contains(k)) throw new IllegalArgumentException("Pick who it is for");
        return k;
    }

    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();

    static String json(Audience a) {
        try { return JSON.writeValueAsString(a); } catch (Exception e) { return "{}"; }
    }

    static Audience fromJson(Object raw, String kind) {
        Audience a = new Audience();
        if (raw != null) {
            try { a = JSON.readValue(String.valueOf(raw), Audience.class); } catch (Exception ignored) { /* an old row: the kind is enough */ }
        }
        if (a.kind == null) a.kind = kind;
        return a;
    }

    private Map<String, Object> row(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM placement_announcement WHERE id = :id AND is_deleted = 0", new MapSqlParameterSource("id", id));
        if (rows.isEmpty()) throw new IllegalArgumentException("Announcement not found");
        return rows.get(0);
    }

    private Map<String, Object> requireOwn(Integer collegeId, long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM placement_announcement WHERE id = :id AND college_id = :c AND audience = 'STUDENTS' AND is_deleted = 0",
                new MapSqlParameterSource("id", id).addValue("c", collegeId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Announcement not found");
        return rows.get(0);
    }

    private long lastId() {
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        return id == null ? 0 : id;
    }

    private static String nameOfCollege(List<Map<String, Object>> cells, Integer id) {
        for (Map<String, Object> c : cells) if (((Number) c.get("id")).intValue() == id) return String.valueOf(c.get("name"));
        return "1 placement cell";
    }

    /** A button: an https link with a short label ("Open" when none is given). */
    static String[] link(String label, String url) {
        String u = url == null ? "" : url.trim();
        String l = label == null ? "" : label.trim();
        if (u.isEmpty()) {
            if (!l.isEmpty()) throw new IllegalArgumentException("Add the link for the button, or remove its label");
            return new String[]{null, null};
        }
        if (!u.matches("(?i)^https://[^\\s]+$")) throw new IllegalArgumentException("The link has to start with https://");
        if (u.length() > 500) throw new IllegalArgumentException("Keep the link under 500 characters");
        if (l.length() > 60) throw new IllegalArgumentException("Keep the button label under 60 characters");
        return new String[]{l.isEmpty() ? "Open" : l, u};
    }

    static LocalDateTime futureOrNull(String raw, String passed) {
        if (raw == null || raw.isBlank()) return null;
        LocalDateTime d;
        try {
            String v = raw.trim().replace("Z", "");
            d = LocalDateTime.parse(v.length() == 16 ? v + ":00" : v.length() == 10 ? v + "T23:59:00" : v);
        } catch (Exception e) {
            throw new IllegalArgumentException("Give a date and time");
        }
        if (d.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) throw new IllegalArgumentException(passed);
        return d;
    }

    static LocalDateTime toLdt(Object v) {
        if (v instanceof LocalDateTime l) return l;
        if (v instanceof java.sql.Timestamp t) return t.toLocalDateTime();
        return LocalDateTime.parse(String.valueOf(v).replace(' ', 'T'));
    }

    private static boolean truthy(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        if (v instanceof Number n) return n.intValue() != 0;
        return "true".equalsIgnoreCase(String.valueOf(v)) || "1".equals(String.valueOf(v));
    }

    private static String requireTitle(String title) {
        String t = clean(title);
        if (t == null) throw new IllegalArgumentException("Give the announcement a title");
        if (t.length() > MAX_TITLE) throw new IllegalArgumentException("Keep the title under " + MAX_TITLE + " characters");
        return t;
    }

    private static String requireBody(String body) {
        String b = clean(body);
        if (b == null) throw new IllegalArgumentException("Write the announcement");
        if (b.length() > MAX_BODY) throw new IllegalArgumentException("Keep it under " + MAX_BODY + " characters");
        return b;
    }

    static String preview(String body) {
        String b = body == null ? "" : body.trim().replaceAll("\\s+", " ");
        return b.length() > 140 ? b.substring(0, 137) + "..." : b;
    }

    /** Stored as typed: the screen escapes text when it shows it (escaping here too showed "&amp;amp;"). */
    static String clean(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isEmpty() ? null : v;
    }

    /** Ids from a list, for markRead. */
    public static List<Long> ids(List<Map<String, Object>> rows) {
        List<Long> out = new ArrayList<>();
        for (Map<String, Object> r : rows) out.add(((Number) r.get("id")).longValue());
        return out;
    }
}
