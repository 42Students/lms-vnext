package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Highest-blast-radius API checks: real JWT filter chain, controller/service/repository stack and
 * the migrated MySQL schema. This deliberately crosses feature boundaries because a security or
 * tenant-scope regression in these routes is more dangerous than an isolated DTO/unit failure.
 */
@Transactional
@Rollback
class CriticalApiAuthorizationMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 99701;
    private static final int COLLEGE_B = 99702;
    private static final int ADMIN_A = 99711;
    private static final int TEACHER_A = 99712;
    private static final int LEARNER_A = 99721;
    private static final int LEARNER_B = 99722;

    private void seedPeopleAndTenants() {
        seedCollege(COLLEGE_A, "Integration College Alpha");
        seedCollege(COLLEGE_B, "Integration College Beta");
        seedFaculty(ADMIN_A, COLLEGE_A, "Ada");
        seedFaculty(TEACHER_A, COLLEGE_A, "Theo");
        seedLearner(LEARNER_A, COLLEGE_A, "Asha");
        seedLearner(LEARNER_B, COLLEGE_B, "Bala");
    }

    @Test
    void privateCriticalSurfacesRejectAnonymousRequestsBeforeControllerWork() throws Exception {
        mvc.perform(get("/api/v1/department/fetchAll"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/projects/me"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/tpo/reports"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/superadmin/features"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/upload/file/get"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void collegeAdminDepartmentReadIsTenantScopedByTheAuthenticatedJwt() throws Exception {
        seedPeopleAndTenants();
        seedDepartment(99731, COLLEGE_A, "Alpha Engineering");
        seedDepartment(99732, COLLEGE_B, "Beta Engineering");

        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
        String body = mvc.perform(get("/api/v1/department/fetchAll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Alpha Engineering"), body);
        assertFalse(body.contains("Beta Engineering"),
                "college A response leaked a department owned by college B: " + body);
    }

    @Test
    void collegeAdminCannotReadAnotherCollegesCourseCollection() throws Exception {
        seedPeopleAndTenants();
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        mvc.perform(get("/api/v1/courses/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void ordinaryFacultyAndLearnerCannotCrossTheAcademicMutationGate() throws Exception {
        seedPeopleAndTenants();

        String teacher = accessToken(facultyPrincipal(TEACHER_A, "LECTURER", COLLEGE_A));
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/courses/create")
                        .header("Authorization", "Bearer " + teacher)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/courses/create")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void tpoSurfaceRejectsLearnerButAllowsCollegeAdminThroughTheRealFilters() throws Exception {
        seedPeopleAndTenants();

        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        String admin = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        mvc.perform(get("/api/v1/tpo/reports")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/tpo/reports")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());
    }

    @Test
    void superAdminSurfaceRejectsCollegeAdminAndAcceptsSyntheticSuperAdminJwt() throws Exception {
        seedPeopleAndTenants();

        String admin = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
        mvc.perform(get("/api/v1/superadmin/features")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());

        String superAdmin = accessToken(superAdminPrincipal());
        int status = mvc.perform(get("/api/v1/superadmin/features")
                        .header("Authorization", "Bearer " + superAdmin))
                .andReturn().getResponse().getStatus();

        assertNotEquals(401, status, "valid signed super-admin token was rejected as unauthenticated");
        assertNotEquals(403, status, "valid signed super-admin token was rejected by the super-admin gate");
    }

    @Test
    void projectsMeReturnsOnlyTheAuthenticatedLearnersMemberships() throws Exception {
        seedPeopleAndTenants();
        seedProject(99741, COLLEGE_A, "alpha-project-it", "Alpha Project");
        seedProject(99742, COLLEGE_B, "beta-project-it", "Beta Project");
        seedProjectMember(99751, 99741, LEARNER_A, "LEARNER", "Student");
        seedProjectMember(99752, 99742, LEARNER_B, "LEARNER", "Student");

        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        String body = mvc.perform(get("/api/v1/projects/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Alpha Project"), body);
        assertFalse(body.contains("Beta Project"),
                "learner A response leaked learner B's project: " + body);
    }
}
