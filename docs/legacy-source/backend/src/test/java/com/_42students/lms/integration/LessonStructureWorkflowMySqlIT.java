package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Lesson structure integration: admin CRUD/reorder/bulk state plus cross-tenant and role fences.
 */
@Transactional
@Rollback
class LessonStructureWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 102801;
    private static final int COLLEGE_B = 102802;
    private static final int ADMIN_A = 102811;
    private static final int FACULTY_A = 102812;
    private static final int LEARNER_A = 102821;
    private static final int DEPT_A = 102831;
    private static final int DEPT_B = 102832;
    private static final int COURSE_A = 102841;
    private static final int COURSE_B = 102842;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Lesson College A");
        seedCollege(COLLEGE_B, "Lesson College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "LessonAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "LessonFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "LessonLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Lesson Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Lesson Dept B");

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'LSA', ?, 'Lesson Course A', 0, 1, 1, 1, 'lesson-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'LSB', ?, 'Lesson Course B', 0, 1, 1, 1, 'lesson-course-b-it', 0, 0)", COURSE_B, DEPT_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private int createLesson(String name, long sequence) throws Exception {
        mvc.perform(post("/api/v1/lesson/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_name\":\"" + name + "\",\"course_id\":" + COURSE_A
                                + ",\"active\":true,\"enabled\":true,\"sequence\":" + sequence + "}"))
                .andExpect(status().isOk());

        return jdbc.queryForObject(
                "select id from lesson where course_id = ? and lesson_name = ? and is_deleted = 0",
                Integer.class, COURSE_A, name);
    }

    @Test
    void adminCreatesAndReadsLessonThroughRealApi() throws Exception {
        seedBase();
        createLesson("Lesson API One", 1);

        String body = mvc.perform(get("/api/v1/lesson/fetch")
                        .param("courseId", String.valueOf(COURSE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Lesson API One"), body);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from lesson where course_id = ? and lesson_name = 'Lesson API One' and is_deleted = 0",
                Integer.class, COURSE_A));
    }

    @Test
    void reorderAssignsDenseSequenceAndRejectsForeignLessonId() throws Exception {
        seedBase();
        int first = createLesson("First Lesson", 1);
        int second = createLesson("Second Lesson", 2);

        mvc.perform(put("/api/v1/lesson/reorder")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + COURSE_A + ",\"lessonIds\":[" + second + "," + first + "]}"))
                .andExpect(status().isOk());

        assertEquals(1L, jdbc.queryForObject("select sequence from lesson where id = ?", Long.class, second));
        assertEquals(2L, jdbc.queryForObject("select sequence from lesson where id = ?", Long.class, first));

        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (102851, 'Foreign Lesson', ?, 1, 1, 1, 0, 0)", COURSE_B);

        mvc.perform(put("/api/v1/lesson/reorder")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + COURSE_A + ",\"lessonIds\":[" + first + ",102851]}"))
                .andExpect(status().isBadRequest());

        assertEquals(2L, jdbc.queryForObject("select sequence from lesson where id = ?", Long.class, first));
    }

    @Test
    void bulkStatusUpdatesAccessibleLessonsAndReportsForeignLessonWithoutRollback() throws Exception {
        seedBase();
        int first = createLesson("Bulk Lesson One", 1);
        int second = createLesson("Bulk Lesson Two", 2);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (102852, 'Foreign Bulk Lesson', ?, 1, 1, 1, 0, 0)", COURSE_B);

        String body = mvc.perform(post("/api/v1/admin/lessons/bulk-status")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lessonIds\":[" + first + "," + second + ",102852],\"enabled\":false}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"updatedCount\":2"), body);
        assertTrue(body.contains("102852"), body);
        assertEquals(0, jdbc.queryForObject("select enabled from lesson where id = ?", Integer.class, first));
        assertEquals(0, jdbc.queryForObject("select enabled from lesson where id = ?", Integer.class, second));
        assertEquals(1, jdbc.queryForObject("select enabled from lesson where id = 102852", Integer.class));
    }

    @Test
    void lessonCannotMoveAcrossCollegeDuringUpdate() throws Exception {
        seedBase();
        int lessonId = createLesson("Tenant Locked Lesson", 1);

        mvc.perform(put("/api/v1/lesson/update/" + lessonId)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_name\":\"Moved Lesson\",\"course_id\":" + COURSE_B
                                + ",\"active\":true,\"enabled\":true,\"sequence\":1}"))
                .andExpect(status().isForbidden());

        assertEquals(COURSE_A, jdbc.queryForObject(
                "select course_id from lesson where id = ?", Integer.class, lessonId));
    }

    @Test
    void deleteAndRestoreKeepLessonRowButDoNotPretendContentsReturn() throws Exception {
        seedBase();
        int lessonId = createLesson("Recoverable Lesson", 1);

        mvc.perform(delete("/api/v1/lesson/delete/" + lessonId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject("select is_deleted from lesson where id = ?", Integer.class, lessonId));

        String deleted = mvc.perform(get("/api/v1/lesson/deleted")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(deleted.contains("Recoverable Lesson"), deleted);

        mvc.perform(post("/api/v1/lesson/restore/" + lessonId)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject("select is_deleted from lesson where id = ?", Integer.class, lessonId));
    }

    @Test
    void learnerAndRegularFacultyCannotCreateLessonStructure() throws Exception {
        seedBase();

        for (String token : new String[]{
                accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A)),
                accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A))
        }) {
            mvc.perform(post("/api/v1/lesson/create")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lesson_name\":\"Unauthorized Lesson\",\"course_id\":" + COURSE_A
                                    + ",\"active\":true,\"enabled\":true,\"sequence\":1}"))
                    .andExpect(status().isForbidden());
        }

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lesson where lesson_name = 'Unauthorized Lesson'",
                Integer.class));
    }
}
