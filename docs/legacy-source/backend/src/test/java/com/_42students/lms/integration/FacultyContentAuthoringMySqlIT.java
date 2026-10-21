package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Faculty lesson-content authoring with active teaching-assignment and class-scope enforcement.
 */
@Transactional
@Rollback
class FacultyContentAuthoringMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 103201;
    private static final int FACULTY_A = 103211;
    private static final int FACULTY_B = 103212;
    private static final int LEARNER = 103221;
    private static final int DEPT = 103231;
    private static final int PROGRAM = 103241;
    private static final long BATCH = 103251L;
    private static final int CLASS_A = 103261;
    private static final int CLASS_B = 103262;
    private static final int COURSE = 103271;
    private static final int LESSON = 103281;

    private void seedBase() {
        seedCollege(COLLEGE, "Faculty Content College");
        seedFaculty(FACULTY_A, COLLEGE, "AssignedFaculty");
        seedFaculty(FACULTY_B, COLLEGE, "UnassignedFaculty");
        seedLearner(LEARNER, COLLEGE, "ContentLearner");
        seedDepartment(DEPT, COLLEGE, "Faculty Content Dept");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) "
                + "values (?, 'Faculty Content Program', ?, 4, 0)", PROGRAM, DEPT);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Faculty Content Batch', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH, PROGRAM);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Content Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM, BATCH);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Content Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM, BATCH);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'FCA', ?, 'Faculty Content Course', 0, 1, 1, 1, 'faculty-content-it', 0, 0)", COURSE, DEPT);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (103291, ?, 1, 'Semester 1', 1, 20, 0)", PROGRAM);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (103292, 103291, ?, 1, 3, 1, 0)", COURSE);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Faculty Content Lesson', ?, 1, 1, 1, 0, 0)", LESSON, COURSE);

        jdbc.update("insert into faculty_teaching_assignment "
                + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                + "values (103293, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)",
                FACULTY_A, COURSE, CLASS_A, BATCH);
    }

    private String body(int classId, String title) {
        return "{\"lesson_id\":" + LESSON + ",\"class_id\":" + classId
                + ",\"content_type\":\"assignment\",\"content_title\":\"" + title + "\""
                + ",\"points\":20,\"active\":true,\"enabled\":true,\"sequence\":1"
                + ",\"deadline\":\"" + java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).plusDays(7)
                        .withNano(0) + "\""
                + ",\"content_data_dto\":{\"assignment_resources\":["
                + "{\"id\":\"instructions\",\"type\":\"INSTRUCTIONS\",\"title\":\"Instructions\","
                + "\"text\":\"<p>Faculty authored assignment</p>\"}],"
                + "\"allowed_submission_types\":[\"WRITTEN_RESPONSE\"]}}";
    }

    @Test
    void assignedFacultyCreatesClassScopedAssignmentAndOwnershipIsPersisted() throws Exception {
        seedBase();
        String token = accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE));

        mvc.perform(post("/api/v1/faculty/lesson-contents/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CLASS_A, "Faculty Assignment")))
                .andExpect(status().isOk());

        Integer id = jdbc.queryForObject(
                "select id from lesson_contents where lesson_id = ? and content_title = 'Faculty Assignment'",
                Integer.class, LESSON);
        assertNotNull(id);
        assertEquals(FACULTY_A, jdbc.queryForObject(
                "select faculty_id from lesson_contents where id = ?", Integer.class, id));
        assertEquals(CLASS_A, jdbc.queryForObject(
                "select class_id from lesson_contents where id = ?", Integer.class, id));
    }

    @Test
    void facultyWithoutActiveCourseAssignmentCannotCreateContent() throws Exception {
        seedBase();
        String token = accessToken(facultyPrincipal(FACULTY_B, "LECTURER", COLLEGE));

        mvc.perform(post("/api/v1/faculty/lesson-contents/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CLASS_A, "Unauthorized Faculty Assignment")))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lesson_contents where content_title = 'Unauthorized Faculty Assignment'",
                Integer.class));
    }

    @Test
    void assignedFacultyCannotCreateClassSpecificContentForUnassignedClass() throws Exception {
        seedBase();
        String token = accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE));

        mvc.perform(post("/api/v1/faculty/lesson-contents/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CLASS_B, "Wrong Class Assignment")))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lesson_contents where content_title = 'Wrong Class Assignment'",
                Integer.class));
    }

    @Test
    void learnerCannotUseFacultyContentAuthoringSurface() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/faculty/lesson-contents/create")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER, COLLEGE)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CLASS_A, "Learner Attack Assignment")))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lesson_contents where content_title = 'Learner Attack Assignment'",
                Integer.class));
    }
}
