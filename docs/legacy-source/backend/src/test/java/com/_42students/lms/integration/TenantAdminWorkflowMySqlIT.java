package com._42students.lms.integration;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Super-admin tenant/domain/settings integration without external DNS calls.
 */
@Transactional
@Rollback
class TenantAdminWorkflowMySqlIT extends AbstractMySqlHttpIT {

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

    private static final int COLLEGE_A = 104401;
    private static final int COLLEGE_B = 104402;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Tenant Admin College A");
        seedCollege(COLLEGE_B, "Tenant Admin College B");
    }

    private String global() {
        return accessToken(superAdminPrincipal());
    }

    private String scopedA() {
        return accessToken(UserPrincipal.forSuperAdminScoped(1, COLLEGE_A));
    }

    private int createDomain(int collegeId, String host, boolean primary, String token) throws Exception {
        mvc.perform(post("/api/v1/superadmin/tenant/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + collegeId + ",\"host\":\"" + host
                                + "\",\"isPrimary\":" + primary + "}"))
                .andExpect(status().isOk());

        return flushedQuery(
                "select id from tenant_domain where college_id = ? and is_deleted = 0 order by id desc limit 1",
                Integer.class, collegeId);
    }

    @Test
    void globalSuperAdminCreatesNormalizedPrimaryDomainAndListsIt() throws Exception {
        seedBase();
        int id = createDomain(COLLEGE_A, "Portal.Example-College.TEST", true, global());

        assertEquals("portal.example-college.test", flushedQuery(
                "select host from tenant_domain where id = ?", String.class, id));
        assertEquals(1, flushedQuery(
                "select is_primary from tenant_domain where id = ?", Integer.class, id));

        String body = mvc.perform(get("/api/v1/superadmin/tenant/domains")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + global()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("portal.example-college.test"), body);
    }

    @Test
    void duplicateActiveHostIsRejectedAcrossColleges() throws Exception {
        seedBase();
        createDomain(COLLEGE_A, "duplicate.example.test", true, global());

        mvc.perform(post("/api/v1/superadmin/tenant/domains")
                        .header("Authorization", "Bearer " + global())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B
                                + ",\"host\":\"duplicate.example.test\",\"isPrimary\":true}"))
                .andExpect(status().isConflict());

        assertEquals(1, flushedQuery(
                "select count(*) from tenant_domain where host = 'duplicate.example.test' and is_deleted = 0",
                Integer.class));
    }

    @Test
    void changingHostClearsVerificationAndDomainCannotMoveCollege() throws Exception {
        seedBase();
        int id = createDomain(COLLEGE_A, "old.example.test", true, global());
        syncedUpdate("update tenant_domain set is_verified = 1, verified_at = now(), verification_token = 'old-token' where id = ?", id);

        mvc.perform(put("/api/v1/superadmin/tenant/domains/" + id)
                        .header("Authorization", "Bearer " + global())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_A + ",\"host\":\"new.example.test\"}"))
                .andExpect(status().isOk());

        assertEquals("new.example.test", flushedQuery(
                "select host from tenant_domain where id = ?", String.class, id));
        assertEquals(0, flushedQuery(
                "select is_verified from tenant_domain where id = ?", Integer.class, id));
        assertEquals(0, flushedQuery(
                "select count(*) from tenant_domain where id = ? and verification_token is not null",
                Integer.class, id));

        mvc.perform(put("/api/v1/superadmin/tenant/domains/" + id)
                        .header("Authorization", "Bearer " + global())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + "}"))
                .andExpect(status().isBadRequest());

        assertEquals(COLLEGE_A, flushedQuery(
                "select college_id from tenant_domain where id = ?", Integer.class, id));
    }

    @Test
    void deletingDomainFreesOriginalHostForCleanRecreation() throws Exception {
        seedBase();
        int first = createDomain(COLLEGE_A, "reusable.example.test", true, global());

        mvc.perform(delete("/api/v1/superadmin/tenant/domains/" + first)
                        .header("Authorization", "Bearer " + global()))
                .andExpect(status().isOk());

        assertEquals(1, flushedQuery(
                "select is_deleted from tenant_domain where id = ?", Integer.class, first));
        String deletedHost = flushedQuery(
                "select host from tenant_domain where id = ?", String.class, first);
        assertTrue(deletedHost.startsWith("reusable.example.test~deleted~"), deletedHost);

        int second = createDomain(COLLEGE_A, "reusable.example.test", true, global());
        assertTrue(second != first);
        assertEquals("reusable.example.test", flushedQuery(
                "select host from tenant_domain where id = ?", String.class, second));
    }

    @Test
    void verificationTokenIssuancePersistsTokenWithoutClearingExistingVerification() throws Exception {
        seedBase();
        int id = createDomain(COLLEGE_A, "verify-token.example.test", true, global());
        syncedUpdate("update tenant_domain set is_verified = 1, verified_at = now() where id = ?", id);

        String body = mvc.perform(post("/api/v1/superadmin/tenant/domains/" + id + "/verification-token")
                        .header("Authorization", "Bearer " + global()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = flushedQuery(
                "select verification_token from tenant_domain where id = ?", String.class, id);
        assertNotNull(token);
        assertTrue(!token.isBlank());
        assertTrue(body.contains("_42lms-verify.verify-token.example.test"), body);
        assertEquals(1, flushedQuery(
                "select is_verified from tenant_domain where id = ?", Integer.class, id));
    }

    @Test
    void collegeScopedSuperAdminCannotManageSiblingDomainOrGlobalSettings() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/superadmin/tenant/domains")
                        .header("Authorization", "Bearer " + scopedA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + ",\"host\":\"forbidden.example.test\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/superadmin/tenant/settings/global")
                        .header("Authorization", "Bearer " + scopedA())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ops.integrationProbe\":\"enabled\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, flushedQuery(
                "select count(*) from tenant_domain where college_id = ? and is_deleted = 0",
                Integer.class, COLLEGE_B));
    }

    @Test
    void globalSettingsRoundTripButDedicatedModuleKeysAreRejected() throws Exception {
        seedBase();

        String body = mvc.perform(put("/api/v1/superadmin/tenant/settings/global")
                        .header("Authorization", "Bearer " + global())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ops.integrationProbe\":\"enabled\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("ops.integrationProbe"), body);
        assertTrue(body.contains("enabled"), body);

        mvc.perform(put("/api/v1/superadmin/tenant/settings/global")
                        .header("Authorization", "Bearer " + global())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"module.projects.enabled\":\"false\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(delete("/api/v1/superadmin/tenant/settings/global/ops.integrationProbe")
                        .header("Authorization", "Bearer " + global()))
                .andExpect(status().isOk());
    }
}
