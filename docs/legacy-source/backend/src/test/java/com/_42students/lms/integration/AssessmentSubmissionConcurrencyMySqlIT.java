package com._42students.lms.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * True two-request races for learner assessment submission.
 */
class AssessmentSubmissionConcurrencyMySqlIT extends AbstractMySqlHttpIT {

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private static final int COLLEGE = 109801;
    private static final int LEARNER = 109811;
    private static final int DEPT = 109821;
    private static final int PROGRAM = 109831;
    private static final long BATCH = 109841L;
    private static final int CLASS_ID = 109851;
    private static final int COURSE = 109861;
    private static final int SEMESTER = 109871;
    private static final int SEMESTER_COURSE = 109881;
    private static final int QUIZ = 109891;
    private static final int QUESTION = 109892;
    private static final int CORRECT_OPTION = 109893;
    private static final int WRONG_OPTION = 109894;
    private static final int ASSIGNMENT = 109895;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from quiz_answers where attempt_id in (select id from quiz_attempts where quiz_id = ?)", QUIZ);
        jdbc.update("delete from quiz_attempts where quiz_id = ?", QUIZ);
        jdbc.update("delete from quiz_options where question_id = ?", QUESTION);
        jdbc.update("delete from quiz_questions where quiz_id = ?", QUIZ);
        jdbc.update("delete from quizzes where id = ?", QUIZ);

        jdbc.update("delete from assignment_upload_receipt where student_assignment_id in "
                + "(select id from student_assignment where lesson_content_id = ?)", ASSIGNMENT);
        jdbc.update("delete from student_assignment where lesson_content_id = ?", ASSIGNMENT);
        jdbc.update("delete from notification where learner_id = ?", LEARNER);
        jdbc.update("delete from learner_content_progress where learner_id = ? and lesson_content_id in (?, ?)",
                LEARNER, QUIZ, ASSIGNMENT);
        jdbc.update("delete from lesson_contents where id = ?", ASSIGNMENT);

