package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin course-progress aggregation and explicit learner retake-attempt lifecycle.
 */
@Transactional
@Rollback
class AdminCourseProgressRetakeMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 108201;
    private static final int COLLEGE_B = 108202;
    private static final int ADMIN_A = 108211;
    private static final int LEARNER_A = 108221;
    private static final int LEARNER_FOREIGN = 108222;
    private static final int DEPT_A = 108231;
    private static final int DEPT_B = 108232;
    private static final int PROGRAM_A = 108241;
    private static final int PROGRAM_B = 108242;
    private static final long BATCH_A = 108251L;
    private static final long BATCH_B = 108252L;
    private static final int CLASS_A = 108261;
    private static final int CLASS_B = 108262;
    private static final int COURSE_A = 108271;
    private static final int COURSE_B = 108272;
    private static final int LESSON_A = 108281;
    private static final int CONTENT_VIDEO = 108291;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Progress College A");
        seedCollege(COLLEGE_B, "Progress College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "ProgressAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "ProgressLearner");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "ProgressForeign");
        seedDepartment(DEPT_A, COLLEGE_A, "Progress Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Progress Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Progress Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Progress Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Progress Batch A', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Progress Batch B', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Progress Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Progress Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_FOREIGN);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'PRA', ?, 'Progress Course A', 0, 1, 1, 1, 'progress-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'PRB', ?, 'Progress Course B', 0, 1, 1, 1, 'progress-course-b-it', 0, 0)", COURSE_B, DEPT_B);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Progress Lesson A', ?, 1, 1, 1, 0, 0)", LESSON_A, COURSE_A);
        jdbc.update("insert into lesson_contents "
                + "(id, lesson_id, course_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                + "values (?, ?, ?, 1, 'video', 'Progress Video', JSON_OBJECT('link','https://example.test/video'), 1, 1, 0, 0, 0)",
                CONTENT_VIDEO, LESSON_A, COURSE_A);
        // Course A is taught in section A (CA-H01: progress is reported only for a course taught in the class).
        jdbc.update("insert into faculty_teaching_assignment "
                        + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                        + "values (108293, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)",
                ADMIN_A, COURSE_A, CLASS_A, BATCH_A);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void courseProgressCountsOnlyLatestAttemptCompletion() throws Exception {
        seedBase();
        jdbc.update("insert into learner_content_progress "
                + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, completed_at, first_completed_at, attempt, created_at, updated_at, is_deleted) "
                + "values (?, ?, 100, 100, now(), now(), 1, now(), now(), 0)",
                LEARNER_A, CONTENT_VIDEO);
        jdbc.update("insert into learner_content_progress "
                + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, completed_at, first_completed_at, attempt, created_at, updated_at, is_deleted) "
                + "values (?, ?, 0, 100, null, null, 2, now(), now(), 0)",
                LEARNER_A, CONTENT_VIDEO);

        String body = mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"measuredItemCount\":1"), body);
        assertTrue(body.contains("\"learnerCount\":1"), body);
        assertTrue(body.contains("\"videosCompleted\":0"), body);
        assertTrue(body.contains("\"percent\":0"), body);
    }

    @Test
    void courseNotTaughtInTheClassIsRefusedRatherThanReportedAgainstIt() throws Exception {
        seedBase();
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (108263, 'Progress Section C', ?, ?, 60, 0, 'SECTION', 0)", PROGRAM_A, BATCH_A);

        mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", "108263")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anotherSectionsContentIsNotCountedAgainstThisClass() throws Exception {
        seedBase();
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (108263, 'Progress Section C', ?, ?, 60, 0, 'SECTION', 0)", PROGRAM_A, BATCH_A);
        jdbc.update("insert into lesson_contents "
                + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                + "values (108292, ?, ?, 108263, 2, 'video', 'Section C only video', JSON_OBJECT('link','https://example.test/c'), 1, 1, 0, 0, 0)",
                LESSON_A, COURSE_A);
        jdbc.update("insert into learner_content_progress "
                + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, completed_at, first_completed_at, attempt, created_at, updated_at, is_deleted) "
                + "values (?, ?, 100, 100, now(), now(), 1, now(), now(), 0)",
                LEARNER_A, CONTENT_VIDEO);

        String body = mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"measuredItemCount\":1"), body);
        assertTrue(body.contains("\"percent\":100"), body);
    }

    @Test
    void courseProgressShowsCompletedCurrentAttemptAsHundredPercent() throws Exception {
        seedBase();
        jdbc.update("insert into learner_content_progress "
                + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, completed_at, first_completed_at, attempt, created_at, updated_at, is_deleted) "
                + "values (?, ?, 100, 100, now(), now(), 1, now(), now(), 0)",
                LEARNER_A, CONTENT_VIDEO);

        String body = mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"videosCompleted\":1"), body);
        assertTrue(body.contains("\"percent\":100"), body);
        assertTrue(body.contains("\"averagePercent\":100"), body);
    }

    @Test
    void startAttemptWithoutPriorProgressReportsAlreadyFreshWithoutInventingRows() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/admin/learner-progress/start-attempt")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"courseId\":" + COURSE_A + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"attempt\":1"), body);
        assertTrue(body.contains("\"alreadyFresh\":true"), body);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from learner_content_progress where learner_id = ? and lesson_content_id = ?",
                Integer.class, LEARNER_A, CONTENT_VIDEO));
    }

    @Test
    void startAttemptCopiesHistoryForwardResettingCurrentProgressButKeepingOldCompletion() throws Exception {
        seedBase();
        jdbc.update("insert into learner_content_progress "
                + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, completed_at, first_completed_at, attempt, created_at, updated_at, is_deleted) "
                + "values (?, ?, 95, 100, now(), now(), 1, now(), now(), 0)",
                LEARNER_A, CONTENT_VIDEO);

        String body = mvc.perform(post("/api/v1/admin/learner-progress/start-attempt")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"courseId\":" + COURSE_A + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"attempt\":2"), body);
        assertTrue(body.contains("\"previousAttempt\":1"), body);
        assertTrue(body.contains("\"contentItemsReset\":1"), body);
        assertEquals(2, jdbc.queryForObject(
                "select count(*) from learner_content_progress where learner_id = ? and lesson_content_id = ?",
                Integer.class, LEARNER_A, CONTENT_VIDEO));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from learner_content_progress where learner_id = ? and lesson_content_id = ? and attempt = 1 and completed_at is not null",
                Integer.class, LEARNER_A, CONTENT_VIDEO));
        assertEquals(0, jdbc.queryForObject(
                "select last_position_seconds from learner_content_progress where learner_id = ? and lesson_content_id = ? and attempt = 2",
                Integer.class, LEARNER_A, CONTENT_VIDEO));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from learner_content_progress where learner_id = ? and lesson_content_id = ? and attempt = 2 and completed_at is not null",
                Integer.class, LEARNER_A, CONTENT_VIDEO));
    }

    @Test
    void progressAndRetakeRejectCrossCollegeReferences() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", String.valueOf(CLASS_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/learner-progress/start-attempt")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_FOREIGN + ",\"courseId\":" + COURSE_A + "}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/learner-progress/start-attempt")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"courseId\":" + COURSE_B + "}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotUseAdminProgressOrRetakeSurfaces() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/admin/course-progress")
                        .param("courseId", String.valueOf(COURSE_A))
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/learner-progress/start-attempt")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"courseId\":" + COURSE_A + "}"))
                .andExpect(status().isForbidden());
    }
}
