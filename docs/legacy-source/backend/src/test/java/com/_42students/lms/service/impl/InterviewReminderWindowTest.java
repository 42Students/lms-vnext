package com._42students.lms.service.impl;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** 19 Oct 2026: the older interview reminder covers the whole next India day, not interviews 23-26 hours away. */
class InterviewReminderWindowTest {

    @Test
    void sevenPmIndiaSearchesAllOfTomorrowIndiaTimeInUtc() {
        ZonedDateTime sevenPm = ZonedDateTime.of(2026, 10, 19, 19, 0, 0, 0, ZoneId.of("Asia/Kolkata"));
        LocalDateTime[] w = NotificationSchedulerService.tomorrowInIndiaAsUtc(sevenPm);
        assertEquals(LocalDateTime.of(2026, 10, 19, 18, 30), w[0]); // 20 Oct, 00:00 India
        assertEquals(LocalDateTime.of(2026, 10, 20, 18, 30), w[1]); // 21 Oct, 00:00 India
    }
}
