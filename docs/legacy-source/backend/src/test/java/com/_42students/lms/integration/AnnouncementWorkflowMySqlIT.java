package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Announcement audience/schedule/tenant integration.
 */
@Transactional
@Rollback
class AnnouncementWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 103601;
    private static final int COLLEGE_B = 103602;
    private static final int ADMIN_A = 103611;
    private static final int FACULTY_A = 103612;
    private static final int LEARNER_A = 103621;
    private static final int LEARNER_B = 103622;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Announcement College A");
        seedCollege(COLLEGE_B, "Announcement College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "AnnouncementAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "AnnouncementFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "AnnouncementLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "AnnouncementLearnerB");
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private long createCollegeAnnouncement(String title, String message, LocalDateTime scheduledAt, LocalDateTime expiresAt) throws Exception {
        String schedule = scheduledAt == null ? "" : ",\"scheduledAt\":\"" + scheduledAt.withNano(0) + "\"";
        String expiry = expiresAt == null ? "" : ",\"expiresAt\":\"" + expiresAt.withNano(0) + "\"";
        mvc.perform(post("/api/v1/announcements/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverType\":\"COLLEGE\",\"receiverValue\":" + COLLEGE_A
                                + ",\"title\":\"" + title + "\",\"message\":\"" + message
                                + "\",\"senderId\":999999,\"senderType\":\"FACULTY\"" + schedule + expiry + "}"))
                .andExpect(status().isOk());
        return jdbc.queryForObject(
                "select id from announcements where receiver_type = 'COLLEGE' and receiver_value = ? order by id desc limit 1",
                Long.class, COLLEGE_A);
    }

    @Test
    void adminCreatesSanitizedCollegeAnnouncementAndServerOverridesSenderIdentity() throws Exception {
        seedBase();

        long id = createCollegeAnnouncement("<b>Important</b>", "<p>Hello</p><script>alert(1)</script>", null, null);

        assertEquals(Long.valueOf(ADMIN_A), jdbc.queryForObject(
                "select sender_id from announcements where id = ?", Long.class, id));
        assertEquals("Important", jdbc.queryForObject(
                "select title from announcements where id = ?", String.class, id));
        String message = jdbc.queryForObject(
                "select message from announcements where id = ?", String.class, id);
        assertTrue(message.contains("<p>Hello</p>"), message);
        assertTrue(!message.contains("<script"), message);
    }

    @Test
    void learnerFeedShowsOwnCollegeAndOwnLearnerAnnouncementsButNotForeignOrFutureAnnouncements() throws Exception {
        seedBase();
        createCollegeAnnouncement("Visible College News", "Visible now", null, null);
        createCollegeAnnouncement("Future College News", "Not yet", LocalDateTime.now().plusDays(1), null);

        jdbc.update("insert into announcements "
                        + "(receiver_type, receiver_value, title, message, sender_type, sender_id, is_deleted, scheduled_at, expires_at, is_pinned) "
                        + "values ('LEARNER', ?, 'Personal Notice', 'For learner A', 'ADMIN', ?, 0, null, null, 0)",
                LEARNER_A, ADMIN_A);
        jdbc.update("insert into announcements "
                        + "(receiver_type, receiver_value, title, message, sender_type, sender_id, is_deleted, scheduled_at, expires_at, is_pinned) "
                        + "values ('COLLEGE', ?, 'Foreign College News', 'Must not leak', 'ADMIN', ?, 0, null, null, 0)",
                COLLEGE_B, ADMIN_A);
        jdbc.update("insert into announcements "
                        + "(receiver_type, receiver_value, title, message, sender_type, sender_id, is_deleted, scheduled_at, expires_at, is_pinned) "
                        + "values ('COLLEGE', ?, 'Expired College News', 'Already expired', 'ADMIN', ?, 0, null, ?, 0)",
                COLLEGE_A, ADMIN_A, java.sql.Timestamp.valueOf(LocalDateTime.now().minusHours(1)));

        String body = mvc.perform(get("/api/v1/announcements/forLearner")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Visible College News"), body);
        assertTrue(body.contains("Personal Notice"), body);
        assertTrue(!body.contains("Future College News"), body);
        assertTrue(!body.contains("Foreign College News"), body);
        assertTrue(!body.contains("Expired College News"), body);
    }

    @Test
    void collegeAdminCannotCreateOrRetargetBroadcastIntoSiblingCollege() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/announcements/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverType\":\"COLLEGE\",\"receiverValue\":" + COLLEGE_B
                                + ",\"title\":\"Attack\",\"message\":\"Must fail\"}"))
                .andExpect(status().isForbidden());

        long id = createCollegeAnnouncement("Owned Announcement", "Owned", null, null);
        mvc.perform(put("/api/v1/announcements/update/" + id)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverType\":\"COLLEGE\",\"receiverValue\":" + COLLEGE_B
                                + ",\"title\":\"Retargeted\",\"message\":\"Must fail\"}"))
                .andExpect(status().isForbidden());

        assertEquals(Long.valueOf(COLLEGE_A), jdbc.queryForObject(
                "select receiver_value from announcements where id = ?", Long.class, id));
    }

    @Test
    void regularFacultyCannotCreateCollegeWideBroadcast() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/announcements/create")
                        .header("Authorization", "Bearer " + accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverType\":\"COLLEGE\",\"receiverValue\":" + COLLEGE_A
                                + ",\"title\":\"Faculty Broadcast\",\"message\":\"Must not broadcast\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from announcements where title = 'Faculty Broadcast'",
                Integer.class));
    }

    @Test
    void adminListingIsScopedToOwnCollege() throws Exception {
        seedBase();
        createCollegeAnnouncement("Admin Visible A", "A", null, null);
        jdbc.update("insert into announcements "
                        + "(receiver_type, receiver_value, title, message, sender_type, sender_id, is_deleted, is_pinned) "
                        + "values ('COLLEGE', ?, 'Admin Foreign B', 'B', 'ADMIN', ?, 0, 0)",
                COLLEGE_B, ADMIN_A);

        String body = mvc.perform(get("/api/v1/announcements/fetchAll")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Admin Visible A"), body);
        assertTrue(!body.contains("Admin Foreign B"), body);
    }

    @Test
    void deleteAndRestoreRemainInsideAnnouncementScope() throws Exception {
        seedBase();
        long id = createCollegeAnnouncement("Recoverable Announcement", "Recover me", null, null);

        mvc.perform(delete("/api/v1/announcements/delete/" + id)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from announcements where id = ?", Integer.class, id));

        String deleted = mvc.perform(get("/api/v1/announcements/deleted")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(deleted.contains("Recoverable Announcement"), deleted);

        mvc.perform(post("/api/v1/announcements/restore/" + id)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from announcements where id = ?", Integer.class, id));
    }
}
