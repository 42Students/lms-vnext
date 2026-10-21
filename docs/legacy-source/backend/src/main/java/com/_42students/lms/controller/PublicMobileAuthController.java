package com._42students.lms.controller;

import com._42students.lms.dto.request.MobileAuthSendRequest;
import com._42students.lms.dto.request.MobileAuthStartRequest;
import com._42students.lms.dto.request.MobileAuthVerifyRequest;
import com._42students.lms.dto.request.MobileAuthEmailFallbackSendRequest;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.College;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.MobileLoginAttempt;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.MobileLoginAttemptRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.util.OnboardingMobileNumber;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.OrgMembershipService;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.service.TenantResolutionService;
import com._42students.lms.model.AuthHandoffToken;
import com._42students.lms.repository.AuthHandoffTokenRepository;
import com._42students.lms.util.CookieUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Mobile/global-domain auth flow:
 * - start: find accounts by phone; if one, send OTP; if many, return choices
 * - send: user selects choice -> send OTP, create attempt
 * - verify: verify OTP for attempt -> issue tokens and return memberships
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/mobile-auth")
public class PublicMobileAuthController {

    private final LearnerRepository learnerRepository;
    private final FacultyRepository facultyRepository;
    private final CollegeRepository collegeRepository;
    private final MobileLoginAttemptRepository attemptRepository;
    private final SmsService smsService;
    private final JwtService jwtService;
    private final OrgMembershipService orgMembershipService;
    private final TestOtpService testOtpService;
    private final ZeptoMailService zeptoMailService;
    private final TenantDomainRepository tenantDomainRepository;
    private final TenantResolutionService tenantResolutionService;

    // Dev/support OTP bypasses (guarded to localhost only).
    private static final long VERIFY_REPLAY_WINDOW_SECONDS = 90;
    // OTP send is synchronous: never claim the provider accepted a message before it responds.

    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Value("${zepto.template.system.email.verification:2518b.4c361928d9526a75.k1.aea6cef0-4e4a-11f1-97e6-e256a66a52e4.19e1e1f015f}")
    private String emailVerificationTemplateId;

    private final AppSettingsService appSettingsService;

    private final AuthHandoffTokenRepository authHandoffTokenRepository;

    private final Environment environment;

    // recruiter (industry) identities. Optional so tests that construct this controller keep working;
    // when absent no recruiter choice is offered and a recruiter attempt never resolves (fail closed).
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.RecruiterRepository recruiterRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.CollegeBrandingRepository collegeBrandingRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.recruiter.RecruiterAccessService recruiterAccessService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.recruiter.RecruiterAuthService recruiterAuthService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.RecruiterInviteService recruiterInviteService;

    /** An invitation from this college waiting for the recruiter's yes. */
    private boolean hasPendingInviteAt(com._42students.lms.model.Recruiter recruiter, Integer collegeId) {
        if (recruiter == null || collegeId == null || recruiterInviteService == null) return false;
        try {
            return recruiterInviteService.pendingFor(recruiter.getId()).stream().anyMatch(m -> Objects.equals(m.get("collegeId"), collegeId));
        } catch (RuntimeException e) {
            return false;
        }
    }

    public PublicMobileAuthController(LearnerRepository learnerRepository,
                                      FacultyRepository facultyRepository,
                                      CollegeRepository collegeRepository,
                                      MobileLoginAttemptRepository attemptRepository,
                                      SmsService smsService,
                                      JwtService jwtService,
                                      OrgMembershipService orgMembershipService,
                                      TestOtpService testOtpService,
                                      ZeptoMailService zeptoMailService,
                                      TenantDomainRepository tenantDomainRepository,
                                      TenantResolutionService tenantResolutionService,
                                      AppSettingsService appSettingsService,
                                      AuthHandoffTokenRepository authHandoffTokenRepository,
                                      Environment environment) {
        this.learnerRepository = learnerRepository;
        this.facultyRepository = facultyRepository;
        this.collegeRepository = collegeRepository;
        this.attemptRepository = attemptRepository;
        this.smsService = smsService;
        this.jwtService = jwtService;
        this.orgMembershipService = orgMembershipService;
        this.testOtpService = testOtpService;
        this.zeptoMailService = zeptoMailService;
        this.tenantDomainRepository = tenantDomainRepository;
        this.tenantResolutionService = tenantResolutionService;
        this.appSettingsService = appSettingsService;
        this.authHandoffTokenRepository = authHandoffTokenRepository;
        this.environment = environment;
    }

