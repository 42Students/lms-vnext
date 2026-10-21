package com._42students.lms.service.tpo;

import com._42students.lms.model.College;
import com._42students.lms.model.Company;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.service.company.CompanyDomainService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A college's public link for recruiters (phase 2, N5 a). Anyone who proves a business email (D1: a code sent to an address on a
 * domain that passes the company-domain check) joins this college; their company is the one that owns the email's domain, or a
 * new unverified one. The college decides whether people who join this way can post drives without its review (N6).
 *
 * The link can be shown again and put in drive invitations: it is HMAC(server secret, college + a random nonce), so the server rebuilds
 * it while the database holds only the nonce and the link's hash (audit docs/recruiter-global/PUBLIC-LINK-AND-RECRUITER-RULES-AUDIT-2026-10-13.md).
 */
@Service
@RequiredArgsConstructor
public class CollegePublicLinkService {

    public static final String VIA = "PUBLIC_LINK";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final NamedParameterJdbcTemplate jdbc;
    private final CollegeRepository collegeRepository;
    private final RecruiterRepository recruiterRepository;
    private final CompanyDomainService domainService;
    private final CompanyDirectoryService directory;
    private final RecruiterInviteCodeService codeService;
    private final CompanyJoinService companyJoin;
    private final TpoAuditService audit;

    @Value("${jwt.secret}")
    private String secret;

    public static class JoinInput {
        public String email;
        public String code;
        public String firstName;
        public String lastName;
        public String designation;
        public String phone;
        public String companyName;
    }

    // ---------------------------------------------------------------- the placement cell's side

