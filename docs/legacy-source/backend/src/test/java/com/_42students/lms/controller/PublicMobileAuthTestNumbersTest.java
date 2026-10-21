package com._42students.lms.controller;

import com._42students.lms.dto.request.MobileAuthStartRequest;
import com._42students.lms.dto.request.MobileAuthVerifyRequest;
import com._42students.lms.model.College;
import com._42students.lms.model.Learner;
import com._42students.lms.model.MobileLoginAttempt;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.MobileLoginAttemptRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.TestOtpService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.env.MockEnvironment;

import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * QA login numbers: listed numbers are verified against the configured test OTP and are never
 * texted; every other number keeps the real SMS flow.
 *
 * The numbers below are synthetic on purpose. The real list is deployment configuration, and this
 * repository must not contain it.
 */
class PublicMobileAuthTestNumbersTest {
    private static final String LISTED = "9000000101";
    private static final String OTHER = "9000000202";
    private static final String TEST_OTP = "5555";

    private static TestOtpService testOtpConfigured() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("APP_TEST_OTP_ENABLED", "true")
                .withProperty("APP_TEST_OTP", TEST_OTP)
                .withProperty("APP_TEST_OTP_PHONES", LISTED + " , 9000000103");
        return new TestOtpService(env);
    }

    private static Learner learner(String phone) {
        Learner l = new Learner();
        l.setId(7);
        l.setContactMobile(phone);
        l.setCollegeId(1);
        return l;
    }

    private static PublicMobileAuthController controller(LearnerRepository learners,
                                                         MobileLoginAttemptRepository attempts,
                                                         SmsService sms,
                                                         TestOtpService testOtp) {
        CollegeRepository colleges = mock(CollegeRepository.class);
        when(colleges.findById(1)).thenReturn(Optional.of(new College()));
        return new PublicMobileAuthController(
                learners, mock(FacultyRepository.class), colleges, attempts, sms, mock(JwtService.class),
                null, testOtp, null, null, null, null, null, null);
    }

    private static MobileLoginAttemptRepository attemptsThatSave() {
        MobileLoginAttemptRepository attempts = mock(MobileLoginAttemptRepository.class);
        when(attempts.countActiveAttemptsSince(anyString(), any(LocalDateTime.class))).thenReturn(0L);
        when(attempts.save(any(MobileLoginAttempt.class))).thenAnswer(inv -> inv.getArgument(0));
        return attempts;
    }

    private ResponseEntity<?> startFor(String phone, SmsService sms) {
        LearnerRepository learners = mock(LearnerRepository.class);
        when(learners.findAllByContactMobileAndNotDeleted(phone)).thenReturn(List.of(learner(phone)));
        MobileAuthStartRequest req = new MobileAuthStartRequest();
        req.setPhone(phone);
        return controller(learners, attemptsThatSave(), sms, testOtpConfigured()).start(req, null);
    }

    @Test
    void aListedNumberStartsLoginWithoutSendingAnySms() {
        SmsService sms = mock(SmsService.class);
        ResponseEntity<?> result = startFor(LISTED, sms);
        assertEquals(200, result.getStatusCodeValue());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) result.getBody();
        assertEquals("OTP_SENT", body.get("mode"));
        verifyNoInteractions(sms);
    }

    @Test
    void anUnlistedNumberStillGetsTheRealSms() {
        SmsService sms = mock(SmsService.class);
        when(sms.sendOtp(eq(OTHER), anyString(), any())).thenReturn(true);
        ResponseEntity<?> result = startFor(OTHER, sms);
        assertEquals(200, result.getStatusCodeValue());
        verify(sms).sendOtp(eq(OTHER), anyString(), any());
    }

    @Test
    void anUnlistedNumberWhoseSmsFailsStillReturns503() {
        SmsService sms = mock(SmsService.class);
        when(sms.sendOtp(eq(OTHER), anyString(), any())).thenReturn(false);
        assertEquals(503, startFor(OTHER, sms).getStatusCodeValue());
    }

    /** verify() only reaches the account-state gate once the OTP itself has been accepted. */
    private int verifyStatus(String phone, String otp) throws Exception {
        LearnerRepository learners = mock(LearnerRepository.class);
        Learner suspended = learner(phone);
        suspended.setSuspendedAt(LocalDateTime.now().minusMinutes(1));
        when(learners.findById(7)).thenReturn(Optional.of(suspended));
        MobileLoginAttempt attempt = new MobileLoginAttempt();
        attempt.setAttemptId("attempt-1");
        attempt.setUserType("LEARNER");
        attempt.setUserId(7);
        attempt.setPhone(phone);
        attempt.setOtp("123456");
        attempt.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        MobileLoginAttemptRepository attempts = mock(MobileLoginAttemptRepository.class);
        when(attempts.findByAttemptId("attempt-1")).thenReturn(Optional.of(attempt));
        when(attempts.reserveVerificationAttempt(eq("attempt-1"), any(LocalDateTime.class))).thenReturn(1);
        MobileAuthVerifyRequest req = new MobileAuthVerifyRequest();
        req.setAttemptId("attempt-1");
        req.setOtp(otp);
        return controller(learners, attempts, mock(SmsService.class), testOtpConfigured())
                .verify(req, null, mock(HttpServletResponse.class)).getStatusCodeValue();
    }

    @Test
    void theConfiguredTestOtpIsAcceptedForAListedNumberOnly() throws Exception {
        // 403 ACCOUNT_SUSPENDED means the OTP check passed and the account gate ran next.
        assertEquals(403, verifyStatus(LISTED, TEST_OTP));
        assertEquals(401, verifyStatus(OTHER, TEST_OTP), "an unlisted number must not accept the test OTP");
        assertEquals(401, verifyStatus(LISTED, "0000"), "a listed number must not accept any other code");
    }
}
