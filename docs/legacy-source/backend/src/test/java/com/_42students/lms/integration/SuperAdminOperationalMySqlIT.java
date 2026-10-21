package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Super-admin operational integration: audit scoping, recruiter lifecycle and E2E seed fail-close.
 */
@Transactional
@Rollback
class SuperAdminOperationalMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 108401;
    private static final int COLLEGE_B = 108402;
    private static final int ADMIN_A = 108411;
    private static final int LEARNER_A = 108421;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Super Ops College A");
        seedCollege(COLLEGE_B, "Super Ops College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "Audit Admin");
        seedLearner(LEARNER_A, COLLEGE_A, "SuperOpsLearner");
    }

    private String globalSuper() {
        return accessToken(superAdminPrincipal());
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private int createRecruiter(String mobile, String firstName) throws Exception {
        mvc.perform(post("/api/v1/superadmin/recruiters")
                        .header("Authorization", "Bearer " + globalSuper())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contactMobile\":\"" + mobile + "\",\"firstName\":\"" + firstName
                                + "\",\"contactMail\":\"" + firstName.toLowerCase() + "@example.test\","
                                + "\"designation\":\"Talent Partner\",\"companyName\":\"Integration Hiring Corp\","
                                + "\"collegeIds\":[" + COLLEGE_A + "]}"))
                .andExpect(status().isOk());

        return jdbc.queryForObject(
                "select id from recruiter where contact_mobile = ? and is_deleted = 0",
                Integer.class, mobile);
    }

    @Test
    void collegeAdminAuditSearchIsForcedToOwnCollegeAndResolvesHumanActorName() throws Exception {
        seedBase();
        jdbc.update("insert into admin_audit_log "
                        + "(actor_user_id, actor_user_type, actor_contact_mobile, action_key, entity_type, entity_id, organization_id, college_id, created_at) "
                        + "values (?, 'FACULTY', '9000000000', 'COURSE_UPDATE', 'course', '1', 1, ?, now())",
                ADMIN_A, COLLEGE_A);
        jdbc.update("insert into admin_audit_log "
                        + "(actor_user_id, actor_user_type, action_key, entity_type, entity_id, organization_id, college_id, created_at) "
                        + "values (999999, 'FACULTY', 'FOREIGN_SECRET_ACTION', 'course', '2', 1, ?, now())",
                COLLEGE_B);

        String body = mvc.perform(get("/api/v1/superadmin/audit")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("COURSE_UPDATE"), body);
        assertTrue(body.contains("Audit Admin"), body);
        assertTrue(!body.contains("FOREIGN_SECRET_ACTION"), body);
    }

    @Test
    void globalSuperAdminCanFilterAuditByExplicitCollegeAndUnknownCategoryFailsClosed() throws Exception {
        seedBase();
        jdbc.update("insert into admin_audit_log "
                        + "(actor_user_id, actor_user_type, action_key, entity_type, entity_id, organization_id, college_id, created_at) "
                        + "values (?, 'FACULTY', 'OWN_AUDIT_ACTION', 'department', '10', 1, ?, now())",
                ADMIN_A, COLLEGE_A);
        jdbc.update("insert into admin_audit_log "
                        + "(actor_user_id, actor_user_type, action_key, entity_type, entity_id, organization_id, college_id, created_at) "
                        + "values (999998, 'FACULTY', 'FOREIGN_AUDIT_ACTION', 'department', '20', 1, ?, now())",
                COLLEGE_B);

        String body = mvc.perform(get("/api/v1/superadmin/audit")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + globalSuper()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("FOREIGN_AUDIT_ACTION"), body);
        assertTrue(!body.contains("OWN_AUDIT_ACTION"), body);

        mvc.perform(get("/api/v1/superadmin/audit")
                        .param("category", "root-secrets")
                        .header("Authorization", "Bearer " + globalSuper()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recruiterCreatePersistsCollegeGrantAndDuplicateMobileConflicts() throws Exception {
        seedBase();
        int recruiterId = createRecruiter("9876500001", "Riya");

        assertEquals("Riya", jdbc.queryForObject(
                "select first_name from recruiter where id = ?", String.class, recruiterId));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from recruiter_college_access where recruiter_id = ? and college_id = ? and status = 'ACTIVE'",
                Integer.class, recruiterId, COLLEGE_A));

        mvc.perform(post("/api/v1/superadmin/recruiters")
                        .header("Authorization", "Bearer " + globalSuper())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contactMobile\":\"9876500001\",\"firstName\":\"Duplicate\","
                                + "\"collegeIds\":[" + COLLEGE_A + "]}"))
                .andExpect(status().isConflict());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from recruiter where contact_mobile = '9876500001' and is_deleted = 0",
                Integer.class));
    }

    @Test
    void suspendReactivateAndRevokeSessionsInvalidateRecruiterTokensByVersion() throws Exception {
        seedBase();
        int recruiterId = createRecruiter("9876500002", "SessionRecruiter");
        int initial = jdbc.queryForObject(
                "select token_version from recruiter where id = ?", Integer.class, recruiterId);

        mvc.perform(post("/api/v1/superadmin/recruiters/" + recruiterId + "/suspend")
                        .header("Authorization", "Bearer " + globalSuper())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Security review\"}"))
                .andExpect(status().isOk());

        assertNotNull(jdbc.queryForObject(
                "select suspended_at from recruiter where id = ?", java.sql.Timestamp.class, recruiterId));
        assertEquals("Security review", jdbc.queryForObject(
                "select suspension_reason from recruiter where id = ?", String.class, recruiterId));
        int afterSuspend = jdbc.queryForObject(
                "select token_version from recruiter where id = ?", Integer.class, recruiterId);
        assertEquals(initial + 1, afterSuspend);

        mvc.perform(post("/api/v1/superadmin/recruiters/" + recruiterId + "/reactivate")
                        .header("Authorization", "Bearer " + globalSuper()))
                .andExpect(status().isOk());
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from recruiter where id = ? and suspended_at is not null",
                Integer.class, recruiterId));

        mvc.perform(post("/api/v1/superadmin/recruiters/" + recruiterId + "/revoke-sessions")
                        .header("Authorization", "Bearer " + globalSuper()))
                .andExpect(status().isOk());

        assertEquals(afterSuspend + 1, jdbc.queryForObject(
                "select token_version from recruiter where id = ?", Integer.class, recruiterId));
    }

    @Test
    void globalSuperAdminCanGrantAndRevokeSecondCollegeWithoutTouchingFirstGrant() throws Exception {
        seedBase();
        int recruiterId = createRecruiter("9876500003", "MultiCollegeRecruiter");

        mvc.perform(post("/api/v1/superadmin/recruiters/" + recruiterId + "/colleges")
                        .header("Authorization", "Bearer " + globalSuper())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + "}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from recruiter_college_access where recruiter_id = ? and college_id = ? and status = 'ACTIVE'",
                Integer.class, recruiterId, COLLEGE_B));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(
                        "/api/v1/superadmin/recruiters/" + recruiterId + "/colleges/" + COLLEGE_B)
                        .header("Authorization", "Bearer " + globalSuper())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Contract ended\"}"))
                .andExpect(status().isOk());

        assertEquals("REVOKED", jdbc.queryForObject(
                "select status from recruiter_college_access where recruiter_id = ? and college_id = ?",
                String.class, recruiterId, COLLEGE_B));
        assertEquals("ACTIVE", jdbc.queryForObject(
                "select status from recruiter_college_access where recruiter_id = ? and college_id = ?",
                String.class, recruiterId, COLLEGE_A));
    }

    @Test
    void regularCollegeAdminCannotUseSuperAdminRecruiterLifecycle() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/superadmin/recruiters")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/superadmin/recruiters")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contactMobile\":\"9876500004\",\"firstName\":\"Attack\","
                                + "\"collegeIds\":[" + COLLEGE_A + "]}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from recruiter where contact_mobile = '9876500004'",
                Integer.class));
    }

    @Test
    void e2eSeedEndpointFailsClosedWhenSeedFlagIsDisabled() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/superadmin/e2e/seed")
                        .header("Authorization", "Bearer " + globalSuper()))
                .andExpect(status().isInternalServerError())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("E2E seeding is disabled"), body);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from college where name like 'E2E College %' and is_deleted = 0",
                Integer.class));
    }

    @Test
    void nonSuperAdminCannotReachE2eSeedEndpointEvenBeforeFeatureFlag() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/superadmin/e2e/seed")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from college where name like 'E2E College %' and is_deleted = 0",
                Integer.class));
    }
}
