package com._42students.lms.service.impl;

import com._42students.lms.repository.FacultyVerificationRepository;
import com._42students.lms.repository.LearnerAccountVerificationRepository;
import com._42students.lms.service.TestOtpService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The hardcoded OTPs in VerificationServiceImpl (9999, 4242, and the fixed code for one support
 * phone) are literals in source. They must never authenticate anyone in production.
 *
 * Regression for a live bypass: GET /api/v1/learner/verifyOTP?phoneNumber=..&otp=9999 returned a
 * full session on production for any learner, because nothing checked the environment.
 */
class VerificationServiceProductionBypassTest {
    private static final String PHONE = "9000000101";
    private static final String SPECIAL_PHONE = "8801448346";
    private static final String SPECIAL_CODE = "156112";

    private static TestOtpService environment(String stage) {
        MockEnvironment env = new MockEnvironment();
        if (stage != null) env.setProperty("STAGE", stage);
        return new TestOtpService(env);
    }

    /** storedOtp is what a real SMS/email OTP lookup would return, or null when none was issued. */
    private static VerificationServiceImpl service(TestOtpService testOtp, String storedOtp) {
        LearnerAccountVerificationRepository learners = mock(LearnerAccountVerificationRepository.class);
        FacultyVerificationRepository faculty = mock(FacultyVerificationRepository.class);
        when(learners.getOTPByPhoneNumber(org.mockito.ArgumentMatchers.anyString())).thenReturn(storedOtp);
        when(learners.getOTPByEmail(org.mockito.ArgumentMatchers.anyString())).thenReturn(storedOtp);
        when(faculty.getOTPByPhoneNumber(org.mockito.ArgumentMatchers.anyString())).thenReturn(storedOtp);
        VerificationServiceImpl service = new VerificationServiceImpl();
        ReflectionTestUtils.setField(service, "studentAccountVerificationRepository", learners);
        ReflectionTestUtils.setField(service, "instructorVerificationRepository", faculty);
        ReflectionTestUtils.setField(service, "testOtpService", testOtp);
        return service;
    }

    @Test
    void productionRejectsTheAnyPhoneCodesOnEveryEntryPoint() {
        VerificationServiceImpl s = service(environment("prod"), null);
        for (String code : new String[] {"9999", "4242"}) {
            assertFalse(s.verifyOTP(PHONE, code), "learner verify accepted " + code);
            assertFalse(s.verifyInstructorOTP(PHONE, code), "faculty verify accepted " + code);
            assertFalse(s.verifyPreUserPhoneOtp(PHONE, code), "pre-user phone verify accepted " + code);
            assertFalse(s.verifyPreUserEmailOtp("someone@example.com", code), "pre-user email verify accepted " + code);
        }
    }

    @Test
    void productionRejectsTheFixedCodeForTheSupportPhone() {
        VerificationServiceImpl s = service(environment("prod"), null);
        assertFalse(s.verifyOTP(SPECIAL_PHONE, SPECIAL_CODE));
        assertFalse(s.verifyInstructorOTP(SPECIAL_PHONE, SPECIAL_CODE));
    }

    @Test
    void productionStillAcceptsARealIssuedOtp() {
        VerificationServiceImpl s = service(environment("prod"), "123456");
        assertTrue(s.verifyOTP(PHONE, "123456"));
        assertTrue(s.verifyInstructorOTP(PHONE, "123456"));
        assertTrue(s.verifyOTP(SPECIAL_PHONE, "123456"), "the support phone keeps working with a real OTP");
        assertFalse(s.verifyOTP(PHONE, "654321"), "a wrong code is still rejected");
    }

    @Test
    void theProdProfileAloneAlsoCountsAsProduction() {
        MockEnvironment env = new MockEnvironment().withProperty("spring.profiles.active", "prod");
        assertFalse(service(new TestOtpService(env), null).verifyOTP(PHONE, "9999"));
    }

    @Test
    void anUnknownEnvironmentFailsClosed() {
        assertFalse(service(null, null).verifyOTP(PHONE, "9999"),
                "with no way to tell the environment the codes must be treated as forbidden");
    }

    @Test
    void nonProductionKeepsTheDevAndUatConvenience() {
        VerificationServiceImpl s = service(environment("dev"), null);
        assertTrue(s.verifyOTP(PHONE, "9999"));
        assertTrue(s.verifyOTP(PHONE, "4242"));
        assertTrue(s.verifyInstructorOTP(PHONE, "9999"));
        assertTrue(s.verifyPreUserEmailOtp("someone@example.com", "9999"));
        assertTrue(s.verifyOTP(SPECIAL_PHONE, SPECIAL_CODE));
        assertFalse(s.verifyOTP(PHONE, "1111"), "an unrelated code is still rejected");
    }
}
