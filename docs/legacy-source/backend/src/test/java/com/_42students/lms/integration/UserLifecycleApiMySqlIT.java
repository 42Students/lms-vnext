package com._42students.lms.integration;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Account lifecycle integration with real JWT invalidation and dependency guards.
 */
@Transactional
@Rollback
class UserLifecycleApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100601;
    private static final int COLLEGE_B = 100602;
    private static final int ADMIN_A = 100611;
    private static final int LEARNER_A = 100621;
    private static final int LEARNER_B = 100622;
    private static final int FACULTY_A = 100631;
    private static final int PROTECTED_ADMIN = 100632;
    private static final int MENTOR = 100633;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Lifecycle College A");
        seedCollege(COLLEGE_B, "Lifecycle College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "LifecycleAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "LifecycleLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "LifecycleLearnerB");
        seedFaculty(FACULTY_A, COLLEGE_A, "LifecycleFaculty");
        seedFaculty(PROTECTED_ADMIN, COLLEGE_A, "ProtectedAdmin");
        seedFaculty(MENTOR, COLLEGE_A, "ActiveMentor");

        // FacultyType is stored as an ordinal. ADMIN=4, LECTURER=11, MENTOR=13.
        jdbc.update("update faculty set faculty_type = 11 where id in (?, ?)", FACULTY_A, ADMIN_A);
        jdbc.update("update faculty set faculty_type = 4 where id = ?", PROTECTED_ADMIN);
        jdbc.update("update faculty set faculty_type = 13 where id = ?", MENTOR);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void suspendingLearnerInvalidatesExistingJwtAndReactivationRequiresFreshVersionedJwt() throws Exception {
        seedBase();

        String oldLearnerToken = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/learner/getLearnerDetails")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + oldLearnerToken))
                .andExpect(status().isOk());

        mvc.perform(put("/api/v1/admin/users/LEARNER/" + LEARNER_A + "/suspend")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"integration lifecycle test\"}"))
                .andExpect(status().isOk());

        java.sql.Timestamp suspendedAt = jdbc.queryForObject(
                "select suspended_at from learner where id = ?", java.sql.Timestamp.class, LEARNER_A);
        Integer bumpedVersion = jdbc.queryForObject(
                "select token_version from learner where id = ?", Integer.class, LEARNER_A);
        assertNotNull(suspendedAt);
        assertEquals(1, bumpedVersion);

        mvc.perform(get("/api/v1/learner/getLearnerDetails")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + oldLearnerToken))
                .andExpect(status().isUnauthorized());

        mvc.perform(put("/api/v1/admin/users/LEARNER/" + LEARNER_A + "/reactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        java.sql.Timestamp reactivated = jdbc.queryForObject(
                "select suspended_at from learner where id = ?", java.sql.Timestamp.class, LEARNER_A);
        assertNull(reactivated);

        // Reactivation deliberately does not roll token_version backwards.
        mvc.perform(get("/api/v1/learner/getLearnerDetails")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + oldLearnerToken))
                .andExpect(status().isUnauthorized());

        String fresh = accessToken(new UserPrincipal(
                LEARNER_A, "LEARNER", null, 1, COLLEGE_A, bumpedVersion));
        mvc.perform(get("/api/v1/learner/getLearnerDetails")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + fresh))
                .andExpect(status().isOk());
    }

    @Test
    void collegeAdminCannotSuspendLearnerFromAnotherCollege() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/admin/users/LEARNER/" + LEARNER_B + "/suspend")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"must not cross tenant\"}"))
                .andExpect(status().isForbidden());

        java.sql.Timestamp suspendedAt = jdbc.queryForObject(
                "select suspended_at from learner where id = ?", java.sql.Timestamp.class, LEARNER_B);
        assertNull(suspendedAt);
    }

    @Test
    void collegeAdminCannotSuspendProtectedAdminFacultyRole() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/admin/users/FACULTY/" + PROTECTED_ADMIN + "/suspend")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"protected role test\"}"))
                .andExpect(status().isForbidden());

        java.sql.Timestamp suspendedAt = jdbc.queryForObject(
                "select suspended_at from faculty where id = ?", java.sql.Timestamp.class, PROTECTED_ADMIN);
        assertNull(suspendedAt);
    }

    @Test
    void facultyMentoringActiveProjectCannotBeSuspendedUntilDependencyIsResolved() throws Exception {
        seedBase();
        seedProject(100641, COLLEGE_A, "lifecycle-mentor-project", "Mentor Dependency Project");
        seedProjectMember(100651, 100641, MENTOR, "FACULTY", "Project Mentor");

        mvc.perform(put("/api/v1/admin/users/FACULTY/" + MENTOR + "/suspend")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"dependency guard test\"}"))
                .andExpect(status().isConflict());

        java.sql.Timestamp suspendedAt = jdbc.queryForObject(
                "select suspended_at from faculty where id = ?", java.sql.Timestamp.class, MENTOR);
        assertNull(suspendedAt);
    }
}
