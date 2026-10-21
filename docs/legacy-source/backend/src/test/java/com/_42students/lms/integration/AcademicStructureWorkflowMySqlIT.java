package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Deep academic hierarchy integration: department -> program -> semester -> batch -> class.
 * These tests deliberately cross controller/service/repository boundaries and verify resulting
 * MySQL state, because many LMS modules derive their scope from this chain.
 */
@Transactional
@Rollback
class AcademicStructureWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100501;
    private static final int COLLEGE_B = 100502;
    private static final int ADMIN_A = 100511;
    private static final int LEARNER_A = 100521;
    private static final int DEPT_A = 100531;
    private static final int DEPT_B = 100532;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Academic Workflow College A");
        seedCollege(COLLEGE_B, "Academic Workflow College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "AcademicAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "AcademicLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Engineering A");
        seedDepartment(DEPT_B, COLLEGE_B, "Engineering B");
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private int createProgram(String name, int deptId) throws Exception {
        mvc.perform(post("/api/v1/new-program/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"dept_id\":" + deptId + ",\"duration_years\":4}"))
                .andExpect(status().isOk());

        Integer id = jdbc.queryForObject(
                "select id from new_program where dept_id = ? and name = ?",
                Integer.class, deptId, name);
        assertNotNull(id);
        return id;
    }

    private long createBatch(String name, int programId) throws Exception {
        mvc.perform(post("/api/v1/batch/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"batchName\":\"" + name + "\",\"programId\":" + programId
                                + ",\"academicYear\":\"2026-27\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isCreated());

        Long id = jdbc.queryForObject(
                "select id from batch where program_id = ? and batch_name = ?",
                Long.class, programId, name);
        assertNotNull(id);
        return id;
    }

    private int createClass(String name, int programId, long batchId) throws Exception {
        mvc.perform(post("/api/v1/class/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"Integration section\","
                                + "\"program_id\":" + programId + ",\"batch_id\":" + batchId
                                + ",\"upper_limit\":60,\"lower_limit\":0}"))
                .andExpect(status().isOk());

        Integer id = jdbc.queryForObject(
                "select id from class where program_id = ? and batch_id = ? and name = ?",
                Integer.class, programId, batchId, name);
        assertNotNull(id);
        return id;
    }

    @Test
    void completeAcademicHierarchyPersistsAndReadsBackThroughApis() throws Exception {
        seedBase();
        int programId = createProgram("BTech API Integration", DEPT_A);

        mvc.perform(post("/api/v1/semester/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"program_id\":" + programId + ",\"semester_number\":1,"
                                + "\"name\":\"Semester One\",\"is_active\":true,\"total_credits\":22}"))
                .andExpect(status().isCreated());

        long batchId = createBatch("2026 Cohort", programId);
        int classId = createClass("Section A", programId, batchId);

        Integer semesters = jdbc.queryForObject(
                "select count(*) from semester where program_id = ? and semester_number = 1 and name = 'Semester One'",
                Integer.class, programId);
        assertEquals(1, semesters);

        Integer currentSemester = jdbc.queryForObject(
                "select current_semester from batch where id = ?",
                Integer.class, batchId);
        assertEquals(1, currentSemester);

        String programs = mvc.perform(get("/api/v1/new-program/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(programs.contains("BTech API Integration"), programs);

        String batches = mvc.perform(get("/api/v1/batch/fetchByProgram")
                        .param("programId", String.valueOf(programId))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(batches.contains("2026 Cohort"), batches);

        String classes = mvc.perform(get("/api/v1/class/getClassesByProgram")
                        .param("programId", String.valueOf(programId))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(classes.contains("Section A"), classes);

        Integer storedProgram = jdbc.queryForObject(
                "select program_id from class where id = ?", Integer.class, classId);
        assertEquals(programId, storedProgram);
    }

    @Test
    void duplicateProgramAndSemesterAreRejectedWithoutDuplicateRows() throws Exception {
        seedBase();
        int programId = createProgram("Unique Program", DEPT_A);

        int duplicateProgramStatus = mvc.perform(post("/api/v1/new-program/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Unique Program\",\"dept_id\":" + DEPT_A + ",\"duration_years\":4}"))
                .andReturn().getResponse().getStatus();
        assertTrue(duplicateProgramStatus >= 400 && duplicateProgramStatus < 500,
                "duplicate program should be a client error, got " + duplicateProgramStatus);

        String semester = "{\"program_id\":" + programId
                + ",\"semester_number\":1,\"name\":\"First Semester\",\"is_active\":true}";
        mvc.perform(post("/api/v1/semester/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON).content(semester))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/semester/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON).content(semester))
                // A duplicate semester hits the unique key: the API answers 409 Conflict, like other duplicates.
                .andExpect(status().isConflict());

        Integer programRows = jdbc.queryForObject(
                "select count(*) from new_program where dept_id = ? and lower(trim(name)) = lower('Unique Program')",
                Integer.class, DEPT_A);
        Integer semesterRows = jdbc.queryForObject(
                "select count(*) from semester where program_id = ? and semester_number = 1",
                Integer.class, programId);
        assertEquals(1, programRows);
        assertEquals(1, semesterRows);
    }

    @Test
    void programCannotBeMovedToDepartmentInAnotherCollege() throws Exception {
        seedBase();
        int programId = createProgram("Tenant Locked Program", DEPT_A);

        mvc.perform(put("/api/v1/new-program/update/" + programId)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Tenant Locked Program\",\"dept_id\":" + DEPT_B
                                + ",\"duration_years\":4}"))
                .andExpect(status().isForbidden());

        Integer deptId = jdbc.queryForObject(
                "select dept_id from new_program where id = ?", Integer.class, programId);
        assertEquals(DEPT_A, deptId);
    }

    @Test
    void classCannotAttachBatchFromAnotherProgram() throws Exception {
        seedBase();
        int programA = createProgram("Program A", DEPT_A);
        int programB = createProgram("Program B", DEPT_A);
        long batchB = createBatch("Program B Batch", programB);

        mvc.perform(post("/api/v1/class/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Invalid Section\",\"program_id\":" + programA
                                + ",\"batch_id\":" + batchB + ",\"upper_limit\":60,\"lower_limit\":0}"))
                .andExpect(status().isForbidden());

        Integer rows = jdbc.queryForObject(
                "select count(*) from class where program_id = ? and name = 'Invalid Section'",
                Integer.class, programA);
        assertEquals(0, rows);
    }

    @Test
    void classWithEnrolledLearnerCannotBeDeleted() throws Exception {
        seedBase();
        int programId = createProgram("Protected Class Program", DEPT_A);
        long batchId = createBatch("Protected Batch", programId);
        int classId = createClass("Protected Section", programId, batchId);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?",
                programId, classId, LEARNER_A);

        mvc.perform(delete("/api/v1/class/delete/" + classId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isConflict());

        Integer rows = jdbc.queryForObject(
                "select count(*) from class where id = ?", Integer.class, classId);
        assertEquals(1, rows);
    }

    @Test
    void learnerCannotCreateAcademicStructureEvenWithValidIds() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/new-program/create")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Learner Attack\",\"dept_id\":" + DEPT_A + ",\"duration_years\":4}"))
                .andExpect(status().isForbidden());
    }
}
