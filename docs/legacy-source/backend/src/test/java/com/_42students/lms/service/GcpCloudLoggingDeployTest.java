package com._42students.lms.service;

import com._42students.lms.dto.response.DeployHealthResponse;
import com._42students.lms.dto.response.DeployMarkerResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GcpCloudLoggingDeployTest {

    private static GcpCloudLoggingService.RawDeployMarker marker(String at, String commit) {
        return new GcpCloudLoggingService.RawDeployMarker(Instant.parse(at), commit);
    }

    @Test
    void podsOfOneRolloutCollapseIntoOneMarkerNewestFirst() {
        List<DeployMarkerResponse> result = GcpCloudLoggingService.clusterDeployMarkers(List.of(
                marker("2026-09-28T10:03:00Z", "aaa1111"),
                marker("2026-09-28T10:01:00Z", "aaa1111"),
                marker("2026-09-28T14:00:00Z", "bbb2222"),
                marker("2026-09-28T14:02:00Z", "bbb2222")));

        assertEquals(2, result.size());
        assertEquals("bbb2222", result.get(0).getCommit());
        assertEquals(2, result.get(0).getPods());
        assertEquals(Instant.parse("2026-09-28T14:00:00Z"), result.get(0).getAt());
        assertEquals("aaa1111", result.get(1).getCommit());
        assertEquals(Instant.parse("2026-09-28T10:01:00Z"), result.get(1).getAt());
    }

    @Test
    void aDifferentCommitStartingRightAfterIsAlwaysANewRollout() {
        List<DeployMarkerResponse> result = GcpCloudLoggingService.clusterDeployMarkers(List.of(
                marker("2026-09-28T10:00:00Z", "aaa1111"),
                marker("2026-09-28T10:05:00Z", "bbb2222")));
        assertEquals(2, result.size());
    }

    @Test
    void theSameCommitRestartingHoursLaterIsARestartNotTheSameRollout() {
        List<DeployMarkerResponse> result = GcpCloudLoggingService.clusterDeployMarkers(List.of(
                marker("2026-09-28T10:00:00Z", "aaa1111"),
                marker("2026-09-28T16:00:00Z", "aaa1111")));
        assertEquals(2, result.size());
    }

    @Test
    void missingCommitsAreLabelledUnknownAndAnEmptyListIsEmpty() {
        assertEquals("unknown", GcpCloudLoggingService.clusterDeployMarkers(List.of(marker("2026-09-28T10:00:00Z", null))).get(0).getCommit());
        assertTrue(GcpCloudLoggingService.clusterDeployMarkers(List.of()).isEmpty());
    }

    @Test
    void verdictFlagsAtLeastDoubleAndAtLeastFive() {
        assertEquals("OK", GcpCloudLoggingService.healthVerdict(0, 0));
        assertEquals("OK", GcpCloudLoggingService.healthVerdict(10, 4));
        assertEquals("ELEVATED", GcpCloudLoggingService.healthVerdict(3, 4));
        assertEquals("ELEVATED", GcpCloudLoggingService.healthVerdict(0, 3));
        assertEquals("JUMP", GcpCloudLoggingService.healthVerdict(0, 5));
        assertEquals("JUMP", GcpCloudLoggingService.healthVerdict(6, 12));
    }

    @SuppressWarnings("unchecked")
    private GcpCloudLoggingService serviceReturning(String... bodies) throws Exception {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId()).thenReturn("p");
        when(credentials.getAccessToken()).thenReturn("t");
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String> first = mock(HttpResponse.class);
        when(first.statusCode()).thenReturn(200);
        when(first.body()).thenReturn(bodies[0]);
        HttpResponse<String>[] rest = new HttpResponse[bodies.length - 1];
        for (int i = 1; i < bodies.length; i++) {
            rest[i - 1] = mock(HttpResponse.class);
            when(rest[i - 1].statusCode()).thenReturn(200);
            when(rest[i - 1].body()).thenReturn(bodies[i]);
        }
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(first, rest);
        return new GcpCloudLoggingService(new ObjectMapper(), credentials, client);
    }

    @Test
    void deployMarkersAreReadFromTheStartupLines() throws Exception {
        String body = "{\"entries\":["
                + "{\"timestamp\":\"2026-09-28T14:01:00Z\",\"jsonPayload\":{\"message\":\"app.started\",\"commit\":\"bbb2222\"}},"
                + "{\"timestamp\":\"2026-09-28T14:00:00Z\",\"jsonPayload\":{\"message\":\"app.started\",\"commit\":\"bbb2222\"}},"
                + "{\"timestamp\":\"2026-09-27T09:00:00Z\",\"jsonPayload\":{\"message\":\"app.started\",\"commit\":\"aaa1111\"}}]}";

        List<DeployMarkerResponse> markers = serviceReturning(body).deployMarkers("PRODUCTION", 7);

        assertEquals(2, markers.size());
        assertEquals("bbb2222", markers.get(0).getCommit());
        assertEquals(2, markers.get(0).getPods());
    }

    @Test
    void deployHealthCountsRealErrorsOnBothSidesAndIgnoresTheLogsToolingItself() throws Exception {
        String before = "{\"entries\":[{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"a\",\"httpPath\":\"/api/v1/x\"}}]}";
        String after = "{\"entries\":["
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"b\",\"httpPath\":\"/api/v1/x\"}},"
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"c\",\"httpPath\":\"/api/v1/y\"}},"
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"d\",\"httpPath\":\"/api/v1/z\"}},"
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"e\",\"httpPath\":\"/api/v1/w\"}},"
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"f\",\"httpPath\":\"/api/v1/v\"}},"
                + "{\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"self\",\"httpPath\":\"/api/v1/superadmin/logs/query\"}}]}";

        DeployHealthResponse health = serviceReturning(before, after)
                .deployHealth("PRODUCTION", Instant.now().minus(Duration.ofHours(1)));

        assertEquals(1, health.getErrorsBefore());
        assertEquals(5, health.getErrorsAfter());
        assertEquals("JUMP", health.getVerdict());
        assertFalse(health.isCapped());
        assertEquals(10, health.getWindowMinutes());
    }
}
