package com._42students.lms.integration;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real super-admin scope tests. A narrowed super-admin session must stay narrowed even though the
 * underlying services can query the whole platform.
 */
@Transactional
@Rollback
class SuperAdminApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100301;
    private static final int COLLEGE_B = 100302;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Scoped SuperAdmin College A");
        seedCollege(COLLEGE_B, "Scoped SuperAdmin College B");
    }

    private String scopedCollegeToken() {
        UserPrincipal principal = UserPrincipal.forSuperAdminScoped(1, COLLEGE_A);
        return accessToken(principal);
    }

    @Test
    void collegeScopedSuperAdminFeatureListDoesNotLeakSiblingCollege() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/superadmin/features")
                        .header("Authorization", "Bearer " + scopedCollegeToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Scoped SuperAdmin College A"), body);
        assertFalse(body.contains("Scoped SuperAdmin College B"),
                "college-scoped super-admin response leaked sibling college: " + body);
    }

    @Test
    void collegeScopedSuperAdminCannotMutateSiblingCollegeFeatureFlags() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/superadmin/features/" + COLLEGE_B)
                        .header("Authorization", "Bearer " + scopedCollegeToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"module\":\"projects\",\"enabled\":false}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void globalSuperAdminCanSeeBothCollegesThroughTheSameApi() throws Exception {
        seedBase();
        String token = accessToken(superAdminPrincipal());

        String body = mvc.perform(get("/api/v1/superadmin/features")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Scoped SuperAdmin College A"), body);
        assertTrue(body.contains("Scoped SuperAdmin College B"), body);
    }
}