    public Map<String, Object> settings(Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT enabled, post_direct, token_hash IS NOT NULL AS hasLink, token_hash, link_nonce, created_at, opens, joins FROM college_public_link WHERE college_id = :c",
                new MapSqlParameterSource("c", collegeId));
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> r = rows.isEmpty() ? Map.of() : rows.get(0);
        out.put("enabled", truthy(r.get("enabled")));
        out.put("postDirect", truthy(r.get("post_direct")));
        out.put("hasLink", truthy(r.get("hasLink")));
        out.put("createdAt", r.get("created_at"));
        out.put("opens", r.get("opens") == null ? 0 : ((Number) r.get("opens")).intValue());
        out.put("joins", r.get("joins") == null ? 0 : ((Number) r.get("joins")).intValue());
        // The token, when this link can be rebuilt (made after V220, server secret unchanged); null for an older link.
        out.put("token", rebuild(collegeId, (String) r.get("link_nonce"), (String) r.get("token_hash")));
        return out;
    }

    /** The link's token for a drive invitation: only while the link is on and can be rebuilt; otherwise null. */
    public String tokenForInvites(Integer collegeId) {
        if (collegeId == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT token_hash, link_nonce FROM college_public_link WHERE college_id = :c AND enabled = 1",
                new MapSqlParameterSource("c", collegeId));
        return rows.isEmpty() ? null : rebuild(collegeId, (String) rows.get(0).get("link_nonce"), (String) rows.get(0).get("token_hash"));
    }

    String derive(Integer collegeId, String nonce) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] h = mac.doFinal(("college-public-link|" + collegeId + "|" + nonce).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(h);
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("Couldn't make the link", e);
        }
    }

    /** Rebuilt only when it matches the stored hash: a changed server secret means "can't be shown", never a wrong link. */
    private String rebuild(Integer collegeId, String nonce, String tokenHash) {
        if (nonce == null || tokenHash == null) return null;
        String token = derive(collegeId, nonce);
        return TpoRecruiterLeadService.sha256Hex(token).equals(tokenHash) ? token : null;
    }

    /** A new public link (the old one stops working); it is switched on. */
    @Transactional
    public Map<String, Object> newLink(Integer collegeId, Integer actorId) {
        byte[] raw = new byte[24];
        RANDOM.nextBytes(raw);
        String nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        String token = derive(collegeId, nonce);
        jdbc.update("INSERT INTO college_public_link (college_id, token_hash, link_nonce, enabled, created_at) VALUES (:c, :h, :n, 1, NOW()) " +
                "ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), link_nonce = VALUES(link_nonce), enabled = 1, created_at = NOW()",
                new MapSqlParameterSource("c", collegeId).addValue("h", TpoRecruiterLeadService.sha256Hex(token)).addValue("n", nonce));
        audit.log(collegeId, "TPO", actorId, "PUBLIC_LINK_MADE", "SETTINGS", null, "A new public link; the old one stopped working");
        return settings(collegeId);
    }

    @Transactional
    public Map<String, Object> save(Integer collegeId, Boolean enabled, Boolean postDirect, Integer actorId) {
        jdbc.update("INSERT INTO college_public_link (college_id, enabled, post_direct) VALUES (:c, :e, :d) " +
                "ON DUPLICATE KEY UPDATE enabled = COALESCE(:eo, enabled), post_direct = COALESCE(:do, post_direct)",
                new MapSqlParameterSource("c", collegeId).addValue("e", Boolean.TRUE.equals(enabled) ? 1 : 0).addValue("d", Boolean.TRUE.equals(postDirect) ? 1 : 0)
                        .addValue("eo", enabled == null ? null : (enabled ? 1 : 0)).addValue("do", postDirect == null ? null : (postDirect ? 1 : 0)));
        if (enabled != null) audit.log(collegeId, "TPO", actorId, enabled ? "PUBLIC_LINK_ON" : "PUBLIC_LINK_OFF", "SETTINGS", null, null);
        if (postDirect != null) audit.log(collegeId, "TPO", actorId, "PUBLIC_LINK_POST_DIRECT", "SETTINGS", null, postDirect ? "On" : "Off");
        return settings(collegeId);
    }

    /** Whether this recruiter joined through the public link and the college lets those post without review. */
    public boolean postsDirect(long recruiterId, Integer collegeId) {
        if (collegeId == null) return false;
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM college_public_link l JOIN recruiter_college_access g ON g.college_id = l.college_id " +
                "WHERE l.college_id = :c AND l.enabled = 1 AND l.post_direct = 1 AND g.recruiter_id = :h AND g.granted_by_user_type = :via " +
                "AND g.status = 'ACTIVE' AND (g.is_deleted = 0 OR g.is_deleted IS NULL) AND (g.valid_until IS NULL OR g.valid_until > NOW())",
                new MapSqlParameterSource("c", collegeId).addValue("h", recruiterId).addValue("via", VIA), Integer.class);
        return n != null && n > 0;
    }

    // ---------------------------------------------------------------- the recruiter's side (public)

    @Transactional
    public Map<String, Object> preview(String token) {
        Integer collegeId = live(token);
        jdbc.update("UPDATE college_public_link SET opens = opens + 1 WHERE college_id = :c", new MapSqlParameterSource("c", collegeId));
        return Map.of("collegeName", collegeRepository.findById(collegeId).map(College::getName).orElse(""));
    }

    public Map<String, Object> sendCode(String token, String email) {
        live(token);
        String e = requireBusinessEmail(email);
        try {
            codeService.sendShared(token, e, null);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new CompanyJoinService.JoinProblem(p.getCode(), p.getMessage());
        }
        // Whether the company is already known, so the page only asks for its name when it is new.
        String known = directory.byDomain(domainService.checkEmail(e).domain()).map(Company::getName).orElse(null);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "CODE_SENT");
        out.put("email", e);
        out.put("companyName", known);
        return out;
    }

    @Transactional
    public Map<String, Object> join(String token, JoinInput in) {
        Integer collegeId = live(token);
        if (in == null) throw new CompanyJoinService.JoinProblem("BODY_REQUIRED", "Details are required");
        String email = requireBusinessEmail(in.email);
        String firstName = clean(in.firstName, 100);
        if (firstName == null) throw new CompanyJoinService.JoinProblem("FIRST_NAME_REQUIRED", "Enter your name");
        String mobile = null;
        if (in.phone != null && !in.phone.isBlank()) {
            mobile = OnboardingMobileNumber.normalize(in.phone);
            if (mobile == null) throw new CompanyJoinService.JoinProblem("INVALID_MOBILE", "Enter a valid 10-digit mobile number, or leave it blank");
        }
        Recruiter recruiter = recruiterRepository.findByContactMail(email).orElse(null);
        if (recruiter != null && (Boolean.TRUE.equals(recruiter.getIsDeleted()) || recruiter.getSuspendedAt() != null)) {
            throw new CompanyJoinService.JoinProblem("ACCOUNT_UNAVAILABLE", "This account can't be used. Please contact the placement cell.");
        }
        try {
            codeService.verify(token, email, in.code);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new CompanyJoinService.JoinProblem(p.getCode(), p.getMessage());
        }
        Company company;
        try {
            company = directory.resolveForCollege(clean(in.companyName, 200), null, email, collegeId,
                    new CompanyDirectoryService.Actor(VIA, null, collegeId), true).company();
        } catch (CompanyDirectoryService.SameCompanyException e) {
            // A stranger's domain must not appear on drives as a company already on the list (audit 13 Oct 2026, L4).
            throw new CompanyJoinService.JoinProblem("COMPANY_EXISTS", e.getCompanyName().replaceAll("\\.+$", "") + " is already on 42's company list with its own email domain. "
                    + "Join with your " + e.getCompanyName().replaceAll("\\.+$", "") + " email address, or ask the placement cell to invite you.");
        } catch (IllegalArgumentException e) {
            throw new CompanyJoinService.JoinProblem("COMPANY_NAME_REQUIRED", "Add your company's name");
        }
        if (recruiter == null) {
            recruiter = new Recruiter();
            recruiter.setTokenVersion(0);
            recruiter.setIsDeleted(false);
            recruiter.setContactMail(email);
            recruiter.setContactMobile(mobile);
            recruiter.setFirstName(firstName);
            recruiter.setLastName(clean(in.lastName, 100));
            recruiter.setDesignation(clean(in.designation, 150));
            recruiter.setCompanyId(company.getId());
            recruiter.setCreatedByUserType(VIA);
            recruiter = recruiterRepository.save(recruiter);
        } else if (recruiter.getCompanyId() == null) {
            recruiter.setCompanyId(company.getId());
            recruiter = recruiterRepository.save(recruiter);
        }
        if (!companyJoin.grantAccess(recruiter.getId(), collegeId, VIA)) return companyJoin.alreadyIn(collegeId, email);
        companyJoin.welcome(recruiter, collegeId);
        jdbc.update("UPDATE college_public_link SET joins = joins + 1 WHERE college_id = :c", new MapSqlParameterSource("c", collegeId));
        audit.bell(collegeId, "RECRUITER_JOINED", recruiter.getFirstName() + " joined from " + company.getName(),
                "Through your public link. They can now request a drive.", "/tpo/settings?tab=recruiters");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "JOINED");
        out.put("collegeName", collegeRepository.findById(collegeId).map(College::getName).orElse(""));
        out.put("signInEmail", email);
        return out;
    }

    // ---------------------------------------------------------------- internals

    private Integer live(String token) {
        if (token == null || token.isBlank() || token.length() > 200) throw new CompanyJoinService.JoinProblem("LINK_INVALID", "This link is no longer valid");
        List<Integer> c = jdbc.queryForList("SELECT college_id FROM college_public_link WHERE token_hash = :h AND enabled = 1",
                new MapSqlParameterSource("h", TpoRecruiterLeadService.sha256Hex(token)), Integer.class);
        if (c.isEmpty()) throw new CompanyJoinService.JoinProblem("LINK_INVALID", "This link is no longer valid");
        return c.get(0);
    }

    private String requireBusinessEmail(String email) {
        if (email == null || email.isBlank()) throw new CompanyJoinService.JoinProblem("EMAIL_REQUIRED", "Enter your work email");
        String e = email.trim().toLowerCase();
        CompanyDomainService.Check check = domainService.checkEmail(e);
        if (!check.ok()) throw new CompanyJoinService.JoinProblem("COMPANY_EMAIL_REQUIRED", check.message());
        return e;
    }

    private static boolean truthy(Object v) {
        return v instanceof Boolean b ? b : v instanceof Number n && n.intValue() != 0;
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }
}
