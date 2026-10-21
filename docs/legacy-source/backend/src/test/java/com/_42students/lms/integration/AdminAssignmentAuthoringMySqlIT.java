package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin assignment authoring/oversight/publish integration against real MySQL.
 */
@Transactional
@Rollback
class AdminAssignmentAuthoringMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 103001;
    private static final int COLLEGE_B = 103002;
    private static final int ADMIN_A = 103011;
    private static final int FACULTY_A = 103012;
    private static final int LEARNER_A = 103021;
    private static final int LEARNER_B = 103022;
    private static final int DEPT_A = 103031;
    private static final int DEPT_B = 103032;
    private static final int COURSE_A = 103041;
    private static final int COURSE_B = 103042;
    private static final int LESSON_A = 103051;
    private static final int LESSON_B = 103052;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Assignment Authoring College A");
        seedCollege(COLLEGE_B, "Assignment Authoring College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "AssignmentAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "AssignmentFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "AssignmentLearnerA");
        seedLearner(LEARNER_B, COLLEGE_A, "AssignmentLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Assignment Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Assignment Dept B");

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'AAA', ?, 'Assignment Authoring A', 0, 1, 1, 1, 'assignment-author-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'AAB', ?, 'Assignment Authoring B', 0, 1, 1, 1, 'assignment-author-b-it', 0, 0)", COURSE_B, DEPT_B);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Assignment Lesson A', ?, 1, 1, 1, 0, 0)", LESSON_A, COURSE_A);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Assignment Lesson B', ?, 1, 1, 1, 0, 0)", LESSON_B, COURSE_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String assignmentBody(int lessonId, String title) {
        return "{\"lesson_id\":" + lessonId
                + ",\"content_type\":\"assignment\",\"content_title\":\"" + title + "\""
                + ",\"points\":10,\"active\":true,\"enabled\":true,\"sequence\":1"
                + ",\"deadline\":\"" + LocalDateTime.now().plusDays(2).withNano(0) + "\""
                + ",\"content_data_dto\":{\"assignment_resources\":["
                + "{\"id\":\"instructions\",\"type\":\"INSTRUCTIONS\",\"title\":\"Instructions\","
                + "\"text\":\"<p>Complete the integration assignment</p>\"}],"
                + "\"allowed_submission_types\":[\"WRITTEN_RESPONSE\"],"
                + "\"html_content\":\"<p>Assignment details</p>\"}}";
    }

    private int createAssignment(String title) throws Exception {
        mvc.perform(post("/api/v1/admin/assignments/content/save")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignmentBody(LESSON_A, title)))
                .andExpect(status().isOk());

        Integer id = flushedQuery(
                "select id from lesson_contents where lesson_id = ? and content_title = ? and is_deleted = 0",
                Integer.class, LESSON_A, title);
        assertNotNull(id);
        return id;
    }

    @Test
    void adminCreatesValidatedAssignmentWithDeadlineAndSubmissionSchema() throws Exception {
        seedBase();
        int id = createAssignment("Integration Assignment");

        assertEquals("assignment", flushedQuery(
                "select content_type from lesson_contents where id = ?", String.class, id));
        assertEquals(10L, flushedQuery(
                "select points from lesson_contents where id = ?", Long.class, id));
        assertNotNull(flushedQuery(
                "select deadline from lesson_contents where id = ?", java.sql.Timestamp.class, id));

        String json = flushedQuery(
                "select cast(content_data as char) from lesson_contents where id = ?", String.class, id);
        assertTrue(json.contains("WRITTEN_RESPONSE"), json);
        assertTrue(json.contains("Complete the integration assignment"), json);
    }

    @Test
    void assignmentWithoutRequiredResourcesIsRejectedWithoutRow() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/assignments/content/save")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_id\":" + LESSON_A
                                + ",\"content_type\":\"assignment\",\"content_title\":\"Invalid Assignment\","
                                + "\"points\":10,\"content_data_dto\":{\"allowed_submission_types\":[\"WRITTEN_RESPONSE\"]}}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, flushedQuery(
                "select count(*) from lesson_contents where content_title = 'Invalid Assignment'",
                Integer.class));
    }

    @Test
    void learnerAndRegularFacultyCannotUseAdminAssignmentAuthoringSurface() throws Exception {
        seedBase();

        for (String token : new String[]{
                accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A)),
                accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A))
        }) {
            mvc.perform(post("/api/v1/admin/assignments/content/save")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(assignmentBody(LESSON_A, "Unauthorized Assignment")))
                    .andExpect(status().isForbidden());
        }

        assertEquals(0, flushedQuery(
                "select count(*) from lesson_contents where content_title = 'Unauthorized Assignment'",
                Integer.class));
    }

    @Test
    void adminCannotAuthorAssignmentAgainstForeignCollegeLesson() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/assignments/content/save")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignmentBody(LESSON_B, "Foreign Assignment")))
                .andExpect(status().isForbidden());

        assertEquals(0, flushedQuery(
                "select count(*) from lesson_contents where lesson_id = ?",
                Integer.class, LESSON_B));
    }

    @Test
    void collegeOversightListsOwnAssignmentButNotForeignCollegeAssignment() throws Exception {
        seedBase();
        createAssignment("Visible Admin Assignment");
        jdbc.update("insert into lesson_contents "
                        + "(id, lesson_id, course_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                        + "values (103061, ?, ?, 1, 'assignment', 'Foreign Admin Assignment', "
                        + "JSON_OBJECT('allowed_submission_types', JSON_ARRAY('WRITTEN_RESPONSE')), 1, 1, 10, 0, 0)",
                LESSON_B, COURSE_B);

        String body = mvc.perform(get("/api/v1/admin/assignments")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Visible Admin Assignment"), body);
        assertTrue(!body.contains("Foreign Admin Assignment"), body);
    }

    @Test
    void editingPublishedGradeUnpublishesItUntilExplicitRepublish() throws Exception {
        seedBase();
        int assignmentId = createAssignment("Editable Published Grade");

        jdbc.update("insert into student_assignment "
                        + "(id, assignment_name, lesson_content_id, student_id, student_first_name, points, points_obtained, "
                        + "graded, grading_status, graded_by, graded_at, attempt_number, is_grade_published, version, is_deleted) "
                        + "values (103073, 'Editable Published Grade', ?, ?, 'A', 10, 8, 1, 'MANUALLY_GRADED', ?, now(), 1, 1, 0, 0)",
                assignmentId, LEARNER_A, ADMIN_A);

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/assignment/updatePoints")
                        .param("studentAssignmentId", "103073")
                        .param("pointsObtained", "9")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(9L, flushedQuery(
                "select points_obtained from student_assignment where id = 103073", Long.class));
        assertEquals(0, flushedQuery(
                "select is_grade_published from student_assignment where id = 103073", Integer.class));

        String hidden = mvc.perform(get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer "
                                + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hidden.contains("\"pointsObtained\":0"), hidden);
        assertTrue(!hidden.contains("\"pointsObtained\":9"), hidden);

        mvc.perform(post("/api/v1/assignment/publishGrade")
                        .param("studentAssignmentId", "103073")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(1, flushedQuery(
                "select is_grade_published from student_assignment where id = 103073", Integer.class));

        String visible = mvc.perform(get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer "
                                + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(visible.contains("\"pointsObtained\":9"), visible);
    }

    @Test
    void repeatedGradePublishIsIdempotentAndDoesNotChangeScore() throws Exception {
        seedBase();
        int assignmentId = createAssignment("Idempotent Grade Publish");

        jdbc.update("insert into student_assignment "
                        + "(id, assignment_name, lesson_content_id, student_id, student_first_name, points, points_obtained, "
                        + "graded, grading_status, graded_by, graded_at, attempt_number, is_grade_published, version, is_deleted) "
                        + "values (103074, 'Idempotent Grade Publish', ?, ?, 'A', 10, 7, 1, 'MANUALLY_GRADED', ?, now(), 1, 0, 0, 0)",
                assignmentId, LEARNER_A, ADMIN_A);

        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/v1/assignment/publishGrade")
                            .param("studentAssignmentId", "103074")
                            .header("Authorization", "Bearer " + adminToken()))
                    .andExpect(status().isOk());
        }

        assertEquals(1, flushedQuery(
                "select is_grade_published from student_assignment where id = 103074", Integer.class));
        assertEquals(7L, flushedQuery(
                "select points_obtained from student_assignment where id = 103074", Long.class));
        assertEquals(1, flushedQuery(
                "select count(*) from student_assignment where id = 103074", Integer.class));
    }

    @Test
    void bulkPublishPublishesOnlyGradedSubmissionsAndSkipsUngraded() throws Exception {
        seedBase();
        int assignmentId = createAssignment("Publish Grades Assignment");

        jdbc.update("insert into student_assignment "
                        + "(id, assignment_name, lesson_content_id, student_id, student_first_name, points, points_obtained, "
                        + "graded, grading_status, graded_by, attempt_number, is_grade_published, version, is_deleted) "
                        + "values (103071, 'Publish Grades Assignment', ?, ?, 'A', 10, 8, 1, 'MANUALLY_GRADED', ?, 1, 0, 0, 0)",
                assignmentId, LEARNER_A, ADMIN_A);
        jdbc.update("insert into student_assignment "
                        + "(id, assignment_name, lesson_content_id, student_id, student_first_name, points, points_obtained, "
                        + "graded, grading_status, attempt_number, is_grade_published, version, is_deleted) "
                        + "values (103072, 'Publish Grades Assignment', ?, ?, 'B', 10, 0, 0, 'NOT_GRADED', 1, 0, 0, 0)",
                assignmentId, LEARNER_B);

        String body = mvc.perform(post("/api/v1/admin/assignments/" + assignmentId + "/publish-grades")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"published\":1"), body);
        assertTrue(body.contains("\"skippedUngraded\":1"), body);
        assertEquals(1, flushedQuery(
                "select is_grade_published from student_assignment where id = 103071",
                Integer.class));
        assertEquals(0, flushedQuery(
                "select is_grade_published from student_assignment where id = 103072",
                Integer.class));
    }
}
