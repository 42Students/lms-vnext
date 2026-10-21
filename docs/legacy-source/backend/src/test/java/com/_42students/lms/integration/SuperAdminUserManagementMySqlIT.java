package com._42students.lms.integration;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Privileged account management through the real super-admin HTTP surface.
 */
@Transactional
@Rollback
class SuperAdminUserManagementMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100801;
    private static final int COLLEGE_B = 100802;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Super Admin Users College A");
        seedCollege(COLLEGE_B, "Super Admin Users College B");
    }

    private String globalToken() {
        return accessToken(superAdminPrincipal());
    }

    private String scopedToken() {
        return accessToken(UserPrincipal.forSuperAdminScoped(1, COLLEGE_A));
    }

    @Test
    void globalSuperAdminCreatesCollegeAdminAndOldJwtDiesOnDeactivation() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/superadmin/users/faculty-admins")
                        .header("Authorization", "Bearer " + globalToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_A + ",\"firstName\":\"Created\","
                                + "\"lastName\":\"Admin\",\"contactMobile\":\"9876500801\","
                                + "\"contactMail\":\"created-admin@example.test\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk());

        Integer createdId = jdbc.queryForObject(
                "select id from faculty where college_id = ? and contact_mobile = '9876500801'",
                Integer.class, COLLEGE_A);
        assertEquals(4, jdbc.queryForObject(
                "select faculty_type from faculty where id = ?", Integer.class, createdId));
        assertEquals(0, jdbc.queryForObject(
                "select token_version from faculty where id = ?", Integer.class, createdId));

        String createdAdminToken = accessToken(new UserPrincipal(
                createdId, "FACULTY", "ADMIN", 1, COLLEGE_A, 0));
        mvc.perform(get("/api/v1/department/fetchAll")
                        .header("Authorization", "Bearer " + createdAdminToken))
                .andExpect(status().isOk());

        mvc.perform(put("/api/v1/superadmin/users/faculty-admins/" + createdId + "/status")
                        .header("Authorization", "Bearer " + globalToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isDeleted\":true}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from faculty where id = ?", Integer.class, createdId));
        assertEquals(1, jdbc.queryForObject(
                "select token_version from faculty where id = ?", Integer.class, createdId));

        mvc.perform(get("/api/v1/department/fetchAll")
                        .header("Authorization", "Bearer " + createdAdminToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicatePrivilegedMobileInSameCollegeIsConflictNotSecondAccount() throws Exception {
        seedBase();
        String body = "{\"collegeId\":" + COLLEGE_A + ",\"firstName\":\"Duplicate\","
                + "\"contactMobile\":\"9876500802\",\"role\":\"TPO\"}";

        mvc.perform(post("/api/v1/superadmin/users/faculty-admins")
                        .header("Authorization", "Bearer " + globalToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/superadmin/users/faculty-admins")
                        .header("Authorization", "Bearer " + globalToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from faculty where college_id = ? and contact_mobile = '9876500802'",
                Integer.class, COLLEGE_A));
    }

    @Test
    void collegeScopedSuperAdminCannotCreatePrivilegedUserInSiblingCollege() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/superadmin/users/faculty-admins")
                        .header("Authorization", "Bearer " + scopedToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + ",\"firstName\":\"Forbidden\","
                                + "\"contactMobile\":\"9876500803\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty where college_id = ? and contact_mobile = '9876500803'",
                Integer.class, COLLEGE_B));
    }

    @Test
    void scopedSuperAdminAdminListCannotBeTrickedBySiblingCollegeQueryParam() throws Exception {
        seedBase();
        seedFaculty(100811, COLLEGE_A, "AdminA");
        seedFaculty(100812, COLLEGE_B, "AdminB");
        jdbc.update("update faculty set faculty_type = 4 where id in (100811,100812)");

        String body = mvc.perform(get("/api/v1/superadmin/users/faculty-admins")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .param("role", "ADMIN")
                        .header("Authorization", "Bearer " + scopedToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("AdminA"), body);
        assertTrue(!body.contains("AdminB"),
                "college-scoped super-admin list leaked sibling admin: " + body);
    }

    @Test
    void collegeAdminCannotReachSuperAdminPrivilegedUserManagement() throws Exception {
        seedBase();
        seedFaculty(100813, COLLEGE_A, "CollegeAdmin");
        String admin = accessToken(facultyPrincipal(100813, "ADMIN", COLLEGE_A));

        mvc.perform(get("/api/v1/superadmin/users/faculty-admins")
                        .param("role", "ADMIN")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());
    }
}
