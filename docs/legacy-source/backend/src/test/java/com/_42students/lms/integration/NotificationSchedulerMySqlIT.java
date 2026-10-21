package com._42students.lms.integration;

import com._42students.lms.model.LessonContents;
import com._42students.lms.service.impl.NotificationSchedulerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Real-MySQL evidence for scheduled notification release, cleanup, and deadline parsing. */
class NotificationSchedulerMySqlIT extends AbstractMySqlHttpIT {

    private static final String PREFIX = "IT scheduler ";

    @Autowired
    private NotificationSchedulerService scheduler;

    @BeforeEach
    void cleanBefore() {
        cleanup();
    }

    @AfterEach
    void cleanAfter() {
        cleanup();
    }

    @Test
    void dueScheduledNotificationIsReleasedButFutureNotificationStaysScheduled() {
        int due = insertNotification("due", LocalDateTime.now().minusMinutes(1), "SCHEDULED", LocalDateTime.now());
        int future = insertNotification("future", LocalDateTime.now().plusHours(1), "SCHEDULED", LocalDateTime.now());

        ReflectionTestUtils.invokeMethod(scheduler, "releaseScheduledNotificationsInternal");

        assertEquals("SENT", status(due));
        assertNotNull(jdbc.queryForObject("select delivered_at from notification where id=?", java.sql.Timestamp.class, due));
        assertEquals("SCHEDULED", status(future));
        assertNull(jdbc.queryForObject("select delivered_at from notification where id=?", java.sql.Timestamp.class, future));
    }

    @Test
    void releaseBatchCapDrainsTwoHundredRowsPerTickInsteadOfOneUnboundedTransaction() {
        for (int i = 0; i < 205; i++) {
            insertNotification("batch-" + i, LocalDateTime.now().minusMinutes(2), "SCHEDULED", LocalDateTime.now());
        }

        ReflectionTestUtils.invokeMethod(scheduler, "releaseScheduledNotificationsInternal");

        assertEquals(200, countByStatus("SENT"));
        assertEquals(5, countByStatus("SCHEDULED"));

        ReflectionTestUtils.invokeMethod(scheduler, "releaseScheduledNotificationsInternal");

        assertEquals(205, countByStatus("SENT"));
        assertEquals(0, countByStatus("SCHEDULED"));
    }

    @Test
    void cleanupSoftDeletesOnlyNotificationsOlderThanNinetyDays() {
        int old = insertNotification("old", null, "SENT", LocalDateTime.now().minusDays(91));
        int recent = insertNotification("recent", null, "SENT", LocalDateTime.now().minusDays(89));

        ReflectionTestUtils.invokeMethod(scheduler, "cleanupOldNotificationsInternal");

        assertEquals(1, deletedFlag(old));
        assertEquals(0, deletedFlag(recent));
    }

    @Test
    void assignmentReminderWindowHasExactLowerAndUpperBoundaries() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 6, 9, 0);

        Boolean lower = ReflectionTestUtils.invokeMethod(
                scheduler, "dueInReminderWindow", now, now.plusHours(12));
        Boolean justBefore = ReflectionTestUtils.invokeMethod(
                scheduler, "dueInReminderWindow", now, now.plusHours(12).minusMinutes(1));
        Boolean justInsideUpper = ReflectionTestUtils.invokeMethod(
                scheduler, "dueInReminderWindow", now, now.plusHours(36).minusMinutes(1));
        Boolean upper = ReflectionTestUtils.invokeMethod(
                scheduler, "dueInReminderWindow", now, now.plusHours(36));

        assertEquals(Boolean.TRUE, lower);
        assertEquals(Boolean.FALSE, justBefore);
        assertEquals(Boolean.TRUE, justInsideUpper);
        assertEquals(Boolean.FALSE, upper);
    }

    @Test
    void isoZuluDeadlineIsConvertedToIndiaWallClock() {
        LocalDateTime parsed = ReflectionTestUtils.invokeMethod(
                scheduler, "parseDueDate", "2026-10-03T08:30:00.153Z", 123);

        assertEquals(LocalDateTime.of(2026, 10, 3, 14, 0, 0, 153_000_000), parsed);
    }

    @Test
    void explicitDeadlineWinsOverLegacyContentDataDeadline() {
        LessonContents assignment = new LessonContents();
        assignment.setDeadline(LocalDateTime.of(2026, 10, 7, 18, 30));

        com._42students.lms.dto.request.ContentDataDTO legacy =
                new com._42students.lms.dto.request.ContentDataDTO();
        legacy.setDueDate("2026-10-08 23:59:59");
        assignment.setContentDataDTO(legacy);

        LocalDateTime due = ReflectionTestUtils.invokeMethod(scheduler, "dueAtOf", assignment);
        assertEquals(LocalDateTime.of(2026, 10, 7, 18, 30), due);
    }

    private int insertNotification(String suffix, LocalDateTime scheduledAt, String deliveryStatus, LocalDateTime createdAt) {
        jdbc.update("insert into notification "
                        + "(title, message, class_id, course_id, is_read, scheduled_at, delivery_status, is_deleted, created_at, updated_at) "
                        + "values (?, 'integration', 0, 0, 0, ?, ?, 0, ?, ?)",
                PREFIX + suffix, scheduledAt, deliveryStatus, createdAt, createdAt);
        Integer id = jdbc.queryForObject(
                "select id from notification where title=? order by id desc limit 1",
                Integer.class, PREFIX + suffix);
        return id == null ? -1 : id;
    }

    private String status(int id) {
        return jdbc.queryForObject("select delivery_status from notification where id=?", String.class, id);
    }

    private int deletedFlag(int id) {
        Integer v = jdbc.queryForObject("select is_deleted from notification where id=?", Integer.class, id);
        return v == null ? -1 : v;
    }

    private int countByStatus(String status) {
        Integer v = jdbc.queryForObject(
                "select count(*) from notification where title like ? and delivery_status=?",
                Integer.class, PREFIX + "%", status);
        return v == null ? 0 : v;
    }

    private void cleanup() {
        try {
            jdbc.update("delete from notification where title like ?", PREFIX + "%");
        } catch (Exception ignored) {
        }
    }
}
