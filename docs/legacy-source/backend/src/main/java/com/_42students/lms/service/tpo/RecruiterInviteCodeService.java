package com._42students.lms.service.tpo;

import com._42students.lms.service.ZeptoMailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The email code a recruiter enters before a TPO's invite link is spent (recruiter phase 1, step 4): it proves the work mailbox
 * and so the company domain (D1). Codes are stored hashed, live 10 minutes, and stop working after 5 wrong tries; at most 5
 * codes per link per hour. A link many people share (the college's public link, a company link, the placements page) counts per
 * email instead, with a high cap per link: one shared count let the sixth person in an hour be refused, and let anyone block
 * everyone by asking for 5 codes (audit 13 Oct 2026, L3).
 */
@Slf4j
@Service
public class RecruiterInviteCodeService {

    static final int MAX_WRONG = 5;
    static final int MAX_PER_HOUR = 5;
    static final int SHARED_MAX_PER_LINK_PER_HOUR = 300;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final NamedParameterJdbcTemplate jdbc;
    private final ZeptoMailService mail;

    @Value("${zepto.template.system.email.verification:2518b.4c361928d9526a75.k1.aea6cef0-4e4a-11f1-97e6-e256a66a52e4.19e1e1f015f}")
    private String templateId;

    public RecruiterInviteCodeService(NamedParameterJdbcTemplate jdbc, ZeptoMailService mail) {
        this.jdbc = jdbc;
        this.mail = mail;
    }

    /** Thrown with words the invite screen shows as they are. */
    public static class CodeProblem extends RuntimeException {
        private final String code;

        public CodeProblem(String code, String message) {
            super(message);
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }

    /** A code for one person's invite link: at most 5 an hour for the link. */
    public void send(String token, String email, String displayName) {
        String tokenHash = TpoRecruiterLeadService.sha256Hex(token);
        if (recent(tokenHash, null) >= MAX_PER_HOUR) throw new CodeProblem("TOO_MANY_CODES", "Too many codes for this invitation. Try again in an hour.");
        issue(tokenHash, email, displayName);
    }

    /** A code for a link many people share: at most 5 an hour for each email, and a high cap for the whole link. */
    public void sendShared(String token, String email, String displayName) {
        String tokenHash = TpoRecruiterLeadService.sha256Hex(token);
        if (recent(tokenHash, email) >= MAX_PER_HOUR) throw new CodeProblem("TOO_MANY_CODES", "Too many codes for this email. Try again in an hour.");
        if (recent(tokenHash, null) >= SHARED_MAX_PER_LINK_PER_HOUR) throw new CodeProblem("TOO_MANY_CODES", "Too many people are joining right now. Try again in an hour.");
        issue(tokenHash, email, displayName);
    }

    private int recent(String tokenHash, String email) {
        MapSqlParameterSource p = new MapSqlParameterSource("t", tokenHash).addValue("since", LocalDateTime.now().minusHours(1));
        String sql = "SELECT COUNT(*) FROM recruiter_invite_code WHERE invite_token_hash = :t AND created_at > :since";
        if (email != null) { sql += " AND email = :e"; p.addValue("e", email); }
        Integer n = jdbc.queryForObject(sql, p, Integer.class);
        return n == null ? 0 : n;
    }

    private void issue(String tokenHash, String email, String displayName) {
        String code = String.valueOf(100000 + RANDOM.nextInt(900000));
        jdbc.update("INSERT INTO recruiter_invite_code (invite_token_hash, email, code_hash, expires_at) VALUES (:t, :e, :h, :x)",
                new MapSqlParameterSource("t", tokenHash).addValue("e", email).addValue("h", TpoRecruiterLeadService.sha256Hex(tokenHash + ":" + code))
                        .addValue("x", LocalDateTime.now().plusMinutes(10)));
        Map<String, String> merge = new HashMap<>();
        merge.put("otp", code);
        merge.put("learnerName", displayName == null ? "" : displayName);
        merge.put("email", email);
        merge.put("mobile", "");
        merge.put("expiryMinutes", "10");
        try {
            mail.sendEmailWithTemplateId(templateId, email, merge);
        } catch (Exception e) {
            log.warn("Invite code delivery failed for {}", email, e);
            throw new CodeProblem("CODE_NOT_SENT", "We couldn't send the code. Please try again.");
        }
    }

    /** True when the code is right for this link and email; counts wrong tries. Marks the code used. */
    public void verify(String token, String email, String code) {
        if (code == null || !code.trim().matches("\\d{6}")) throw new CodeProblem("CODE_REQUIRED", "Enter the 6-digit code we emailed you");
        String tokenHash = TpoRecruiterLeadService.sha256Hex(token);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, code_hash AS h, wrong_tries AS w FROM recruiter_invite_code "
                        + "WHERE invite_token_hash = :t AND email = :e AND used_at IS NULL AND expires_at > :now ORDER BY id DESC LIMIT 1",
                new MapSqlParameterSource("t", tokenHash).addValue("e", email).addValue("now", LocalDateTime.now()));
        if (rows.isEmpty()) throw new CodeProblem("CODE_EXPIRED", "That code has expired. Send a new one.");
        Map<String, Object> row = rows.get(0);
        if (((Number) row.get("w")).intValue() >= MAX_WRONG) throw new CodeProblem("CODE_LOCKED", "Too many wrong codes. Send a new one.");
        if (!TpoRecruiterLeadService.sha256Hex(tokenHash + ":" + code.trim()).equals(row.get("h"))) {
            jdbc.update("UPDATE recruiter_invite_code SET wrong_tries = wrong_tries + 1 WHERE id = :id", new MapSqlParameterSource("id", row.get("id")));
            throw new CodeProblem("WRONG_CODE", "That code isn't right. Check the latest email from us.");
        }
        jdbc.update("UPDATE recruiter_invite_code SET used_at = :now WHERE id = :id", new MapSqlParameterSource("id", row.get("id")).addValue("now", LocalDateTime.now()));
    }
}
