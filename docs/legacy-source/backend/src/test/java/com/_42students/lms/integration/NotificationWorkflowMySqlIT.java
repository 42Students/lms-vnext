package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Notification compose/read/scheduled-delivery integration through real JWT + MySQL.
 */
@Transactional
@Rollback
class NotificationWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 104601;
    private static final int COLLEGE_B = 104602;
    private static final int ADMIN_A = 104611;
    private static final int LEARNER_A = 104621;
    private static final int LEARNER_B = 104622;
    private static final int DEPT_A = 104631;
    private static final int DEPT_B = 104632;
    private static final int PROGRAM_A = 104641;
    private static final int PROGRAM_B = 104642;
    private static final long BATCH_A = 104651L;
    private static final long BATCH_B = 104652L;
    private static final int CLASS_A = 104661;
    private static final int CLASS_B = 104662;
    private static final int COURSE_A = 104671;
    private static final int COURSE_B = 104672;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Notification College A");
        seedCollege(COLLEGE_B, "Notification College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "NotificationAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "NotificationLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "NotificationLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Notification Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Notification Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Notification Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Notification Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Notification Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Notification Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Notification Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Notification Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'NTA', ?, 'Notification Course A', 0, 1, 1, 1, 'notification-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'NTB', ?, 'Notification Course B', 0, 1, 1, 1, 'notification-course-b-it', 0, 0)", COURSE_B, DEPT_B);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (104681, ?, 1, 'Notification Semester A', 1, 20, 0)", PROGRAM_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (104682, ?, 1, 'Notification Semester B', 1, 20, 0)", PROGRAM_B);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (104691, 104681, ?, 1, 3, 1, 0)", COURSE_A);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (104692, 104682, ?, 1, 3, 1, 0)", COURSE_B);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String futureTimestamp() {
        return LocalDateTime.now().plusDays(1).withNano(0)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private int createNotification(String title, Integer learnerId, String scheduledAt) throws Exception {
        String learner = learnerId == null ? "" : ",\"learner_id\":" + learnerId;
        String schedule = scheduledAt == null ? "" : ",\"scheduled_at\":\"" + scheduledAt + "\"";
        mvc.perform(post("/api/v1/notification/createNotification")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"html_content\":\"<p>Integration notice</p>\",\"title\":\"" + title
                                + "\",\"class_id\":" + CLASS_A + ",\"course_id\":" + COURSE_A
                                + learner + ",\"creator_faculty_id\":999999" + schedule + "}"))
                .andExpect(status().isOk());

        return jdbc.queryForObject(
                "select id from notification where title = ? order by id desc limit 1",
                Integer.class, title);
    }

    @Test
    void immediateNotificationUsesAuthenticatedCreatorAndIsSentImmediately() throws Exception {
        seedBase();
        int id = createNotification("Immediate Integration Notice", null, null);

        assertEquals(ADMIN_A, jdbc.queryForObject(
                "select creator_faculty_id from notification where id = ?", Integer.class, id));
        assertEquals("SENT", jdbc.queryForObject(
                "select delivery_status from notification where id = ?", String.class, id));
        assertNotNull(jdbc.queryForObject(
                "select delivered_at from notification where id = ?", java.sql.Timestamp.class, id));
    }

    @Test
    void learnerReadsOwnClassNotificationButCannotReadSiblingCollegeClass() throws Exception {
        seedBase();
        createNotification("Visible Class Notice", null, null);
        jdbc.update("insert into notification "
                        + "(id, title, message, class_id, course_id, learner_id, is_read, notification_type, creator_faculty_id, delivery_status, delivered_at, is_deleted) "
                        + "values (104701, 'Foreign Class Notice', 'Foreign', ?, ?, null, 0, 'COURSE', ?, 'SENT', now(), 0)",
                CLASS_B, COURSE_B, ADMIN_A);

        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        String body = mvc.perform(get("/api/v1/notification/getNotificationsByClassId")
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("Visible Class Notice"), body);
        assertTrue(!body.contains("Foreign Class Notice"), body);

        mvc.perform(get("/api/v1/notification/getNotificationsByClassId")
                        .param("classId", String.valueOf(CLASS_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void futureScheduledNotificationIsHiddenFromLearnerUntilRelease() throws Exception {
        seedBase();
        int id = createNotification("Future Scheduled Notice", null, futureTimestamp());

        assertEquals("SCHEDULED", jdbc.queryForObject(
                "select delivery_status from notification where id = ?", String.class, id));

        String body = mvc.perform(get("/api/v1/notification/getNotificationsByClassId")
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!body.contains("Future Scheduled Notice"), body);
    }

    @Test
    void adminCanCancelThenRequeueScheduledNotificationWithoutMakingItImmediatelyVisible() throws Exception {
        seedBase();
        int id = createNotification("Cancelable Scheduled Notice", null, futureTimestamp());

        mvc.perform(post("/api/v1/admin/notification-delivery/" + id + "/cancel-schedule")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals("CANCELLED", jdbc.queryForObject(
                "select delivery_status from notification where id = ?", String.class, id));
        LocalDateTime cancelledAt = jdbc.queryForObject(
                "select scheduled_at from notification where id = ?",
                java.sql.Timestamp.class, id).toLocalDateTime();
        assertTrue(cancelledAt.isAfter(LocalDateTime.now().plusYears(90)));

        mvc.perform(post("/api/v1/admin/notification-delivery/" + id + "/resend")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals("SCHEDULED", jdbc.queryForObject(
                "select delivery_status from notification where id = ?", String.class, id));
        LocalDateTime requeuedAt = jdbc.queryForObject(
                "select scheduled_at from notification where id = ?",
                java.sql.Timestamp.class, id).toLocalDateTime();
        assertTrue(!requeuedAt.isAfter(LocalDateTime.now().plusMinutes(1)));
    }

    @Test
    void failedNotificationCanBeRequeuedForImmediateRetryAndClearsError() throws Exception {
        seedBase();
        jdbc.update("insert into notification "
                        + "(id, title, message, class_id, course_id, is_read, notification_type, creator_faculty_id, "
                        + "scheduled_at, delivery_status, delivery_error, is_deleted) "
                        + "values (104704, 'Retry Failed Notice', 'Retry me', ?, ?, 0, 'COURSE', ?, ?, 'FAILED', 'provider timeout', 0)",
                CLASS_A, COURSE_A, ADMIN_A, java.sql.Timestamp.valueOf(LocalDateTime.now().minusMinutes(5)));

        mvc.perform(post("/api/v1/admin/notification-delivery/104704/resend")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals("SCHEDULED", jdbc.queryForObject(
                "select delivery_status from notification where id = 104704", String.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from notification where id = 104704 and delivery_error is not null",
                Integer.class));
        LocalDateTime due = jdbc.queryForObject(
                "select scheduled_at from notification where id = 104704",
                java.sql.Timestamp.class).toLocalDateTime();
        assertTrue(!due.isAfter(LocalDateTime.now().plusMinutes(1)));
    }

    @Test
    void alreadySentImmediateNotificationCannotBeResentFromStaleAdminScreen() throws Exception {
        seedBase();
        int id = createNotification("Already Sent Notice", null, null);

        mvc.perform(post("/api/v1/admin/notification-delivery/" + id + "/resend")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        assertEquals("SENT", jdbc.queryForObject(
                "select delivery_status from notification where id = ?", String.class, id));
    }

    @Test
    void adminCannotCancelSiblingCollegeNotificationBySupplyingOwnCollegeId() throws Exception {
        seedBase();
        jdbc.update("insert into notification "
                        + "(id, title, message, class_id, course_id, is_read, notification_type, creator_faculty_id, scheduled_at, delivery_status, is_deleted) "
                        + "values (104702, 'Foreign Scheduled Notice', 'Foreign', ?, ?, 0, 'COURSE', ?, ?, 'SCHEDULED', 0)",
                CLASS_B, COURSE_B, ADMIN_A, java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(1)));

        mvc.perform(post("/api/v1/admin/notification-delivery/104702/cancel-schedule")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        assertEquals("SCHEDULED", jdbc.queryForObject(
                "select delivery_status from notification where id = 104702", String.class));
    }

    @Test
    void recipientEndpointIsSelfOnlyForLearners() throws Exception {
        seedBase();
        jdbc.update("insert into notification "
                        + "(id, title, message, class_id, course_id, learner_id, is_read, notification_type, delivery_status, delivered_at, is_deleted) "
                        + "values (104703, 'Personal Recipient Notice', 'Personal', 0, 0, ?, 0, 'GENERAL', 'SENT', now(), 0)",
                LEARNER_A);
        // a mentor notice for the faculty member who has the same number (V227): not this learner's
        jdbc.update("insert into notification "
                        + "(id, title, message, class_id, course_id, learner_id, recipient_type, is_read, notification_type, delivery_status, delivered_at, is_deleted) "
                        + "values (104704, 'Faculty Same Number Notice', 'Mentor', 0, 0, ?, 'FACULTY', 0, 'PROJECT', 'SENT', now(), 0)",
                LEARNER_A);

        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        String own = mvc.perform(get("/api/v1/notification/getNotificationsForRecipient")
                        .param("recipientId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(own.contains("Personal Recipient Notice"), own);
        assertFalse(own.contains("Faculty Same Number Notice"), own);

        mvc.perform(get("/api/v1/notification/getNotificationsForRecipient")
                        .param("recipientId", String.valueOf(LEARNER_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
