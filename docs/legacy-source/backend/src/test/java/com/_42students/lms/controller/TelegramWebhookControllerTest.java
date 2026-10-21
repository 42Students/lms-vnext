package com._42students.lms.controller;

import com._42students.lms.service.impl.TelegramNotifierService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The only thing standing between this public, unauthenticated endpoint and anyone who finds its
 * URL is the shared-secret header check -- worth testing directly rather than trusting it by
 * inspection alone.
 */
class TelegramWebhookControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void rejectsWhenNoSecretIsConfiguredYet() {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "");

        var response = controller.receiveUpdate("anything", null);

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCodeValue());
        verifyNoInteractions(notifier);
    }

    @Test
    void rejectsAMissingSecretHeader() {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "the-real-secret");

        var response = controller.receiveUpdate(null, null);

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCodeValue());
        verifyNoInteractions(notifier);
    }

    @Test
    void rejectsAWrongSecretHeader() {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "the-real-secret");

        var response = controller.receiveUpdate("guessed-wrong", null);

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCodeValue());
        verifyNoInteractions(notifier);
    }

    @Test
    void acceptsTheCorrectSecretHeaderWithNoBody() {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "the-real-secret");

        var response = controller.receiveUpdate("the-real-secret", null);

        assertEquals(200, response.getStatusCodeValue());
        verifyNoInteractions(notifier);
    }

    @Test
    void anAcknowledgeCallbackIsRoutedWithTheOriginalMessageAppended() throws Exception {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "secret");

        JsonNode update = objectMapper.readTree("{"
                + "\"callback_query\": {"
                + "  \"id\": \"cbq-1\","
                + "  \"data\": \"ack:abc123\","
                + "  \"message\": {\"message_id\": 42, \"chat\": {\"id\": 469603778}, \"text\": \"New error type\"}"
                + "}}");

        controller.receiveUpdate("secret", update);

        verify(notifier).acknowledgeCallback(eq("cbq-1"), eq("469603778"), eq(42),
                contains("New error type"));
    }

    @Test
    void aNonAcknowledgeCallbackStillAnswersTelegramButDoesNotEditAnything() throws Exception {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "secret");

        JsonNode update = objectMapper.readTree("{"
                + "\"callback_query\": {\"id\": \"cbq-2\", \"data\": \"something-else\", \"message\": {}}"
                + "}");

        controller.receiveUpdate("secret", update);

        verify(notifier).acknowledgeCallback("cbq-2", null, null, null);
    }

    @Test
    void anUpdateWithNoCallbackQueryIsANoOp() throws Exception {
        TelegramNotifierService notifier = mock(TelegramNotifierService.class);
        TelegramWebhookController controller = new TelegramWebhookController(notifier, "secret");

        JsonNode update = objectMapper.readTree("{\"some_other_field\": true}");

        var response = controller.receiveUpdate("secret", update);

        assertEquals(200, response.getStatusCodeValue());
        verifyNoInteractions(notifier);
    }
}
