package com._42students.lms.integration;

import com._42students.lms.search.notifications.NotificationSearchCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Same-class recipient privacy for v1 notification feeds and v2 in-memory search.
 */
class NotificationRecipientPrivacyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 110001;
    private static final int LEARNER_A = 110011;
    private static final int LEARNER_B = 110012;
    private static final int DEPT = 110021;
    private static final int PROGRAM = 110031;
    private static final long BATCH = 110041L;
    private static final int CLASS_ID = 110051;
    private static final int COURSE = 110061;

    @Autowired
    private NotificationSearchCache cache;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from notification where class_id = ? or course_id = ?", CLASS_ID, COURSE);
        jdbc.update("delete from learner where id in (?, ?)", LEARNER_A, LEARNER_B);
        jdbc.update("delete from course where id = ?", COURSE);
        jdbc.update("delete from class where id = ?", CLASS_ID);
        jdbc.update("delete from batch where id = ?", BATCH);
        jdbc.update("delete from new_program where id = ?", PROGRAM);
        jdbc.update("delete from department where id = ?", DEPT);
        jdbc.update("delete from college where id = ?", COLLEGE);
        cache.refresh();
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Notification Privacy College");
        seedLearner(LEARNER_A, COLLEGE, "NotificationPrivacyA");
        seedLearner(LEARNER_B, COLLEGE, "NotificationPrivacyB");
        seedDepartment(DEPT, COLLEGE, "Notification Privacy Dept");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) "
                + "values (?, 'Notification Privacy Program', ?, 4, 0)", PROGRAM, DEPT);
        jdbc.update("insert into batch "
                + "(id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Notification Privacy Batch', ?, 2, 1, '2026-27', 'ACTIVE', now(), now())",
                BATCH, PROGRAM);
        jdbc.update("insert into class "
                + "(id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Notification Privacy Section', ?, ?, 60, 0, 'SECTION', 0)",
                CLASS_ID, PROGRAM, BATCH);
        jdbc.update("insert into course "
                + "(id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'NPC', ?, 'Notification Privacy Course', 0, 1, 1, 1, 'notification-privacy-course-it', 0, 0)",
                COURSE, DEPT);
        jdbc.update("update learner set program_id = ?, class_id = ? where id in (?, ?)",
                PROGRAM, CLASS_ID, LEARNER_A, LEARNER_B);

        insertNotification("Class Broadcast", "Visible to both", null, null);
        insertNotification("Private For A", "A-only secret payload", LEARNER_A, null);
        insertNotification("Private For B", "B-only secret payload", LEARNER_B, null);
        insertNotification("Future Class Notice", "Do not reveal before schedule", null,
                LocalDateTime.now().plusDays(1));
        cache.refresh();
    }

    private void insertNotification(String title, String message, Integer learnerId, LocalDateTime scheduledAt) {
        jdbc.update("insert into notification "
                        + "(title, message, class_id, course_id, learner_id, is_read, notification_type, "
                        + "scheduled_at, delivery_status, delivered_at, created_at, is_deleted) "
                        + "values (?, ?, ?, ?, ?, 0, 'COURSE', ?, ?, ?, now(), 0)",
                title, message, CLASS_ID, COURSE, learnerId,
                scheduledAt != null ? java.sql.Timestamp.valueOf(scheduledAt) : null,
                scheduledAt != null ? "SCHEDULED" : "SENT",
                scheduledAt == null ? java.sql.Timestamp.valueOf(LocalDateTime.now()) : null);
    }

    private String token(int learnerId) {
        return accessToken(learnerPrincipal(learnerId, COLLEGE));
    }

    @Test
    void v1ClassFeedDoesNotLeakSameClassPersonalNotificationToOtherLearner() throws Exception {
        seedBase();

        String a = mvc.perform(get("/api/v1/notification/getNotificationsByClassId")
                        .param("classId", String.valueOf(CLASS_ID))
                        .header("Authorization", "Bearer " + token(LEARNER_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(a.contains("Class Broadcast"), a);
        assertTrue(a.contains("Private For A"), a);
        assertTrue(!a.contains("Private For B"), a);
        assertTrue(!a.contains("Future Class Notice"), a);

        String b = mvc.perform(get("/api/v1/notification/getNotificationsByClassId")
                        .param("classId", String.valueOf(CLASS_ID))
                        .header("Authorization", "Bearer " + token(LEARNER_B)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(b.contains("Class Broadcast"), b);
        assertTrue(b.contains("Private For B"), b);
        assertTrue(!b.contains("Private For A"), b);
        assertTrue(!b.contains("Future Class Notice"), b);
    }

    @Test
    void v1CourseFeedAppliesSameRecipientIsolation() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/notification/getNotifications")
                        .param("classId", String.valueOf(CLASS_ID))
                        .param("courseId", String.valueOf(COURSE))
                        .header("Authorization", "Bearer " + token(LEARNER_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Class Broadcast"), body);
        assertTrue(body.contains("Private For A"), body);
        assertTrue(!body.contains("Private For B"), body);
        assertTrue(!body.contains("Future Class Notice"), body);
    }

    @Test
    void v2SearchHidesOtherLearnersPrivateNotificationAndFutureScheduledContent() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v2/notifications/search")
                        .param("query", "")
                        .param("limit", "50")
                        .param("classId", String.valueOf(CLASS_ID))
                        .header("Authorization", "Bearer " + token(LEARNER_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Class Broadcast"), body);
        assertTrue(body.contains("Private For A"), body);
        assertTrue(!body.contains("Private For B"), body);
        assertTrue(!body.contains("B-only secret payload"), body);
        assertTrue(!body.contains("Future Class Notice"), body);
        assertTrue(!body.contains(String.valueOf(LEARNER_A)),
                "hidden recipient metadata must not be serialized in v2 search DTO: " + body);
    }
}
