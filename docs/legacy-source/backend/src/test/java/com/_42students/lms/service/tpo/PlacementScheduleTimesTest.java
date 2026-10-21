package com._42students.lms.service.tpo;

import com._42students.lms.service.impl.NotificationSchedulerService;
import com._42students.lms.util.PlacementDateTimeUtils;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.annotation.Scheduled;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 19 Oct 2026: the placement jobs ran on the server's UTC clock ("deadline today" at 1:30 pm India time), the older interview
 * reminder only caught interviews starting 1:30-4:30 pm and wrote UTC times into the notice.
 */
class PlacementScheduleTimesTest {

    @Test
    void everyDailyPlacementJobSaysItsZone() {
        for (Method m : TpoScheduledJobs.class.getDeclaredMethods()) {
            Scheduled s = m.getAnnotation(Scheduled.class);
            if (s == null || s.cron().isEmpty()) continue;
            assertEquals("Asia/Kolkata", s.zone(), m.getName() + " runs on the server clock");
        }
    }

    @Test
    void theOlderInterviewReminderRunsTheEveningBeforeIndiaTime() throws Exception {
        Scheduled s = NotificationSchedulerService.class.getMethod("sendInterviewReminders").getAnnotation(Scheduled.class);
        assertEquals("0 0 19 * * *", s.cron());
        assertEquals("Asia/Kolkata", s.zone());
    }

    @Test
    void interviewTimesAreWrittenInIndiaTime() {
        LocalDateTime utc = LocalDateTime.of(2026, 10, 20, 4, 30); // 10:00 am India
        assertEquals("10:00 AM", PlacementDateTimeUtils.indiaFormat(utc, "hh:mm a"));
        assertEquals("20 Oct 2026", PlacementDateTimeUtils.indiaFormat(utc, "dd MMM yyyy"));
        assertEquals("21 Oct 2026", PlacementDateTimeUtils.indiaFormat(LocalDateTime.of(2026, 10, 20, 19, 0), "dd MMM yyyy"));
        assertNull(PlacementDateTimeUtils.indiaFormat(null, "hh:mm a"));
    }
}
