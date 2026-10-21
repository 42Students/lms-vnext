package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Emails a recruiter about the placement cell's messages only when they wait unread (13 Oct 2026). A message used to be emailed as
 * it was sent, so a burst of four lines was four emails, and a recruiter working in their account got emails for what they had
 * already read.
 *
 * Every few minutes, for each conversation with unread messages from the placement cell that arrived after its last email:
 * - wait until the oldest of them has been unread 15 minutes and the placement cell has paused for 2 (so a burst is one email),
 *   or 45 minutes have passed whatever happens;
 * - at most one email per conversation every 6 hours, so a recruiter away for a day gets two or three, never a stream;
 * - the email shows the latest three unread messages in full, so it can be acted on without signing in, and its Reply-To is the
 *   conversation's reply address: a reply by email comes back into the conversation (Cloudflare worker -> InboundReplyService).
 * Only while the recruiter can still see the college.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecruiterMessageEmailService {

    static final int WAIT_MINUTES = 15, QUIET_MINUTES = 2, LATEST_MINUTES = 45, GAP_HOURS = 6, SHOWN = 3;
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("d MMM, h:mm a", Locale.ENGLISH);

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoMailService mail;
    private final TpoMessagesService messages;

    /** The recruiter address: recruitment@42lms.com -> reply address recruitment+r-<code>@42lms.com (Cloudflare Email Routing). */
    @Value("${RECRUITER_MAILBOX:recruitment@42lms.com}")
    private String mailbox;

    /** "r" on prod, "rdev" on dev: each environment reads only its own replies from the shared mailbox. */
    @Value("${REPLY_TAG:r}")
    private String replyTag;

    static String replyAddress(String mailbox, String tag, String token) {
        if (mailbox == null || token == null) return null;
        int at = mailbox.indexOf('@');
        if (at <= 0) return null;
        return mailbox.substring(0, at) + "+" + (tag == null || tag.isBlank() ? "r" : tag.trim()) + "-" + token + mailbox.substring(at);
    }

    /** Conversations due an email now (unread placement-cell messages since the last email, waited long enough, 6 hours apart). */
    static final String DUE =
            "SELECT t.id, t.college_id AS collegeId, t.recruiter_id AS recruiterId, t.job_id AS jobId, j.company_name AS company, j.job_title AS role, " +
            "  h.contact_mail AS email, h.first_name AS name " +
            "FROM tpo_message_thread t JOIN recruiter h ON h.id = t.recruiter_id LEFT JOIN job j ON j.id = t.job_id " +
            "JOIN (SELECT m.thread_id, MIN(m.created_at) AS oldest, MAX(m.created_at) AS newest FROM tpo_message m JOIN tpo_message_thread x ON x.id = m.thread_id " +
            "      WHERE m.sender_type = 'TPO' AND m.kind = 'MESSAGE' AND m.read_at IS NULL " +
            "        AND (x.recruiter_emailed_at IS NULL OR m.created_at > x.recruiter_emailed_at) GROUP BY m.thread_id) u ON u.thread_id = t.id " +
            "WHERE (t.recruiter_emailed_at IS NULL OR t.recruiter_emailed_at <= NOW() - INTERVAL " + GAP_HOURS + " HOUR) " +
            "  AND ((u.oldest <= NOW() - INTERVAL " + WAIT_MINUTES + " MINUTE AND u.newest <= NOW() - INTERVAL " + QUIET_MINUTES + " MINUTE) " +
            "       OR u.oldest <= NOW() - INTERVAL " + LATEST_MINUTES + " MINUTE) " +
            "  AND h.contact_mail IS NOT NULL AND h.contact_mail <> '' AND (h.is_deleted = 0 OR h.is_deleted IS NULL) " +
            "  AND EXISTS (SELECT 1 FROM recruiter_college_access x WHERE x.recruiter_id = t.recruiter_id AND x.college_id = t.college_id " +
            "              AND x.status = 'ACTIVE' AND (x.valid_until IS NULL OR x.valid_until > NOW())) " +
            "LIMIT 200";

    public int emailUnread() {
        if (!mail.isConfigured("recruiter-message")) return 0;
        int sent = 0;
        for (Map<String, Object> t : jdbc.queryForList(DUE, new MapSqlParameterSource())) {
            try {
                if (emailOne(t)) sent++;
            } catch (RuntimeException e) {
                log.warn("Unread-messages email for conversation {} failed: {}", t.get("id"), e.getMessage());
            }
        }
        if (sent > 0) log.info("Unread-messages emails sent: {}", sent);
        return sent;
    }

    boolean emailOne(Map<String, Object> t) {
        long threadId = ((Number) t.get("id")).longValue();
        Integer collegeId = ((Number) t.get("collegeId")).intValue();
        Integer jobId = t.get("jobId") == null ? null : ((Number) t.get("jobId")).intValue();
        List<Map<String, Object>> unread = jdbc.queryForList(
                "SELECT m.body, m.created_at AS createdAt, TRIM(CONCAT(f.first_name, ' ', COALESCE(f.last_name, ''))) AS sender " +
                "FROM tpo_message m LEFT JOIN faculty f ON f.id = m.sender_id WHERE m.thread_id = :t AND m.sender_type = 'TPO' " +
                "AND m.kind = 'MESSAGE' AND m.read_at IS NULL ORDER BY m.id DESC", new MapSqlParameterSource("t", threadId));
        if (unread.isEmpty()) return false;
        // Taken before sending, so a second worker or a slow send never emails the same conversation twice.
        int claimed = jdbc.update("UPDATE tpo_message_thread SET recruiter_emailed_at = NOW() WHERE id = :t AND " +
                        "(recruiter_emailed_at IS NULL OR recruiter_emailed_at <= NOW() - INTERVAL " + GAP_HOURS + " HOUR)",
                new MapSqlParameterSource("t", threadId));
        if (claimed != 1) return false;

        Map<String, String> m = new LinkedHashMap<>();
        m.put("name", text(t.get("name")));
        int n = unread.size();
        m.put("count", n == 1 ? "1 new message" : n + " new messages");
        String company = text(t.get("company")), role = text(t.get("role"));
        m.put("subject", jobId == null ? "your recruitment with us" : (company.isEmpty() ? role : company + " · " + role));
        m.put("messages", messagesText(unread.subList(0, Math.min(SHOWN, n))));
        m.put("more", n > SHOWN ? "+ " + (n - SHOWN) + (n - SHOWN == 1 ? " earlier message" : " earlier messages") + " in the conversation" : "");
        m.put("driveLink", mail.collegeLink(collegeId, jobId == null ? "/recruiter/messages" : "/recruiter/drives/" + jobId));
        String replyTo = replyAddress(mailbox, replyTag, messages.replyToken(threadId));
        TpoMailService.Result r = mail.sendAsCollege("recruiter-message", text(t.get("email")), m, collegeId, replyTo);
        if (r == TpoMailService.Result.NOT_CONFIGURED) {
            // Nothing went out: try again next time instead of waiting six hours.
            jdbc.update("UPDATE tpo_message_thread SET recruiter_emailed_at = NULL WHERE id = :t", new MapSqlParameterSource("t", threadId));
            return false;
        }
        return r == TpoMailService.Result.SENT;
    }

    /** Oldest first, each as "Dr. K. Ramesh · 13 Oct, 10:42 AM" then the message. */
    static String messagesText(List<Map<String, Object>> newestFirst) {
        List<String> parts = new ArrayList<>();
        for (int i = newestFirst.size() - 1; i >= 0; i--) {
            Map<String, Object> r = newestFirst.get(i);
            String sender = text(r.get("sender"));
            String when = india(r.get("createdAt"));
            String head = (sender.isEmpty() ? "Campus Recruitment Team" : sender) + (when.isEmpty() ? "" : " · " + when);
            parts.add(head + "\n" + text(r.get("body")));
        }
        return String.join("\n\n", parts);
    }

    /** created_at is the database's clock, which runs in UTC. */
    private static String india(Object v) {
        LocalDateTime t = v instanceof LocalDateTime l ? l : v instanceof Timestamp s ? s.toLocalDateTime() : null;
        if (t == null) return "";
        return t.atZone(ZoneId.of("UTC")).withZoneSameInstant(INDIA).format(WHEN);
    }

    private static String text(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }
}
