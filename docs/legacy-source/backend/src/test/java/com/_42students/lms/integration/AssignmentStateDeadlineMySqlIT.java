package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Assignment submission-state integration at the HTTP boundary. The frontend may use these
 * contracts to suppress stale actions, but the backend remains authoritative when a client is
 * stale, malicious or racing a deadline.
 */
@Transactional
@Rollback
class AssignmentStateDeadlineMySqlIT extends AbstractMySqlHttpIT {

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private static final int COLLEGE_A = 101201;
    private static final int COLLEGE_B = 101202;
    private static final int LEARNER_A = 101221;
    private static final int LEARNER_B = 101222;
    private static final int DEPT_A = 101231;
    private static final int DEPT_B = 101232;
    private static final int PROGRAM_A = 101241;
    private static final int PROGRAM_B = 101242;
    private static final int CLASS_A = 101251;
    private static final int CLASS_B = 101252;
    private static final int COURSE_A = 101261;
    private static final int COURSE_B = 101262;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Assignment State College A");
        seedCollege(COLLEGE_B, "Assignment State College B");
        seedLearner(LEARNER_A, COLLEGE_A, "AssignmentLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "AssignmentLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Assignment Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Assignment Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Assignment Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Assignment Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (101271, 'Assignment Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (101272, 'Assignment Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Assignment Section A', ?, 101271, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Assignment Section B', ?, 101272, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ASA', ?, 'Assignment Course A', 0, 1, 1, 1, 'assignment-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ASB', ?, 'Assignment Course B', 0, 1, 1, 1, 'assignment-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101281, ?, 1, 'Semester 1 A', 1, 20, 0)", PROGRAM_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101282, ?, 1, 'Semester 1 B', 1, 20, 0)", PROGRAM_B);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (101291, 101281, ?, 1, 3, 1, 0)", COURSE_A);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (101292, 101282, ?, 1, 3, 1, 0)", COURSE_B);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_B);
    }

    private void seedAssignment(int contentId, int courseId, int classId,
                                boolean active, boolean enabled, LocalDateTime deadline) {
        jdbc.update("insert into lesson_contents "
                        + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, active, enabled, points, deadline, version, is_deleted) "
                        + "values (?, 0, ?, ?, 1, 'assignment', ?, "
                        + "JSON_OBJECT('allowed_submission_types', JSON_ARRAY('WRITTEN_RESPONSE')), ?, ?, 10, ?, 0, 0)",
                contentId, courseId, classId, "Assignment " + contentId,
                active, enabled, Timestamp.valueOf(deadline));
    }

    private String tokenA() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    private String writtenBody(int contentId, int claimedStudentId) {
        return "{\"lesson_content_id\":" + contentId
                + ",\"student_id\":" + claimedStudentId
                + ",\"submission_type\":\"WRITTEN_RESPONSE\","
                + "\"html_content\":\"<p>Integration answer</p>\"}";
    }

    @Test
    void pastDeadlineAssignmentRejectsSubmissionWithoutPersistence() throws Exception {
        seedBase();
        int contentId = 101301;
        seedAssignment(contentId, COURSE_A, CLASS_A, true, true,
                LocalDateTime.now(INDIA).minusMinutes(5));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writtenBody(contentId, LEARNER_A)))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ?",
                Integer.class, contentId));
    }

    @Test
    void inactiveAssignmentRejectsSubmissionWithoutPersistence() throws Exception {
        seedBase();
        int contentId = 101302;
        seedAssignment(contentId, COURSE_A, CLASS_A, false, true,
                LocalDateTime.now(INDIA).plusHours(2));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writtenBody(contentId, LEARNER_A)))
                .andExpect(status().isConflict());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ?",
                Integer.class, contentId));
    }

    @Test
    void validWrittenSubmissionPersistsOnceAndDuplicateIsRejected() throws Exception {
        seedBase();
        int contentId = 101303;
        seedAssignment(contentId, COURSE_A, CLASS_A, true, true,
                LocalDateTime.now(INDIA).plusHours(2));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writtenBody(contentId, LEARNER_A)))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ? and student_id = ?",
                Integer.class, contentId, LEARNER_A));
        assertEquals("WRITTEN_RESPONSE", jdbc.queryForObject(
                "select submission_type from student_assignment where lesson_content_id = ? and student_id = ?",
                String.class, contentId, LEARNER_A));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writtenBody(contentId, LEARNER_A)))
                .andExpect(status().isBadRequest());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ? and student_id = ?",
                Integer.class, contentId, LEARNER_A));
    }

    @Test
    void controllerIgnoresSpoofedStudentIdAndPersistsAuthenticatedLearner() throws Exception {
        seedBase();
        int contentId = 101304;
        seedAssignment(contentId, COURSE_A, CLASS_A, true, true,
                LocalDateTime.now(INDIA).plusHours(2));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        // Body claims another learner; controller must overwrite it from JWT.
                        .content(writtenBody(contentId, LEARNER_B)))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ? and student_id = ?",
                Integer.class, contentId, LEARNER_A));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ? and student_id = ?",
                Integer.class, contentId, LEARNER_B));
    }

    @Test
    void learnerCannotSubmitAssignmentFromAnotherCollegeOrClass() throws Exception {
        seedBase();
        int contentId = 101305;
        seedAssignment(contentId, COURSE_B, CLASS_B, true, true,
                LocalDateTime.now(INDIA).plusHours(2));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + tokenA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(writtenBody(contentId, LEARNER_A)))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ?",
                Integer.class, contentId));
    }
}
