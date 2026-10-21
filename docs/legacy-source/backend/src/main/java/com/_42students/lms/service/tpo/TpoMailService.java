package com._42students.lms.service.tpo;

import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.service.ZeptoMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * All TPO V1 email goes through ZeptoMail templates whose ids live in application.properties as
 * {@code zepto.template.tpo.<name>} (see docs/tpo-v1/EMAIL-TEMPLATES.md for every name, when it fires and its variables).
 * A name whose id is missing or still TEMP_ID_PLACEHOLDER is reported as NOT_CONFIGURED and nothing is sent, exactly like the
 * rest of the platform: adding a template later needs only its id in the properties, no code change.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TpoMailService {

    public enum Result { SENT, NOT_CONFIGURED, FAILED }

    public static final String PLACEHOLDER = "TEMP_ID_PLACEHOLDER";

    private final ZeptoMailService zeptoMailService;
    private final Environment environment;
    private final NamedParameterJdbcTemplate jdbc;

    @Autowired(required = false)
    private TenantDomainRepository tenantDomains;

    /**
     * The recruiter address (13 Oct 2026, owner): recruiter emails come from recruitment@42lms.com (ZeptoMail sends from 42lms.com)
     * and every reply goes back to it: the conversation's recruitment+<tag>-<code>@ address for message emails, the address itself
     * for the rest. Cloudflare Email Routing receives 42lms.com mail; its worker forwards a copy to hello@42learn.com and posts
     * conversation replies to InboundReplyService.
     */
    @Value("${RECRUITER_MAILBOX:recruitment@42lms.com}")
    private String recruiterMailbox;

    /** The From address of recruiter emails (a domain verified in ZeptoMail). */
    @Value("${RECRUITER_FROM:recruitment@42lms.com}")
    private String recruiterFrom;

    /** STAGE of this backend; anything set and not "prod" (dev) sends only to DEV_MAIL_ALLOW. */
    @Value("${STAGE:}")
    private String stage;

    /** Outside prod: comma-separated addresses or @domains these emails may go to (the dev database holds real people's addresses). */
    @Value("${DEV_MAIL_ALLOW:}")
    private String devMailAllow;

    /** The ZeptoMail template id for a TPO template name, or null when it is not configured yet. */
    public String templateId(String name) {
        String v = environment.getProperty("zepto.template.tpo." + name);
        return v == null || v.isBlank() || PLACEHOLDER.equals(v.trim()) ? null : v.trim();
    }

    public boolean isConfigured(String name) {
        return templateId(name) != null;
    }

    public Result send(String name, String toEmail, Map<String, String> merge) {
        return deliver(name, toEmail, merge, null, null, null);
    }

    /**
     * Emails to recruiters and companies go out in the college's name (13 Oct 2026, owner): the inbox shows "NSRIT Campus Recruitment",
     * the address stays ours and replies come to us (we handle them, and track recruiter leads from them later). Students' and
     * system emails keep the platform's name.
     */
    public Result sendAsCollege(String name, String toEmail, Map<String, String> merge, Integer collegeId) {
        return sendAsCollege(name, toEmail, merge, collegeId, null);
    }

    /** Same, with a Reply-To address (a conversation's reply address: the recruiter's reply comes back into the conversation). */
    public Result sendAsCollege(String name, String toEmail, Map<String, String> merge, Integer collegeId, String replyTo) {
        if (collegeId == null) return deliver(name, toEmail, merge, null, replyOr(replyTo), recruiterFrom);
        String collegeName = collegeName(collegeId);
        // Every recruiter template can use the college's name and a link back to the recruiter's account on the college's own
        // address (recruiters sign in only there); a caller's own value wins.
        Map<String, String> m = new LinkedHashMap<>();
        m.put("collegeName", collegeName == null ? "" : collegeName);
        m.put("workspaceLink", collegeLink(collegeId, "/recruiter"));
        if (merge != null) merge.forEach((k, v) -> { if (v != null) m.put(k, v); });
        return deliver(name, toEmail, m, collegeSenderName(collegeName), replyOr(replyTo), recruiterFrom);
    }

    /**
     * A student's interview emails come from their college too (19 Oct 2026, owner: placements are the college's; only 42's own
     * global jobs will speak as 42). The inbox shows "NSRIT Placement Cell" and the template can name the college. Our platform
     * address and no reply address, as before: a student acts on their Placements page, not by email.
     */
    public Result sendToStudentAsCollege(String name, String toEmail, Map<String, String> merge, Integer collegeId) {
        String collegeName = collegeId == null ? null : collegeName(collegeId);
        Map<String, String> m = new LinkedHashMap<>();
        m.put("collegeName", collegeName == null ? "" : collegeName);
        if (merge != null) merge.forEach((k, v) -> { if (v != null) m.put(k, v); });
        return deliver(name, toEmail, m, studentSenderName(collegeName), null, null);
    }

    /** "NSRIT" -> "NSRIT Placement Cell": the words a student knows (their Placements page has a Placement cell tab). */
    static String studentSenderName(String collegeName) {
        String n = headerSafe(collegeName);
        return n == null ? null : n + " Placement Cell";
    }

    /** A recruiter's reply always reaches our recruiter mailbox: the conversation's own address, else the mailbox itself. */
    private String replyOr(String replyTo) {
        return replyTo != null && !replyTo.isBlank() ? replyTo : recruiterMailbox;
    }

    String collegeName(Integer collegeId) {
        try {
            List<String> names = jdbc.queryForList("SELECT name FROM college WHERE id = :c", new MapSqlParameterSource("c", collegeId), String.class);
            return names.isEmpty() ? null : names.get(0);
        } catch (RuntimeException e) {
            log.warn("College {} name not read for an email: {}", collegeId, e.getMessage());
            return null;
        }
    }

    /** https://<the college's own address><path> (verified primary domain first), else the public base URL; "" when neither is known. */
    public String collegeLink(Integer collegeId, String path) {
        String host = null;
        try {
            if (tenantDomains != null && collegeId != null) {
                List<TenantDomain> domains = tenantDomains.findActiveByCollegeId(collegeId);
                if (domains != null) {
                    host = domains.stream().filter(d -> d != null && d.getHost() != null && !d.getHost().isBlank())
                            .sorted(Comparator.comparing((TenantDomain d) -> !Boolean.TRUE.equals(d.getIsVerified()))
                                    .thenComparing(d -> !Boolean.TRUE.equals(d.getIsPrimary())))
                            .map(d -> d.getHost().trim()).findFirst().orElse(null);
                }
            }
        } catch (RuntimeException e) {
            log.warn("College {} address not read for an email link: {}", collegeId, e.getMessage());
        }
        String base = host != null ? "https://" + host : environment.getProperty("app.public.base.url", "");
        if (base == null || base.isBlank()) return "";
        base = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        return base + (path == null ? "" : path);
    }

    /** What follows the college's name in the sender: "NSRIT Campus Recruitment" (owner wanted recruiter-facing words, not "placement cell"). */
    public static final String SENDER_SUFFIX = " Campus Recruitment";

    /** "NSRIT" -> "NSRIT Campus Recruitment"; characters that would break an email header are dropped. */
    static String collegeSenderName(String collegeName) {
        String n = headerSafe(collegeName);
        return n == null ? null : n + SENDER_SUFFIX;
    }

    /** A college name fit for an email header: no characters that would break it, at most 80 long; null when nothing is left. */
    private static String headerSafe(String collegeName) {
        if (collegeName == null) return null;
        String n = collegeName.replaceAll("[\\r\\n\"<>,;:\\\\]", " ").replaceAll("\\s+", " ").trim();
        if (n.isEmpty()) return null;
        return n.length() > 80 ? n.substring(0, 80).trim() : n;
    }

    private Result deliver(String name, String toEmail, Map<String, String> merge, String senderName, String replyTo, String fromAddress) {
        String id = templateId(name);
        if (id == null) {
            log.info("TPO email '{}' not sent: no ZeptoMail template id configured (zepto.template.tpo.{})", name, name);
            return Result.NOT_CONFIGURED;
        }
        if (toEmail == null || toEmail.isBlank()) return Result.FAILED;
        if (!mayEmail(toEmail)) {
            log.info("TPO email '{}' not sent on {}: {} is not in DEV_MAIL_ALLOW", name, stage, toEmail);
            return Result.FAILED;
        }
        try {
            zeptoMailService.sendEmailWithTemplateId(id, toEmail.trim(), cleanMerge(merge), senderName, replyTo, fromAddress);
            return Result.SENT;
        } catch (Exception e) {
            log.error("TPO email '{}' to {} failed: {}", name, toEmail, e.getMessage());
            return Result.FAILED;
        }
    }

    /**
     * What the template receives: "<" and ">" in any value become single angle quotes, so a drive title or company name typed by a recruiter can
     * never add markup or a link to an email (whether or not ZeptoMail escapes); a blank name greets "there" ("Hi there,").
     */
    static Map<String, String> cleanMerge(Map<String, String> merge) {
        Map<String, String> m = new LinkedHashMap<>();
        if (merge != null) merge.forEach((k, v) -> m.put(k, v == null ? "" : v.replace("<", "\u2039").replace(">", "\u203A")));
        if (m.containsKey("name") && m.get("name").isBlank()) m.put("name", "there");
        return m;
    }

    /** Prod (or no STAGE set) emails anyone; another stage only the addresses or @domains in DEV_MAIL_ALLOW. */
    boolean mayEmail(String toEmail) {
        return mayEmail(stage, devMailAllow, toEmail);
    }

    /** The same rule for any sender (the older notification dispatcher uses it too). */
    public static boolean mayEmail(String stage, String devMailAllow, String toEmail) {
        if (stage == null || stage.isBlank() || "prod".equalsIgnoreCase(stage.trim())) return true;
        if (toEmail == null) return false;
        String to = toEmail.trim().toLowerCase(java.util.Locale.ROOT);
        if (devMailAllow == null || devMailAllow.isBlank()) return false;
        for (String a : devMailAllow.split(",")) {
            String e = a.trim().toLowerCase(java.util.Locale.ROOT);
            if (e.isEmpty()) continue;
            if (e.startsWith("@") ? to.endsWith(e) : to.equals(e)) return true;
        }
        return false;
    }

    /** Event name (OFFER_RELEASED) to template name (offer-released). */
    public static String nameForEvent(String event) {
        return event == null ? "" : event.toLowerCase().replace('_', '-');
    }
}
