package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * College-admin operational dashboard/summary plus generic recycle-bin recovery.
 */
@Transactional
@Rollback
class AdminOperationsRecycleBinMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 108001;
    private static final int COLLEGE_B = 108002;
    private static final int ADMIN_A = 108011;
    private static final int LEARNER_A = 108021;
    private static final int DEPT_A = 108031;
    private static final int DEPT_B = 108032;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Admin Ops College A");
        seedCollege(COLLEGE_B, "Admin Ops College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "AdminOps");
        seedLearner(LEARNER_A, COLLEGE_A, "AdminOpsLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Recoverable Department A");
        seedDepartment(DEPT_B, COLLEGE_B, "Recoverable Department B");
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void collegeSummaryIsScopedToAuthorizedCollegeAndRejectsForeignCollege() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/admin/college-summary")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("studentCount"), body);
        assertTrue(body.contains("facultyCount"), body);
        assertTrue(body.contains("courseCount"), body);
        assertTrue(body.contains("activeDriveCount"), body);

        mvc.perform(get("/api/v1/admin/college-summary")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/college-summary")
                        .param("collegeId", "0")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void operationalDashboardReturnsIndependentSectionsAndRejectsSiblingCollege() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/admin/college-dashboard")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        for (String key : new String[]{"generatedAt", "attendanceThreshold", "today", "attendancePending",
                "attendanceAtRisk", "gradingBacklog", "unstaffed", "setupGaps", "dueThisWeek"}) {
            assertTrue(body.contains(key), body);
        }

        mvc.perform(get("/api/v1/admin/college-dashboard")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void recycleBinListsOnlyDeletedRowsFromRequestedCollege() throws Exception {
        seedBase();
        jdbc.update("update department set is_deleted = 1 where id in (?, ?)", DEPT_A, DEPT_B);

        String body = mvc.perform(get("/api/v1/admin/recycle-bin")
                        .param("entityType", "department")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Recoverable Department A"), body);
        assertTrue(!body.contains("Recoverable Department B"), body);
    }

    @Test
    void recycleBinRestoreReactivatesOwnDepartmentButCannotRestoreForeignDepartment() throws Exception {
        seedBase();
        jdbc.update("update department set is_deleted = 1 where id in (?, ?)", DEPT_A, DEPT_B);

        mvc.perform(post("/api/v1/admin/recycle-bin/restore")
                        .param("entityType", "department")
                        .param("id", String.valueOf(DEPT_A))
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from department where id = ?", Integer.class, DEPT_A));

        mvc.perform(post("/api/v1/admin/recycle-bin/restore")
                        .param("entityType", "department")
                        .param("id", String.valueOf(DEPT_B))
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from department where id = ?", Integer.class, DEPT_B));
    }

    @Test
    void platformLevelRecycleTypesRequireSuperAdminAndUnknownTypeFailsClosed() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/admin/recycle-bin")
                        .param("entityType", "college")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/recycle-bin")
                        .param("entityType", "root-secret")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        String types = mvc.perform(get("/api/v1/admin/recycle-bin/types")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(types.contains("department"), types);
        assertTrue(types.contains("notification"), types);
        assertTrue(types.contains("college"), types);
    }

    @Test
    void learnerCannotUseCollegeAdminOperationalOrRecoverySurfaces() throws Exception {
        seedBase();
        jdbc.update("update department set is_deleted = 1 where id = ?", DEPT_A);
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/admin/college-dashboard")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/recycle-bin/restore")
                        .param("entityType", "department")
                        .param("id", String.valueOf(DEPT_A))
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from department where id = ?", Integer.class, DEPT_A));
    }
}
