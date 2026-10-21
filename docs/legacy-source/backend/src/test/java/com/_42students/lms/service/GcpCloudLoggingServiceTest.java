package com._42students.lms.service;

import com._42students.lms.dto.request.GcpLogExportRequest;
import com._42students.lms.dto.request.GcpLogQueryRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GcpCloudLoggingServiceTest {
    @Test
    void buildsBoundedNamespaceSeverityAndTimeFilter() {
        String filter = GcpCloudLoggingService.buildFilter(
                "lms-prod-2026",
                "WARNING",
                null,
                Instant.parse("2026-09-23T10:00:00Z"),
                Instant.parse("2026-09-23T11:00:00Z"));

        assertTrue(filter.contains("resource.type=\"k8s_container\""));
        assertTrue(filter.contains("resource.labels.namespace_name=\"lms-prod-2026\""));
        assertTrue(filter.contains("resource.labels.container_name=\"lms-be\""));
        assertTrue(filter.contains("severity>=WARNING"));
        assertFalse(filter.contains("SEARCH("));
    }

    @Test
    void escapesUserSearchInsteadOfAllowingFilterInjection() {
        String escaped = GcpCloudLoggingService.escapeFilterString(
                "boom\" OR severity>=DEBUG\nnext");

        assertEquals("boom\\\" OR severity>=DEBUG next", escaped);
        String filter = GcpCloudLoggingService.buildFilter(
                "lms-dev-2026",
                "ERROR",
                "boom\" OR severity>=DEBUG",
                Instant.parse("2026-09-23T10:00:00Z"),
                Instant.parse("2026-09-23T11:00:00Z"));

        assertTrue(filter.contains("severity>=ERROR"));
        assertTrue(filter.contains("SEARCH(\"boom\\\" OR severity>=DEBUG\")"));
        assertFalse(filter.contains("SEARCH(\"boom\" OR severity>=DEBUG\")"));
    }

    @Test
    void paginationAnchorCanRemainValidDuringLongInvestigation() {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        GcpCloudLoggingService service = new GcpCloudLoggingService(new ObjectMapper(), credentials);
        when(credentials.getProjectId()).thenThrow(new CloudLoggingUnavailableException("stop after validation"));

        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("PRODUCTION");
        request.setWindow("7D");
        request.setLevel("WARNING");
        request.setPageToken("page-token");
        request.setAnchor(Instant.now().minus(Duration.ofHours(3)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.search(request));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
    }

    @Test
    void redactsSensitiveKeysAndSecretsInsideText() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        GcpCloudLoggingService service =
                new GcpCloudLoggingService(mapper, mock(GcpMetadataCredentialProvider.class));

        JsonNode input = mapper.readTree(
                "{\"password\":\"hunter2\","
                        + "\"nested\":{\"access_token\":\"abc\","
                        + "\"message\":\"authorization: Bearer xyz password=secret\"},"
                        + "\"httpRequest\":{\"requestUrl\":\"https://42lms.com/api?a=secret#x\"}}"
        );

        JsonNode safe = service.sanitizeRaw(input);
        assertEquals("[REDACTED]", safe.path("password").asText());
        assertEquals("[REDACTED]", safe.path("nested").path("access_token").asText());
        assertFalse(safe.path("nested").path("message").asText().contains("xyz"));
        assertFalse(safe.path("nested").path("message").asText().contains("secret"));
        assertEquals("https://42lms.com/api", safe.path("httpRequest").path("requestUrl").asText());
    }

    @Test
    void sanitizerRemovesJwtLikeValues() {
        String input = "token eyJabcdefghijk.abcdefghijkl.abcdefghijkl";
        assertFalse(GcpCloudLoggingService.sanitizeString(input).contains("eyJabcdefghijk"));
    }

    @Test
    void metadataCredentialFailureBecomesControlledServiceUnavailable() {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId())
                .thenThrow(new CloudLoggingUnavailableException("metadata unavailable"));

        GcpCloudLoggingService service = new GcpCloudLoggingService(new ObjectMapper(), credentials);
        GcpLogQueryRequest request = new GcpLogQueryRequest();

        ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> service.search(request));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        verify(credentials, never()).getAccessToken();
    }

    private GcpLogExportRequest exportRequest(Instant since, Instant until) {
        GcpLogExportRequest request = new GcpLogExportRequest();
        request.setEnvironment("PRODUCTION");
        request.setLevel("WARNING");
        request.setSince(since);
        request.setUntil(until);
        return request;
    }

    @Test
    void exportRejectsAMissingTimeRange() {
        GcpCloudLoggingService service =
                new GcpCloudLoggingService(new ObjectMapper(), mock(GcpMetadataCredentialProvider.class));
        GcpLogExportRequest request = exportRequest(null, Instant.now());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.export(request));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void exportRejectsUntilBeforeSince() {
        GcpCloudLoggingService service =
                new GcpCloudLoggingService(new ObjectMapper(), mock(GcpMetadataCredentialProvider.class));
        Instant now = Instant.now();
        GcpLogExportRequest request = exportRequest(now, now.minusSeconds(60));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.export(request));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void exportRejectsARangeWiderThanTheCap() {
        GcpCloudLoggingService service =
                new GcpCloudLoggingService(new ObjectMapper(), mock(GcpMetadataCredentialProvider.class));
        Instant until = Instant.now();
        GcpLogExportRequest request = exportRequest(until.minus(Duration.ofDays(45)), until);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.export(request));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void exportRejectsARangeInTheFuture() {
        GcpCloudLoggingService service =
                new GcpCloudLoggingService(new ObjectMapper(), mock(GcpMetadataCredentialProvider.class));
        Instant future = Instant.now().plus(Duration.ofDays(1));
        GcpLogExportRequest request = exportRequest(future.minusSeconds(60), future);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.export(request));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> jsonResponse(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }

    @Test
    void exportFollowsPaginationAcrossMultiplePages() throws Exception {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId()).thenReturn("students-384817");
        when(credentials.getAccessToken()).thenReturn("token");
        HttpClient httpClient = mock(HttpClient.class);
        String page1 = "{\"entries\":[{\"insertId\":\"a\",\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"boom 1\"}}],"
                + "\"nextPageToken\":\"p2\"}";
        String page2 = "{\"entries\":[{\"insertId\":\"b\",\"severity\":\"ERROR\",\"jsonPayload\":{\"message\":\"boom 2\"}}]}";
        HttpResponse<String> response1 = jsonResponse(200, page1);
        HttpResponse<String> response2 = jsonResponse(200, page2);
        doReturn(response1).doReturn(response2).when(httpClient).send(any(), any());

        GcpCloudLoggingService service = new GcpCloudLoggingService(new ObjectMapper(), credentials, httpClient);
        Instant until = Instant.now();
        GcpLogExportRequest request = exportRequest(until.minus(Duration.ofHours(1)), until);

        GcpCloudLoggingService.ExportResult result = service.export(request);

        assertEquals(2, result.entries.size());
        assertFalse(result.truncated);
        assertEquals("boom 1", result.entries.get(0).getMessage());
        assertEquals("boom 2", result.entries.get(1).getMessage());
        assertNull(result.entries.get(0).getRaw(), "export entries should not carry the raw payload");
        verify(httpClient, times(2)).send(any(), any());
    }

    @Test
    void exportStopsAtTheSafetyCapAndReportsTruncation() throws Exception {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId()).thenReturn("students-384817");
        when(credentials.getAccessToken()).thenReturn("token");
        HttpClient httpClient = mock(HttpClient.class);
        String neverEndingPage = "{\"entries\":[{\"insertId\":\"a\",\"severity\":\"ERROR\","
                + "\"jsonPayload\":{\"message\":\"boom\"}}],\"nextPageToken\":\"more\"}";
        doReturn(jsonResponse(200, neverEndingPage)).when(httpClient).send(any(), any());

        GcpCloudLoggingService service = new GcpCloudLoggingService(new ObjectMapper(), credentials, httpClient);
        Instant until = Instant.now();
        GcpLogExportRequest request = exportRequest(until.minus(Duration.ofDays(7)), until);

        GcpCloudLoggingService.ExportResult result = service.export(request);

        assertTrue(result.truncated);
        assertEquals(100, result.entries.size());
    }

    @Test
    void excludingToolingAddsANegatedPathClauseAndIsOffByDefault() {
        Instant since = Instant.parse("2026-09-23T10:00:00Z");
        Instant until = Instant.parse("2026-09-23T11:00:00Z");
        String on = GcpCloudLoggingService.buildFilter("lms-prod-2026", "ERROR", null, since, until, true);
        String off = GcpCloudLoggingService.buildFilter("lms-prod-2026", "ERROR", null, since, until);
        assertTrue(on.contains("NOT jsonPayload.httpPath:\"/api/v1/superadmin/logs\""));
        assertFalse(off.contains("superadmin/logs"));
    }

    @SuppressWarnings("unchecked")
    private GcpCloudLoggingService serviceAnswering(int... statuses) throws Exception {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId()).thenReturn("p");
        when(credentials.getAccessToken()).thenReturn("t");
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String>[] responses = new HttpResponse[statuses.length];
        for (int i = 0; i < statuses.length; i++) {
            responses[i] = mock(HttpResponse.class);
            when(responses[i].statusCode()).thenReturn(statuses[i]);
            when(responses[i].body()).thenReturn("{\"entries\":[]}");
        }
        HttpResponse<String> first = responses[0];
        HttpResponse<String>[] rest = java.util.Arrays.copyOfRange(responses, 1, responses.length);
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(first, rest);
        GcpCloudLoggingService service = new GcpCloudLoggingService(new ObjectMapper(), credentials, client);
        service.rateLimitBackoffMs = 0;
        return service;
    }

    @Test
    void aRateLimitedQueryIsRetriedAndSucceedsWhenTheQuotaClears() throws Exception {
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("PRODUCTION");
        request.setLevel("ERROR");
        request.setWindow("1H");
        assertEquals(0, serviceAnswering(429, 429, 200).search(request).getItems().size());
    }

    @Test
    void aQueryThatStaysRateLimitedFailsWith429AfterTheRetries() throws Exception {
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("PRODUCTION");
        request.setLevel("ERROR");
        request.setWindow("1H");
        GcpCloudLoggingService service = serviceAnswering(429, 429, 429);
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.search(request));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, error.getStatus());
    }

    @Test
    void errorFilterAlsoMatchesPlainTextEntriesThatKubernetesLabelledInfo() {
        String filter = GcpCloudLoggingService.buildFilter(
                "lms-dev-2026", "ERROR", null,
                Instant.parse("2026-09-23T10:00:00Z"), Instant.parse("2026-09-23T11:00:00Z"));
        assertTrue(filter.contains("severity>=ERROR"));
        assertTrue(filter.contains("textPayload:\"ERROR\""));
    }

    @SuppressWarnings("unchecked")
    private GcpCloudLoggingService serviceReturning(String entriesJson) throws Exception {
        GcpMetadataCredentialProvider credentials = mock(GcpMetadataCredentialProvider.class);
        when(credentials.getProjectId()).thenReturn("p");
        when(credentials.getAccessToken()).thenReturn("t");
        HttpClient client = mock(HttpClient.class);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"entries\":" + entriesJson + "}");
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        return new GcpCloudLoggingService(new ObjectMapper(), credentials, client);
    }

    private static final String DEV_ENTRIES = "["
            + "{\"insertId\":\"a\",\"severity\":\"INFO\",\"timestamp\":\"2026-09-28T09:00:02Z\","
            + "\"textPayload\":\"2026-09-28 09:00:02,115 ERROR [main] c.x.Job : Reminder failed\\n\\tat a.B.c(B.java:1)\"},"
            + "{\"insertId\":\"b\",\"severity\":\"INFO\",\"timestamp\":\"2026-09-28T09:00:01Z\","
            + "\"textPayload\":\"2026-09-28 09:00:01,000 INFO  [main] c.x.Job : all good, no ERROR here\"}"
            + "]";

    @Test
    void plainTextErrorsSurviveTheErrorLevelAndInfoLinesMentioningErrorDoNot() throws Exception {
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("DEVELOPMENT");
        request.setLevel("ERROR");
        request.setWindow("24H");

        var result = serviceReturning(DEV_ENTRIES).search(request);

        assertEquals(1, result.getItems().size());
        assertEquals("ERROR", result.getItems().get(0).getSeverity());
        assertEquals("Reminder failed", result.getItems().get(0).getMessage());
        assertEquals("c.x.Job", result.getItems().get(0).getLogger());
        assertTrue(result.getItems().get(0).isHasException());
    }

    @Test
    void allLevelKeepsEveryPlainTextEntryWithItsParsedSeverity() throws Exception {
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("DEVELOPMENT");
        request.setLevel("ALL");
        request.setWindow("24H");

        var items = serviceReturning(DEV_ENTRIES).search(request).getItems();

        assertEquals(2, items.size());
        assertEquals("ERROR", items.get(0).getSeverity());
        assertEquals("INFO", items.get(1).getSeverity());
    }

    @Test
    void structuredEntriesExposeCallerIdentifiersAndCommit() throws Exception {
        String entries = "[{\"insertId\":\"z\",\"severity\":\"ERROR\",\"timestamp\":\"2026-09-28T09:00:02Z\","
                + "\"jsonPayload\":{\"message\":\"boom\",\"logger\":\"c.x.Y\",\"userId\":\"15\",\"userType\":\"FACULTY\","
                + "\"facultyType\":\"TEACHER\",\"collegeId\":\"6\",\"organizationId\":\"2\",\"commit\":\"abc1234\"}}]";
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("PRODUCTION");
        request.setLevel("ERROR");
        request.setWindow("1H");

        var item = serviceReturning(entries).search(request).getItems().get(0);

        assertEquals("15", item.getUserId());
        assertEquals("FACULTY", item.getUserType());
        assertEquals("TEACHER", item.getFacultyType());
        assertEquals("6", item.getCollegeId());
        assertEquals("2", item.getOrganizationId());
        assertEquals("abc1234", item.getCommit());
    }
}
