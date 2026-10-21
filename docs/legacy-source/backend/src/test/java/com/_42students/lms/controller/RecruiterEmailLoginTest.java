package com._42students.lms.controller;

import com._42students.lms.dto.request.RecruiterEmailLoginStartRequest;
import com._42students.lms.dto.request.MobileAuthVerifyRequest;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.MobileLoginAttempt;
import com._42students.lms.repository.*;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.OrgMembershipService;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * recruiter V1 §10/§2: "Recruiter? Sign in with email." Covers the new email-first login path end to end —
 * starting an attempt from an email address alone (no phone step), and completing it through the
 * existing {@code /email-fallback/verify} — plus that it never weakens the phone-ownership check a
 * phone-first recruiter attempt still relies on.
 */
class RecruiterEmailLoginTest {

    private RecruiterRepository recruiters;
    private RecruiterAccessService recruiterAccessService;
    private RecruiterAuthService recruiterAuthService;
    private MobileLoginAttemptRepository attemptRepo;
    private PublicMobileAuthController controller;
    private com._42students.lms.service.TenantResolutionService tenants;

    /** Recruiters sign in only on a college's own address (L9): every start here is on KL University's. */
    private static HttpServletRequest onKlu() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("Host")).thenReturn("klu.42lms.com");
        return req;
    }

    private void wire() throws Exception {
        LearnerRepository learnerRepo = mock(LearnerRepository.class);
        FacultyRepository facultyRepo = mock(FacultyRepository.class);
        CollegeRepository collegeRepo = mock(CollegeRepository.class);
        attemptRepo = mock(MobileLoginAttemptRepository.class);
        when(attemptRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        SmsService sms = mock(SmsService.class);
        JwtService jwt = mock(JwtService.class);
        OrgMembershipService orgMembershipService = mock(OrgMembershipService.class);
        TestOtpService testOtp = mock(TestOtpService.class);
        ZeptoMailService zepto = mock(ZeptoMailService.class);
        TenantDomainRepository tenantDomainRepo = mock(TenantDomainRepository.class);

        tenants = mock(com._42students.lms.service.TenantResolutionService.class);
        com._42students.lms.model.College klu = new com._42students.lms.model.College();
        klu.setId(9);
        when(tenants.resolveCollegeFromHost("klu.42lms.com")).thenReturn(Optional.of(klu));
        controller = new PublicMobileAuthController(learnerRepo, facultyRepo, collegeRepo, attemptRepo, sms, jwt,
                orgMembershipService, testOtp, zepto, tenantDomainRepo, tenants, null, null,
                new org.springframework.core.env.StandardEnvironment());

        recruiters = mock(RecruiterRepository.class);
        recruiterAccessService = mock(RecruiterAccessService.class);
        recruiterAuthService = mock(RecruiterAuthService.class);
        setField("recruiterRepository", recruiters);
        setField("recruiterAccessService", recruiterAccessService);
        setField("recruiterAuthService", recruiterAuthService);
        setField("zeptoMailService", zepto);
        setField("emailVerificationTemplateId", "2518b.real.template.id"); // a real-looking id, not TEMP_ID_PLACEHOLDER
    }

    private void setField(String name, Object value) throws Exception {
        Field f = PublicMobileAuthController.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(controller, value);
    }

    private Recruiter recruiter(int id, String email) {
        Recruiter recruiter = new Recruiter();
        recruiter.setId(id);
        recruiter.setFirstName("Ravi");
        recruiter.setContactMail(email);
        recruiter.setIsDeleted(false);
        return recruiter;
    }

    @Test
    void unknownEmailIsRefusedWithoutRevealingWhetherAnAccountExists() throws Exception {
        wire();
        when(recruiters.findActiveByContactMail("nobody@acme.com")).thenReturn(Optional.empty());

        RecruiterEmailLoginStartRequest req = new RecruiterEmailLoginStartRequest();
        req.setEmail("nobody@acme.com");
        ResponseEntity<?> res = controller.startRecruiterEmailLogin(req, onKlu());

        // The same answer a real recruiter gets, so nobody can test which emails recruit here; nothing is stored or sent.
        assertEquals(200, res.getStatusCodeValue());
        assertEquals("EMAIL_OTP_SENT", ((Map<?, ?>) res.getBody()).get("mode"));
        verify(attemptRepo, never()).save(any());
    }

    @Test
    void aKnownEmailStartsAPhonelessAttemptAndSendsTheCode() throws Exception {
        wire();
        Recruiter recruiter = recruiter(501, "ravi@infosys.com");
        when(recruiters.findActiveByContactMail("ravi@infosys.com")).thenReturn(Optional.of(recruiter));
        when(recruiterAccessService.hasActiveGrant(501, 9)).thenReturn(true);

        RecruiterEmailLoginStartRequest req = new RecruiterEmailLoginStartRequest();
        req.setEmail(" Ravi@Infosys.com "); // exercises trim + lower-case before lookup
        ResponseEntity<?> res = controller.startRecruiterEmailLogin(req, onKlu());

        assertEquals(200, res.getStatusCodeValue());
        Map<?, ?> body = (Map<?, ?>) res.getBody();
        assertEquals("EMAIL_OTP_SENT", body.get("mode"));
        assertNotNull(body.get("attemptId"));

        org.mockito.ArgumentCaptor<MobileLoginAttempt> captor = org.mockito.ArgumentCaptor.forClass(MobileLoginAttempt.class);
        verify(attemptRepo, atLeastOnce()).save(captor.capture());
        MobileLoginAttempt saved = captor.getValue();
        // mobile_login_attempt.phone is NOT NULL: an email-first attempt stores an empty phone, never null (null failed the
        // insert and every email sign-in answered 409; this test used to assert null because it never touched a database).
        assertEquals("", saved.getPhone(), "an email-first attempt carries an empty phone, never null");
        assertEquals("RECRUITER", saved.getUserType());
        assertEquals(501, saved.getUserId());
        assertNotNull(saved.getEmailOtp());
        assertEquals(9, saved.getCollegeId(), "the session is for this college's address");
    }

    @Test
    void aSuspendedRecruiterCannotStartAnEmailLogin() throws Exception {
        wire();
        Recruiter recruiter = recruiter(501, "ravi@infosys.com");
        recruiter.setSuspendedAt(LocalDateTime.now());
        when(recruiters.findActiveByContactMail("ravi@infosys.com")).thenReturn(Optional.of(recruiter));
        when(recruiterAccessService.hasActiveGrant(501, 9)).thenReturn(true);

        RecruiterEmailLoginStartRequest req = new RecruiterEmailLoginStartRequest();
        req.setEmail("ravi@infosys.com");
        ResponseEntity<?> res = controller.startRecruiterEmailLogin(req, onKlu());

        // Suspended looks like any other email: no attempt, no code.
        assertEquals(200, res.getStatusCodeValue());
        verify(attemptRepo, never()).save(any());
    }

    @Test
    void verifyingThePhonelessAttemptIssuesTokensWithoutAPhoneOwnershipCheck() throws Exception {
        wire();
        Recruiter recruiter = recruiter(501, "ravi@infosys.com");
        when(recruiters.findById(501)).thenReturn(Optional.of(recruiter));
        UserPrincipal principal = new UserPrincipal(501, "RECRUITER", null, 1, 9, 0);
        when(recruiterAuthService.principalFor(recruiter, 9)).thenReturn(principal);
        when(recruiterAccessService.hasActiveGrant(501, 9)).thenReturn(true);
        when(recruiterAuthService.issueTokens(eq(recruiter), any())).thenReturn(new TokenPair("access", "refresh", "jti", 3600L));

        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId("email-first-1");
        attempt.setPhone(""); // email-first, as it is stored now (old rows may hold null: see the next test)
        attempt.setCollegeId(9);
        attempt.setUserType("RECRUITER");
        attempt.setUserId(501);
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setEmailOtp("123456");
        attempt.setEmailOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        when(attemptRepo.findByAttemptId("email-first-1")).thenReturn(Optional.of(attempt));
        when(attemptRepo.reserveVerificationAttempt(eq("email-first-1"), any())).thenReturn(1);

        MobileAuthVerifyRequest req = new MobileAuthVerifyRequest();
        req.setAttemptId("email-first-1");
        req.setOtp("123456");
        HttpServletRequest http = mock(HttpServletRequest.class);
        HttpServletResponse http2 = mock(HttpServletResponse.class);
        ResponseEntity<?> res = controller.verifyEmailFallback(req, http, http2);

        assertEquals(200, res.getStatusCodeValue());
        verify(recruiterAuthService).issueTokens(recruiter, 9);
    }

    @Test
    void anOlderEmailFirstAttemptWithANullPhoneStillVerifies() throws Exception {
        wire();
        Recruiter recruiter = recruiter(501, "ravi@infosys.com");
        when(recruiters.findById(501)).thenReturn(Optional.of(recruiter));
        UserPrincipal principal = new UserPrincipal(501, "RECRUITER", null, 1, 9, 0);
        when(recruiterAuthService.principalFor(recruiter, 9)).thenReturn(principal);
        when(recruiterAccessService.hasActiveGrant(501, 9)).thenReturn(true);
        when(recruiterAuthService.issueTokens(eq(recruiter), any())).thenReturn(new TokenPair("access", "refresh", "jti", 3600L));

        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId("email-first-1");
        attempt.setPhone(null); // a row saved before the empty-phone fix
        attempt.setCollegeId(9);
        attempt.setUserType("RECRUITER");
        attempt.setUserId(501);
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setEmailOtp("123456");
        attempt.setEmailOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        when(attemptRepo.findByAttemptId("email-first-1")).thenReturn(Optional.of(attempt));
        when(attemptRepo.reserveVerificationAttempt(eq("email-first-1"), any())).thenReturn(1);

        MobileAuthVerifyRequest req = new MobileAuthVerifyRequest();
        req.setAttemptId("email-first-1");
        req.setOtp("123456");
        HttpServletRequest http = mock(HttpServletRequest.class);
        HttpServletResponse http2 = mock(HttpServletResponse.class);
        ResponseEntity<?> res = controller.verifyEmailFallback(req, http, http2);

        assertEquals(200, res.getStatusCodeValue());
        verify(recruiterAuthService).issueTokens(recruiter, 9);
    }

    @Test
    void aPhoneFirstAttemptStillNeedsItsPhoneToMatchTheAccountsPhone() throws Exception {
        wire();
        Recruiter recruiter = recruiter(501, "ravi@infosys.com");
        recruiter.setContactMobile("9876543210");
        when(recruiters.findById(501)).thenReturn(Optional.of(recruiter));

        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId("phone-first-1");
        attempt.setPhone("1111111111"); // does NOT match the account's real phone
        attempt.setUserType("RECRUITER");
        attempt.setUserId(501);
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        attempt.setEmailOtp("654321");
        attempt.setEmailOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        when(attemptRepo.findByAttemptId("phone-first-1")).thenReturn(Optional.of(attempt));
        when(attemptRepo.reserveVerificationAttempt(eq("phone-first-1"), any())).thenReturn(1);

        MobileAuthVerifyRequest req = new MobileAuthVerifyRequest();
        req.setAttemptId("phone-first-1");
        req.setOtp("654321");
        ResponseEntity<?> res = controller.verifyEmailFallback(req, mock(HttpServletRequest.class), mock(HttpServletResponse.class));

        assertEquals(404, res.getStatusCodeValue(), "a spoofed phone must still be refused");
        verify(recruiterAuthService, never()).issueTokens(any(), any());
    }
}
