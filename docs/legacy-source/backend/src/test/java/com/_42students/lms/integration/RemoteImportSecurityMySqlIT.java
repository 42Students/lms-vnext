package com._42students.lms.integration;

import com._42students.lms.controller.FileUploadController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetAddress;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression coverage for the backend-fetch upload paths. All HTTP cases deliberately use
 * addresses that are rejected before any outbound request, so the CI suite never reaches the
 * public internet while still proving the SSRF/role gates.
 */
class RemoteImportSecurityMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_ID = 989920;
    private static final int LEARNER_ID = 989921;
    private static final int FACULTY_ID = 989922;

    @Autowired
    private FileUploadController controller;

    @BeforeEach
    void seedUsers() {
        cleanup();
        seedCollege(COLLEGE_ID, "Remote Import IT");
        seedLearner(LEARNER_ID, COLLEGE_ID, "ImportLearner");
        seedFaculty(FACULTY_ID, COLLEGE_ID, "ImportFaculty");
    }

    @AfterEach
    void cleanupAfter() {
        cleanup();
    }

    @Test
    void anonymousCannotInvokeBackendFetchEndpoints() throws Exception {
        String body = "{\"url\":\"http://127.0.0.1/video.mp4\"}";

        mvc.perform(post("/api/v1/upload/import-video-from-url")
                        .contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/upload/validate-video-url")
                        .contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void learnerCannotImportOrValidateRemoteVideo() throws Exception {
        String token = accessToken(learnerPrincipal(LEARNER_ID, COLLEGE_ID));
        String body = "{\"url\":\"http://127.0.0.1/video.mp4\"}";

        mvc.perform(post("/api/v1/upload/import-video-from-url")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/upload/validate-video-url")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void facultyVideoImportRejectsPrivateAndMetadataIpv4BeforeNetwork() throws Exception {
        String token = accessToken(facultyPrincipal(FACULTY_ID, "PERMANENT", COLLEGE_ID));
        for (String url : new String[] {
                "http://127.0.0.1/video.mp4",
                "http://10.0.0.1/video.mp4",
                "http://192.168.1.20/video.mp4",
                "http://169.254.169.254/latest/meta-data/"
        }) {
            mvc.perform(post("/api/v1/upload/import-video-from-url")
                            .header("Authorization", "Bearer " + token)
                            .contentType("application/json")
                            .content("{\"url\":\"" + url + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("restricted network address")));
        }
    }

    @Test
    void facultyVideoValidationReportsPrivateAddressAsInvalidWithoutFetching() throws Exception {
        String token = accessToken(facultyPrincipal(FACULTY_ID, "PERMANENT", COLLEGE_ID));

        mvc.perform(post("/api/v1/upload/validate-video-url")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"url\":\"http://127.0.0.1/video.mp4\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"valid\":false")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("restricted network address")));
    }

    @Test
    void genericImportRejectsNonGoogleHostBeforeOutboundFetch() throws Exception {
        String token = accessToken(facultyPrincipal(FACULTY_ID, "PERMANENT", COLLEGE_ID));

        mvc.perform(post("/api/v1/upload/import-file-from-url")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{"
                                + "\"url\":\"https://example.com/file.pdf\","
                                + "\"folder\":\"profile-images\","
                                + "\"type\":\"image\","
                                + "\"userId\":" + FACULTY_ID
                                + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(
                        "Only Google Drive links are supported")));
    }

    @Test
    void googleDriveNormalizerUsesExactHostAllowlistAndCanonicalDownloadUrl() {
        String normalized = ReflectionTestUtils.invokeMethod(
                controller,
                "normalizeImportUrl",
                "https://drive.google.com/file/d/abc123XYZ/view?usp=sharing");
        assertEquals("https://drive.google.com/uc?export=download&id=abc123XYZ", normalized);

        String docs = ReflectionTestUtils.invokeMethod(
                controller,
                "normalizeImportUrl",
                "https://docs.google.com/document/d/doc987/edit");
        assertEquals("https://drive.google.com/uc?export=download&id=doc987", docs);

        assertThrows(IllegalArgumentException.class, () -> ReflectionTestUtils.invokeMethod(
                controller,
                "normalizeImportUrl",
                "https://drive.google.com.evil.example/file/d/abc/view"));

        assertThrows(IllegalArgumentException.class, () -> ReflectionTestUtils.invokeMethod(
                controller,
                "normalizeImportUrl",
                "http://drive.google.com/file/d/abc/view"));
    }

    @Test
    void ipv6UniqueLocalAndLoopbackAddressesAreRejected() throws Exception {
        InetAddress ula = InetAddress.getByName("fc00::1");
        InetAddress publicV6 = InetAddress.getByName("2001:4860:4860::8888");

        Boolean ulaResult = ReflectionTestUtils.invokeMethod(controller, "isIpv6UniqueLocal", ula);
        Boolean publicResult = ReflectionTestUtils.invokeMethod(controller, "isIpv6UniqueLocal", publicV6);
        assertEquals(Boolean.TRUE, ulaResult);
        assertEquals(Boolean.FALSE, publicResult);

        assertThrows(IllegalArgumentException.class, () -> ReflectionTestUtils.invokeMethod(
                controller, "rejectInternalHost", URI.create("http://[::1]/video.mp4")));
    }

    @Test
    void hostlessRemoteUrlIsRejectedFailClosed() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                ReflectionTestUtils.invokeMethod(controller, "rejectInternalHost", URI.create("file:/tmp/video.mp4")));
        assertTrue(ex.getMessage().contains("valid host"));
    }

    @Test
    void overlongRemoteUrlIsRejectedByBeanValidationBeforeControllerWork() throws Exception {
        String token = accessToken(facultyPrincipal(FACULTY_ID, "PERMANENT", COLLEGE_ID));
        String huge = "https://example.com/" + "x".repeat(2100);

        mvc.perform(post("/api/v1/upload/import-video-from-url")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"url\":\"" + huge + "\"}"))
                .andExpect(status().isBadRequest());
    }

    private void cleanup() {
        try {
            jdbc.update("delete from faculty where id = ?", FACULTY_ID);
            jdbc.update("delete from learner where id = ?", LEARNER_ID);
            jdbc.update("delete from college where id = ?", COLLEGE_ID);
        } catch (Exception ignored) {
        }
    }
}
