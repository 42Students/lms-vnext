package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Batch promotion is a cross-entity transaction: batch semester, semester curriculum and active
 * teaching assignments must remain coherent. These tests exercise the HTTP transaction against
 * real MySQL rather than only the service in isolation.
 */
@Transactional
@Rollback
class BatchPromotionWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    /** Raw JDBC write mid-test: flush pending JPA writes first and clear afterwards so the shared persistence context does not keep serving stale entities. */
    private int syncedUpdate(String sql, Object... args) {
        entityManager.flush();
        int n = jdbc.update(sql, args);
        entityManager.clear();
        return n;
    }

    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 100901;
    private static final int COLLEGE_B = 100902;
    private static final int ADMIN_A = 100911;
    private static final int TEACHER_A = 100912;
    private static final int DEPT_A = 100921;
    private static final int DEPT_B = 100922;
    private static final int PROGRAM_A = 100931;
    private static final int PROGRAM_B = 100932;
    private static final long BATCH_A = 100941L;
    private static final long BATCH_B = 100942L;
    private static final int CLASS_A = 100951;
    private static final int COURSE_A = 100961;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Promotion College A");
        seedCollege(COLLEGE_B, "Promotion College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "PromotionAdmin");
        seedFaculty(TEACHER_A, COLLEGE_A, "PromotionTeacher");
        seedDepartment(DEPT_A, COLLEGE_A, "Promotion Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Promotion Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Promotion Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Promotion Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                        + "values (?, 'Promotion Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())",
                BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                        + "values (?, 'Promotion Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())",
                BATCH_B, PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                        + "values (?, 'Promotion Section A', ?, ?, 60, 0, 'SECTION', 0)",
                CLASS_A, PROGRAM_A, BATCH_A);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                        + "values (?, 'PROMO', ?, 'Promotion Course', 0, 1, 1, 1, 'promotion-course-it', 0, 0)",
                COURSE_A, DEPT_A);

        // Current semester exists; semester 2 is deliberately added by individual tests.
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                        + "values (100971, ?, 1, 'Semester 1', 1, 20, 0)",
                PROGRAM_A);

        jdbc.update("insert into faculty_teaching_assignment "
                        + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                        + "values (100981, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)",
                TEACHER_A, COURSE_A, CLASS_A, BATCH_A);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private void seedSemesterTwo(boolean mapCourse) {
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                        + "values (100972, ?, 2, 'Semester 2', 1, 22, 0)",
                PROGRAM_A);
        if (mapCourse) {
            jdbc.update("insert into semester_course "
                            + "(id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                            + "values (100973, 100972, ?, 1, 3, 1, 0)",
                    COURSE_A);
        }
    }

    @Test
    void previewFailsClosedWhenNextSemesterIsNotConfiguredAndDoesNotMutateBatch() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/batch/" + BATCH_A + "/promote/preview")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"valid\":false"), body);
        assertTrue(body.contains("Semester 2"), body);
        assertEquals(1, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
    }

    @Test
    void promotionIsRejectedWhenNextSemesterHasNoMappedCurriculum() throws Exception {
        seedBase();
        seedSemesterTwo(false);

        mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"batch_id\":" + BATCH_A + ",\"target_semester\":2}"))
                .andExpect(status().isBadRequest());

        assertEquals(1, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
        assertEquals(1, flushedQuery(
                "select is_active from faculty_teaching_assignment where id = 100981", Integer.class));
    }

    @Test
    void validPromotionAdvancesExactlyOneSemesterAndDeactivatesOldTeachingAssignments() throws Exception {
        seedBase();
        seedSemesterTwo(true);

        String preview = mvc.perform(get("/api/v1/batch/" + BATCH_A + "/promote/preview")
                        .param("targetSemester", "2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(preview.contains("\"valid\":true"), preview);
        assertTrue(preview.contains("\"mappedCourseCount\":1"), preview);

        mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"batch_id\":" + BATCH_A + ",\"target_semester\":2}"))
                .andExpect(status().isOk());

        assertEquals(2, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
        assertEquals(0, flushedQuery(
                "select is_active from faculty_teaching_assignment where id = 100981", Integer.class));
    }

    @Test
    void duplicatePromotionRequestCannotAdvanceOrReplaySameTargetSemester() throws Exception {
        seedBase();
        seedSemesterTwo(true);

        String payload = "{\"batch_id\":" + BATCH_A + ",\"target_semester\":2}";
        mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());

        assertEquals(2, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
        assertEquals(0, flushedQuery(
                "select is_active from faculty_teaching_assignment where id = 100981", Integer.class));
        assertEquals(1, flushedQuery(
                "select count(*) from batch where id = ?", Integer.class, BATCH_A));
    }

    @Test
    void promotionCannotSkipAsemester() throws Exception {
        seedBase();
        seedSemesterTwo(true);

        mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"batch_id\":" + BATCH_A + ",\"target_semester\":3}"))
                .andExpect(status().isBadRequest());

        assertEquals(1, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
    }

    @Test
    void evenToOddPromotionRollsAcademicYearWithoutRevertingTheSemester() throws Exception {
        seedBase();
        // Semester 2 -> 3 crosses into the next academic year, so promoteBatch also saves the new year on the batch.
        syncedUpdate("update batch set current_semester = 2 where id = ?", BATCH_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                        + "values (100974, ?, 3, 'Semester 3', 1, 22, 0)",
                PROGRAM_A);
        jdbc.update("insert into semester_course "
                        + "(id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                        + "values (100975, 100974, ?, 1, 3, 1, 0)",
                COURSE_A);

        String body = mvc.perform(post("/api/v1/batch/" + BATCH_A + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"batch_id\":" + BATCH_A + ",\"target_semester\":3}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("promoted to semester 3"), body);

        assertEquals(3, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
        assertEquals("2027-28", flushedQuery(
                "select academic_year from batch where id = ?", String.class, BATCH_A));
    }

    @Test
    void directSemesterMutationCannotBypassPromotionWorkflow() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/batch/" + BATCH_A + "/semester")
                        .param("semesterNumber", "2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        assertEquals(1, flushedQuery(
                "select current_semester from batch where id = ?", Integer.class, BATCH_A));
    }

    @Test
    void collegeAdminCannotPreviewOrPromoteSiblingCollegeBatch() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/batch/" + BATCH_B + "/promote/preview")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/batch/" + BATCH_B + "/promote")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target_semester\":2}"))
                .andExpect(status().isForbidden());
    }
}
