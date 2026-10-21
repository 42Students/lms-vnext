package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bulk academic mutations: teaching assignments are atomic prevalidated graphs, while course
 * status updates are intentionally per-row partial-success operations.
 */
@Transactional
@Rollback
class AcademicBulkOperationsMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 105201;
    private static final int COLLEGE_B = 105202;
    private static final int ADMIN_A = 105211;
    private static final int FACULTY_A = 105212;
    private static final int LEARNER_A = 105221;
    private static final int DEPT_A = 105231;
    private static final int DEPT_B = 105232;
    private static final int PROGRAM_A = 105241;
    private static final long BATCH_A = 105251L;
    private static final int CLASS_A = 105261;
    private static final int COURSE_A = 105271;
    private static final int COURSE_A2 = 105272;
    private static final int COURSE_B = 105273;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Academic Bulk College A");
        seedCollege(COLLEGE_B, "Academic Bulk College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "BulkAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "BulkFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "BulkLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Bulk Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Bulk Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Bulk Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Bulk Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Bulk Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (105281, ?, 1, 'Bulk Semester 1', 1, 20, 0)", PROGRAM_A);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'BKA', ?, 'Bulk Course A', 0, 1, 1, 1, 'bulk-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'BKA2', ?, 'Bulk Course A2', 0, 1, 1, 1, 'bulk-course-a2-it', 0, 0)", COURSE_A2, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'BKB', ?, 'Bulk Course B', 0, 1, 1, 1, 'bulk-course-b-it', 0, 0)", COURSE_B, DEPT_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String bulkTeachingBody(String courseIds) {
        return "{\"faculty_id\":" + FACULTY_A + ",\"class_id\":" + CLASS_A
                + ",\"batch_id\":" + BATCH_A + ",\"semester_number\":1,"
                + "\"academic_year\":\"2026-27\",\"role\":\"PRIMARY\",\"is_active\":true,"
                + "\"course_ids\":" + courseIds + "}";
    }

    @Test
    void bulkTeachingCreatePersistsOneAssignmentPerValidatedCourse() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/teaching-assignment/createBulk")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bulkTeachingBody("[" + COURSE_A + "," + COURSE_A2 + "]")))
                .andExpect(status().isCreated());

        assertEquals(2, jdbc.queryForObject(
                "select count(*) from faculty_teaching_assignment where faculty_id = ? and class_id = ? and is_active = 1",
                Integer.class, FACULTY_A, CLASS_A));
        assertEquals(2, jdbc.queryForObject(
                "select count(distinct course_id) from faculty_teaching_assignment where faculty_id = ? and class_id = ?",
                Integer.class, FACULTY_A, CLASS_A));
    }

    @Test
    void duplicateOrForeignCourseInTeachingBulkRejectsWholeRequestBeforeInsert() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/teaching-assignment/createBulk")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bulkTeachingBody("[" + COURSE_A + "," + COURSE_A + "]")))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/teaching-assignment/createBulk")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bulkTeachingBody("[" + COURSE_A + "," + COURSE_B + "]")))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty_teaching_assignment where faculty_id = ?",
                Integer.class, FACULTY_A));
    }

    @Test
    void deactivateByBatchSemesterTurnsOffAllMatchingTeachingAssignmentsOnly() throws Exception {
        seedBase();
        jdbc.update("insert into faculty_teaching_assignment "
                + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                + "values (105291, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)", FACULTY_A, COURSE_A, CLASS_A, BATCH_A);
        jdbc.update("insert into faculty_teaching_assignment "
                + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                + "values (105292, ?, ?, ?, ?, 2, '2026-27', 'PRIMARY', 1, 0)", FACULTY_A, COURSE_A2, CLASS_A, BATCH_A);

        mvc.perform(post("/api/v1/teaching-assignment/deactivateByBatchSemester")
                        .param("batchId", String.valueOf(BATCH_A))
                        .param("semesterNumber", "1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select is_active from faculty_teaching_assignment where id = 105291", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "select is_active from faculty_teaching_assignment where id = 105292", Integer.class));
    }

    @Test
    void courseBulkStatusUpdatesAccessibleRowsAndReportsForeignRowWithoutRollback() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/admin/courses/bulk-status")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseIds\":[" + COURSE_A + "," + COURSE_A2 + "," + COURSE_B
                                + "],\"active\":false,\"enabled\":false,\"allowedForDisplay\":0}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"updatedCount\":2"), body);
        assertTrue(body.contains(String.valueOf(COURSE_B)), body);
        for (int courseId : new int[]{COURSE_A, COURSE_A2}) {
            assertEquals(0, jdbc.queryForObject(
                    "select active from course where id = ?", Integer.class, courseId));
            assertEquals(0, jdbc.queryForObject(
                    "select enabled from course where id = ?", Integer.class, courseId));
            assertEquals(0, jdbc.queryForObject(
                    "select allowed_for_display from course where id = ?", Integer.class, courseId));
        }
        assertEquals(1, jdbc.queryForObject(
                "select active from course where id = ?", Integer.class, COURSE_B));
    }

    @Test
    void invalidCourseBulkPayloadIsRejectedWithoutMutation() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/courses/bulk-status")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseIds\":[" + COURSE_A + "],\"allowedForDisplay\":2}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/admin/courses/bulk-status")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseIds\":[" + COURSE_A + "]}"))
                .andExpect(status().isBadRequest());

        assertEquals(1, jdbc.queryForObject(
                "select active from course where id = ?", Integer.class, COURSE_A));
    }

    @Test
    void learnerCannotUseEitherAcademicBulkMutationSurface() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/teaching-assignment/createBulk")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bulkTeachingBody("[" + COURSE_A + "]")))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/courses/bulk-status")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseIds\":[" + COURSE_A + "],\"active\":false}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty_teaching_assignment where faculty_id = ?",
                Integer.class, FACULTY_A));
        assertEquals(1, jdbc.queryForObject(
                "select active from course where id = ?", Integer.class, COURSE_A));
    }
}
