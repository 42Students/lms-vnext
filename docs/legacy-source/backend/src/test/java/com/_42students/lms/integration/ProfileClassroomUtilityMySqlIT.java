package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Profile/media/discussion/classroom ownership and identity boundaries.
 */
@Transactional
@Rollback
class ProfileClassroomUtilityMySqlIT extends AbstractMySqlHttpIT {

    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    /**
     * The class is @Transactional, so requests join the test transaction and Hibernate writes their changes only on
     * commit or flush. Flush before reading with plain JDBC so the checks see what a committed request wrote.
     */
    private org.springframework.jdbc.core.JdbcTemplate flushed() {
        entityManager.flush();
        return jdbc;
    }

    private static final int COLLEGE_A = 108801;
    private static final int COLLEGE_B = 108802;
    private static final int FACULTY_A = 108811;
    private static final int FACULTY_B = 108812;
    private static final int LEARNER_A = 108821;
    private static final int LEARNER_B = 108822;
    private static final int LEARNER_FOREIGN = 108823;
    private static final int DEPT_A = 108831;
    private static final int DEPT_B = 108832;
    private static final int PROGRAM_A = 108841;
    private static final int PROGRAM_B = 108842;
    private static final long BATCH_A = 108851L;
    private static final long BATCH_B = 108852L;
    private static final int CLASS_A = 108861;
    private static final int CLASS_B = 108862;
    private static final int COURSE_A = 108871;
    private static final int COURSE_B = 108872;
    private static final int LESSON_A = 108881;
    private static final int LESSON_B = 108882;
    private static final int CONTENT_A = 108891;
    private static final int CONTENT_B = 108892;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Profile Utility College A");
        seedCollege(COLLEGE_B, "Profile Utility College B");
        seedFaculty(FACULTY_A, COLLEGE_A, "ProfileFacultyA");
        seedFaculty(FACULTY_B, COLLEGE_A, "ProfileFacultyB");
        seedLearner(LEARNER_A, COLLEGE_A, "ProfileLearnerA");
        seedLearner(LEARNER_B, COLLEGE_A, "ProfileLearnerB");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "ProfileLearnerForeign");
        seedDepartment(DEPT_A, COLLEGE_A, "Profile Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Profile Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Profile Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Profile Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Profile Batch A', ?, 2, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Profile Batch B', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Profile Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Profile Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("update learner set program_id = ?, class_id = ?, roll_number = 'A-001' where id = ?",
                PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ?, roll_number = 'A-002' where id = ?",
                PROGRAM_A, CLASS_A, LEARNER_B);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?",
                PROGRAM_B, CLASS_B, LEARNER_FOREIGN);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'PCA', ?, 'Profile Course A', 0, 1, 1, 1, 'profile-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'PCB', ?, 'Profile Course B', 0, 1, 1, 1, 'profile-course-b-it', 0, 0)", COURSE_B, DEPT_B);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (108883, ?, 1, 'Profile Semester A', 1, 20, 0)", PROGRAM_A);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (108884, 108883, ?, 1, 3, 1, 0)", COURSE_A);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Profile Lesson A', ?, 1, 1, 1, 0, 0)", LESSON_A, COURSE_A);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Profile Lesson B', ?, 1, 1, 1, 0, 0)", LESSON_B, COURSE_B);
        jdbc.update("insert into lesson_contents "
                + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                + "values (?, ?, ?, ?, 1, 'lecture', 'Discussion Content A', JSON_OBJECT('html_content','A'), 1, 1, 0, 0, 0)",
                CONTENT_A, LESSON_A, COURSE_A, CLASS_A);
        jdbc.update("insert into lesson_contents "
                + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                + "values (?, ?, ?, ?, 1, 'lecture', 'Discussion Content B', JSON_OBJECT('html_content','B'), 1, 1, 0, 0, 0)",
                CONTENT_B, LESSON_B, COURSE_B, CLASS_B);
    }

    private String learnerToken(int id, int collegeId) {
        return accessToken(learnerPrincipal(id, collegeId));
    }

    private String facultyToken(int id) {
        return accessToken(facultyPrincipal(id, "LECTURER", COLLEGE_A));
    }

    @Test
    void learnerCanUpdateOwnAboutButCannotReadOrWriteAnotherLearnerProfile() throws Exception {
        seedBase();
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(put("/api/v1/profile/learner/" + LEARNER_A + "/about")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"<script>alert(1)</script>My profile\"}"))
                .andExpect(status().isOk());

        String stored = flushed().queryForObject(
                "select description from learner where id = ?", String.class, LEARNER_A);
        assertTrue(stored.contains("My profile"), stored);
        assertTrue(!stored.contains("<script"), stored);

        mvc.perform(get("/api/v1/profile/learner/" + LEARNER_B + "/about")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/profile/learner/" + LEARNER_B + "/about")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"IDOR\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void facultyCanUpdateOwnAboutButCannotMutatePeerProfileAndLearnerCannotReadFacultyProfile() throws Exception {
        seedBase();
        String faculty = facultyToken(FACULTY_A);

        mvc.perform(put("/api/v1/profile/faculty/" + FACULTY_A + "/about")
                        .header("Authorization", "Bearer " + faculty)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"<b>Teaching</b> profile\"}"))
                .andExpect(status().isOk());

        assertEquals("Teaching profile", flushed().queryForObject(
                "select description from faculty where id = ?", String.class, FACULTY_A));

        mvc.perform(put("/api/v1/profile/faculty/" + FACULTY_B + "/about")
                        .header("Authorization", "Bearer " + faculty)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Peer attack\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/profile/faculty/" + FACULTY_A + "/about")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentImageReadAndDeactivateAreSelfOnlyForLearners() throws Exception {
        seedBase();
        jdbc.update("insert into student_image (learner_id, image_data) values (?, ?)",
                String.valueOf(LEARNER_A),
                "[{\"imageId\":\"profileimg01\",\"imageUrl\":\"https://cdn.example.test/profile.jpg\",\"active\":1}]");

        String token = learnerToken(LEARNER_A, COLLEGE_A);
        String body = mvc.perform(get("/api/v1/learner-images/getImageDataByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("profileimg01"), body);

        mvc.perform(patch("/api/v1/learner-images/deactivateImageByImageIdAndLearnerId")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":\"" + LEARNER_A + "\",\"imageId\":\"profileimg01\"}"))
                .andExpect(status().isOk());

        String json = flushed().queryForObject(
                "select image_data from student_image where learner_id = ?", String.class, String.valueOf(LEARNER_A));
        assertTrue(json.contains("\"active\":0"), json);

        mvc.perform(get("/api/v1/learner-images/getImageDataByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void discussionPostOverridesSpoofedIdentityAndSanitizesContent() throws Exception {
        seedBase();
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/discussion/post")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_content_id\":" + CONTENT_A + ",\"content_text\":\"<script>x</script>Hello class\","
                                + "\"sequence\":1,\"user_id\":" + LEARNER_B + ",\"user_name\":\"spoofed\",\"profile_name\":\"spoofed\"}"))
                .andExpect(status().isOk());

        assertEquals(LEARNER_A, flushed().queryForObject(
                "select user_id from discussions where lesson_content_id = ? order by id desc limit 1",
                Integer.class, CONTENT_A));
        String content = flushed().queryForObject(
                "select content_text from discussions where lesson_content_id = ? order by id desc limit 1",
                String.class, CONTENT_A);
        assertTrue(content.contains("Hello class"), content);
        assertTrue(!content.contains("<script"), content);
        assertEquals("ProfileLearnerA Integration", flushed().queryForObject(
                "select profile_name from discussions where lesson_content_id = ? order by id desc limit 1",
                String.class, CONTENT_A));
    }

    @Test
    void learnerCannotPostOrFetchDiscussionFromForeignClassContent() throws Exception {
        seedBase();
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/discussion/post")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_content_id\":" + CONTENT_B + ",\"content_text\":\"tenant attack\",\"sequence\":1}"))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/discussion/fetchDiscussion")
                        .param("lessonContentId", String.valueOf(CONTENT_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        assertEquals(0, flushed().queryForObject(
                "select count(*) from discussions where lesson_content_id = ?",
                Integer.class, CONTENT_B));
    }

    @Test
    void learnerPostsClassroomMessageWithServerDerivedIdentityAndCanDeleteOwnMessage() throws Exception {
        seedBase();
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/classroom/messages")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + COURSE_A + ",\"classId\":" + CLASS_A
                                + ",\"messageText\":\"  Hello classroom  \"}"))
                .andExpect(status().isOk());

        Integer id = flushed().queryForObject(
                "select id from classroom_messages where course_id = ? and class_id = ? order by id desc limit 1",
                Integer.class, COURSE_A, CLASS_A);
        assertEquals(LEARNER_A, flushed().queryForObject(
                "select sender_id from classroom_messages where id = ?", Integer.class, id));
        assertEquals("Learner", flushed().queryForObject(
                "select sender_role from classroom_messages where id = ?", String.class, id));
        assertEquals("Hello classroom", flushed().queryForObject(
                "select message_text from classroom_messages where id = ?", String.class, id));

        mvc.perform(delete("/api/v1/classroom/messages/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertEquals(1, flushed().queryForObject(
                "select is_deleted from classroom_messages where id = ?", Integer.class, id));
    }

    @Test
    void learnerCannotPinClassroomMessagesOrReadForeignClassChat() throws Exception {
        seedBase();
        jdbc.update("insert into classroom_messages "
                + "(id, course_id, class_id, sender_id, sender_name, sender_role, message_text, is_pinned, is_deleted) "
                + "values (108899, ?, ?, ?, 'ProfileLearnerA', 'Learner', 'Pin me', 0, 0)",
                COURSE_A, CLASS_A, LEARNER_A);
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(patch("/api/v1/classroom/messages/108899/pin")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/classroom/messages")
                        .param("courseId", String.valueOf(COURSE_B))
                        .param("classId", String.valueOf(CLASS_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        assertEquals(0, flushed().queryForObject(
                "select is_pinned from classroom_messages where id = 108899", Integer.class));
    }
}
