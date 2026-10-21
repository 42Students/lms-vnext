package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.model.LessonContents;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** Prod logged "invalid dueDate format" for every builder-made assignment, so no reminder went out. */
class AssignmentReminderDueDateTest {

    private final NotificationSchedulerService job = new NotificationSchedulerService();

    @Test
    void isoInstantFromTheBuilderIsReadAsIndiaTime() {
        assertEquals(LocalDateTime.of(2026, 10, 3, 14, 0),
                job.parseDueDate("2026-10-03T08:30:00.153Z", 646).withSecond(0).withNano(0));
    }

    @Test
    void deadlineColumnWinsOverLegacyDueDate() {
        LessonContents a = new LessonContents();
        a.setDeadline(LocalDateTime.of(2026, 10, 6, 23, 59));
        ContentDataDTO data = new ContentDataDTO();
        data.setDueDate("2026-01-01T00:00:00Z");
        a.setContentDataDTO(data);
        assertEquals(LocalDateTime.of(2026, 10, 6, 23, 59), job.dueAtOf(a));
    }

    @Test
    void dailyWindowsCoverEveryDeadlineOnce() {
        LocalDateTime run = LocalDateTime.of(2026, 10, 5, 14, 30);
        LocalDateTime nextRun = run.plusDays(1);
        for (int h = 0; h < 72; h++) {
            LocalDateTime due = run.plusHours(h);
            int hits = (NotificationSchedulerService.dueInReminderWindow(run, due) ? 1 : 0)
                    + (NotificationSchedulerService.dueInReminderWindow(nextRun, due) ? 1 : 0)
                    + (NotificationSchedulerService.dueInReminderWindow(run.minusDays(1), due) ? 1 : 0);
            if (h >= 12 && h < 60) assertEquals(1, hits, "deadline " + h + "h after a run");
        }
    }
}
