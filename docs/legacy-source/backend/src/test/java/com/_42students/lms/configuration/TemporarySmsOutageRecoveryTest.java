package com._42students.lms.configuration;

import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.SmsService;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TemporarySmsOutageRecoveryTest {
    private static final String PHONE = "9000000000";
    private static final String GENERATED_CODE = "1234";

    private TemporarySmsOutageRecovery recovery(String enabled, String instant) {
        Environment env = mock(Environment.class);
        when(env.getProperty("APP_TEMPORARY_SMS_OUTAGE_ENABLED", "true")).thenReturn(enabled);
        return new TemporarySmsOutageRecovery(env,
                Clock.fixed(Instant.parse(instant), ZoneOffset.UTC));
    }

    @Test
    void providerExceptionDoesNotBlockLoginInitiationDuringTemporaryTestWindow() {
        SmsService provider = mock(SmsService.class);
        when(provider.sendOtp(PHONE, GENERATED_CODE, NotificationTemplateContext.LMS))
                .thenThrow(new IllegalStateException("SMS provider is unavailable"));
        SmsService recovered = (SmsService) recovery("true", "2026-09-21T00:00:00Z")
                .postProcessAfterInitialization(provider, "smsProvider");

        assertFalse(recovered.sendOtp(PHONE, GENERATED_CODE, NotificationTemplateContext.LMS));
        verify(provider).sendOtp(PHONE, GENERATED_CODE, NotificationTemplateContext.LMS);
    }

    @Test
    void successfulSmsDeliveryIsUnchanged() {
        SmsService provider = mock(SmsService.class);
        when(provider.sendOtp(PHONE, GENERATED_CODE)).thenReturn(true);
        SmsService recovered = (SmsService) recovery("true", "2026-09-21T00:00:00Z")
                .postProcessAfterInitialization(provider, "smsProvider");
        assertTrue(recovered.sendOtp(PHONE, GENERATED_CODE));
    }

    @Test
    void nonOtpFailuresAreNeverSuppressed() {
        SmsService provider = mock(SmsService.class);
        when(provider.sendNotification(PHONE, "notice"))
                .thenThrow(new IllegalStateException("notification failed"));
        SmsService recovered = (SmsService) recovery("true", "2026-09-21T00:00:00Z")
                .postProcessAfterInitialization(provider, "smsProvider");
        assertThrows(IllegalStateException.class,
                () -> recovered.sendNotification(PHONE, "notice"));
    }

    @Test
    void killSwitchLeavesSmsProviderUntouched() {
        SmsService provider = mock(SmsService.class);
        assertSame(provider, recovery("false", "2026-09-21T00:00:00Z")
                .postProcessAfterInitialization(provider, "smsProvider"));
    }

    @Test
    void deadlineDisablesFallbackEvenForAlreadyWrappedProvider() {
        SmsService provider = mock(SmsService.class);
        when(provider.sendOtp(PHONE, GENERATED_CODE))
                .thenThrow(new IllegalStateException("SMS provider is unavailable"));
        SmsService recovered = (SmsService) recovery("true", "2026-09-28T00:00:00Z")
                .postProcessAfterInitialization(provider, "smsProvider");
        assertSame(provider, recovered);
        assertThrows(IllegalStateException.class,
                () -> recovered.sendOtp(PHONE, GENERATED_CODE));
    }
}
