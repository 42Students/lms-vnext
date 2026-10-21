package com._42students.lms.controller;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Login audit 2026-10-12: /email-fallback/send had no server-side limit; one attempt now emails at most every 30 s. */
class EmailCodeResendGapTest {

    private static final LocalDateTime T = LocalDateTime.of(2026, 10, 12, 10, 0, 0);

    @Test
    void firstEmailIsAlwaysAllowed() {
        assertEquals(0, PublicMobileAuthController.emailResendWaitSeconds(null, T));
    }

    @Test
    void aSecondEmailWithinThirtySecondsWaits() {
        assertEquals(30, PublicMobileAuthController.emailResendWaitSeconds(T, T));
        assertEquals(18, PublicMobileAuthController.emailResendWaitSeconds(T, T.plusSeconds(12)));
    }

    @Test
    void afterThirtySecondsItIsAllowedAgain() {
        assertEquals(0, PublicMobileAuthController.emailResendWaitSeconds(T, T.plusSeconds(30)));
        assertEquals(0, PublicMobileAuthController.emailResendWaitSeconds(T, T.plusMinutes(4)));
    }
}
