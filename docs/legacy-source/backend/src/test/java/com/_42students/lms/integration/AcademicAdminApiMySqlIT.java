package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Successful College Admin / academic-structure writes through the real HTTP -> security ->
 * controller -> service -> repository -> MySQL stack. Existing unit tests pin many individual
 * invariants; this class proves the pieces still work together against the production dialect.
 */
@Transactional
@Rollback
class AcademicAdminApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 99801;
    private static final int OTHER_COLLEGE = 99802;
    private static final int ADMIN = 99811;

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN, "ADMIN", COLLEGE));
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Academic API Integration College");
        seedCollege(OTHER_COLLEGE, "Academic API Other College");
        seedFaculty(ADMIN, COLLEGE, "Admin");
    }

    @Test
    void adminCanCreateDepartmentThenCourseAndReadThemBackFromMySql() throws Exception {
        seedBase();
        String token = adminToken();

        mvc.perform(post("/api/v1/department/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Computer Science API IT\",\"college_id\":" + COLLEGE + "}"))
                .andExpect(status().isOk());

        Integer departmentId = jdbc.queryForObject(
                "select id from department where college_id = ? and name = ? and is_deleted = 0",
                Integer.class, COLLEGE, "Computer Science API IT");
        assertNotNull(departmentId);

        mvc.perform(post("/api/v1/courses/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"short_title\":\"APIIT\",\"dept_id\":" + departmentId +
                                ",\"course_name\":\"API Integration Testing\"}"))
                .andExpect(status().isOk());

        Integer courseId = jdbc.queryForObject(
                "select id from course where dept_id = ? and course_name = ? and (is_deleted = 0 or is_deleted is null)",
                Integer.class, departmentId, "API Integration Testing");
        assertNotNull(courseId);

        String departmentBody = mvc.perform(get("/api/v1/department/fetch")
                        .param("collegeId", String.valueOf(COLLEGE))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(departmentBody.contains("Computer Science API IT"), departmentBody);

        String courseBody = mvc.perform(get("/api/v1/courses/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(courseBody.contains("API Integration Testing"), courseBody);
    }

    @Test
    void duplicateDepartmentNameIsRejectedAndDoesNotCreateASecondRow() throws Exception {
        seedBase();
        String token = adminToken();
        String body = "{\"name\":\"Electronics API IT\",\"college_id\":" + COLLEGE + "}";

        mvc.perform(post("/api/v1/department/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        int secondStatus = mvc.perform(post("/api/v1/department/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn().getResponse().getStatus();

        assertTrue(secondStatus >= 400 && secondStatus < 500,
                "duplicate department should be a client error, got " + secondStatus);
        Integer rows = jdbc.queryForObject(
                "select count(*) from department where college_id = ? and lower(trim(name)) = lower(trim(?)) and is_deleted = 0",
                Integer.class, COLLEGE, "Electronics API IT");
        assertEquals(1, rows);
    }

    @Test
    void adminCannotCreateDepartmentForAnotherCollegeEvenWithAValidPayload() throws Exception {
        seedBase();
        String token = adminToken();

        mvc.perform(post("/api/v1/department/create")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Forbidden Department\",\"college_id\":" + OTHER_COLLEGE + "}"))
                .andExpect(status().isForbidden());

        Integer rows = jdbc.queryForObject(
                "select count(*) from department where college_id = ? and name = ?",
                Integer.class, OTHER_COLLEGE, "Forbidden Department");
        assertEquals(0, rows);
    }

    @Test
    void departmentUpdateCannotMoveAnEntityAcrossTenantBoundary() throws Exception {
        seedBase();
        seedDepartment(99831, COLLEGE, "Original Department");
        String token = adminToken();

        int status = mvc.perform(put("/api/v1/department/update/99831")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Moved Department\",\"college_id\":" + OTHER_COLLEGE + "}"))
                .andReturn().getResponse().getStatus();

        assertTrue(status >= 400 && status < 500,
                "cross-college department move must be rejected, got " + status);

        Integer collegeId = jdbc.queryForObject(
                "select college_id from department where id = 99831",
                Integer.class);
        String name = jdbc.queryForObject(
                "select name from department where id = 99831",
                String.class);
        assertEquals(COLLEGE, collegeId);
        assertFalse("Moved Department".equals(name),
                "rejected update still mutated the department");
    }
}
