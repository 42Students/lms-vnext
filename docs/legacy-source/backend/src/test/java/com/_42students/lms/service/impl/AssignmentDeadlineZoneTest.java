package com._42students.lms.service.impl;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AssignmentDeadlineZoneTest {

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    @Test
    void deadlineIsReadAsIndiaWallClockNotJvmTime() {
        LocalDateTime indiaNow = LocalDateTime.now(INDIA);
        // One minute ago in India has passed, even though on a UTC JVM it is still hours away.
        assertTrue(AssignmentServiceImpl.isPastDeadline(indiaNow.minusMinutes(1)));
        assertFalse(AssignmentServiceImpl.isPastDeadline(indiaNow.plusMinutes(5)));
    }

    @Test
    void noDeadlineNeverPasses() {
        assertFalse(AssignmentServiceImpl.isPastDeadline(null));
    }
}
