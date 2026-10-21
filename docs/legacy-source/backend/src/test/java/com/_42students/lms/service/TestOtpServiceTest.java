package com._42students.lms.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Numbers are synthetic: the real QA list lives in deployment configuration, not in this repository. */
class TestOtpServiceTest {
    private static MockEnvironment configured() {
        return new MockEnvironment()
                .withProperty("APP_TEST_OTP_ENABLED", "true")
                .withProperty("APP_TEST_OTP", "5555")
                .withProperty("APP_TEST_OTP_PHONES", "9000000101,9000000102");
    }

    @Test
    void acceptsOnlyTheConfiguredCodeForListedNumbers() {
        TestOtpService service = new TestOtpService(configured());
        assertTrue(service.isEnabled());
        assertTrue(service.isTestPhone("9000000101"));
        assertTrue(service.matchesTestOtp("9000000101", "5555"));
        assertTrue(service.matchesTestOtp("9000000102", " 5555 "), "surrounding whitespace is tolerated");
        assertFalse(service.matchesTestOtp("9000000101", "5556"));
        assertFalse(service.matchesTestOtp("9000000101", "9999"), "a previous code must stop working once the code changes");
        assertFalse(service.matchesTestOtp("9000000101", null));
    }

    @Test
    void neverAcceptsANumberThatIsNotListed() {
        TestOtpService service = new TestOtpService(configured());
        assertFalse(service.isTestPhone("9000000999"));
        assertFalse(service.matchesTestOtp("9000000999", "5555"));
    }

    @Test
    void isOffWhenNothingIsConfigured() {
        TestOtpService service = new TestOtpService(new MockEnvironment());
        assertFalse(service.isEnabled());
        assertFalse(service.isTestPhone("9000000101"));
        assertFalse(service.matchesTestOtp("9000000101", "5555"));
    }

