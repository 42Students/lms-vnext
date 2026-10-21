package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-app conversations between a TPO and a recruiter, grouped by drive, plus one General thread per recruiter
 * (TPO V1 - Locked.docx §1 "Where things arrive").
 *
 * Email (13 Oct 2026): a TPO's message is not emailed as it is sent. RecruiterMessageEmailService emails the recruiter once their
 * messages have waited unread (one email per conversation at most every 6 hours), with a Reply-To of this conversation's reply
 * address; replies arrive through Cloudflare Email Routing and InboundReplyService posts them here (via = EMAIL). Recruiter messages reach
 * the TPO in the app only (bell and unread badge).
 *
 * A drive thread also carries its change requests' lines (kind = 'EVENT', see postEvent), and a message can quote a request
 * (change_request_id). Unread counts, "waiting for you" and Seen look at real messages only (kind = 'MESSAGE'); event lines are
 * never emailed. Edge cases: docs/recruiter-global/REQUESTS-DISCUSSION-AUDIT-2026-10-12.md.
 */
@Service
@RequiredArgsConstructor
public class TpoMessagesService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoAuditService audit;

    private long threadFor(Integer collegeId, long recruiterId, Integer jobId) {
        // BE-0157: UNIQUE (college_id, recruiter_id, job_id) lets several job_id = NULL (General) threads in, so two first
        // messages at once could each make one. Taking turns on the recruiter row makes the second see the first.
        jdbc.queryForList("SELECT id FROM recruiter WHERE id = :h FOR UPDATE", new MapSqlParameterSource("h", recruiterId));
        List<Long> found = jdbc.queryForList("SELECT id FROM tpo_message_thread WHERE college_id = :c AND recruiter_id = :h AND " +
                        "(job_id <=> :j) FOR UPDATE", new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("j", jobId), Long.class);
        if (!found.isEmpty()) return found.get(0);
        jdbc.update("INSERT INTO tpo_message_thread (college_id, recruiter_id, job_id) VALUES (:c, :h, :j)",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("j", jobId));
        return jdbc.queryForObject("SELECT id FROM tpo_message_thread WHERE college_id = :c AND recruiter_id = :h AND (job_id <=> :j)",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("j", jobId), Long.class);
    }

    /** Unread recruiter messages across the college: one COUNT for the top bar badge. */
    public int unreadForTpo(Integer collegeId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_message m JOIN tpo_message_thread t ON t.id = m.thread_id " +
                "WHERE t.college_id = :c AND m.sender_type = 'RECRUITER' AND m.kind = 'MESSAGE' AND m.read_at IS NULL", new MapSqlParameterSource("c", collegeId), Integer.class);
        return n == null ? 0 : n;
    }

    /**
     * Live conversations (13 Oct 2026): a small token that changes whenever anything a screen shows changes (a new message or
     * line, or a message being read), for the college's placement cell or for one recruiter there. Screens ask every few seconds
     * while open and reload only when it changes. Works across every backend instance (it is read from the database) and never
     * carries message content, so the usual permission-checked endpoints stay the only way to read messages.
     */
    public String pulse(Integer collegeId, Long recruiterId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId);
        Map<String, Object> r = jdbc.queryForMap("SELECT COALESCE(MAX(m.id), 0) AS lastId, COUNT(m.read_at) AS readCount, COUNT(*) AS total " +
                "FROM tpo_message m JOIN tpo_message_thread t ON t.id = m.thread_id WHERE t.college_id = :c" +
                (recruiterId == null ? "" : " AND t.recruiter_id = :h"), p);
        return r.get("lastId") + "." + r.get("readCount") + "." + r.get("total");
    }

    /** Access that lets a recruiter see this college now: granted, not revoked, not past its end date. */
    private static final String ACTIVE_ACCESS = "SELECT COUNT(*) FROM recruiter_college_access x WHERE x.recruiter_id = %s AND x.college_id = %s " +
            "AND x.status = 'ACTIVE' AND (x.valid_until IS NULL OR x.valid_until > NOW())";

    /**
     * Threads for the TPO inbox, newest first, with unread counts, whether the last word was the recruiter's, the recruiter's
     * company and whether they can still see the college (accessActive: false once revoked or expired).
     */
    public List<Map<String, Object>> threadsForTpo(Integer collegeId, Integer jobId) {
        return jdbc.queryForList(
                "SELECT t.id, t.recruiter_id AS recruiterId, t.job_id AS jobId, t.last_message_at AS lastMessageAt, " +
                "  TRIM(CONCAT(h.first_name, ' ', COALESCE(h.last_name, ''))) AS recruiterName, ic.name AS recruiterCompany, " +
                "  (" + String.format(ACTIVE_ACCESS, "t.recruiter_id", "t.college_id") + ") > 0 AS accessActive, " +
                "  (CASE WHEN j.id IS NULL THEN 'General' ELSE CONCAT(j.company_name, ' · ', j.job_title) END) AS subject, " +
                "  (SELECT m.body FROM tpo_message m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS lastBody, " +
                "  (SELECT m.sender_type FROM tpo_message m WHERE m.thread_id = t.id AND m.kind = 'MESSAGE' ORDER BY m.id DESC LIMIT 1) AS lastSender, " +
                "  (SELECT COUNT(*) FROM tpo_message m WHERE m.thread_id = t.id AND m.sender_type = 'RECRUITER' AND m.kind = 'MESSAGE' AND m.read_at IS NULL) AS unread " +
                "FROM tpo_message_thread t JOIN recruiter h ON h.id = t.recruiter_id LEFT JOIN company ic ON ic.id = h.company_id " +
                "LEFT JOIN job j ON j.id = t.job_id WHERE t.college_id = :c AND (:j IS NULL OR t.job_id = :j) ORDER BY t.last_message_at DESC",
                new MapSqlParameterSource("c", collegeId).addValue("j", jobId));
    }

    public List<Map<String, Object>> messages(Integer collegeId, long threadId, String reader) {
        Long own = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_message_thread WHERE id = :t AND college_id = :c",
                new MapSqlParameterSource("t", threadId).addValue("c", collegeId), Long.class);
        if (own == null || own == 0) throw new IllegalArgumentException("Not found");
        String other = "TPO".equals(reader) ? "RECRUITER" : "TPO";
        jdbc.update("UPDATE tpo_message SET read_at = NOW() WHERE thread_id = :t AND sender_type = :o AND read_at IS NULL",
                new MapSqlParameterSource("t", threadId).addValue("o", other));
        // Who wrote each message: a teammate's name (a shared inbox used to say "You" for everyone in the placement cell) or the recruiter's.
        // A line about a change request (or a message quoting one) carries the request, so the screen can show it in the reader's time.
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT m.id, m.sender_type AS senderType, m.sender_id AS senderId, m.body, m.read_at AS readAt, m.created_at AS createdAt, m.via, " +
                "  m.kind, m.event, m.change_request_id AS changeRequestId, " +
                "  cr.field AS crField, cr.kind AS crKind, cr.direction AS crDirection, cr.current_value AS crCurrent, cr.proposed_value AS crProposed, " +
                "  cr.note AS crNote, cr.status AS crStatus, cr.answer_value AS crAnswer, cr.reply_text AS crReply, " +
                "  CASE m.sender_type WHEN 'TPO' THEN (SELECT TRIM(CONCAT(f.first_name, ' ', COALESCE(f.last_name, ''))) FROM faculty f WHERE f.id = m.sender_id) " +
                "    WHEN 'RECRUITER' THEN (SELECT TRIM(CONCAT(h.first_name, ' ', COALESCE(h.last_name, ''))) FROM recruiter h WHERE h.id = m.sender_id) END AS senderName " +
                "FROM tpo_message m LEFT JOIN drive_change_request cr ON cr.id = m.change_request_id WHERE m.thread_id = :t ORDER BY m.id", new MapSqlParameterSource("t", threadId));
        for (Map<String, Object> r : rows) {
            Object field = r.remove("crField");
            Object crKind = r.remove("crKind"), dir = r.remove("crDirection"), cur = r.remove("crCurrent"), prop = r.remove("crProposed");
            Object note = r.remove("crNote"), st = r.remove("crStatus"), ans = r.remove("crAnswer"), rep = r.remove("crReply");
            if (r.get("changeRequestId") == null || field == null) continue;
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("id", r.get("changeRequestId"));
            q.put("field", field);
            q.put("fieldLabel", DriveChangeRequestService.label(field));
            q.put("kind", crKind);
            q.put("direction", dir);
            q.put("currentValue", cur);
            q.put("proposedValue", prop);
            q.put("note", note);
            q.put("status", st);
            q.put("answerValue", ans);
            q.put("replyText", rep);
            r.put("request", q);
        }
        return rows;
    }

    /** Access that lets this recruiter see the college now. */
    public boolean recruiterCanSee(Integer collegeId, long recruiterId) {
        Long active = jdbc.queryForObject(String.format(ACTIVE_ACCESS, ":h", ":c"), new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), Long.class);
        return active != null && active > 0;
    }

    /**
     * A change request's line in its drive's company thread (created, accepted, answered, declined, withdrawn). Not a message: no
     * access check (the request itself was checked), no email, no bell, never unread. It moves the thread to the top.
     */
    @Transactional
    public void postEvent(Integer collegeId, long recruiterId, Integer jobId, String senderType, int senderId, String event, long changeRequestId, String words) {
        long thread = threadFor(collegeId, recruiterId, jobId);
        jdbc.update("INSERT INTO tpo_message (thread_id, sender_type, sender_id, body, kind, event, change_request_id) VALUES (:t, :st, :si, :b, 'EVENT', :e, :r)",
                new MapSqlParameterSource("t", thread).addValue("st", senderType).addValue("si", senderId).addValue("b", words.length() > 4000 ? words.substring(0, 4000) : words)
                        .addValue("e", event).addValue("r", changeRequestId));
        jdbc.update("UPDATE tpo_message_thread SET last_message_at = NOW() WHERE id = :t", new MapSqlParameterSource("t", thread));
    }

    public long send(Integer collegeId, long recruiterId, Integer jobId, String senderType, int senderId, String body) {
        return send(collegeId, recruiterId, jobId, senderType, senderId, body, null);
    }

    /**
     * jobId null = the General thread. The recruiter must have access to this college. changeRequestId: the request this message
     * talks about ("Discuss" on a request); it must be a request on this drive.
     */
    @Transactional
    public long send(Integer collegeId, long recruiterId, Integer jobId, String senderType, int senderId, String rawBody, Long changeRequestId) {
        return post(collegeId, recruiterId, jobId, senderType, senderId, rawBody, changeRequestId, "APP")[0];
    }

    /**
     * A recruiter's reply to our email, posted into the conversation the reply address belongs to, with the same checks as a message
     * written in the app. It counts as reading the placement cell's messages (they answered them). Returns the new message's id.
     */
    @Transactional
    public long postEmailReply(Integer collegeId, long recruiterId, Integer jobId, String body) {
        long[] posted = post(collegeId, recruiterId, jobId, "RECRUITER", (int) recruiterId, body, null, "EMAIL");
        jdbc.update("UPDATE tpo_message SET read_at = NOW() WHERE thread_id = :t AND sender_type = 'TPO' AND read_at IS NULL",
                new MapSqlParameterSource("t", posted[0]));
        return posted[1];
    }

    /** This conversation's reply address code, made the first time it is needed. */
    @Transactional
    public String replyToken(long threadId) {
        List<String> have = jdbc.queryForList("SELECT reply_token FROM tpo_message_thread WHERE id = :t FOR UPDATE", new MapSqlParameterSource("t", threadId), String.class);
        if (!have.isEmpty() && have.get(0) != null) return have.get(0);
        byte[] raw = new byte[10];
        new java.security.SecureRandom().nextBytes(raw);
        StringBuilder token = new StringBuilder();
        for (byte b : raw) token.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
        jdbc.update("UPDATE tpo_message_thread SET reply_token = :k WHERE id = :t", new MapSqlParameterSource("k", token.toString()).addValue("t", threadId));
        return token.toString();
    }

    /** [thread id, message id] */
    private long[] post(Integer collegeId, long recruiterId, Integer jobId, String senderType, int senderId, String rawBody, Long changeRequestId, String via) {
        String body = rawBody == null ? null : rawBody.trim();
        if (body == null || body.isEmpty()) throw new IllegalArgumentException("Write a message first");
        if (body.length() > 4000) throw new IllegalArgumentException("Keep a message under 4000 characters");
        Long any = jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_college_access WHERE recruiter_id = :h AND college_id = :c",
                new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), Long.class);
        if (any == null || any == 0) throw new IllegalArgumentException("Not found");
        // A recruiter whose access was removed or has ended cannot read the college any more: nothing is sent (or emailed) to them.
        Long active = jdbc.queryForObject(String.format(ACTIVE_ACCESS, ":h", ":c"), new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), Long.class);
        if (active == null || active == 0) throw new IllegalStateException("This recruiter's access to your college has ended. Give access again in Settings > Recruiters to write to them.");
        if (jobId != null) {
            // A drive thread is with that drive's own recruiter only. It used to allow any recruiter on a drive the college runs itself:
            // they saw a thread named after a drive they can't open, and could not reply in it.
            Long okJob = jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE id = :j AND college_id = :c AND recruiter_id = :h",
                    new MapSqlParameterSource("j", jobId).addValue("c", collegeId).addValue("h", recruiterId), Long.class);
            if (okJob == null || okJob == 0) throw new IllegalArgumentException("Not found");
        }
        if (changeRequestId != null) {
            Long okRequest = jobId == null ? Long.valueOf(0) : jdbc.queryForObject("SELECT COUNT(*) FROM drive_change_request WHERE id = :r AND job_id = :j AND college_id = :c",
                    new MapSqlParameterSource("r", changeRequestId).addValue("j", jobId).addValue("c", collegeId), Long.class);
            if (okRequest == null || okRequest == 0) throw new IllegalArgumentException("Not found");
        }
        long thread = threadFor(collegeId, recruiterId, jobId);
        jdbc.update("INSERT INTO tpo_message (thread_id, sender_type, sender_id, body, change_request_id, via) VALUES (:t, :st, :si, :b, :r, :v)",
                new MapSqlParameterSource("t", thread).addValue("st", senderType).addValue("si", senderId).addValue("b", body).addValue("r", changeRequestId).addValue("v", via));
        Long messageId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        jdbc.update("UPDATE tpo_message_thread SET last_message_at = NOW() WHERE id = :t", new MapSqlParameterSource("t", thread));
        // A TPO's message is emailed later, and only if it waits unread (RecruiterMessageEmailService).
        if ("RECRUITER".equals(senderType)) audit.bell(collegeId, "RECRUITER_MESSAGE", "EMAIL".equals(via) ? "A recruiter replied by email" : "New message from a recruiter",
                body.length() > 120 ? body.substring(0, 120) + "…" : body, "/tpo/messages");
        return new long[]{thread, messageId == null ? 0 : messageId};
    }

    /** The recruiter's own threads for one college. */
    public List<Map<String, Object>> threadsForRecruiter(Integer collegeId, long recruiterId) {
        return jdbc.queryForList(
                "SELECT t.id, t.job_id AS jobId, t.last_message_at AS lastMessageAt, " +
                "(CASE WHEN j.id IS NULL THEN 'General' ELSE CONCAT(j.company_name, ' · ', j.job_title) END) AS subject, " +
                "(SELECT m.body FROM tpo_message m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS lastBody, " +
                "(SELECT COUNT(*) FROM tpo_message m WHERE m.thread_id = t.id AND m.sender_type = 'TPO' AND m.kind = 'MESSAGE' AND m.read_at IS NULL) AS unread " +
                "FROM tpo_message_thread t LEFT JOIN job j ON j.id = t.job_id WHERE t.college_id = :c AND t.recruiter_id = :h ORDER BY t.last_message_at DESC",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId));
    }

    public boolean threadBelongsToRecruiter(long threadId, Integer collegeId, long recruiterId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_message_thread WHERE id = :t AND college_id = :c AND recruiter_id = :h",
                new MapSqlParameterSource("t", threadId).addValue("c", collegeId).addValue("h", recruiterId), Long.class);
        return n != null && n > 0;
    }
}
