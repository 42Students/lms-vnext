package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Quiz state/deadline integration at the HTTP boundary. This is the backend contract the frontend
 * must use to hide/disable impossible quiz actions before a learner clicks them.
 */
@Transactional
@Rollback
class QuizStateDeadlineMySqlIT extends AbstractMySqlHttpIT {

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    /** The class-level transaction spans MockMvc calls; JdbcTemplate reads do not auto-flush JPA updates. */
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private static final int COLLEGE_A = 101001;
    private static final int COLLEGE_B = 101002;
    private static final int LEARNER_A = 101021;
    private static final int LEARNER_B = 101022;
    private static final int DEPT_A = 101031;
    private static final int DEPT_B = 101032;
    private static final int PROGRAM_A = 101041;
    private static final int PROGRAM_B = 101042;
    private static final int CLASS_A = 101051;
    private static final int CLASS_B = 101052;
    private static final int COURSE_A = 101061;
    private static final int COURSE_B = 101062;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Quiz State College A");
        seedCollege(COLLEGE_B, "Quiz State College B");
        seedLearner(LEARNER_A, COLLEGE_A, "QuizLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "QuizLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Quiz Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Quiz Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Quiz Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Quiz Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                        + "values (101071, 'Quiz Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                        + "values (101072, 'Quiz Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Quiz Section A', ?, 101071, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Quiz Section B', ?, 101072, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'QZA', ?, 'Quiz Course A', 0, 1, 1, 1, 'quiz-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'QZB', ?, 'Quiz Course B', 0, 1, 1, 1, 'quiz-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101081, ?, 1, 'Semester 1 A', 1, 20, 0)", PROGRAM_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101082, ?, 1, 'Semester 1 B', 1, 20, 0)", PROGRAM_B);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (101091, 101081, ?, 1, 3, 1, 0)", COURSE_A);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (101092, 101082, ?, 1, 3, 1, 0)", COURSE_B);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_B);
    }

    private void seedQuiz(int quizId, int courseId, int classId, String status, LocalDateTime dueAt, int maxAttempts) {
        jdbc.update("insert into quizzes "
                        + "(id, lesson_id, course_id, class_id, title, description, status, due_at, max_attempts, total_points, "
                        + "active, enabled, is_grade_published, shuffle_questions, shuffle_options, is_deleted) "
                        + "values (?, 0, ?, ?, ?, 'Integration quiz', ?, ?, ?, 1, 1, 1, 1, 0, 0, 0)",
                quizId, courseId, classId, "Quiz " + quizId, status, Timestamp.valueOf(dueAt), maxAttempts);

        jdbc.update("insert into quiz_questions (id, quiz_id, question_type, prompt, points, sequence, is_deleted) "
                        + "values (?, ?, 'SINGLE_CHOICE', 'Pick the correct option', 1, 1, 0)",
                quizId + 10, quizId);
        jdbc.update("insert into quiz_options (id, question_id, option_text, correct, sequence, is_deleted) "
                        + "values (?, ?, 'Correct', 1, 1, 0)",
                quizId + 20, quizId + 10);
        jdbc.update("insert into quiz_options (id, question_id, option_text, correct, sequence, is_deleted) "
                        + "values (?, ?, 'Wrong', 0, 2, 0)",
                quizId + 21, quizId + 10);
    }

    private String learnerAToken() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    private String answerBody(int quizId) {
        return "{\"answers\":[{\"questionId\":" + (quizId + 10)
                + ",\"selectedOptionIds\":[" + (quizId + 20) + "]}]}";
    }

    @Test
    void pastDueQuizCannotBeOpenedForAttemptOrSubmitted() throws Exception {
        seedBase();
        int quizId = 101101;
        seedQuiz(quizId, COURSE_A, CLASS_A, "PUBLISHED",
                LocalDateTime.now(INDIA).minusMinutes(5), 1);

        mvc.perform(get("/api/v1/quizzes/" + quizId + "/attempt")
                        .header("Authorization", "Bearer " + learnerAToken()))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/quizzes/" + quizId + "/submit")
                        .header("Authorization", "Bearer " + learnerAToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerBody(quizId)))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ? and learner_id = ?",
                Integer.class, quizId, LEARNER_A));
    }

    @Test
    void draftQuizIsNotAttemptableOrSubmittableByLearner() throws Exception {
        seedBase();
        int quizId = 101102;
        seedQuiz(quizId, COURSE_A, CLASS_A, "DRAFT",
                LocalDateTime.now(INDIA).plusHours(2), 1);

        mvc.perform(get("/api/v1/quizzes/" + quizId + "/attempt")
                        .header("Authorization", "Bearer " + learnerAToken()))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/v1/quizzes/" + quizId + "/submit")
                        .header("Authorization", "Bearer " + learnerAToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerBody(quizId)))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ?",
                Integer.class, quizId));
    }

    @Test
    void publishedQuizAllowsOneAttemptThenEnforcesAttemptLimit() throws Exception {
        seedBase();
        int quizId = 101103;
        seedQuiz(quizId, COURSE_A, CLASS_A, "PUBLISHED",
                LocalDateTime.now(INDIA).plusHours(2), 1);

        mvc.perform(get("/api/v1/quizzes/" + quizId + "/attempt")
                        .header("Authorization", "Bearer " + learnerAToken()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/quizzes/" + quizId + "/submit")
                        .header("Authorization", "Bearer " + learnerAToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerBody(quizId)))
                .andExpect(status().isOk());
        entityManager.flush();

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ? and learner_id = ? and is_deleted = 0",
                Integer.class, quizId, LEARNER_A));
        assertEquals(1, jdbc.queryForObject(
                "select score from quiz_attempts where quiz_id = ? and learner_id = ?",
                Integer.class, quizId, LEARNER_A));

        mvc.perform(post("/api/v1/quizzes/" + quizId + "/submit")
                        .header("Authorization", "Bearer " + learnerAToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerBody(quizId)))
                .andExpect(status().isBadRequest());
        entityManager.flush();

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ? and learner_id = ?",
                Integer.class, quizId, LEARNER_A));
    }

    @Test
    void learnerCannotUseQuizIdToCrossCollegeBoundary() throws Exception {
        seedBase();
        int quizId = 101104;
        seedQuiz(quizId, COURSE_B, CLASS_B, "PUBLISHED",
                LocalDateTime.now(INDIA).plusHours(2), 1);

        mvc.perform(get("/api/v1/quizzes/" + quizId + "/attempt")
                        .header("Authorization", "Bearer " + learnerAToken()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/quizzes/" + quizId + "/submit")
                        .header("Authorization", "Bearer " + learnerAToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerBody(quizId)))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ?",
                Integer.class, quizId));
    }
}
