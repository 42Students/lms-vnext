package com._42students.lms.service.tpo;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import com._42students.lms.service.recruiter.RecruiterCapability;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The recruiter side of a TPO invite (TPO V1 - Locked.docx §2, recruiter V1 §2): the TPO copies a link and sends it
 * themselves (no email lane here — see TpoRecruiterLeadService for the emailed variant). Opening the link only
 * PREVIEWS it and never uses it up (company mail scanners open links before people do); only
 * {@link #accept} spends it. Login afterwards is by email (recruiter V1 §10: email is the account key) when
 * the recruiter lead had one on file, or the phone OTP the recruiter enters on this screen when it did not;
 * whichever is present, the other stays optional.
 *
 * A bad, used, expired, unsubscribed or not-now link all fail identically ({@link InviteInvalid}) so
 * the endpoint cannot be used to probe which recruiter leads exist. The link grants one thing: access to the
 * inviting college, with {@link RecruiterCapability#INVITE_DEFAULT}. The company is taken from the recruiter lead the
 * TPO created, never from what the recruiter types, so a recruiter cannot pick another company's name.
 */
@Service
@RequiredArgsConstructor
public class RecruiterInviteService {

    public static final String STATUS_PENDING_RECRUITER = "PENDING_HR";
    public static final int TTL_DAYS = 7;

    private final RecruiterLeadRepository recruiterLeadRepository;
    private final RecruiterRepository recruiterRepository;
    private final RecruiterCollegeAccessRepository accessRepository;
    private final CompanyDirectoryService companyRepository;
    private final CollegeRepository collegeRepository;
    private final TpoRecruiterLeadService recruiterLeadService;
    private final TpoAuditService audit;
    private final TpoMailService mail;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final TpoSettingsHubService settingsHub;

    /** The drive the recruiter was asked to review becomes theirs when they join (recruiter phase 1, N5 c). Optional for direct-built tests. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private DriveReviewInviteService reviewInvites;

    /** The link is not usable: wrong, used, expired or withdrawn. Deliberately says nothing more. */
    public static class InviteInvalid extends RuntimeException {
        public InviteInvalid() {
            super("INVITE_INVALID");
        }
    }

    /** The link is fine but the details are not (bad phone, blocked account). Safe to explain. */
    public static class InviteRejected extends RuntimeException {
        private final String code;

        public InviteRejected(String code, String message) {
            super(message);
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }

    public static class AcceptInput {
        public String firstName;
        public String lastName;
        public String designation;
        /** Optional contact number for the placement cell; never a way to sign in (L9). */
        public String phone;
        /** Only asked for when the recruiter lead has no email on file; ignored otherwise (the recruiter lead's own email is authoritative). */
        public String email;
        /** The code emailed to the work address (see {@link #sendCode}); required to accept. */
        public String code;
    }

    @org.springframework.beans.factory.annotation.Autowired
    private RecruiterInviteCodeService codeService;

    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.service.company.CompanyDomainService domainService;

    /**
     * Step one of accepting (recruiter phase 1, step 4): email a code to the work address. The address is the recruiter lead's
     * own when the TPO entered one, otherwise the one typed here; either way it must be a company email (L1, N4).
     */
    public Map<String, Object> sendCode(String token, String typedEmail) {
        RecruiterLead recruiterLead = liveRecruiterLead(token);
        String email = firstNonBlankEmail(recruiterLead.getEmailNorm(), typedEmail);
        if (email == null) throw new InviteRejected("EMAIL_REQUIRED", "Enter your work email");
        requireCompanyEmail(email);
        try {
            codeService.send(token, email, recruiterLead.getName());
        } catch (RecruiterInviteCodeService.CodeProblem e) {
            throw new InviteRejected(e.getCode(), e.getMessage());
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "CODE_SENT");
        out.put("email", email);
        return out;
    }

    private void requireCompanyEmail(String email) {
        com._42students.lms.service.company.CompanyDomainService.Check check = domainService.checkEmail(email);
        if (!check.ok()) throw new InviteRejected("COMPANY_EMAIL_REQUIRED", check.message());
    }

    private static final java.util.regex.Pattern EMAIL_SHAPE = java.util.regex.Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    /** Trimmed, lower-cased, and shape-checked; null if blank or not a plausible email. */
    private static String normalizeEmail(String raw) {
        if (raw == null) return null;
        String e = raw.trim().toLowerCase();
        return e.isEmpty() || !EMAIL_SHAPE.matcher(e).matches() ? null : e;
    }

    private RecruiterLead liveRecruiterLead(String token) {
        if (token == null || token.isBlank() || token.length() > 200) throw new InviteInvalid();
        RecruiterLead recruiterLead = recruiterLeadRepository.findByInviteTokenHash(TpoRecruiterLeadService.sha256Hex(token)).orElseThrow(InviteInvalid::new);
        LocalDateTime sent = recruiterLead.getInviteSentAt();
        if (sent == null || sent.plusDays(TTL_DAYS).isBefore(LocalDateTime.now())) throw new InviteInvalid();
        if (recruiterLead.getUnsubscribedAt() != null || "NOT_NOW".equals(recruiterLead.getManualStage())) throw new InviteInvalid();
        return recruiterLead;
    }

    /** What the welcome screen shows. Never consumes the link; it records the first open (BE-0206). */
    public Map<String, Object> preview(String token) {
        RecruiterLead recruiterLead = liveRecruiterLead(token);
        College college = collegeRepository.findById(recruiterLead.getCollegeId()).orElseThrow(InviteInvalid::new);
        // Opened counts as a click: the day-4 "still unopened" reminder (which rotates the link) skips them.
        if (recruiterLead.getInviteClickedAt() == null) recruiterLeadRepository.markInviteOpened(recruiterLead.getId(), LocalDateTime.now());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeName", college.getName());
        out.put("companyName", recruiterLead.getCompanyName());
        out.put("contactName", recruiterLead.getName());
        out.put("designation", recruiterLead.getDesignation());
        // The work email the invitation was sent to (shown locked on the invite page; empty when the TPO had none).
        out.put("email", recruiterLead.getEmailNorm());
        out.put("expiresAt", recruiterLead.getInviteSentAt().plusDays(TTL_DAYS));
        // Asked to review a drive the placement cell posted (N5 c): the page names it.
        if (recruiterLead.getReviewJobId() != null) {
            List<String> title = jdbc.queryForList("SELECT job_title FROM job WHERE id = :j AND college_id = :c",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", recruiterLead.getReviewJobId()).addValue("c", recruiterLead.getCollegeId()), String.class);
            if (!title.isEmpty()) out.put("reviewDrive", title.get(0));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> accept(String token, AcceptInput in) {
        RecruiterLead recruiterLead = liveRecruiterLead(token);
        if (in == null) throw new InviteRejected("BODY_REQUIRED", "Details are required");

        // The work email is the identity (L9): the recruiter lead's own when the TPO entered one, otherwise the one typed.
        // It must be a company email, and the code sent to it must be right, before anything else happens.
        String email = firstNonBlankEmail(recruiterLead.getEmailNorm(), in.email);
        if (email == null) throw new InviteRejected("EMAIL_REQUIRED", "Enter your work email");
        requireCompanyEmail(email);
        String mobile = in.phone == null || in.phone.isBlank() ? null : OnboardingMobileNumber.normalize(in.phone);
        if (in.phone != null && !in.phone.isBlank() && mobile == null) {
            throw new InviteRejected("INVALID_MOBILE", "Enter a valid 10-digit mobile number, or leave it blank");
        }
        String firstName = clean(in.firstName, 100);
        if (firstName == null) throw new InviteRejected("FIRST_NAME_REQUIRED", "Enter your name");

        // Validate everything that can be refused BEFORE the link is spent, so a typo does not burn it.
        // The same work email is the same person; a phone number never identifies anyone (L9).
        Recruiter existing = recruiterRepository.findByContactMail(email).orElse(null);
        if (existing != null && (Boolean.TRUE.equals(existing.getIsDeleted()) || existing.getSuspendedAt() != null)) {
            throw new InviteRejected("ACCOUNT_UNAVAILABLE", "This account cannot be used. Please contact the placement cell.");
        }
        College college = collegeRepository.findById(recruiterLead.getCollegeId()).orElseThrow(InviteInvalid::new);
        try {
            codeService.verify(token, email, in.code);
        } catch (RecruiterInviteCodeService.CodeProblem e) {
            throw new InviteRejected(e.getCode(), e.getMessage());
        }

        // Spend the link. Only one concurrent request can win; the loser sees it as invalid.
        if (recruiterLeadRepository.consumeInvite(recruiterLead.getId(), TpoRecruiterLeadService.sha256Hex(token), LocalDateTime.now()) != 1) {
            throw new InviteInvalid();
        }

        Recruiter recruiter = existing != null ? existing : new Recruiter();
        if (existing == null) {
            recruiter.setTokenVersion(0);
            recruiter.setIsDeleted(false);
            recruiter.setContactMobile(mobile);
            recruiter.setFirstName(firstName);
            recruiter.setLastName(clean(in.lastName, 100));
            recruiter.setDesignation(firstNonBlank(clean(in.designation, 150), recruiterLead.getDesignation()));
            recruiter.setContactMail(email);
            recruiter.setCompanyId(resolveCompany(recruiterLead, email));
            recruiter.setCreatedByUserId(recruiterLead.getOwnerFacultyId());
            recruiter.setCreatedByUserType("FACULTY");
        } else if (recruiter.getCompanyId() == null) {
            recruiter.setCompanyId(resolveCompany(recruiterLead, email));
        }
        recruiter = recruiterRepository.save(recruiter);

        if (existing != null) {
            // An account that already exists is never given a college silently: the person signs in and accepts.
            RecruiterCollegeAccess pending = accessRepository.findForRecruiterAndCollege(recruiter.getId(), college.getId()).orElse(null);
            boolean alreadyActive = pending != null && RecruiterCollegeAccess.STATUS_ACTIVE.equals(pending.getStatus());
            if (!alreadyActive) {
                if (pending == null) {
                    pending = new RecruiterCollegeAccess();
                    pending.setRecruiterId(recruiter.getId());
                    pending.setCollegeId(college.getId());
                    pending.setIsDeleted(false);
                }
                pending.setOrganizationId(college.getOrgId());
                pending.setStatus(STATUS_PENDING_RECRUITER);
                pending.setGrantedAt(LocalDateTime.now());
                pending.setGrantedByUserId(recruiterLead.getOwnerFacultyId());
                pending.setGrantedByUserType("FACULTY");
                pending.setCapabilities(new HashSet<>(RecruiterCapability.INVITE_DEFAULT));
                accessRepository.save(pending);
                jdbc.update("UPDATE recruiter_college_access SET pending_recruiter_lead_id = :l WHERE recruiter_id = :h AND college_id = :c",
                        new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", recruiterLead.getId()).addValue("h", recruiter.getId()).addValue("c", college.getId()));
                recruiterLeadService.logActivity(recruiterLead.getId(), "SYSTEM", null, "Existing recruiter invited; waiting for them to accept", null);
                audit.bell(recruiterLead.getCollegeId(), "RECRUITER_INVITE_PENDING", recruiter.getFirstName() + " already has a 42LMS account", "They need to sign in and accept your invitation.", "/tpo/recruiters/" + recruiterLead.getId());
                Map<String, Object> pendingOut = new LinkedHashMap<>();
                pendingOut.put("status", "PENDING_HR");
                pendingOut.put("collegeName", college.getName());
                signInHint(pendingOut, mobile, email);
                return pendingOut;
            }
        }
        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiter.getId(), college.getId()).orElse(null);
        if (grant == null) {
            grant = new RecruiterCollegeAccess();
            grant.setRecruiterId(recruiter.getId());
            grant.setCollegeId(college.getId());
            grant.setIsDeleted(false);
        }
        Set<String> capabilities = new HashSet<>(RecruiterCapability.INVITE_DEFAULT);
        if (grant.getCapabilities() != null) capabilities.addAll(grant.getCapabilities());
        grant.setOrganizationId(college.getOrgId());
        grant.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        grant.setGrantedAt(LocalDateTime.now());
        grant.setValidUntil(settingsHub.recruiterAccessValidUntil(college.getId(), grant.getGrantedAt()));
        grant.setGrantedByUserId(recruiterLead.getOwnerFacultyId());
        grant.setGrantedByUserType("FACULTY");
        grant.setRevokedAt(null);
        grant.setRevokedByUserId(null);
        grant.setRevokedByUserType(null);
        grant.setRevokeReason(null);
        grant.setCapabilities(capabilities);
        accessRepository.save(grant);

        RecruiterLead fresh = recruiterLeadRepository.findById(recruiterLead.getId()).orElseThrow(InviteInvalid::new);
        fresh.setRecruiterId((long) recruiter.getId());
        recruiterLeadRepository.save(fresh);
        if (reviewInvites != null) reviewInvites.attachReviewDrive(fresh, recruiter.getId());
        recruiterLeadService.logActivity(fresh.getId(), "SYSTEM", null, "Joined as a recruiter: " + recruiter.getFirstName(), null);
        audit.bell(fresh.getCollegeId(), "RECRUITER_JOINED", recruiter.getFirstName() + " joined from " + (fresh.getCompanyName() == null ? "a company" : fresh.getCompanyName()), "They can now see your college and request a drive.", "/tpo/recruiters/" + fresh.getId());

        if (existing == null && email != null) {
            // recruiter V1 §1 email table: "Welcome" the first time a brand-new account joins — not on a later invite acceptance.
            // TpoMailService.send already swallows delivery failures (returns FAILED, never throws), so a missed email never fails the join.
            mail.sendAsCollege("recruiter-welcome", email, Map.of("name", recruiter.getFirstName() == null ? "" : recruiter.getFirstName(), "collegeName", college.getName()), college.getId());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "JOINED");
        out.put("collegeName", college.getName());
        signInHint(out, mobile, email);
        return out;
    }

    /** How this recruiter signs in from now on: always their work email, on this college's address (L9). */
    private static void signInHint(Map<String, Object> out, String mobile, String email) {
        out.put("signInEmail", email);
    }

    /** Invitations from colleges waiting for this recruiter's yes. */
    public List<Map<String, Object>> pendingFor(int recruiterId) {
        return jdbc.queryForList("SELECT a.college_id AS collegeId, c.name AS collegeName, l.company_name AS company, l.name AS invitedContact FROM recruiter_college_access a " +
                        "JOIN college c ON c.id = a.college_id LEFT JOIN recruiter_lead l ON l.id = a.pending_recruiter_lead_id WHERE a.recruiter_id = :h AND a.status = 'PENDING_HR' AND (a.is_deleted = 0 OR a.is_deleted IS NULL)",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId));
    }

    /** One click: the invitation becomes access, the recruiter lead becomes Joined. */
    @Transactional
    public void acceptPending(int recruiterId, Integer collegeId) {
        RecruiterCollegeAccess g = accessRepository.findForRecruiterAndCollege(recruiterId, collegeId).filter(x -> STATUS_PENDING_RECRUITER.equals(x.getStatus())).orElseThrow(() -> new IllegalArgumentException("Not found"));
        g.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        g.setGrantedAt(LocalDateTime.now());
        g.setValidUntil(settingsHub.recruiterAccessValidUntil(collegeId, g.getGrantedAt()));
        accessRepository.save(g);
        List<Long> recruiterLeadIds = jdbc.queryForList("SELECT pending_recruiter_lead_id FROM recruiter_college_access WHERE recruiter_id = :h AND college_id = :c",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), Long.class);
        if (!recruiterLeadIds.isEmpty() && recruiterLeadIds.get(0) != null) {
            recruiterLeadRepository.findById(recruiterLeadIds.get(0)).ifPresent(l -> {
                l.setRecruiterId((long) recruiterId);
                l.setInviteTokenHash(null);
                recruiterLeadRepository.save(l);
                if (reviewInvites != null) reviewInvites.attachReviewDrive(l, recruiterId);
                recruiterLeadService.logActivity(l.getId(), "SYSTEM", null, "Recruiter accepted the invitation", null);
                audit.bell(l.getCollegeId(), "RECRUITER_JOINED", l.getName() + " accepted your invitation", "They can now see your college and request a drive.", "/tpo/recruiters/" + l.getId());
            });
        }
    }

    @Transactional
    public void declinePending(int recruiterId, Integer collegeId) {
        RecruiterCollegeAccess g = accessRepository.findForRecruiterAndCollege(recruiterId, collegeId).filter(x -> STATUS_PENDING_RECRUITER.equals(x.getStatus())).orElseThrow(() -> new IllegalArgumentException("Not found"));
        g.setStatus(RecruiterCollegeAccess.STATUS_REVOKED);
        g.setRevokedAt(LocalDateTime.now());
        g.setRevokeReason("Declined by the recruiter");
        accessRepository.save(g);
    }

    /** "Not hiring from this college this season": the recruiter lead goes to Not now and the TPO is told. */
    @Transactional
    public void notHiring(String token) {
        RecruiterLead recruiterLead = liveRecruiterLead(token);
        recruiterLead.setManualStage("NOT_NOW");
        recruiterLead.setNotNowReason("Said they are not hiring from this college this season");
        recruiterLead.setNotNowUntil(java.time.LocalDate.now().plusMonths(6));
        recruiterLead.setInviteTokenHash(null);
        recruiterLeadRepository.save(recruiterLead);
        recruiterLeadService.logActivity(recruiterLead.getId(), "SYSTEM", null, "Replied: not hiring this season", null);
        audit.bell(recruiterLead.getCollegeId(), "RECRUITER_NOT_HIRING", recruiterLead.getName() + " is not hiring this season", "Moved to Not now. Revisit in six months.", "/tpo/recruiters/" + recruiterLead.getId());
    }

    /** Unsubscribe: no more invites or reminders, ever, until the TPO clears it. */
    @Transactional
    public void unsubscribe(String token) {
        RecruiterLead recruiterLead = liveRecruiterLead(token);
        recruiterLead.setUnsubscribedAt(LocalDateTime.now());
        recruiterLead.setInviteTokenHash(null);
        recruiterLeadRepository.save(recruiterLead);
        recruiterLeadService.logActivity(recruiterLead.getId(), "SYSTEM", null, "Unsubscribed from invitations", null);
        audit.bell(recruiterLead.getCollegeId(), "RECRUITER_UNSUBSCRIBED", recruiterLead.getName() + " unsubscribed", "They will not be sent invitations again.", "/tpo/recruiters/" + recruiterLead.getId());
    }

    /**
     * The recruiter's company is the one owning their work email's domain (L1, P1-1); the recruiter lead's company name is
     * used only when that company is new. A personal or unusable email leaves the company empty for now (step 4 makes a
     * company email required at the invite).
     */
    private Integer resolveCompany(RecruiterLead recruiterLead, String email) {
        if (email == null) return null;
        try {
            return companyRepository.forWorkEmail(email, clean(recruiterLead.getCompanyName(), 150),
                    new CompanyDirectoryService.Actor("FACULTY", recruiterLead.getOwnerFacultyId(), recruiterLead.getCollegeId())).getId();
        } catch (IllegalArgumentException notACompanyEmail) {
            return null;
        }
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }

    private static String firstNonBlank(String a, String b) {
        return a != null ? a : b;
    }

    /** The recruiter lead's own email (already normalised when set) wins; otherwise whatever the recruiter typed, normalised and shape-checked. */
    private static String firstNonBlankEmail(String recruiterLeadEmail, String typed) {
        if (recruiterLeadEmail != null && !recruiterLeadEmail.isBlank()) return recruiterLeadEmail.trim().toLowerCase();
        return normalizeEmail(typed);
    }
}
