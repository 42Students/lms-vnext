package com._42students.lms.configuration;

import com._42students.lms.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;

/**
 * TEMPORARY testing-only recovery for an unpaid/unavailable SMS provider.
 *
 * The existing verification service already accepts the legacy 9999 test OTP. When
 * sendOtp throws before UserController can save the verification record, login
 * initiation fails even though that test OTP remains accepted. During the bounded
 * outage window, let the controller continue to save the record instead.
 *
 * Does not introduce a new OTP, issue tokens, change verification or bypass rate
 * limits. Disable immediately with APP_TEMPORARY_SMS_OUTAGE_ENABLED=false; the
 * fallback also shuts itself off on 2026-09-28 UTC without a redeployment.
 * Remove this entire class once SMS billing is restored and testing ends.
 */
@Component
@Slf4j
public class TemporarySmsOutageRecovery implements BeanPostProcessor {
    private static final Instant EXPIRES_AT = Instant.parse("2026-09-28T00:00:00Z");

    private final boolean enabled;
    private final Clock clock;

    @Autowired
    public TemporarySmsOutageRecovery(Environment environment) {
        this(environment, Clock.systemUTC());
    }

    TemporarySmsOutageRecovery(Environment environment, Clock clock) {
        this.enabled = !"false".equalsIgnoreCase(
                environment.getProperty("APP_TEMPORARY_SMS_OUTAGE_ENABLED", "true").trim());
        this.clock = clock;
    }

    private boolean active() {
        return enabled && clock.instant().isBefore(EXPIRES_AT);
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (!(bean instanceof SmsService) || !active()) return bean;
        SmsService provider = (SmsService) bean;
        return Proxy.newProxyInstance(SmsService.class.getClassLoader(),
                new Class<?>[]{SmsService.class}, (proxy, method, arguments) -> {
                    boolean otpSend = "sendOtp".equals(method.getName());
                    try {
                        Object result = method.invoke(provider, arguments);
                        if (otpSend && active() && Boolean.FALSE.equals(result)) {
                            // The existing login controller already continues on a false result.
                            log.warn("SMS OTP delivery returned false; temporary testing fallback is active");
                        }
                        return result;
                    } catch (InvocationTargetException e) {
                        Throwable cause = e.getCause();
                        if (otpSend && active() && cause instanceof RuntimeException) {
                            // Never log phone numbers, generated OTPs or provider credentials.
                            log.warn("SMS OTP provider threw {}; temporary testing fallback is active",
                                    cause.getClass().getSimpleName());
                            return false;
                        }
                        throw cause;
                    }
                });
    }
}