    @PostMapping("/start")
    public ResponseEntity<?> start(@Valid @RequestBody MobileAuthStartRequest req, HttpServletRequest request) {
        long startedAt = System.currentTimeMillis();
        String phone = normalizePhone(req.getPhone());
        try {
            if (phone == null) return ResponseEntity.badRequest().body(Map.of("error", "Phone required"));

            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(request);
            if (!phoneSignInAllowed(tenantCollegeId)) return loginMethodDisabled();
            List<AccountChoice> choices = findChoices(phone, tenantCollegeId,
                    com._42students.lms.util.RequestHostUtil.getNormalizedHost(request));
            if (tenantCollegeId != null) {
                choices = choices.stream().filter(c -> Objects.equals(c.collegeId, tenantCollegeId)).toList();
            }
            if (choices.isEmpty()) {
                if (tenantCollegeId != null) {
                    return ResponseEntity.status(404).body(Map.of(
                            "error", "NO_ACCOUNT_FOR_DOMAIN",
                            "message", "No account found for this number on this college domain"
                    ));
                }
                return ResponseEntity.status(404).body(Map.of("error", "NOT_REGISTERED", "message", "No account found for this number"));
            }
            if (choices.size() == 1) {
                AccountChoice choice = choices.get(0);
                // Refused before any SMS is spent (verify refuses a suspended account anyway).
                if (choice.suspended) return accountSuspended();
                ResponseEntity<?> limited = enforceAttemptRateLimit(phone);
                if (limited != null) return limited;
                MobileLoginAttempt attempt = createAttempt(phone, choice);
                try {
                    sendOtpUnlessTestNumber(phone, attempt.getOtp());
                } catch (RuntimeException deliveryFailure) {
                    log.warn("OTP provider rejected send request", deliveryFailure);
                    return ResponseEntity.status(503).body(Map.of("error", "OTP_DELIVERY_FAILED", "message", "Could not send the login code. Please try again."));
                }
                return ResponseEntity.ok(Map.of(
                        "mode", "OTP_SENT",
                        "attemptId", attempt.getAttemptId(),
                        "choice", choice.toPublic(),
                        "expiresInSeconds", 300
                ));
            }
            Map<String, Object> out = new HashMap<>();
            out.put("mode", "CHOOSE_ACCOUNT");
            out.put("choices", choices.stream().map(AccountChoice::toPublic).toList());
            out.put("tenantCollegeId", tenantCollegeId);
            return ResponseEntity.ok(out);
        } finally {
            logSlowMobileAuth("start", startedAt, phone);
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@Valid @RequestBody MobileAuthSendRequest req, HttpServletRequest request) {
        long startedAt = System.currentTimeMillis();
        String phone = normalizePhone(req.getPhone());
        try {
            if (phone == null) return ResponseEntity.badRequest().body(Map.of("error", "Phone required"));
            ResponseEntity<?> limited = enforceAttemptRateLimit(phone);
            if (limited != null) return limited;
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(request);
            if (!phoneSignInAllowed(tenantCollegeId)) return loginMethodDisabled();
            List<AccountChoice> choices = findChoices(phone, tenantCollegeId,
                    com._42students.lms.util.RequestHostUtil.getNormalizedHost(request));
            if (tenantCollegeId != null) {
                choices = choices.stream().filter(c -> Objects.equals(c.collegeId, tenantCollegeId)).toList();
            }
            AccountChoice selected = pickChoice(choices, req.getChoiceId(), req.getKey());
            if (selected == null) {
                return ResponseEntity.status(400).body(Map.of("error", "INVALID_CHOICE"));
            }
            if (selected.suspended) return accountSuspended();
            MobileLoginAttempt attempt = createAttempt(phone, selected);
                try {
                    sendOtpUnlessTestNumber(phone, attempt.getOtp());
                } catch (RuntimeException deliveryFailure) {
                    log.warn("OTP provider rejected send request", deliveryFailure);
                    return ResponseEntity.status(503).body(Map.of("error", "OTP_DELIVERY_FAILED", "message", "Could not send the login code. Please try again."));
                }
            return ResponseEntity.ok(Map.of(
                    "mode", "OTP_SENT",
                    "attemptId", attempt.getAttemptId(),
                    "choice", selected.toPublic(),
                    "expiresInSeconds", 300
            ));
        } finally {
            logSlowMobileAuth("send", startedAt, phone);
        }
    }

    /** Body of the email sign-in endpoints: the email, and on /email-login/send the chosen account. */
    @lombok.Data
    public static class EmailLoginRequest {
        private String email;
        private Integer choiceId;
        /** The chosen account's stable key (preferred over choiceId, which is only a position in the list). */
        private String key;
    }

    /**
     * Sign in with an email address (students, staff and recruiters): the email-first twin of {@code /start}.
     * One account: an email code is sent straight away. Several (same email in more than one place): the
     * caller picks one and calls {@code /email-login/send}. The code is verified with {@code /email-fallback/verify},
     * like every other email-channel attempt. On a college address the college's sign-in methods apply to
     * everyone alike (students, staff and recruiters all use the same login).
     */
    @PostMapping("/email-login/start")
    public ResponseEntity<?> startEmailLogin(@RequestBody EmailLoginRequest req, HttpServletRequest request) {
        long startedAt = System.currentTimeMillis();
        String email = normalizeEmail(req != null ? req.getEmail() : null);
        try {
            if (email == null) return ResponseEntity.badRequest().body(Map.of("error", "INVALID_EMAIL"));
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(request);
            if (!emailSignInAllowed(tenantCollegeId)) return loginMethodDisabled();
            List<AccountChoice> choices = emailChoicesFor(email, tenantCollegeId, request);
            if (choices.isEmpty()) {
                if (tenantCollegeId != null) {
                    return ResponseEntity.status(404).body(Map.of(
                            "error", "NO_ACCOUNT_FOR_DOMAIN",
                            "message", "No account found for this email on this college domain"));
                }
                // A recruiter on the main site: they sign in on their college's own address (recruiter phase 1).
                if (recruiterRepository != null && recruiterRepository.findActiveByContactMail(email).isPresent()) {
                    return ResponseEntity.status(404).body(Map.of("error", "RECRUITER_COLLEGE_ADDRESS", "message",
                            "Recruiters sign in at their college's placement address, for example klu.42lms.com. You'll find it in your invitation email."));
                }
                return ResponseEntity.status(404).body(Map.of("error", "NOT_REGISTERED", "message", "No account found for this email"));
            }
            if (choices.size() == 1) return sendEmailLoginCode(email, choices.get(0));
            Map<String, Object> out = new HashMap<>();
            out.put("mode", "CHOOSE_ACCOUNT");
            out.put("choices", choices.stream().map(AccountChoice::toPublic).toList());
            out.put("tenantCollegeId", tenantCollegeId);
            return ResponseEntity.ok(out);
        } finally {
            logSlowMobileAuth("email-login-start", startedAt, email);
        }
    }

    @PostMapping("/email-login/send")
    public ResponseEntity<?> sendEmailLogin(@RequestBody EmailLoginRequest req, HttpServletRequest request) {
        long startedAt = System.currentTimeMillis();
        String email = normalizeEmail(req != null ? req.getEmail() : null);
        try {
            if (email == null) return ResponseEntity.badRequest().body(Map.of("error", "INVALID_EMAIL"));
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(request);
            if (!emailSignInAllowed(tenantCollegeId)) return loginMethodDisabled();
            AccountChoice selected = pickChoice(emailChoicesFor(email, tenantCollegeId, request), req.getChoiceId(), req.getKey());
            if (selected == null) return ResponseEntity.status(400).body(Map.of("error", "INVALID_CHOICE"));
            return sendEmailLoginCode(email, selected);
        } finally {
            logSlowMobileAuth("email-login-send", startedAt, email);
        }
    }

    /** Accounts this email can sign in to here (on a college address, only that college's). */
    private List<AccountChoice> emailChoicesFor(String email, Integer tenantCollegeId, HttpServletRequest request) {
        List<AccountChoice> choices = findChoicesByEmail(email, tenantCollegeId,
                com._42students.lms.util.RequestHostUtil.getNormalizedHost(request));
        if (tenantCollegeId != null) {
            choices = new ArrayList<>(choices.stream().filter(c -> Objects.equals(c.collegeId, tenantCollegeId)).toList());
            for (int i = 0; i < choices.size(); i++) choices.get(i).choiceId = i + 1;
        }
        return choices;
    }

    private ResponseEntity<?> sendEmailLoginCode(String email, AccountChoice choice) {
        if (attemptRepository.countActiveUserAttemptsSince(choice.userType, choice.userId, LocalDateTime.now().minusMinutes(10)) >= 5) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "TOO_MANY_REQUESTS",
                    "message", "Too many code requests. Please try again later.",
                    "retryAfterSeconds", 600));
        }
        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId(UUID.randomUUID().toString());
        attempt.setPhone(EMAIL_FIRST_PHONE); // email-first: never SMS-verified
        attempt.setOtp(String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000))); // unused (phone OTP column is NOT NULL); never sent, never accepted
        attempt.setUserType(choice.userType);
        attempt.setUserId(choice.userId);
        attempt.setCollegeId(choice.collegeId);
        attempt.setOrganizationId(choice.organizationId);
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setUsed(false);
        String emailOtp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        LocalDateTime now = LocalDateTime.now();
        attempt.setEmailOtp(emailOtp);
        attempt.setEmailOtpSentAt(now);
        attempt.setEmailOtpExpiresAt(now.plusMinutes(5));
        attempt = attemptRepository.save(attempt);

        ResolvedLoginUser resolved = resolveAttemptUser(attempt);
        if (resolved == null || resolved.user == null) return ResponseEntity.status(404).body(Map.of("error", "USER_NOT_FOUND"));
        if (suspendedAtOf(resolved.user) != null) return ResponseEntity.status(403).body(Map.of("error", "ACCOUNT_SUSPENDED"));
        try {
            sendEmailOtp(resolved.user, attempt, emailOtp);
        } catch (RuntimeException deliveryFailure) {
            log.warn("Email login OTP delivery failed", deliveryFailure);
            return ResponseEntity.status(503).body(Map.of("error", "OTP_DELIVERY_FAILED", "message", "Could not send the login code. Please try again."));
        }
        return ResponseEntity.ok(Map.of(
                "mode", "EMAIL_OTP_SENT",
                "attemptId", attempt.getAttemptId(),
                "choice", choice.toPublic(),
                "maskedEmail", maskEmail(email),
                "expiresInSeconds", 300));
    }

    /** Every account (recruiter first, then learners, then faculty) whose registered email is this one. */
    private List<AccountChoice> findChoicesByEmail(String email, Integer tenantCollegeId, String requestHost) {
        List<AccountChoice> out = new ArrayList<>();
        if (recruiterRepository != null) {
            com._42students.lms.model.Recruiter recruiter = recruiterRepository.findActiveByContactMail(email).orElse(null);
            AccountChoice rc = recruiter != null ? recruiterChoiceFor(recruiter, tenantCollegeId, requestHost) : null;
            if (rc != null) out.add(rc);
        }
        List<String> key = List.of(email);
        for (Learner l : learnerRepository.findByContactMailLowerInAndNotDeleted(key)) {
            College college = l.getCollegeId() != null ? collegeRepository.findById(l.getCollegeId()).orElse(null) : null;
            AccountChoice c = AccountChoice.fromLearner(l, college, out.size() + 1);
            populateDomainFields(c);
            out.add(c);
        }
        for (Faculty f : facultyRepository.findByContactMailLowerInAndNotDeleted(key)) {
            College college = f.getCollegeId() != null ? collegeRepository.findById(f.getCollegeId()).orElse(null) : null;
            AccountChoice c = AccountChoice.fromFaculty(f, college, out.size() + 1);
            populateDomainFields(c);
            out.add(c);
        }
        for (int i = 0; i < out.size(); i++) out.get(i).choiceId = i + 1;
        return out;
    }

    /**
     * The phone stored on an email-first attempt (email sign-in: no phone step at all). mobile_login_attempt.phone is NOT NULL
     * in dev and prod, and these attempts saved null: the insert failed, every email sign-in answered 409 "conflicts with an
     * existing record", recruiters included (login audit 2026-10-12).
     */
    static final String EMAIL_FIRST_PHONE = "";

    /** An attempt started from an email address, with no phone (stored as EMAIL_FIRST_PHONE, or null on old rows). */
    static boolean isEmailFirst(MobileLoginAttempt attempt) {
        return attempt != null && (attempt.getPhone() == null || attempt.getPhone().isBlank());
    }

    /**
     * The account the person picked. choiceId is only a position in a list rebuilt on every call (from queries with no
     * ORDER BY), so an account added, removed or returned in another order between the list and Continue made "choice 2"
     * a different account (login audit 2026-10-12). The account's key (acc:TYPE:id:college:n...) names exactly one
     * account; a key that no longer matches is INVALID_CHOICE, never a fallback to the position. Old clients send only
     * choiceId and keep working.
     */
    static AccountChoice pickChoice(List<AccountChoice> choices, Integer choiceId, String key) {
        if (choices == null) return null;
        if (key != null && !key.isBlank()) {
            return choices.stream().filter(c -> key.trim().equals(c.key)).findFirst().orElse(null);
        }
        return choices.stream().filter(c -> Objects.equals(c.choiceId, choiceId)).findFirst().orElse(null);
    }

    private static ResponseEntity<?> accountSuspended() {
        return ResponseEntity.status(403).body(Map.of("error", "ACCOUNT_SUSPENDED",
                "message", "This account is suspended. Contact your college administrator."));
    }

    /** Shortest gap between two email codes for one attempt (/email-fallback/send). */
    static final long EMAIL_RESEND_GAP_SECONDS = 30;

    /** Seconds still to wait before this attempt may email another code; 0 when it may. */
    static long emailResendWaitSeconds(LocalDateTime lastSentAt, LocalDateTime now) {
        if (lastSentAt == null || now == null) return 0;
        long elapsed = java.time.Duration.between(lastSentAt, now).getSeconds();
        return elapsed >= EMAIL_RESEND_GAP_SECONDS ? 0 : EMAIL_RESEND_GAP_SECONDS - Math.max(0, elapsed);
    }

    private static String normalizeEmail(String email) {
        String e = email == null ? "" : email.trim().toLowerCase();
        return e.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") ? e : null;
    }

    /** The college's sign-in methods (EMAIL_PHONE, PHONE_EMAIL, EMAIL_ONLY, PHONE_ONLY); the global host allows both. */
    private String loginMethodsFor(Integer tenantCollegeId) {
        if (tenantCollegeId == null || collegeBrandingRepository == null) return com._42students.lms.model.CollegeBranding.LOGIN_METHODS_DEFAULT;
        try {
            return com._42students.lms.model.CollegeBranding.effectiveLoginMethods(
                    collegeBrandingRepository.findActiveByCollegeId(tenantCollegeId).orElse(null));
        } catch (Exception e) {
            return com._42students.lms.model.CollegeBranding.LOGIN_METHODS_DEFAULT;
        }
    }

    private boolean phoneSignInAllowed(Integer tenantCollegeId) {
        return !"EMAIL_ONLY".equals(loginMethodsFor(tenantCollegeId));
    }

    private boolean emailSignInAllowed(Integer tenantCollegeId) {
        return !"PHONE_ONLY".equals(loginMethodsFor(tenantCollegeId));
    }

    private static ResponseEntity<?> loginMethodDisabled() {
        return ResponseEntity.status(403).body(Map.of(
                "error", "LOGIN_METHOD_DISABLED",
                "message", "This college doesn't use this sign-in method."));
    }

    /**
     * recruiter V1 §10/§2: "Recruiter? Sign in with email." Email is the recruiter account key now, so this starts
     * a login attempt directly from an email address, with no phone step first — unlike
     * {@code /email-fallback/send}, which only adds an email channel to an attempt a phone already
     * started. Verifying it uses the same {@code /email-fallback/verify} endpoint: once the attempt
     * carries an emailOtp, that endpoint does not care how it got there.
     */
    @PostMapping("/recruiter/email-login/start")
    public ResponseEntity<?> startRecruiterEmailLogin(@Valid @RequestBody com._42students.lms.dto.request.RecruiterEmailLoginStartRequest req,
                                               HttpServletRequest httpRequest) {
        return startRecruiterEmailLoginFor(req, httpRequest);
    }

    /** Same as the endpoint with no HTTP request to read a college domain from (global-host behaviour). */
    public ResponseEntity<?> startRecruiterEmailLogin(com._42students.lms.dto.request.RecruiterEmailLoginStartRequest req) {
        return startRecruiterEmailLoginFor(req, null);
    }

    private ResponseEntity<?> startRecruiterEmailLoginFor(com._42students.lms.dto.request.RecruiterEmailLoginStartRequest req,
                                                   HttpServletRequest httpRequest) {
        long startedAt = System.currentTimeMillis();
        String email = req.getEmail() == null ? "" : req.getEmail().trim().toLowerCase();
        try {
            if (recruiterRepository == null || recruiterAuthService == null) {
                return ResponseEntity.status(404).body(Map.of("error", "USER_NOT_FOUND"));
            }
            if (email.isEmpty() || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "INVALID_EMAIL"));
            }
            // Recruiter phase 1 (L9, current scope): recruiters sign in only with a company email, and only on the college's own
            // address; the session is for that college alone. There is no recruiter sign-in on the main site.
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(httpRequest);
            if (tenantCollegeId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "RECRUITER_COLLEGE_ADDRESS", "message",
                        "Recruiters sign in at their college's placement address, for example klu.42lms.com. You'll find it in your invitation email."));
            }
            if (com._42students.lms.service.company.CompanyDomainService.isPersonalOrDisposableDomain(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "COMPANY_EMAIL_REQUIRED", "message",
                        "Use your work email. Personal email (Gmail, Yahoo, Outlook and similar) can't be used for recruiting."));
            }
            com._42students.lms.model.Recruiter recruiter = recruiterRepository.findActiveByContactMail(email).orElse(null);
            boolean mayEnter = recruiter != null && recruiter.getSuspendedAt() == null && recruiterAccessService != null
                    && (recruiterAccessService.hasActiveGrant(recruiter.getId(), tenantCollegeId) || hasPendingInviteAt(recruiter, tenantCollegeId));
            if (!mayEnter) {
                // The same answer whether or not the email can recruit here, so nobody can test which companies recruit at a
                // college. This attempt id is never stored: any code entered against it fails like a wrong code.
                return ResponseEntity.ok(Map.of("mode", "EMAIL_OTP_SENT", "attemptId", UUID.randomUUID().toString(),
                        "maskedEmail", maskEmail(email), "expiresInSeconds", 300));
            }
            Integer scopeCollegeId = tenantCollegeId;

            MobileLoginAttempt attempt = new MobileLoginAttempt();
            attempt.setAttemptId(UUID.randomUUID().toString());
            attempt.setCollegeId(scopeCollegeId);
            if (scopeCollegeId != null && recruiterAccessService != null) {
                attempt.setOrganizationId(recruiterAccessService.organizationOf(scopeCollegeId));
            }
            attempt.setPhone(EMAIL_FIRST_PHONE); // no phone step: this attempt is email-first, never SMS-verified
            attempt.setOtp(String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000))); // unused (phone OTP column is NOT NULL); never sent, never accepted
            attempt.setUserType(com._42students.lms.model.Recruiter.USER_TYPE);
            attempt.setUserId(recruiter.getId());
            attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
            attempt.setUsed(false);
            attempt = attemptRepository.save(attempt);

            String emailOtp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
            LocalDateTime now = LocalDateTime.now();
            attempt.setEmailOtp(emailOtp);
            attempt.setEmailOtpSentAt(now);
            attempt.setEmailOtpExpiresAt(now.plusMinutes(5));
            attemptRepository.save(attempt);

            try {
                sendEmailOtp(recruiter, attempt, emailOtp);
            } catch (RuntimeException deliveryFailure) {
                log.warn("HR email login OTP delivery failed", deliveryFailure);
                return ResponseEntity.status(503).body(Map.of("error", "OTP_DELIVERY_FAILED", "message", "Could not send the login code. Please try again."));
            }

            return ResponseEntity.ok(Map.of(
                    "mode", "EMAIL_OTP_SENT",
                    "attemptId", attempt.getAttemptId(),
                    "maskedEmail", maskEmail(email),
                    "expiresInSeconds", 300
            ));
        } finally {
            logSlowMobileAuth("hr-email-login-start", startedAt, email);
        }
    }

    @PostMapping("/email-fallback/send")
    public ResponseEntity<?> sendEmailFallback(@Valid @RequestBody MobileAuthEmailFallbackSendRequest req,
                                               HttpServletRequest httpRequest) {
        long startedAt = System.currentTimeMillis();
        String attemptId = req.getAttemptId() != null ? req.getAttemptId().trim() : null;
        try {
            if (attemptId == null || attemptId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "attemptId required"));
            }
            MobileLoginAttempt attempt = attemptRepository.findByAttemptId(attemptId).orElse(null);
            if (attempt == null) {
                return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
            }
            if (attempt.getExpiresAt() == null || LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
                return ResponseEntity.status(401).body(Map.of("error", "OTP_EXPIRED"));
            }
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(httpRequest);
            if (tenantCollegeId != null && !Objects.equals(attempt.getCollegeId(), tenantCollegeId)) {
                return ResponseEntity.status(403).body(Map.of("error", "WRONG_TENANT"));
            }
            if (attempt.isUsed()) {
                return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
            }
            // Login audit 2026-10-12: nothing limited this endpoint (the 30 s wait was only on the page), so one attempt id
            // could send the account's mailbox a code on every call. One email per attempt every EMAIL_RESEND_GAP_SECONDS.
            long wait = emailResendWaitSeconds(attempt.getEmailOtpSentAt(), LocalDateTime.now());
            if (wait > 0) {
                return ResponseEntity.status(429).body(Map.of(
                        "error", "TOO_SOON",
                        "message", "A code was just sent. Wait a few seconds before asking for another.",
                        "retryAfterSeconds", wait));
            }

            ResolvedLoginUser resolvedUser = resolveAttemptUser(attempt);
            if (resolvedUser == null || resolvedUser.principal == null) {
                return ResponseEntity.status(404).body(Map.of("error", "USER_NOT_FOUND"));
            }
            String email = extractLoginEmail(resolvedUser.user);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "EMAIL_NOT_FOUND",
                        "message", "No registered email is available for this account"
                ));
            }

            String emailOtp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
            LocalDateTime now = LocalDateTime.now();
            attempt.setEmailOtp(emailOtp);
            attempt.setEmailOtpSentAt(now);
            attempt.setEmailOtpExpiresAt(now.plusMinutes(5));
            attemptRepository.save(attempt);

            sendEmailOtp(resolvedUser.user, attempt, emailOtp);

            return ResponseEntity.ok(Map.of(
                    "mode", "EMAIL_OTP_SENT",
                    "attemptId", attempt.getAttemptId(),
                    "maskedEmail", maskEmail(email),
                    "expiresInSeconds", 300
            ));
        } finally {
            logSlowMobileAuth("email-fallback-send", startedAt, attemptId);
        }
    }

    @PostMapping("/email-fallback/verify")
    public ResponseEntity<?> verifyEmailFallback(@Valid @RequestBody MobileAuthVerifyRequest req,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse httpResponse) throws Exception {
        long startedAt = System.currentTimeMillis();
        String attemptId = req.getAttemptId() != null ? req.getAttemptId().trim() : null;
        String otp = req.getOtp() != null ? req.getOtp().trim() : null;
        try {
            if (attemptId == null || attemptId.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "attemptId required"));
            if (otp == null || otp.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "otp required"));

            MobileLoginAttempt attempt = attemptRepository.findByAttemptId(attemptId).orElse(null);
            if (attempt == null) {
                return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
            }
            if (attempt.getExpiresAt() == null || LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
                return ResponseEntity.status(401).body(Map.of("error", "OTP_EXPIRED"));
            }
            if (attempt.getEmailOtp() == null || attempt.getEmailOtp().isBlank()
                    || attempt.getEmailOtpExpiresAt() == null
                    || LocalDateTime.now().isAfter(attempt.getEmailOtpExpiresAt())) {
                return ResponseEntity.status(401).body(Map.of("error", "EMAIL_OTP_EXPIRED"));
            }
            Integer tenantCollegeId = inferTenantCollegeIdFromRequest(httpRequest);
            if (tenantCollegeId != null && !Objects.equals(attempt.getCollegeId(), tenantCollegeId)) {
                return ResponseEntity.status(403).body(Map.of("error", "WRONG_TENANT"));
            }
            if (attempt.isUsed()) {
                return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
            }
            if (attemptRepository.reserveVerificationAttempt(attemptId, LocalDateTime.now()) != 1) {
                return ResponseEntity.status(429).body(Map.of("error", "OTP_ATTEMPTS_EXCEEDED",
                        "message", "Too many verification attempts. Request a fresh code."));
            }
            if (!otp.equalsIgnoreCase(attempt.getEmailOtp())) {
                return ResponseEntity.status(401).body(Map.of("error", "INCORRECT_OTP"));
            }

            ResolvedLoginUser resolvedUser = resolveAttemptUser(attempt);
            if (resolvedUser == null || resolvedUser.principal == null) {
                return ResponseEntity.status(404).body(Map.of("error", "USER_NOT_FOUND"));
            }
            attempt.setEmailOtp(null);
            attempt.setEmailOtpExpiresAt(null);
            return completeAttemptVerification(attempt, resolvedUser, httpRequest, httpResponse);
        } finally {
            logSlowMobileAuth("email-fallback-verify", startedAt, attemptId);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody MobileAuthVerifyRequest req,
                                    HttpServletRequest httpRequest,
                                    HttpServletResponse httpResponse) throws Exception {
        long startedAt = System.currentTimeMillis();
        String attemptId = req.getAttemptId() != null ? req.getAttemptId().trim() : null;
        String otp = req.getOtp() != null ? req.getOtp().trim() : null;
        try {
            if (attemptId == null || attemptId.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "attemptId required"));
            if (otp == null || otp.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "otp required"));

        MobileLoginAttempt attempt = attemptRepository.findByAttemptId(attemptId).orElse(null);
        if (attempt == null) {
            return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
        }
        if (attempt.getExpiresAt() == null || LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
            return ResponseEntity.status(401).body(Map.of("error", "OTP_EXPIRED"));
        }
        boolean alreadyUsed = attempt.isUsed();
        if (alreadyUsed) {
            LocalDateTime verifiedAt = attempt.getVerifiedAt();
            if (verifiedAt == null || verifiedAt.isBefore(LocalDateTime.now().minusSeconds(VERIFY_REPLAY_WINDOW_SECONDS))) {
                return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
            }
        }
        Integer tenantCollegeId = inferTenantCollegeIdFromRequest(httpRequest);
        if (tenantCollegeId != null && !Objects.equals(attempt.getCollegeId(), tenantCollegeId)) {
            log.warn("Mobile auth verify blocked for tenant mismatch attemptId={} attemptCollegeId={} requestCollegeId={} host={}",
                    attemptId, attempt.getCollegeId(), tenantCollegeId,
                    com._42students.lms.util.RequestHostUtil.getEffectiveHostHeader(httpRequest));
            return ResponseEntity.status(403).body(Map.of("error", "WRONG_TENANT"));
        }
        if (attemptRepository.reserveVerificationAttempt(attemptId, LocalDateTime.now()) != 1) {
            return ResponseEntity.status(429).body(Map.of("error", "OTP_ATTEMPTS_EXCEEDED",
                    "message", "Too many verification attempts. Request a fresh code."));
        }
        String attemptPhone = attempt.getPhone() != null ? attempt.getPhone().trim() : "";
        boolean isTestOtp = (testOtpService != null && testOtpService.matchesTestOtp(attemptPhone, otp));
        if (!isTestOtp && !otp.equalsIgnoreCase(attempt.getOtp())) {
            return ResponseEntity.status(401).body(Map.of("error", "INCORRECT_OTP"));
        }
        if (alreadyUsed) {
            log.info("Mobile auth verify replay accepted within OTP lifetime attemptId={} userType={} userId={} collegeId={} host={}",
                    attemptId, attempt.getUserType(), attempt.getUserId(), attempt.getCollegeId(),
                    com._42students.lms.util.RequestHostUtil.getEffectiveHostHeader(httpRequest));
        }

            ResolvedLoginUser resolvedUser = resolveAttemptUser(attempt);
            if (resolvedUser == null || resolvedUser.principal == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            // A suspended account must not be able to mint a fresh token even if their OTP is
            // otherwise valid — this is the actual login-blocking half of admin suspend; the
            // suspend action itself also revokes any already-issued sessions/tokens separately.
            LocalDateTime suspendedAt = suspendedAtOf(resolvedUser.user);
            if (suspendedAt != null) {
                return ResponseEntity.status(403).body(Map.of("error", "ACCOUNT_SUSPENDED"));
            }

            return completeAttemptVerification(attempt, resolvedUser, httpRequest, httpResponse);
        } finally {
            logSlowMobileAuth("verify", startedAt, attemptId);
        }
    }

    private ResponseEntity<?> completeAttemptVerification(MobileLoginAttempt attempt,
                                                          ResolvedLoginUser resolvedUser,
                                                          HttpServletRequest httpRequest,
                                                          HttpServletResponse httpResponse) throws Exception {
        // Central account-state check: every OTP channel must pass this gate before minting tokens.
        // Do not rely on the SMS-only check; email fallback also reaches this method.
        if (resolvedUser == null || resolvedUser.user == null || resolvedUser.principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "INVALID_ATTEMPT"));
        }
        boolean deleted = resolvedUser.user instanceof Learner
                ? Boolean.TRUE.equals(((Learner) resolvedUser.user).getIsDeleted())
                : resolvedUser.user instanceof Faculty
                    ? Boolean.TRUE.equals(((Faculty) resolvedUser.user).getIsDeleted())
                    : !(resolvedUser.user instanceof com._42students.lms.model.Recruiter)
                        || Boolean.TRUE.equals(((com._42students.lms.model.Recruiter) resolvedUser.user).getIsDeleted());
        if (deleted) {
            return ResponseEntity.status(403).body(Map.of("error", "ACCOUNT_UNAVAILABLE"));
        }
        LocalDateTime suspendedAt = suspendedAtOf(resolvedUser.user);
        if (suspendedAt != null) {
            return ResponseEntity.status(403).body(Map.of("error", "ACCOUNT_SUSPENDED"));
        }
        boolean alreadyUsed = attempt.isUsed();
        boolean recruiterLogin = resolvedUser.user instanceof com._42students.lms.model.Recruiter;
        com._42students.lms.model.Recruiter recruiter = recruiterLogin ? (com._42students.lms.model.Recruiter) resolvedUser.user : null;
        TokenPair tokens = recruiterLogin
                ? recruiterAuthService.issueTokens(recruiter, resolvedUser.principal.getCollegeId())
                : jwtService.generateTokens(resolvedUser.principal);
        setAuthCookies(httpRequest, httpResponse, tokens);

        String handoffToken = null;
        if (authHandoffTokenRepository != null) {
            try {
                AuthHandoffToken ht = new AuthHandoffToken();
                ht.setToken(UUID.randomUUID().toString().replace("-", ""));
                ht.setAccessToken(tokens.getAccessToken());
                ht.setRefreshToken(tokens.getRefreshToken());
                ht.setExpiresAt(LocalDateTime.now().plusMinutes(2));
                ht.setUsed(false);
                ht.setIsDeleted(false);
                authHandoffTokenRepository.save(ht);
                handoffToken = ht.getToken();
            } catch (Exception ignored) {}
        }

        AuthResponse authResponse = recruiterLogin
                ? AuthResponse.of(recruiterAuthService.authUser(recruiter, resolvedUser.principal.getCollegeId()), tokens)
                : AuthResponse.of(resolvedUser.user, tokens);
        if (recruiterLogin && !alreadyUsed) {
            recruiterAuthService.recordLogin(recruiter);
        }
        String defaultHost = inferDefaultHost(attempt.getCollegeId());
        List<Map<String, Object>> memberships = recruiterLogin
                ? recruiterAuthService.membershipsFor(recruiter, resolvedUser.principal.getCollegeId(), defaultHost)
                : buildCurrentMembership(attempt, resolvedUser.user, defaultHost);
        Map<String, Object> out = new HashMap<>();
        out.put("auth", authResponse);
        out.put("memberships", memberships);
        out.put("defaultHost", defaultHost);
        out.put("handoffToken", handoffToken);
        out.put("domainEnforcementEnabled", domainEnforcementEnabled());
        out.put("requireVerifiedDomains", requireVerifiedDomains());
        out.put("strictDomainVerificationEnabled", strictDomainVerificationEnabled());
        out.put("trustForwardedHeaders", com._42students.lms.util.RequestHostUtil.trustForwardedHeaders());

        if (!alreadyUsed) {
            attempt.setUsed(true);
            attempt.setVerifiedAt(LocalDateTime.now());
        }
        attemptRepository.save(attempt);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), out), HttpStatus.OK);
    }

    private ResolvedLoginUser resolveAttemptUser(MobileLoginAttempt attempt) {
        if (attempt == null || attempt.getUserId() == null || attempt.getUserType() == null) return null;
        if ("LEARNER".equalsIgnoreCase(attempt.getUserType())) {
            Learner learner = learnerRepository.findById(attempt.getUserId()).orElse(null);
            if (learner == null) return null;
            return new ResolvedLoginUser(learner, UserPrincipal.fromLearner(learner));
        }
        if ("FACULTY".equalsIgnoreCase(attempt.getUserType())) {
            Faculty faculty = facultyRepository.findById(attempt.getUserId()).orElse(null);
            if (faculty == null) return null;
            return new ResolvedLoginUser(faculty, UserPrincipal.fromFaculty(faculty));
        }
        if (com._42students.lms.model.Recruiter.isUserType(attempt.getUserType())) {
            if (recruiterRepository == null || recruiterAccessService == null || recruiterAuthService == null) return null;
            com._42students.lms.model.Recruiter recruiter = recruiterRepository.findById(attempt.getUserId()).orElse(null);
            if (recruiter == null) return null;
            // A phone-first attempt: the phone that received the OTP must still own this recruiter identity.
            // An email-first attempt (no phone at all, see /recruiter/email-login/start) has no phone to
            // check here — its identity comes from the email lookup that created it, and the email
            // OTP the caller must already have entered correctly to reach this method at all.
            // Recruiters sign in by email only, and only into one college (recruiter phase 1, L9).
            if (!isEmailFirst(attempt)) return null;
            Integer collegeId = attempt.getCollegeId();
            if (collegeId == null) return null;
            // Signing in on the address of a college that invited them, with a proven email, is accepting that invitation.
            if (!recruiterAccessService.hasActiveGrant(recruiter.getId(), collegeId) && hasPendingInviteAt(recruiter, collegeId) && recruiterInviteService != null) {
                recruiterInviteService.acceptPending(recruiter.getId(), collegeId);
            }
            if (!recruiterAccessService.hasActiveGrant(recruiter.getId(), collegeId)) return null;
            return new ResolvedLoginUser(recruiter, recruiterAuthService.principalFor(recruiter, collegeId));
        }
        // Unknown account type: never fall back to a faculty lookup (ids overlap across tables).
        return null;
    }

    private static LocalDateTime suspendedAtOf(Object user) {
        if (user instanceof Learner) return ((Learner) user).getSuspendedAt();
        if (user instanceof Faculty) return ((Faculty) user).getSuspendedAt();
        if (user instanceof com._42students.lms.model.Recruiter) return ((com._42students.lms.model.Recruiter) user).getSuspendedAt();
        return null;
    }

    private String extractLoginEmail(Object user) {
        String email = null;
        if (user instanceof Learner learner) {
            email = learner.getContactMail();
        } else if (user instanceof Faculty faculty) {
            email = faculty.getContactMail();
        } else if (user instanceof com._42students.lms.model.Recruiter recruiter) {
            email = recruiter.getContactMail();
        }
        if (email == null) return null;
        String normalized = email.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String extractDisplayName(Object user) {
        String firstName = null;
        String lastName = null;
        if (user instanceof Learner learner) {
            firstName = learner.getFirstName();
            lastName = learner.getLastName();
        } else if (user instanceof Faculty faculty) {
            firstName = faculty.getFirstName();
            lastName = faculty.getLastName();
        } else if (user instanceof com._42students.lms.model.Recruiter recruiter) {
            firstName = recruiter.getFirstName();
            lastName = recruiter.getLastName();
        }
        String full = String.join(" ",
                firstName != null ? firstName.trim() : "",
                lastName != null ? lastName.trim() : "").trim();
        return full.isEmpty() ? "Learner" : full;
    }

    private void sendEmailOtp(Object user, MobileLoginAttempt attempt, String emailOtp) {
        if (zeptoMailService == null || attempt == null || user == null) {
            throw new RuntimeException("Email delivery service unavailable");
        }
        String email = extractLoginEmail(user);
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Registered email not found");
        }
        // A listed test email (dev only, never production): its code is the test code and nothing is sent, so QA can sign in as a
        // recruiter, who signs in by email only.
        if (testOtpService != null && testOtpService.isTestEmail(email)) {
            attempt.setEmailOtp(testOtpService.getOtpForTestPhone());
            attemptRepository.save(attempt);
            log.info("Test email sign-in for a listed QA address; no email sent");
            return;
        }
        String displayName = extractDisplayName(user);
        String templateId = emailVerificationTemplateId != null ? emailVerificationTemplateId.trim() : "";
        if (templateId.isBlank() || "TEMP_ID_PLACEHOLDER".equalsIgnoreCase(templateId)) {
            throw new RuntimeException("Email verification template is not configured");
        }
        Map<String, String> mergeInfo = new HashMap<>();
        mergeInfo.put("otp", emailOtp);
        mergeInfo.put("learnerName", displayName);
        mergeInfo.put("email", email);
        mergeInfo.put("mobile", attempt.getPhone() == null ? "" : attempt.getPhone()); // null on an email-first attempt (no phone step at all)
        mergeInfo.put("expiryMinutes", "5");
        try {
            zeptoMailService.sendEmailWithTemplateId(templateId, email, mergeInfo);
            log.info("Mobile login email OTP sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send mobile login email OTP to {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send email OTP", e);
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) return "";
        String trimmed = email.trim();
        int at = trimmed.indexOf('@');
        if (at <= 1) return trimmed;
        String local = trimmed.substring(0, at);
        String domain = trimmed.substring(at);
        if (local.length() <= 2) {
            return local.charAt(0) + "*" + domain;
        }
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
    }

    /**
     * Every account this phone can sign in to. A recruiter identity comes first so it is the default:
     * on the global host as "recruiter · Global", on a college domain only when the recruiter holds an active
     * grant for that college. Callers still filter by tenant, which also drops the Global choice
     * on a college domain (its collegeId is null).
     */
    private List<AccountChoice> findChoices(String phone, Integer tenantCollegeId, String requestHost) {
        List<AccountChoice> out = new ArrayList<>();
        // Recruiters never sign in by phone (recruiter phase 1, L9): no recruiter choice on the phone path.
        // Learners
        for (Learner l : learnerRepository.findAllByContactMobileAndNotDeleted(phone)) {
            Integer collegeId = l.getCollegeId();
            College college = (collegeId != null) ? collegeRepository.findById(collegeId).orElse(null) : null;
            AccountChoice c = AccountChoice.fromLearner(l, college, out.size() + 1);
            populateDomainFields(c);
            out.add(c);
        }
        // Faculty
        for (Faculty f : facultyRepository.findAllByContactMobileAndNotDeleted(phone)) {
            Integer collegeId = f.getCollegeId();
            College college = (collegeId != null) ? collegeRepository.findById(collegeId).orElse(null) : null;
            AccountChoice c = AccountChoice.fromFaculty(f, college, out.size() + 1);
            populateDomainFields(c);
            out.add(c);
        }
        // Stable choice ids (1..n) for this lookup call
        for (int i = 0; i < out.size(); i++) out.get(i).choiceId = i + 1;
        return out;
    }

    private void populateDomainFields(AccountChoice c) {
        if (c == null || c.collegeId == null || tenantDomainRepository == null) return;
        try {
            List<com._42students.lms.model.TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(c.collegeId);
            if (domains == null || domains.isEmpty()) return;
            com._42students.lms.model.TenantDomain chosen = domains.stream()
                    .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && Boolean.TRUE.equals(d.getIsPrimary()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                    .findFirst()
                    .orElse(domains.stream()
                            .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                            .findFirst()
                            .orElse(domains.stream()
                                    .filter(d -> d != null && Boolean.TRUE.equals(d.getIsPrimary()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                                    .findFirst()
                                    .orElse(domains.stream()
                                            .filter(d -> d != null && d.getHost() != null && !d.getHost().trim().isEmpty())
                                            .findFirst()
                                            .orElse(null))));
            if (chosen == null) return;
            c.host = chosen.getHost() != null ? chosen.getHost().trim() : null;
            c.hostVerified = Boolean.TRUE.equals(chosen.getIsVerified());
            c.hostPrimary = Boolean.TRUE.equals(chosen.getIsPrimary());
        } catch (Exception ignored) {}
    }

    private Integer inferTenantCollegeIdFromRequest(HttpServletRequest request) {
        if (request == null || tenantResolutionService == null) return null;
        try {
            String host = com._42students.lms.util.RequestHostUtil.getEffectiveHostHeader(request);
            Optional<College> college = tenantResolutionService.resolveCollegeFromHost(host);
            if (college.isEmpty()) {
                String normalizedHost = com._42students.lms.util.RequestHostUtil.normalizeHostOnly(host);
                String globalHost = appSettingsService != null ? appSettingsService.getGlobalHost() : null;
                String baseDomain = appSettingsService != null ? appSettingsService.getBaseDomain() : null;
                String normalizedGlobalHost = com._42students.lms.util.RequestHostUtil.normalizeHostOnly(globalHost);
                if (normalizedGlobalHost == null || normalizedGlobalHost.trim().isEmpty()) {
                    normalizedGlobalHost = com._42students.lms.util.RequestHostUtil.normalizeHostOnly(baseDomain);
                }
                boolean isGlobalHost = normalizedHost != null && normalizedGlobalHost != null
                        && normalizedHost.equalsIgnoreCase(normalizedGlobalHost);
                boolean isDevHost = com._42students.lms.util.RequestHostUtil.isDevLocalHost(normalizedHost);
                if (!isGlobalHost && !isDevHost) {
                    log.warn("Mobile auth could not resolve tenant from host={} normalizedHost={} trustForwardedHeaders={}",
                            host, normalizedHost, com._42students.lms.util.RequestHostUtil.trustForwardedHeaders());
                }
            }
            return college.map(College::getId).orElse(null);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String inferUiHost(javax.servlet.http.HttpServletRequest req) {
        if (req == null) return null;
        try {
            String origin = req.getHeader("Origin");
            if (origin != null && !origin.trim().isEmpty()) {
                java.net.URI u = java.net.URI.create(origin.trim());
                return u.getAuthority();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void logSlowMobileAuth(String stage, long startedAt, String reference) {
        long elapsedMs = System.currentTimeMillis() - startedAt;
        if (elapsedMs >= 3000L) {
            log.warn("Slow mobile auth {} completed in {}ms ref={}", stage, elapsedMs, reference);
        } else {
            log.debug("Mobile auth {} completed in {}ms ref={}", stage, elapsedMs, reference);
        }
    }

    private boolean domainEnforcementEnabled() {
        String sys = System.getProperty("lms.domain.enforcement.enabled");
        if (sys != null && !sys.trim().isEmpty()) return !"false".equalsIgnoreCase(sys.trim());
        String env = System.getenv("LMS_DOMAIN_ENFORCEMENT_ENABLED");
        if (env != null && !env.trim().isEmpty()) return !"false".equalsIgnoreCase(env.trim());
        return true;
    }

    private boolean requireVerifiedDomains() {
        String sys = System.getProperty("lms.domain.require.verified");
        if (sys != null && !sys.trim().isEmpty()) return "true".equalsIgnoreCase(sys.trim());
        String env = System.getenv("LMS_REQUIRE_VERIFIED_DOMAINS");
        if (env != null && !env.trim().isEmpty()) return "true".equalsIgnoreCase(env.trim());
        return true;
    }

    private boolean strictDomainVerificationEnabled() {
        String env = System.getenv("LMS_STRICT_DOMAIN_VERIFICATION");
        return env != null && "true".equalsIgnoreCase(env.trim());
    }

    private AccountChoice recruiterChoice(String phone, Integer tenantCollegeId, String requestHost) {
        // Recruiters never sign in by phone (recruiter phase 1, L9).
        return null;
    }

    private AccountChoice recruiterChoiceFor(com._42students.lms.model.Recruiter recruiter, Integer tenantCollegeId, String requestHost) {
        if (recruiter == null || recruiterAccessService == null) return null;
        // Only on a college's own address (recruiter phase 1): the main site has no recruiter sign-in.
        if (tenantCollegeId == null) return null;
        AccountChoice ac = new AccountChoice();
        ac.userType = com._42students.lms.model.Recruiter.USER_TYPE;
        ac.userId = recruiter.getId();
        ac.roleLabel = "Recruiter";
        // On the global host a recruiter who belongs to exactly one college goes straight into it
        // (no chooser to click through); otherwise they get the college-less chooser session.
        if (tenantCollegeId == null && recruiterAuthService != null) {
            Integer sole = recruiterAuthService.soleCollegeOf(recruiter);
            if (sole != null) return recruiterChoiceFor(recruiter, sole, requestHost);
        }
        if (tenantCollegeId == null) {
            int colleges = recruiterAccessService.activeGrants(recruiter.getId()).size();
            ac.collegeId = null;
            ac.organizationId = null;
            // "<title> • <role>" is the shape the login account picker parses.
            ac.label = "Choose a college" + (colleges > 0 ? " (" + colleges + ")" : "") + " • Recruiter";
            ac.key = com._42students.lms.service.recruiter.RecruiterAuthService.membershipKey(recruiter.getId(), null);
            // Only offered on a non-college host (the tenant filter drops it elsewhere), so the Global
            // session stays on this host. The picker disables host-less choices.
            String globalHost = appSettingsService != null ? appSettingsService.getGlobalHost() : null;
            String host = com._42students.lms.util.RequestHostUtil.normalizeHostOnly(globalHost);
            ac.host = requestHost != null && !requestHost.isBlank() ? requestHost : host;
            ac.hostVerified = ac.host != null;
            ac.hostPrimary = ac.host != null;
            return ac;
        }
        if (!recruiterAccessService.hasActiveGrant(recruiter.getId(), tenantCollegeId)) return null;
        College college = collegeRepository.findById(tenantCollegeId).orElse(null);
        ac.collegeId = tenantCollegeId;
        ac.organizationId = college != null ? college.getOrgId() : null;
        ac.label = (college != null ? college.getName() : "College") + " • Recruiter";
        ac.key = com._42students.lms.service.recruiter.RecruiterAuthService.membershipKey(recruiter.getId(), tenantCollegeId);
        populateDomainFields(ac);
        if (ac.host == null) {
            ac.host = requestHost;
            ac.hostVerified = requestHost != null;
        }
        return ac;
    }

    private MobileLoginAttempt createAttempt(String phone, AccountChoice choice) {
        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId(UUID.randomUUID().toString());
        attempt.setPhone(phone);
        attempt.setOtp(String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000)));
        attempt.setUserType(choice.userType);
        attempt.setUserId(choice.userId);
        attempt.setCollegeId(choice.collegeId);
        attempt.setOrganizationId(choice.organizationId);
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setUsed(false);
        return attemptRepository.save(attempt);
    }

    /**
     * Numbers listed in the test-login configuration (APP_TEST_OTP_PHONES) are verified against the
     * configured test OTP instead of a texted one, so no real SMS is sent to them. They are
     * placeholders for QA accounts, not handsets: a send to one would fail at the provider and turn
     * every attempt into a 503, and would spend SMS credit on numbers nobody can read.
     * The list is deployment configuration, never source, so it can differ per environment and the
     * numbers are not exposed through the repository.
     */
    private void sendOtpUnlessTestNumber(String phone, String otp) {
        if (testOtpService != null && testOtpService.isTestPhone(phone)) {
            log.info("OTP SMS skipped: number is on the configured test-login list");
            return;
        }
        sendOtp(phone, otp);
    }

    private void sendOtp(String phone, String otp) {
        // Provider acceptance is distinct from delivery to a handset.
        boolean accepted = smsService.sendOtp(phone, otp, com._42students.lms.service.NotificationTemplateContext.LMS);
        if (!accepted) throw new IllegalStateException("SMS provider did not accept the OTP");
    }

    private ResponseEntity<?> enforceAttemptRateLimit(String phone) {
        if (attemptRepository == null || phone == null) return null;
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            long active = attemptRepository.countActiveAttemptsSince(phone, since);
            if (active >= 5) {
                return ResponseEntity.status(429).body(Map.of(
                        "error", "TOO_MANY_REQUESTS",
                        "message", "Too many OTP requests. Please try again later.",
                        "retryAfterSeconds", 600
                ));
            }
        } catch (Exception ignored) {}
        return null;
    }

    private List<Map<String, Object>> buildCurrentMembership(MobileLoginAttempt attempt, Object user, String defaultHost) {
        if (attempt == null) return Collections.emptyList();
        Map<String, Object> membership = new HashMap<>();
        Integer collegeId = attempt.getCollegeId();
        College college = collegeId != null ? collegeRepository.findById(collegeId).orElse(null) : null;
        Object facultyType = user instanceof Faculty ? ((Faculty) user).getFacultyType() : null;
        String userType = attempt.getUserType() != null ? attempt.getUserType().trim().toUpperCase(Locale.ROOT) : null;
        String key = null;
        if (attempt.getUserId() != null && collegeId != null && userType != null && !userType.isEmpty()) {
            key = "acc:" + userType + ":" + attempt.getUserId() + ":college:" + collegeId;
            if ("FACULTY".equalsIgnoreCase(userType) && facultyType != null && !String.valueOf(facultyType).trim().isEmpty()) {
                key = key + ":facultyType:" + String.valueOf(facultyType).trim();
            }
        }
        membership.put("key", key);
        membership.put("collegeId", collegeId);
        membership.put("collegeName", college != null ? college.getName() : null);
        membership.put("collegeCode", college != null ? college.getUniqueId() : null);
        membership.put("organizationId", attempt.getOrganizationId());
        membership.put("userType", userType);
        membership.put("facultyType", facultyType != null ? String.valueOf(facultyType) : null);
        membership.put("role", "LEARNER".equalsIgnoreCase(userType) ? "Learner" : "Instructor");
        membership.put("userId", attempt.getUserId());
        membership.put("host", defaultHost);
        membership.put("hostVerified", defaultHost != null && !defaultHost.trim().isEmpty());
        membership.put("hostPrimary", defaultHost != null && !defaultHost.trim().isEmpty());
        membership.put("switchable", defaultHost != null && !defaultHost.trim().isEmpty());
        membership.put("label", college != null ? (college.getName() + " • " + membership.get("role")) : membership.get("role"));
        return Collections.singletonList(membership);
    }

    private String inferDefaultHost(Integer collegeId) {
        if (collegeId == null || tenantDomainRepository == null) return null;
        try {
            List<com._42students.lms.model.TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(collegeId);
            if (domains == null || domains.isEmpty()) return null;
            return domains.stream()
                    .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && Boolean.TRUE.equals(d.getIsPrimary()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                    .findFirst()
                    .orElse(domains.stream()
                            .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                            .findFirst()
                            .orElse(domains.stream()
                                    .filter(d -> d != null && Boolean.TRUE.equals(d.getIsPrimary()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                                    .findFirst()
                                    .orElse(domains.stream()
                                            .filter(d -> d != null && d.getHost() != null && !d.getHost().trim().isEmpty())
                                            .findFirst()
                                            .orElse(null))))
                    .getHost()
                    .trim();
        } catch (Exception e) {
            log.warn("Could not infer default host for mobile auth collegeId={}", collegeId, e);
            return null;
        }
    }

    private void setAuthCookies(HttpServletRequest request,
                                HttpServletResponse response,
                                TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(request, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        CookieUtil.setCookie(response, "lms_authenticated",
                tokens.getAccessToken(),
                (int) tokens.getExpiresIn(),
                cd,
                secure,
                true,
                sameSite);
        CookieUtil.setCookie(response, "lms_refresh_token",
                tokens.getRefreshToken(),
                (int) jwtService.getRefreshExpirationSeconds(),
                cd,
                secure,
                true,
                sameSite);
    }

    private String normalizePhone(String phone) {
        return OnboardingMobileNumber.normalize(phone);
    }





    static class AccountChoice { // package-private for PublicMobileAuthChoiceTest
        int choiceId;
        String key;
        String userType;
        Integer userId;
        Integer collegeId;
        Integer organizationId;
        String label;
        String roleLabel;
        String host;
        Boolean hostVerified;
        Boolean hostPrimary;
        /** Suspended by an administrator: listed (so the person understands), but no code is sent for it. */
        boolean suspended;

        static AccountChoice fromLearner(Learner l, College c, int idx) {
            AccountChoice ac = new AccountChoice();
            ac.userType = "LEARNER";
            ac.userId = l.getId();
            ac.suspended = l.getSuspendedAt() != null;
            ac.collegeId = l.getCollegeId();
            ac.organizationId = l.getOrganizationId() != null ? l.getOrganizationId() : (c != null ? c.getOrgId() : null);
            ac.roleLabel = "Learner";
            ac.label = c != null ? (c.getName() + " • Learner") : ("Learner #" + idx);
            if (ac.userId != null && ac.collegeId != null) {
                ac.key = "acc:LEARNER:" + ac.userId + ":college:" + ac.collegeId;
            }
            return ac;
        }

        static AccountChoice fromFaculty(Faculty f, College c, int idx) {
            AccountChoice ac = new AccountChoice();
            ac.userType = "FACULTY";
            ac.userId = f.getId();
            ac.suspended = f.getSuspendedAt() != null;
            ac.collegeId = f.getCollegeId();
            ac.organizationId = f.getOrganizationId() != null ? f.getOrganizationId() : (c != null ? c.getOrgId() : null);
            ac.roleLabel = "Instructor";
            ac.label = c != null ? (c.getName() + " • Instructor") : ("Instructor #" + idx);
            if (ac.userId != null && ac.collegeId != null) {
                String base = "acc:FACULTY:" + ac.userId + ":college:" + ac.collegeId;
                Object ft = f != null ? f.getFacultyType() : null;
                if (ft != null && !String.valueOf(ft).trim().isEmpty()) {
                    base = base + ":facultyType:" + String.valueOf(ft).trim();
                }
                ac.key = base;
            }
            return ac;
        }

        Map<String, Object> toPublic() {
            Map<String, Object> m = new HashMap<>();
            m.put("choiceId", choiceId);
            m.put("key", key);
            m.put("userType", userType);
            m.put("label", label);
            m.put("role", roleLabel);
            m.put("collegeId", collegeId);
            m.put("organizationId", organizationId);
            m.put("host", host);
            m.put("hostVerified", hostVerified);
            m.put("hostPrimary", hostPrimary);
            if (suspended) m.put("suspended", true);
            return m;
        }
    }

    private static class ResolvedLoginUser {
        private final Object user;
        private final UserPrincipal principal;

        private ResolvedLoginUser(Object user, UserPrincipal principal) {
            this.user = user;
            this.principal = principal;
        }
    }
}

