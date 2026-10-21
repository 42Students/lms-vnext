package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP-level upload/file authorization with real JWTs. Tests deliberately use paths that are
 * rejected before storage I/O so the suite never contacts R2 while still exercising the production
 * tenant and ownership gates.
 */
@Transactional
@Rollback
class FileUploadApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100401;
    private static final int COLLEGE_B = 100402;
    private static final int LEARNER_A = 100421;
    private static final int LEARNER_B = 100422;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Upload API College A");
        seedCollege(COLLEGE_B, "Upload API College B");
        seedLearner(LEARNER_A, COLLEGE_A, "UploadLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "UploadLearnerB");
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    @Test
    void learnerCannotPresignAuthoringFolder() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/upload/presign")
                        .header("Authorization", "Bearer " + learnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fileName\":\"job.pdf\",\"contentType\":\"application/pdf\"," +
                                "\"contentLength\":1024,\"folder\":\"jd-files\",\"type\":\"pdf\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotPresignAnotherUsersSelfOwnedFile() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/upload/presign")
                        .header("Authorization", "Bearer " + learnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fileName\":\"avatar.png\",\"contentType\":\"image/png\"," +
                                "\"contentLength\":1024,\"folder\":\"profile-images\",\"type\":\"image\"," +
                                "\"userId\":" + LEARNER_B + "}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotReadFileFromAnotherTenantPrefix() throws Exception {
        seedBase();

        String foreignKey = "org-1/college-" + COLLEGE_B +
                "/profile-images/user-" + LEARNER_B + "/avatar.png";

        mvc.perform(get("/api/v1/upload/file/get")
                        .param("fileName", foreignKey)
                        .param("userId", String.valueOf(LEARNER_B))
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotDeleteFileFromAnotherTenantPrefix() throws Exception {
        seedBase();

        String foreignKey = "org-1/college-" + COLLEGE_B +
                "/resumes/user-" + LEARNER_B + "/resume.pdf";

        String body = mvc.perform(delete("/api/v1/upload/file/delete")
                        .param("fileName", foreignKey)
                        .param("userId", String.valueOf(LEARNER_B))
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isForbidden())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("tenant") || body.contains("FORBIDDEN"),
                "cross-tenant rejection should be explicit: " + body);
    }
}