        jdbc.update("delete from semester_course where id = ?", SEMESTER_COURSE);
        jdbc.update("delete from semester where id = ?", SEMESTER);
        jdbc.update("delete from course where id = ?", COURSE);
        jdbc.update("delete from class where id = ?", CLASS_ID);
        jdbc.update("delete from batch where id = ?", BATCH);
        jdbc.update("delete from new_program where id = ?", PROGRAM);
        jdbc.update("delete from department where id = ?", DEPT);
        jdbc.update("delete from learner where id = ?", LEARNER);
        jdbc.update("delete from college where id = ?", COLLEGE);
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Assessment Race College");
        seedLearner(LEARNER, COLLEGE, "AssessmentRaceLearner");
        seedDepartment(DEPT, COLLEGE, "Assessment Race Dept");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) "
                + "values (?, 'Assessment Race Program', ?, 4, 0)", PROGRAM, DEPT);
        jdbc.update("insert into batch "
                + "(id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Assessment Race Batch', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())",
                BATCH, PROGRAM);
        jdbc.update("insert into class "
                + "(id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Assessment Race Section', ?, ?, 60, 0, 'SECTION', 0)",
                CLASS_ID, PROGRAM, BATCH);
        jdbc.update("insert into course "
                + "(id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ARC', ?, 'Assessment Race Course', 0, 1, 1, 1, 'assessment-race-course-it', 0, 0)",
                COURSE, DEPT);
        jdbc.update("insert into semester "
                + "(id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (?, ?, 1, 'Assessment Race Semester', 1, 20, 0)",
                SEMESTER, PROGRAM);
        jdbc.update("insert into semester_course "
                + "(id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (?, ?, ?, 1, 3, 1, 0)",
                SEMESTER_COURSE, SEMESTER, COURSE);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?",
                PROGRAM, CLASS_ID, LEARNER);
    }

    private void seedQuiz() {
        jdbc.update("insert into quizzes "
                        + "(id, lesson_id, course_id, class_id, title, description, status, due_at, max_attempts, total_points, "
                        + "active, enabled, is_grade_published, shuffle_questions, shuffle_options, is_deleted) "
                        + "values (?, 0, ?, ?, 'Race Quiz', 'Concurrency quiz', 'PUBLISHED', ?, 1, 1, 1, 1, 1, 0, 0, 0)",
                QUIZ, COURSE, CLASS_ID,
                Timestamp.valueOf(LocalDateTime.now(INDIA).plusHours(2)));
        jdbc.update("insert into quiz_questions "
                + "(id, quiz_id, question_type, prompt, points, sequence, is_deleted) "
                + "values (?, ?, 'SINGLE_CHOICE', 'Pick one', 1, 1, 0)", QUESTION, QUIZ);
        jdbc.update("insert into quiz_options "
                + "(id, question_id, option_text, correct, sequence, is_deleted) "
                + "values (?, ?, 'Correct', 1, 1, 0)", CORRECT_OPTION, QUESTION);
        jdbc.update("insert into quiz_options "
                + "(id, question_id, option_text, correct, sequence, is_deleted) "
                + "values (?, ?, 'Wrong', 0, 2, 0)", WRONG_OPTION, QUESTION);
    }

    private void seedAssignment() {
        jdbc.update("insert into lesson_contents "
                        + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, "
                        + "active, enabled, points, deadline, version, is_deleted) "
                        + "values (?, 0, ?, ?, 1, 'assignment', 'Race Assignment', "
                        + "JSON_OBJECT('allowed_submission_types', JSON_ARRAY('WRITTEN_RESPONSE')), "
                        + "1, 1, 10, ?, 0, 0)",
                ASSIGNMENT, COURSE, CLASS_ID,
                Timestamp.valueOf(LocalDateTime.now(INDIA).plusHours(2)));
    }

    @Test
    void quizDoubleSubmitAtMaxAttemptsOneProducesExactlyOneAttemptAndNoServerError() throws Exception {
        seedBase();
        seedQuiz();
        String token = accessToken(learnerPrincipal(LEARNER, COLLEGE));
        String body = "{\"answers\":[{\"questionId\":" + QUESTION
                + ",\"selectedOptionIds\":[" + CORRECT_OPTION + "]}]}";

        List<Integer> statuses = runTogether(List.of(
                post("/api/v1/quizzes/" + QUIZ + "/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                post("/api/v1/quizzes/" + QUIZ + "/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)));

        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), statuses.toString());
        assertTrue(statuses.stream().noneMatch(s -> s >= 500),
                "losing quiz submission must be a controlled client error: " + statuses);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from quiz_attempts where quiz_id = ? and learner_id = ? and is_deleted = 0",
                Integer.class, QUIZ, LEARNER));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from quiz_answers where attempt_id in "
                        + "(select id from quiz_attempts where quiz_id = ? and learner_id = ?)",
                Integer.class, QUIZ, LEARNER));
    }

    @Test
    void assignmentDoubleSubmitProducesExactlyOneSubmissionAndNoServerError() throws Exception {
        seedBase();
        seedAssignment();
        String token = accessToken(learnerPrincipal(LEARNER, COLLEGE));
        String body = "{\"lesson_content_id\":" + ASSIGNMENT
                + ",\"student_id\":" + LEARNER
                + ",\"submission_type\":\"WRITTEN_RESPONSE\","
                + "\"html_content\":\"<p>Concurrent answer</p>\"}";

        List<Integer> statuses = runTogether(List.of(
                post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)));

        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), statuses.toString());
        assertTrue(statuses.stream().noneMatch(s -> s >= 500),
                "losing assignment submission must be a controlled client error: " + statuses);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from student_assignment where lesson_content_id = ? and student_id = ? "
                        + "and (is_deleted = 0 or is_deleted is null)",
                Integer.class, ASSIGNMENT, LEARNER));
    }

    private List<Integer> runTogether(List<MockHttpServletRequestBuilder> requests) throws Exception {
        CountDownLatch ready = new CountDownLatch(requests.size());
        CountDownLatch fire = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(requests.size());
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (MockHttpServletRequestBuilder request : requests) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    if (!fire.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("race start timeout");
                    }
                    return mvc.perform(request).andReturn().getResponse().getStatus();
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            fire.countDown();

            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> future : futures) {
                statuses.add(future.get(20, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }
}