    @Test
    void isOffWithoutTheExplicitSwitchEvenIfNumbersAndCodeArePresent() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("APP_TEST_OTP", "5555")
                .withProperty("APP_TEST_OTP_PHONES", "9000000101");
        TestOtpService service = new TestOtpService(env);
        assertFalse(service.isEnabled());
        assertFalse(service.matchesTestOtp("9000000101", "5555"));
    }

    @Test
    void isOffWhenTheCodeIsBlankEvenWithTheSwitchOn() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("APP_TEST_OTP_ENABLED", "true")
                .withProperty("APP_TEST_OTP", "  ")
                .withProperty("APP_TEST_OTP_PHONES", "9000000101");
        TestOtpService service = new TestOtpService(env);
        assertFalse(service.isEnabled());
        assertFalse(service.matchesTestOtp("9000000101", ""));
    }

    @Test
    void doesNotTurnIntoAnyNumberWorksModeByAccident() {
        // APP_TEST_OTP_GLOBAL is the dangerous switch. It must stay off unless set explicitly.
        TestOtpService service = new TestOtpService(configured());
        assertFalse(service.isTestPhone("9123456780"));
    }

    // ---- production: the block stays, and lifting it needs a second, explicit switch ----

    private static MockEnvironment production() {
        return configured().withProperty("STAGE", "prod");
    }

    @Test
    void productionBlocksTheQaListByDefault() {
        TestOtpService service = new TestOtpService(production());
        assertFalse(service.isEnabled());
        assertFalse(service.isTestPhone("9000000101"));
        assertFalse(service.matchesTestOtp("9000000101", "5555"),
                "configuring the list alone must not enable test login in production");
    }

    @Test
    void productionBlockAlsoAppliesWhenOnlyTheProfileSaysProd() {
        MockEnvironment env = configured().withProperty("spring.profiles.active", "prod");
        assertFalse(new TestOtpService(env).matchesTestOtp("9000000101", "5555"));
    }

    @Test
    void productionAcceptsListedNumbersOnlyWithTheExplicitSwitch() {
        TestOtpService service = new TestOtpService(
                production().withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true"));
        assertTrue(service.isTestPhone("9000000101"));
        assertTrue(service.matchesTestOtp("9000000101", "5555"));
        assertFalse(service.matchesTestOtp("9000000101", "9999"), "any other code is rejected");
        assertFalse(service.isTestPhone("9000000999"), "an unlisted number is never a test number");
        assertFalse(service.matchesTestOtp("9000000999", "5555"));
    }

    @Test
    void liftingTheProductionBlockDoesNotEnableTheE2eTokenEndpointOrTheRateLimitExemption() {
        // Both of those consult isEnabled(), which must stay false in production regardless.
        TestOtpService service = new TestOtpService(
                production().withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true"));
        assertFalse(service.isEnabled());
    }

    @Test
    void productionNeverHonoursAnyNumberWorksMode() {
        TestOtpService service = new TestOtpService(production()
                .withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true")
                .withProperty("APP_TEST_OTP_GLOBAL", "true"));
        assertFalse(service.isTestPhone("9000000999"), "APP_TEST_OTP_GLOBAL must be ignored in production");
        assertFalse(service.matchesTestOtp("9000000999", "5555"));
        assertTrue(service.matchesTestOtp("9000000101", "5555"), "the listed numbers still work");
    }

    @Test
    void theProductionSwitchAloneDoesNothingWithoutTheMainSwitch() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("STAGE", "prod")
                .withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true")
                .withProperty("APP_TEST_OTP", "5555")
                .withProperty("APP_TEST_OTP_PHONES", "9000000101");
        assertFalse(new TestOtpService(env).matchesTestOtp("9000000101", "5555"));
    }

    @Test
    void outsideProductionTheProductionSwitchChangesNothing() {
        TestOtpService service = new TestOtpService(
                configured().withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true"));
        assertTrue(service.isEnabled());
        assertTrue(service.matchesTestOtp("9000000101", "5555"));
        assertFalse(service.isTestPhone("9000000999"));
    }

    // Test emails (13 Oct 2026): recruiters sign in by email only; QA needs a login on dev.

    @Test
    void aListedTestEmailUsesTheTestCodeOffProduction() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("APP_TEST_OTP_ENABLED", "true").withProperty("APP_TEST_OTP", "5555")
                .withProperty("APP_TEST_OTP_EMAILS", " QA.Recruiter@TechMahindra.com , other@acme.test ");
        TestOtpService svc = new TestOtpService(env);
        org.junit.jupiter.api.Assertions.assertTrue(svc.isTestEmail("qa.recruiter@techmahindra.com"));
        org.junit.jupiter.api.Assertions.assertTrue(svc.isTestEmail(" Other@Acme.test "));
        org.junit.jupiter.api.Assertions.assertFalse(svc.isTestEmail("someone@techmahindra.com"));
        org.junit.jupiter.api.Assertions.assertFalse(svc.isTestEmail(null));
    }

    @Test
    void testEmailsNeverWorkInProductionEvenWithTheProductionSwitch() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("STAGE", "prod").withProperty("APP_TEST_OTP_ENABLED", "true").withProperty("APP_TEST_OTP", "5555")
                .withProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION", "true").withProperty("APP_TEST_OTP_EMAILS", "qa.recruiter@techmahindra.com");
        org.junit.jupiter.api.Assertions.assertFalse(new TestOtpService(env).isTestEmail("qa.recruiter@techmahindra.com"));
    }

    @Test
    void testEmailsAreOffWhenTestModeIsOff() {
        MockEnvironment env = new MockEnvironment().withProperty("APP_TEST_OTP", "5555").withProperty("APP_TEST_OTP_EMAILS", "qa.recruiter@techmahindra.com");
        org.junit.jupiter.api.Assertions.assertFalse(new TestOtpService(env).isTestEmail("qa.recruiter@techmahindra.com"));
    }
}
