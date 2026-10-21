package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import com._42students.lms.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Email campaigns from Engage (phase 3, non-global): one email from the placement cell to many recruiter leads, each with their
 * own name and an unsubscribe link. Unsubscribed and email-less recruiter leads are skipped, and nothing goes out until the
 * campaign email template is set up (the result says so instead).
 */
@Service
@RequiredArgsConstructor
public class TpoEmailCampaignService {

    public static final String TEMPLATE = "recruiter-campaign";
    public static final int MAX_RECIPIENTS = 500;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final NamedParameterJdbcTemplate jdbc;
    private final RecruiterLeadRepository recruiterLeadRepository;
    private final TpoRecruiterLeadService recruiterLeads;
    private final TpoMailService mail;
    private final TpoAuditService audit;

    public boolean emailAvailable() {
        return mail.isConfigured(TEMPLATE);
    }

    public List<Map<String, Object>> list(Integer collegeId) {
        return jdbc.queryForList("SELECT c.id, c.subject, c.created_at AS createdAt, c.recipients, c.sent, c.skipped, c.failed, " +
                "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS sentBy " +
                "FROM tpo_email_campaign c LEFT JOIN faculty f ON f.id = c.sent_by_faculty_id WHERE c.college_id = :c ORDER BY c.id DESC LIMIT 100",
                new MapSqlParameterSource("c", collegeId));
    }

    @Transactional
    public Map<String, Object> send(Integer collegeId, int facultyId, String subject, String body, List<Long> recruiterLeadIds, String linkBase) {
        String s = clean(subject, 200);
        if (s == null) throw new IllegalArgumentException("Give the email a subject");
        String b = clean(body, 10000);
        if (b == null) throw new IllegalArgumentException("Write the email");
        LinkedHashSet<Long> ids = new LinkedHashSet<>(recruiterLeadIds == null ? List.of() : recruiterLeadIds);
        ids.remove(null);
        if (ids.isEmpty()) throw new IllegalArgumentException("Choose who gets it");
        if (ids.size() > MAX_RECIPIENTS) throw new IllegalArgumentException("Send to at most " + MAX_RECIPIENTS + " at a time");
        boolean configured = emailAvailable();

        jdbc.update("INSERT INTO tpo_email_campaign (college_id, subject, body, sent_by_faculty_id, recipients) VALUES (:c, :s, :b, :f, :n)",
                new MapSqlParameterSource("c", collegeId).addValue("s", s).addValue("b", b).addValue("f", facultyId).addValue("n", ids.size()));
        Long campaignId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        Map<String, String> college = collegeWords(collegeId);
        int sent = 0, skipped = 0, failed = 0;
        for (Long id : ids) {
            RecruiterLead lead = recruiterLeadRepository.findById(id).filter(l -> collegeId.equals(l.getCollegeId())).orElse(null);
            String status;
            String token = null;
            if (lead == null) {
                status = "NOT_FOUND";
                skipped++;
            } else if (lead.getUnsubscribedAt() != null) {
                status = "UNSUBSCRIBED";
                skipped++;
            } else if (lead.getEmailNorm() == null) {
                status = "NO_EMAIL";
                skipped++;
            } else if (!configured) {
                status = "NOT_CONFIGURED";
                skipped++;
            } else {
                token = newToken();
                Map<String, String> merge = new LinkedHashMap<>();
                merge.put("subject", s);
                merge.put("body", b.replace("{name}", nz(lead.getName())).replace("{company}", nz(lead.getCompanyName())));
                merge.put("name", nz(lead.getName()));
                merge.put("company", nz(lead.getCompanyName()));
                merge.put("collegeName", college.get("collegeName"));
                merge.put("signature", college.get("signature"));
                merge.put("unsubscribeLink", (linkBase == null ? "" : linkBase) + "/campaign-unsubscribe/" + token);
                TpoMailService.Result r = mail.sendAsCollege(TEMPLATE, lead.getEmailNorm(), merge, collegeId);
                if (r == TpoMailService.Result.SENT) {
                    status = "SENT";
                    sent++;
                    recruiterLeads.logActivity(lead.getId(), "EMAIL", null, "Campaign: " + s, facultyId);
                    // Engage > Companies: a company nobody had marked yet is now Emailed (N11).
                    if (lead.getCompanyName() != null && !lead.getCompanyName().isBlank()) {
                        jdbc.update("INSERT IGNORE INTO tpo_company_outreach (college_id, company_key, status, updated_by_faculty_id) VALUES (:c, :k, 'EMAILED', :f)",
                                new MapSqlParameterSource("c", collegeId).addValue("k", TpoRecruiterLeadsHubService.companyKey(lead.getCompanyName())).addValue("f", facultyId));
                    }
                } else {
                    status = "FAILED";
                    failed++;
                }
            }
            jdbc.update("INSERT INTO tpo_email_campaign_recipient (campaign_id, recruiter_lead_id, email, status, unsubscribe_token_hash) VALUES (:c, :l, :e, :s, :t)",
                    new MapSqlParameterSource("c", campaignId).addValue("l", id).addValue("e", lead == null ? null : lead.getEmailNorm())
                            .addValue("s", status).addValue("t", token == null ? null : TpoRecruiterLeadService.sha256Hex(token)));
        }
        jdbc.update("UPDATE tpo_email_campaign SET sent = :s, skipped = :k, failed = :f WHERE id = :id",
                new MapSqlParameterSource("s", sent).addValue("k", skipped).addValue("f", failed).addValue("id", campaignId));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", campaignId);
        out.put("sent", sent);
        out.put("skipped", skipped);
        out.put("failed", failed);
        out.put("emailAvailable", configured);
        return out;
    }

    /** The recipient's unsubscribe link: they get no more invitations or campaigns from this college. A used or unknown link does nothing. */
    @Transactional
    public void unsubscribe(String token) {
        if (token == null || token.isBlank() || token.length() > 200) return;
        List<Long> leads = jdbc.queryForList("SELECT recruiter_lead_id FROM tpo_email_campaign_recipient WHERE unsubscribe_token_hash = :h",
                new MapSqlParameterSource("h", TpoRecruiterLeadService.sha256Hex(token)), Long.class);
        if (leads.isEmpty()) return;
        recruiterLeadRepository.findById(leads.get(0)).ifPresent(lead -> {
            if (lead.getUnsubscribedAt() != null) return;
            lead.setUnsubscribedAt(LocalDateTime.now());
            recruiterLeadRepository.save(lead);
            recruiterLeads.logActivity(lead.getId(), "SYSTEM", null, "Unsubscribed from emails", null);
            audit.bell(lead.getCollegeId(), "RECRUITER_UNSUBSCRIBED", lead.getName() + " unsubscribed", "They will not get your emails again.", "/tpo/recruiters/" + lead.getId());
        });
    }

    private Map<String, String> collegeWords(Integer collegeId) {
        List<Map<String, Object>> c = jdbc.queryForList("SELECT c.name AS college, s.email_signature AS signature FROM college c LEFT JOIN tpo_college_settings s ON s.college_id = c.id WHERE c.id = :c",
                new MapSqlParameterSource("c", collegeId));
        Map<String, String> m = new LinkedHashMap<>();
        m.put("collegeName", c.isEmpty() || c.get(0).get("college") == null ? "" : String.valueOf(c.get(0).get("college")));
        m.put("signature", c.isEmpty() || c.get(0).get("signature") == null ? "" : String.valueOf(c.get(0).get("signature")));
        return m;
    }

    private static String newToken() {
        byte[] raw = new byte[24];
        RANDOM.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static String nz(String v) {
        return v == null ? "" : v;
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }
}
