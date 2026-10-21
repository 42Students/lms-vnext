package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Public tenant/bootstrap and browser-safe utility boundaries.
 */
@Transactional
@Rollback
class PublicClientUtilityMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 108601;
    private static final int LEARNER = 108621;

    private void seedBase() {
        seedCollege(COLLEGE, "Public Utility College");
        seedLearner(LEARNER, COLLEGE, "PublicUtilityLearner");
    }

    @Test
    void localhostTenantBootstrapAlwaysReturnsGlobalModeWithoutTenantLookup() throws Exception {
        String body = mvc.perform(get("/api/v1/public/tenant-bootstrap")
                        .header("Host", "localhost:5173"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"mode\":\"GLOBAL\""), body);
        assertTrue(body.contains("baseDomain"), body);
    }

    @Test
    void tenantBootstrapResolvesAliasAndReturnsCanonicalVerifiedPrimaryHost() throws Exception {
        seedBase();
        jdbc.update("insert into tenant_domain "
                        + "(college_id, host, is_primary, is_verified, verified_at, is_deleted) "
                        + "values (?, 'campus.example.test', 1, 1, now(), 0)",
                COLLEGE);
        jdbc.update("insert into tenant_domain "
                        + "(college_id, host, is_primary, is_verified, verified_at, is_deleted) "
                        + "values (?, 'alias.example.test', 0, 1, now(), 0)",
                COLLEGE);
        jdbc.update("insert into college_branding "
                        + "(college_id, logo_url, primary_color, support_email, is_deleted) "
                        + "values (?, 'https://cdn.example.test/logo.png', '#123456', 'help@example.test', 0)",
                COLLEGE);

        String body = mvc.perform(get("/api/v1/public/tenant-bootstrap")
                        .header("Host", "alias.example.test"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"mode\":\"TENANT\""), body);
        assertTrue(body.contains("\"collegeId\":" + COLLEGE), body);
        assertTrue(body.contains("\"canonicalHost\":\"campus.example.test\""), body);
        assertTrue(body.contains("\"shouldRedirectToCanonicalHost\":true"), body);
        assertTrue(body.contains("https://cdn.example.test/logo.png"), body);
        assertTrue(body.contains("#123456"), body);
        assertTrue(body.contains("help@example.test"), body);
    }

    @Test
    void unknownTenantHostReturnsUniformNotFoundWithoutLeakingCollegeData() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/public/tenant-bootstrap")
                        .header("Host", "unknown.example.test"))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("TENANT_NOT_FOUND"), body);
        assertTrue(!body.contains("Public Utility College"), body);
    }

    @Test
    void signedInClientSettingsExposeOnlyWhitelistedValuesAndEnforcePollingFloors() throws Exception {
        seedBase();
        jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('GLOBAL', null, 'ui.chatPollIntervalMs', '100', 0)");
        jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('GLOBAL', null, 'ui.progressSaveIntervalMs', '200', 0)");
        jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('GLOBAL', null, 'course.watchedThresholdPercent', '87', 0)");
        jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('GLOBAL', null, 'otp.secret.internal', 'DO_NOT_LEAK', 0)");

        String body = mvc.perform(get("/api/v1/client-settings")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER, COLLEGE))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"chatPollIntervalMs\":3000"), body);
        assertTrue(body.contains("\"progressSaveIntervalMs\":5000"), body);
        assertTrue(body.contains("\"watchedThresholdPercent\":87"), body);
        assertTrue(!body.contains("otp.secret.internal"), body);
        assertTrue(!body.contains("DO_NOT_LEAK"), body);
    }

    @Test
    void invalidPublicRecruiterInviteAndShareTokensBothFailAsUniform404s() throws Exception {
        String invite = mvc.perform(get("/api/v1/public/recruiter-invite/not-a-real-token"))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        assertTrue(invite.contains("INVITE_INVALID"), invite);

        String share = mvc.perform(get("/api/v1/public/share/not-a-real-token"))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        assertTrue(share.contains("SHARE_INVALID"), share);
        assertTrue(!share.toLowerCase().contains("database"), share);
    }

    @Test
    void publicE2eSuperAdminLoginFailsClosedWhenTestOtpFeatureIsDisabled() throws Exception {
        String body = mvc.perform(post("/api/v1/public/e2e/auth/superadmin")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9000000000\"}"))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("NOT_FOUND"), body);
    }
}
