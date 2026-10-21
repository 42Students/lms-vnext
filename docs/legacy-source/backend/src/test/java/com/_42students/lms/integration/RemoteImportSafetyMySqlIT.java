package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Outbound-fetch security for upload-by-link/video import.
 *
 * <p>Every URL in this suite is rejected before any network or R2 operation. This makes the tests
 * deterministic while proving that authenticated callers cannot turn the LMS backend into an
 * SSRF client.</p>
 */
@Transactional
@Rollback
class RemoteImportSafetyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109301;
    private static final int FACULTY = 109311;
    private static final int LEARNER = 109321;

    private void seedBase() {
        seedCollege(COLLEGE, "Remote Import Safety College");
        seedFaculty(FACULTY, COLLEGE, "ImportFaculty");
        seedLearner(LEARNER, COLLEGE, "ImportLearner");
    }

    private String facultyToken() {
        return accessToken(facultyPrincipal(FACULTY, "LECTURER", COLLEGE));
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER, COLLEGE));
    }

    @Test
    void learnerCannotImportArbitraryVideoUrl() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/upload/import-video-from-url")
                        .header("Authorization", "Bearer " + learnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/video.mp4\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotProbeVideoUrlsThroughValidationEndpoint() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/upload/validate-video-url")
                        .header("Authorization", "Bearer " + learnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/video.mp4\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void facultyVideoImportRejectsLoopbackBeforeNetworkFetch() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/upload/import-video-from-url")
                        .header("Authorization", "Bearer " + facultyToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"http://127.0.0.1/internal.mp4\"}"))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("restricted network address"), body);
    }

    @Test
    void facultyVideoImportRejectsCloudMetadataAndPrivateRangesBeforeNetworkFetch() throws Exception {
        seedBase();

        for (String url : new String[]{
                "http://169.254.169.254/latest/meta-data/",
                "http://10.0.0.1/internal.mp4",
                "http://192.168.1.10/internal.mp4",
                "http://[::1]/internal.mp4"
        }) {
            String body = mvc.perform(post("/api/v1/upload/import-video-from-url")
                            .header("Authorization", "Bearer " + facultyToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"url\":\"" + url + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(body.contains("restricted network address"), url + " -> " + body);
        }
    }

    @Test
    void videoValidationReportsPrivateAddressAsInvalidWithoutFetchingIt() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/upload/validate-video-url")
                        .header("Authorization", "Bearer " + facultyToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"http://127.0.0.1:8080/private.mp4\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"valid\":false"), body);
        assertTrue(body.contains("restricted network address"), body);
    }

    @Test
    void genericUrlImportRequiresHttpsGoogleDriveAndRejectsLookalikeHosts() throws Exception {
        seedBase();

        for (String url : new String[]{
                "http://drive.google.com/file/d/abc123/view",
                "https://drive.google.com.evil.test/file/d/abc123/view",
                "https://example.com/file/d/abc123/view"
        }) {
            mvc.perform(post("/api/v1/upload/import-file-from-url")
                            .header("Authorization", "Bearer " + facultyToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"url\":\"" + url
                                    + "\",\"folder\":\"assignments\",\"type\":\"generic\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void genericUrlImportRejectsGoogleDriveLinkWithoutFileIdentifierBeforeNetworkFetch() throws Exception {
        seedBase();

        String body = mvc.perform(post("/api/v1/upload/import-file-from-url")
                        .header("Authorization", "Bearer " + facultyToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://drive.google.com/not-a-file\","
                                + "\"folder\":\"assignments\",\"type\":\"generic\"}"))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Could not read Google Drive file id"), body);
    }
}
