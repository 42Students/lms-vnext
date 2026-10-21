package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Recruiters' replies to our emails, posted into their conversation (13 Oct 2026). A conversation's emails carry the Reply-To
 * recruitment+<tag>-<code>@42lms.com. Cloudflare Email Routing receives every email to 42lms.com and hands it to our Email
 * Worker (ops/cloudflare/inbound-email-worker), which keeps it 30 days in Cloudflare D1 and posts it here, signed with
 * INBOUND_EMAIL_SECRET: a +<tag>- reply to its environment (prod "r", dev "rdev"), anything else to prod. Every email is kept in
 * inbound_email (no Gmail anywhere); anything that is not a conversation reply is read on Super Admin > Inbound mail.
 *
 * For each reply: find the conversation by its code; accept it only from the recruiter's own address and only when the sender
 * was verified (Cloudflare checks SPF/DKIM and records DMARC in ARC-Authentication-Results); keep the new text, not the quoted
 * history; post it as the recruiter (same checks as the app: access still active, the drive still theirs). Every reply is logged
 * in inbound_email with what happened, posted or not.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InboundReplyService {

    private static final Pattern ADDRESS = Pattern.compile("<([^>]+)>");

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoMessagesService messages;

    /** Shared with the Cloudflare Email Worker; unset = nothing is accepted. */
    @Value("${INBOUND_EMAIL_SECRET:}")
    private String secret = "";

    /** This environment's reply tag (RecruiterMessageEmailService): only recruitment+<tag>-<code>@ replies are handled here. */
    @Value("${REPLY_TAG:r}")
    private String replyTag = "r";

    /** One email as the worker sends it. */
    public static class Inbound {
        public String id;            // Message-ID (each email is handled once)
        public String from;          // envelope sender
        public String headerFrom;    // From: header
        public String to;            // envelope recipient (the reply address)
        public String subject;
        public String auth;          // ARC-Authentication-Results / Authentication-Results
        public String text;
        public String html;
    }

    public boolean acceptsSecret(String given) {
        if (secret == null || secret.isBlank() || given == null) return false;
        return MessageDigest.isEqual(secret.trim().getBytes(StandardCharsets.UTF_8), given.trim().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * What happened to the email. A reply to a conversation (this environment's tag): POSTED, or why not (NO_THREAD, WRONG_SENDER,
     * NOT_VERIFIED, EMPTY, ACCESS_ENDED, FAILED). Any other email: STORED (kind OTHER, read on Super Admin > Inbound mail), or
     * NOT_OURS when it carries another environment's tag. DUPLICATE when the same email (Message-ID) came before.
     */
    public String receive(Inbound in) {
        String token = tokenOf(replyTag, in.to);
        boolean otherEnvironment = token == null && in.to != null && in.to.toLowerCase(Locale.ROOT).matches(".*\\+r[a-z]*-[0-9a-f]{20}@.*");
        if (otherEnvironment) return "NOT_OURS";
        String id = cut(in.id == null || in.id.isBlank() ? "no-id:" + System.nanoTime() : in.id.trim(), 100);
        int fresh = jdbc.update("INSERT IGNORE INTO inbound_email (external_id, status, kind) VALUES (:g, 'FAILED', :k)",
                new MapSqlParameterSource("g", id).addValue("k", token == null ? "OTHER" : "REPLY"));
        if (fresh == 0) return "DUPLICATE";
        String from = addressOf(in.headerFrom != null && !in.headerFrom.isBlank() ? in.headerFrom : in.from);
        String fullText = in.text != null && !in.text.isBlank() ? in.text : htmlText(in.html);
        Sender who = senderOf(from);

        if (token == null) {
            record(id, "STORED", from, in, null, null, cut(fullText, 200000), cut(fullText, 1000), who);
            return "STORED";
        }

        String body = cut(stripQuoted(fullText), 4000);
        List<Map<String, Object>> thread = jdbc.queryForList("SELECT t.id, t.college_id AS collegeId, t.recruiter_id AS recruiterId, t.job_id AS jobId, " +
                "h.contact_mail AS email FROM tpo_message_thread t JOIN recruiter h ON h.id = t.recruiter_id WHERE t.reply_token = :k", new MapSqlParameterSource("k", token));
        String status;
        Long threadId = null, messageId = null;
        if (thread.isEmpty()) {
            status = "NO_THREAD";
        } else {
            Map<String, Object> t = thread.get(0);
            threadId = ((Number) t.get("id")).longValue();
            if (who.collegeId == null) who.collegeId = ((Number) t.get("collegeId")).intValue();
            if (from == null || t.get("email") == null || !from.equalsIgnoreCase(String.valueOf(t.get("email")).trim())) {
                status = "WRONG_SENDER";
            } else if (!verified(in.auth)) {
                status = "NOT_VERIFIED";
            } else if (body.isBlank()) {
                status = "EMPTY";
            } else {
                try {
                    messageId = messages.postEmailReply(((Number) t.get("collegeId")).intValue(), ((Number) t.get("recruiterId")).longValue(),
                            t.get("jobId") == null ? null : ((Number) t.get("jobId")).intValue(), body);
                    status = "POSTED";
                } catch (IllegalStateException e) {
                    status = "ACCESS_ENDED";
                } catch (IllegalArgumentException e) {
                    status = "FAILED";
                }
            }
        }
        // A reply that did not reach its conversation keeps its whole text, so whoever reads it on Inbound mail can act on it.
        record(id, status, from, in, threadId, messageId, "POSTED".equals(status) ? body : cut(fullText, 200000), cut(body, 1000), who);
        if (!"POSTED".equals(status)) log.info("Inbound reply to conversation {} not posted: {}", threadId, status);
        return status;
    }

    /** Who sent it, when the address is a recruiter's or a student's (for Inbound mail). */
    static class Sender {
        Integer recruiterId, learnerId, collegeId;
    }

    private Sender senderOf(String from) {
        Sender s = new Sender();
        if (from == null) return s;
        MapSqlParameterSource p = new MapSqlParameterSource("e", from);
        List<Map<String, Object>> r = jdbc.queryForList("SELECT id FROM recruiter WHERE LOWER(contact_mail) = :e AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1", p);
        if (!r.isEmpty()) s.recruiterId = ((Number) r.get(0).get("id")).intValue();
        if (s.recruiterId == null) {
            List<Map<String, Object>> l = jdbc.queryForList("SELECT id, college_id FROM learner WHERE LOWER(contact_mail) = :e LIMIT 1", p);
            if (!l.isEmpty()) {
                s.learnerId = ((Number) l.get(0).get("id")).intValue();
                s.collegeId = l.get(0).get("college_id") == null ? null : ((Number) l.get(0).get("college_id")).intValue();
            }
        }
        return s;
    }

    private void record(String id, String status, String from, Inbound in, Long threadId, Long messageId, String bodyText, String preview, Sender who) {
        jdbc.update("UPDATE inbound_email SET received_at = :r, from_address = :f, to_address = :to, subject = :s, thread_id = :t, message_id = :m, " +
                        "status = :st, body_preview = :b, body_text = :bt, recruiter_id = :rid, learner_id = :lid, college_id = :cid WHERE external_id = :g",
                new MapSqlParameterSource("r", LocalDateTime.now(ZoneOffset.UTC)).addValue("f", cut(from, 320)).addValue("to", cut(in.to, 500))
                        .addValue("s", cut(in.subject, 500)).addValue("t", threadId).addValue("m", messageId).addValue("st", status)
                        .addValue("b", preview).addValue("bt", bodyText).addValue("rid", who.recruiterId).addValue("lid", who.learnerId)
                        .addValue("cid", who.collegeId).addValue("g", id));
    }

    // ------------------------------------------------------------------ parsing (static, tested)

    static String tokenOf(String tag, String... headers) {
        Pattern token = Pattern.compile("\\+" + Pattern.quote(tag == null || tag.isBlank() ? "r" : tag.trim()) + "-([0-9a-f]{20})@", Pattern.CASE_INSENSITIVE);
        for (String v : headers) {
            if (v == null) continue;
            Matcher m = token.matcher(v);
            if (m.find()) return m.group(1).toLowerCase(Locale.ROOT);
        }
        return null;
    }

    static String addressOf(String from) {
        if (from == null) return null;
        Matcher m = ADDRESS.matcher(from);
        String a = m.find() ? m.group(1) : from;
        a = a.trim().toLowerCase(Locale.ROOT);
        return a.contains("@") ? a : null;
    }

    /**
     * The receiving server's check of the sender (ARC-Authentication-Results from Cloudflare, or Authentication-Results): DMARC
     * passed, or, for a domain without DMARC, SPF or DKIM passed. A failed DMARC never counts.
     */
    static boolean verified(String authenticationResults) {
        if (authenticationResults == null) return false;
        String a = authenticationResults.toLowerCase(Locale.ROOT);
        if (a.contains("dmarc=fail")) return false;
        if (a.contains("dmarc=pass")) return true;
        return a.contains("spf=pass") || a.contains("dkim=pass");
    }

    /** The reply's own words: everything before the quoted email it answers (Gmail, Outlook and phone clients). */
    static String stripQuoted(String text) {
        if (text == null) return "";
        String[] lines = text.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);
        List<String> keep = new ArrayList<>();
        for (int i = 0; i < lines.length; i++) {
            String l = lines[i].trim();
            String next = i + 1 < lines.length ? lines[i + 1].trim() : "";
            if (l.startsWith(">")) break;
            if (l.matches("(?i)^on\\b.*\\bwrote:?$")) break;
            if (l.matches("(?i)^on\\b.*") && next.matches("(?i).*\\bwrote:?$")) break;
            if (l.matches("(?i)^-{2,}\\s*(original message|forwarded message).*")) break;
            if (l.matches("^_{5,}$")) break;
            if (l.matches("(?i)^from:\\s.+") && (next.matches("(?i)^(sent|date|to):\\s.*") || i > 0)) break;
            if (l.matches("(?i)^sent from my\\b.*")) break;
            if (l.equals("--")) break;
            keep.add(lines[i]);
        }
        return String.join("\n", keep).replaceAll("\n{3,}", "\n\n").trim();
    }

    static String htmlText(String html) {
        if (html == null || html.isBlank()) return "";
        String marked = html.replaceAll("(?i)<br\\s*/?>", "\n").replaceAll("(?i)</(p|div|li|tr)>", "\n");
        return Jsoup.parse(marked).wholeText();
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
