package com._42students.lms.service.tpo;

import com._42students.lms.model.College;
import com._42students.lms.model.CollegeCompany;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.repository.CollegeCompanyRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.service.company.CompanyDomainService;
import com._42students.lms.service.recruiter.RecruiterCapability;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * A college's unique link for a company it is engaging (recruiter phase 1, N5 b). Anyone who proves an email on that company's
 * domain (a code sent to it) joins this college through the link: one account per work email, the company from the domain,
 * access to this college only. The college sees how often the link was opened and how many joined, and can mark the company
 * trusted: a trusted company's drives go live without the placement cell's review.
 */
@Service
@RequiredArgsConstructor
public class CompanyJoinService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CollegeCompanyRepository collegeCompanyRepository;
    private final CompanyDomainRepository domainRepository;
    private final CompanyDomainService domainService;
    private final CompanyDirectoryService directory;
    private final CollegeRepository collegeRepository;
    private final RecruiterRepository recruiterRepository;
    private final RecruiterCollegeAccessRepository accessRepository;
    private final RecruiterInviteCodeService codeService;
    private final TpoSettingsHubService settingsHub;
    private final TpoAuditService audit;

    /** Thrown with words the join page shows as they are. */
    public static class JoinProblem extends RuntimeException {
        private final String code;

        public JoinProblem(String code, String message) {
            super(message);
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }

    public static class JoinInput {
        public String email;
        public String code;
        public String firstName;
        public String lastName;
        public String designation;
        public String phone;
    }

    // ---------------------------------------------------------------- the placement cell's side

    /** A new link for this company (the old one stops working). The company joins this college's list if it wasn't on it. */
    @Transactional
    public Map<String, Object> newLink(Integer collegeId, Integer companyId) {
        directory.live(companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));
        if (directory.domainsOf(companyId).isEmpty()) throw new IllegalArgumentException("Add the company's email domain first, so only its people can join");
        directory.ensureListed(collegeId, companyId);
        CollegeCompany link = collegeCompanyRepository.lockByCollegeAndCompany(collegeId, companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        link.setJoinTokenHash(TpoRecruiterLeadService.sha256Hex(token));
        link.setJoinLinkCreatedAt(LocalDateTime.now());
        collegeCompanyRepository.save(link);
        Map<String, Object> out = engagement(collegeId, companyId);
        out.put("token", token);
        return out;
    }

    @Transactional
    public Map<String, Object> setTrusted(Integer collegeId, Integer companyId, boolean trusted) {
        directory.ensureListed(collegeId, companyId);
        CollegeCompany link = collegeCompanyRepository.lockByCollegeAndCompany(collegeId, companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));
        link.setTrusted(trusted);
        collegeCompanyRepository.save(link);
        return engagement(collegeId, companyId);
    }

    public Map<String, Object> engagement(Integer collegeId, Integer companyId) {
        CollegeCompany link = collegeCompanyRepository.findByCollegeIdAndCompanyId(collegeId, companyId).orElse(null);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("companyId", companyId);
        out.put("trusted", link != null && Boolean.TRUE.equals(link.getTrusted()));
        out.put("hasLink", link != null && link.getJoinTokenHash() != null);
        out.put("linkCreatedAt", link == null ? null : link.getJoinLinkCreatedAt());
        out.put("opens", link == null ? 0 : link.getJoinLinkOpens());
        out.put("joins", link == null ? 0 : link.getJoinLinkJoins());
        out.put("domains", directory.domainsOf(companyId));
        return out;
    }

    /** Whether this recruiter's company is trusted at this college. */
    public boolean isTrusted(Integer collegeId, Integer companyId) {
        if (collegeId == null || companyId == null) return false;
        return collegeCompanyRepository.findByCollegeIdAndCompanyId(collegeId, companyId)
                .map(l -> Boolean.TRUE.equals(l.getTrusted()) && !Boolean.TRUE.equals(l.getIsDeleted())).orElse(false);
    }

    // ---------------------------------------------------------------- the recruiter's side (public)

    @Transactional
    public Map<String, Object> preview(String token) {
        CollegeCompany link = live(token);
        link.setJoinLinkOpens((link.getJoinLinkOpens() == null ? 0 : link.getJoinLinkOpens()) + 1);
        collegeCompanyRepository.save(link);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeName", collegeRepository.findById(link.getCollegeId()).map(College::getName).orElse(""));
        out.put("companyName", directory.nameOf(link.getCompanyId()));
        return out;
    }

    public Map<String, Object> sendCode(String token, String email) {
        CollegeCompany link = live(token);
        String e = requireCompanyEmailOf(link, email);
        try {
            codeService.sendShared(token, e, null);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new JoinProblem(p.getCode(), p.getMessage());
        }
        return Map.of("status", "CODE_SENT", "email", e);
    }

    @Transactional
    public Map<String, Object> join(String token, JoinInput in) {
        CollegeCompany link = live(token);
        if (in == null) throw new JoinProblem("BODY_REQUIRED", "Details are required");
        String email = requireCompanyEmailOf(link, in.email);
        String firstName = clean(in.firstName, 100);
        if (firstName == null) throw new JoinProblem("FIRST_NAME_REQUIRED", "Enter your name");
        String mobile = null;
        if (in.phone != null && !in.phone.isBlank()) {
            mobile = OnboardingMobileNumber.normalize(in.phone);
            if (mobile == null) throw new JoinProblem("INVALID_MOBILE", "Enter a valid 10-digit mobile number, or leave it blank");
        }
        Recruiter recruiter = recruiterRepository.findByContactMail(email).orElse(null);
        if (recruiter != null && (Boolean.TRUE.equals(recruiter.getIsDeleted()) || recruiter.getSuspendedAt() != null)) {
            throw new JoinProblem("ACCOUNT_UNAVAILABLE", "This account can't be used. Please contact the placement cell.");
        }
        try {
            codeService.verify(token, email, in.code);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new JoinProblem(p.getCode(), p.getMessage());
        }
        boolean isNew = recruiter == null;
        if (isNew) {
            recruiter = new Recruiter();
            recruiter.setTokenVersion(0);
            recruiter.setIsDeleted(false);
            recruiter.setContactMail(email);
            recruiter.setContactMobile(mobile);
            recruiter.setFirstName(firstName);
            recruiter.setLastName(clean(in.lastName, 100));
            recruiter.setDesignation(clean(in.designation, 150));
            recruiter.setCompanyId(link.getCompanyId());
            recruiter.setCreatedByUserType("COMPANY_LINK");
            recruiter = recruiterRepository.save(recruiter);
        } else if (recruiter.getCompanyId() == null) {
            recruiter.setCompanyId(link.getCompanyId());
            recruiter = recruiterRepository.save(recruiter);
        }
        if (!grantAccess(recruiter.getId(), link.getCollegeId(), "COMPANY_LINK")) return alreadyIn(link.getCollegeId(), email);
        welcome(recruiter, link.getCollegeId());
        link.setJoinLinkJoins((link.getJoinLinkJoins() == null ? 0 : link.getJoinLinkJoins()) + 1);
        collegeCompanyRepository.save(link);
        String company = directory.nameOf(link.getCompanyId());
        audit.bell(link.getCollegeId(), "RECRUITER_JOINED", recruiter.getFirstName() + " joined from " + (company == null ? "a company" : company),
                "Through your company link. They can now request a drive.", "/tpo/recruiters");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "JOINED");
        out.put("collegeName", collegeRepository.findById(link.getCollegeId()).map(College::getName).orElse(""));
        out.put("signInEmail", email);
        return out;
    }

    /** The answer to someone who joins again while they already have access: no counter, no bell, nothing changed. */
    Map<String, Object> alreadyIn(Integer collegeId, String email) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "ALREADY_JOINED");
        out.put("collegeName", collegeRepository.findById(collegeId).map(College::getName).orElse(""));
        out.put("signInEmail", email);
        return out;
    }

    // ---------------------------------------------------------------- internals

    private CollegeCompany live(String token) {
        if (token == null || token.isBlank() || token.length() > 200) throw new JoinProblem("LINK_INVALID", "This link is no longer valid");
        return collegeCompanyRepository.findByJoinTokenHash(TpoRecruiterLeadService.sha256Hex(token))
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                .orElseThrow(() -> new JoinProblem("LINK_INVALID", "This link is no longer valid"));
    }

    /** A company email whose domain belongs to the link's company. */
    private String requireCompanyEmailOf(CollegeCompany link, String email) {
        if (email == null || email.isBlank()) throw new JoinProblem("EMAIL_REQUIRED", "Enter your work email");
        String e = email.trim().toLowerCase();
        CompanyDomainService.Check check = domainService.checkEmail(e);
        if (!check.ok()) throw new JoinProblem("COMPANY_EMAIL_REQUIRED", check.message());
        boolean ours = domainRepository.findByDomain(check.domain()).map(d -> d.getCompanyId().equals(link.getCompanyId())).orElse(false);
        if (!ours) {
            String company = directory.nameOf(link.getCompanyId());
            throw new JoinProblem("OTHER_COMPANY_EMAIL", "Use your " + (company == null ? "company" : company) + " email address for this link.");
        }
        return e;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private TpoMailService mail;

    /**
     * The welcome email, in the college's name, to a recruiter who just joined through the company link or the public link (an
     * accepted invitation sends its own). Never fails the join.
     */
    public void welcome(Recruiter recruiter, Integer collegeId) {
        if (mail == null || recruiter == null || recruiter.getContactMail() == null) return;
        Map<String, String> m = new LinkedHashMap<>();
        m.put("name", recruiter.getFirstName() == null ? "" : recruiter.getFirstName());
        mail.sendAsCollege("recruiter-welcome", recruiter.getContactMail(), m, collegeId);
    }

    /** Gives this recruiter active access to the college now, with the usual capabilities and the college's access length. */
    public boolean grantAccess(int recruiterId, Integer collegeId, String via) {
        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiterId, collegeId).orElse(null);
        // Removed by the placement cell or by 42: a link the recruiter opens never undoes that (audit 13 Oct 2026, L1). Only a new
        // invitation from the college brings them back. Declining an invitation themselves (no remover) does not block joining.
        if (grant != null && RecruiterCollegeAccess.STATUS_REVOKED.equals(grant.getStatus()) && grant.getRevokedByUserType() != null) {
            throw new JoinProblem("ACCESS_REMOVED", "The placement cell removed your access to this college. Please contact them if you think this is a mistake.");
        }
        // Already working with the college: nothing changes, so an extension the placement cell gave is never cut back to the
        // default, and how they first joined (which decides direct posting) stays as it was (L2).
        if (grant != null && grant.isActiveAt(LocalDateTime.now())) return false;
        if (grant == null) {
            grant = new RecruiterCollegeAccess();
            grant.setRecruiterId(recruiterId);
            grant.setCollegeId(collegeId);
            grant.setIsDeleted(false);
        }
        Set<String> capabilities = new HashSet<>(RecruiterCapability.INVITE_DEFAULT);
        if (grant.getCapabilities() != null) capabilities.addAll(grant.getCapabilities());
        grant.setOrganizationId(collegeRepository.findById(collegeId).map(College::getOrgId).orElse(null));
        grant.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        grant.setGrantedAt(LocalDateTime.now());
        grant.setValidUntil(settingsHub.recruiterAccessValidUntil(collegeId, grant.getGrantedAt()));
        grant.setGrantedByUserType(via);
        grant.setRevokedAt(null);
        grant.setRevokedByUserId(null);
        grant.setRevokedByUserType(null);
        grant.setRevokeReason(null);
        grant.setCapabilities(capabilities);
        accessRepository.save(grant);
        return true;
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }
}
