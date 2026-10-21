package com._42students.lms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TelegramNotifierServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    private HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }

    @Test
    void notConfiguredReturnsTrueAndSendsNothing() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        TelegramNotifierService service = new TelegramNotifierService("", "", objectMapper, httpClient);

        assertTrue(service.send("hello"));
        verifyNoInteractions(httpClient);
    }

    @Test
    void aSuccessfulSendReturnsTrue() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(200, "{\"ok\":true}")).when(httpClient).send(any(), any());
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, httpClient);

        assertTrue(service.send("hello"));
    }

    @Test
    void aClientErrorResponseIsNotRetried() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(400, "{\"ok\":false}")).when(httpClient).send(any(), any());
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, httpClient);

        assertFalse(service.send("hello"));
        verify(httpClient, times(1)).send(any(), any());
    }

    @Test
    void aTransportExceptionIsRetriedOnceThenGivesUp() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        doThrow(new IOException("Connection reset")).when(httpClient).send(any(), any());
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, httpClient);

        assertFalse(service.send("hello"));
        verify(httpClient, times(2)).send(any(), any());
    }

    @Test
    void aTransportExceptionThatSucceedsOnRetryReturnsTrue() throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<String> successResponse = response(200, "{\"ok\":true}");
        doThrow(new IOException("Connection reset"))
                .doReturn(successResponse)
                .when(httpClient).send(any(), any());
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, httpClient);

        assertTrue(service.send("hello"));
        verify(httpClient, times(2)).send(any(), any());
    }

    @Test
    void doesNotTruncateCallbackDataItself() throws Exception {
        // This service faithfully sends whatever callback_data it's given -- it's the CALLER's job
        // to keep it within Telegram's 64-byte limit (see LogAlertingService's own truncation and
        // its regression test), not this service's. Pinning that division of responsibility here.
        HttpClient httpClient = mock(HttpClient.class);
        doReturn(response(200, "{\"ok\":true}")).when(httpClient).send(any(), any());
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, httpClient);

        assertTrue(service.send("hello", "ack:" + "a".repeat(60)));
        verify(httpClient, times(1)).send(any(), any());
    }

    // 13 Oct 2026: dev alerts go to the same chat, tagged, without the production-only Acknowledge button.
    @Test
    void devMessagesAreTaggedAndHaveNoAcknowledgeButton() {
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, mock(HttpClient.class));
        service.setAlertEnvironment(new AlertEnvironment("dev"));
        org.junit.jupiter.api.Assertions.assertEquals("[dev] Spike: 40 errors", service.outgoingText("Spike: 40 errors"));
        org.junit.jupiter.api.Assertions.assertNull(service.outgoingCallback("ack:abc"));
    }

    @Test
    void productionMessagesAreUnchanged() {
        TelegramNotifierService service = new TelegramNotifierService("token", "chat", objectMapper, mock(HttpClient.class));
        service.setAlertEnvironment(new AlertEnvironment("prod"));
        org.junit.jupiter.api.Assertions.assertEquals("Spike: 40 errors", service.outgoingText("Spike: 40 errors"));
        org.junit.jupiter.api.Assertions.assertEquals("ack:abc", service.outgoingCallback("ack:abc"));
        TelegramNotifierService unset = new TelegramNotifierService("token", "chat", objectMapper, mock(HttpClient.class));
        org.junit.jupiter.api.Assertions.assertEquals("x", unset.outgoingText("x"), "no environment known: as before");
    }

    @Test
    void theEnvironmentFollowsStage() {
        org.junit.jupiter.api.Assertions.assertEquals("PRODUCTION", new AlertEnvironment("prod").name());
        org.junit.jupiter.api.Assertions.assertEquals("DEVELOPMENT", new AlertEnvironment("dev").name());
        org.junit.jupiter.api.Assertions.assertEquals("DEVELOPMENT", new AlertEnvironment("").name());
    }
}
