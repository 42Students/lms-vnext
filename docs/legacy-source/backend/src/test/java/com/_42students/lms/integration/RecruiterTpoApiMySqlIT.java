package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Recruiter/TPO API integration after the HR -> Recruiter migration. These checks pin the renamed
 * tables, real recruiter JWT authentication, live grant revocation and the recruiter fence.
 */
@Transactional
@Rollback
class RecruiterTpoApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100201;
    private static final int COLLEGE_B = 100202;
    private static final int RECRUITER = 100221;
    private static final int ACCESS = 100231;

    private void seedRecruiter() {
        seedCollege(COLLEGE_A, "Recruiter API College A");
        seedCollege(COLLEGE_B, "Recruiter API College B");

        jdbc.update(
                "insert into recruiter " +
                        "(id, first_name, last_name, contact_mail, token_version, version, is_deleted) " +
                        "values (?, 'Riya', 'Recruiter', 'riya-api-it@example.test', 0, 0, 0)",
                RECRUITER);

        jdbc.update(
                "insert into recruiter_college_access " +
                        "(id, recruiter_id, college_id, organization_id, status, granted_at, version, is_deleted) " +
                        "values (?, ?, ?, 1, 'ACTIVE', now(), 0, 0)",
                ACCESS, RECRUITER, COLLEGE_A);

        for (String capability : new String[]{"COLLEGE_OVERVIEW", "DRIVE_REQUEST", "DRIVE_WORK"}) {
            jdbc.update(
                    "insert into recruiter_college_access_capability (access_id, capability) values (?, ?)",
                    ACCESS, capability);
        }
    }

    // The test transaction is shared by every MockMvc request, so entities loaded by an earlier request stay in its
    // persistence context. Production requests each get a fresh one; clear it after changing rows behind JPA's back.
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private String recruiterToken() {
        return accessToken(new com._42students.lms.security.UserPrincipal(
                RECRUITER, "RECRUITER", null, 1, COLLEGE_A, 0));
    }

    @Test
    void selectedCollegeRecruiterJwtReadsMeFromRenamedTables() throws Exception {
        seedRecruiter();

        String body = mvc.perform(get("/api/v1/recruiter/me")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Riya"), body);
        assertTrue(body.contains("Recruiter API College A"), body);
        assertFalse(body.contains("Recruiter API College B"),
                "selected-college recruiter session leaked an ungranted college: " + body);
    }

    @Test
    void recruiterFenceBlocksTpoAdminAndLearnerSurfaces() throws Exception {
        seedRecruiter();
        String token = recruiterToken();

        mvc.perform(get("/api/v1/tpo/reports")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/learner/getLearnerDetails")
                        .param("learnerId", "1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/module-access/tree")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void grantRevocationInvalidatesAnAlreadyIssuedSelectedCollegeTokenImmediately() throws Exception {
        seedRecruiter();
        String token = recruiterToken();

        mvc.perform(get("/api/v1/recruiter/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        jdbc.update(
                "update recruiter_college_access set status = 'REVOKED', revoked_at = now() where id = ?",
                ACCESS);
        entityManager.clear();

        mvc.perform(get("/api/v1/recruiter/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recruiterCannotReadACollegeWithoutAGrantEvenWithAValidRecruiterSession() throws Exception {
        seedRecruiter();

        mvc.perform(get("/api/v1/recruiter/colleges/" + COLLEGE_B + "/overview")
                        .header("Authorization", "Bearer " + recruiterToken()))
                // RecruiterFenceFilter answers another college with 404 NOT_FOUND on purpose, so a recruiter session cannot
                // even learn that the college exists (Scope.OTHER_COLLEGE).
                .andExpect(status().isNotFound());
    }

    @Test
    void oldHrApiAddressDoesNotComeBackAfterTheRename() throws Exception {
        seedRecruiter();

        int code = mvc.perform(get("/api/v1/hr/me")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andReturn().getResponse().getStatus();

        assertTrue(code == 403 || code == 404,
                "legacy /api/v1/hr surface unexpectedly became reachable: HTTP " + code);
    }
}
