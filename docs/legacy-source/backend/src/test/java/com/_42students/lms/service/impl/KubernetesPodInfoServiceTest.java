package com._42students.lms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KubernetesPodInfoServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    private HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }

    @Test
    void returnsEmptyWhenNotRunningInCluster() throws Exception {
        // The public constructor sets httpClient/namespace to null when the in-cluster files
        // aren't present (any local dev machine or CI runner) -- exercised via the public
        // constructor directly, unlike every other test here which injects a test double.
        KubernetesPodInfoService service = new KubernetesPodInfoService(objectMapper);
        assertTrue(service.getOwnDeploymentPodTimes("component=lms-be").isEmpty());
    }

    @Test
    void returnsEmptyWhenTheTokenFileCannotBeRead() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        KubernetesPodInfoService service =
                new KubernetesPodInfoService(objectMapper, httpClient, "lms-prod-2026", () -> null);

        assertTrue(service.getOwnDeploymentPodTimes("component=lms-be").isEmpty());
        verifyNoInteractions(httpClient);
    }

    @Test
    void parsesEarliestAndLatestStartTimesAcrossPods() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        String body = "{\"items\":["
                + "{\"status\":{\"startTime\":\"2026-09-26T06:00:00Z\"}},"
                + "{\"status\":{\"startTime\":\"2026-09-26T07:00:00Z\"}}"
                + "]}";
        doReturn(response(200, body)).when(httpClient).send(any(), any());
        KubernetesPodInfoService service =
                new KubernetesPodInfoService(objectMapper, httpClient, "lms-prod-2026", () -> "fake-token");

        Optional<KubernetesPodInfoService.PodTimes> result = service.getOwnDeploymentPodTimes("component=lms-be");

        assertTrue(result.isPresent());
        assertEquals(Instant.parse("2026-09-26T06:00:00Z"), result.get().earliestStart);
        assertEquals(Instant.parse("2026-09-26T07:00:00Z"), result.get().latestStart);
        assertEquals(2, result.get().podCount);
    }

    @Test
    void returnsEmptyOnANonTwoHundredResponse() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(403, "Forbidden")).when(httpClient).send(any(), any());
        KubernetesPodInfoService service =
                new KubernetesPodInfoService(objectMapper, httpClient, "lms-prod-2026", () -> "fake-token");

        assertTrue(service.getOwnDeploymentPodTimes("component=lms-be").isEmpty());
    }

    @Test
    void returnsEmptyWhenNoPodsMatch() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(200, "{\"items\":[]}")).when(httpClient).send(any(), any());
        KubernetesPodInfoService service =
                new KubernetesPodInfoService(objectMapper, httpClient, "lms-prod-2026", () -> "fake-token");

        assertTrue(service.getOwnDeploymentPodTimes("component=lms-be").isEmpty());
    }

    @Test
    void returnsEmptyRatherThanThrowingWhenTheHttpCallItselfFails() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doThrow(new java.io.IOException("Connection reset")).when(httpClient).send(any(), any());
        KubernetesPodInfoService service =
                new KubernetesPodInfoService(objectMapper, httpClient, "lms-prod-2026", () -> "fake-token");

        assertDoesNotThrow(() -> assertTrue(service.getOwnDeploymentPodTimes("component=lms-be").isEmpty()));
    }

    @Test
    void readsTheTokenFreshOnEveryCallRatherThanCachingIt() throws Exception {
        // Projected ServiceAccount tokens rotate roughly hourly -- caching one at construction time
        // would mean every call after the first rotation silently starts failing with 401 for the
        // rest of the pod's lifetime.
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(200, "{\"items\":[]}")).when(httpClient).send(any(), any());
        java.util.concurrent.atomic.AtomicInteger calls = new java.util.concurrent.atomic.AtomicInteger();
        KubernetesPodInfoService service = new KubernetesPodInfoService(
                objectMapper, httpClient, "lms-prod-2026", () -> "token-" + calls.incrementAndGet());

        service.getOwnDeploymentPodTimes("component=lms-be");
        service.getOwnDeploymentPodTimes("component=lms-be");

        assertEquals(2, calls.get());
    }
}
