package com._42students.lms.controller;

import com._42students.lms.service.impl.TelegramNotifierService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Receives Telegram's webhook callbacks -- currently just the "Acknowledge" button on a new-error
 * alert (see TelegramNotifierService/LogAlertingService). Necessarily public and unauthenticated
 * (Telegram's servers call it, not a logged-in admin), so the shared secret header is the only
 * thing standing between this and anyone who finds the URL -- see telegram.alert.webhook-secret.
 *
 * <p>Registering the webhook URL with Telegram (TelegramNotifierService#setWebhook) and setting
 * the secret both require the real bot token, so this endpoint is inert (no traffic reaches it)
 * until that's configured.
 */
@Slf4j
@RestController
public class TelegramWebhookController {

    private final TelegramNotifierService telegramNotifier;
    private final String webhookSecret;

    public TelegramWebhookController(TelegramNotifierService telegramNotifier,
                                     @Value("${telegram.alert.webhook-secret:}") String webhookSecret) {
        this.telegramNotifier = telegramNotifier;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/api/v1/public/telegram/webhook")
    public ResponseEntity<Void> receiveUpdate(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretHeader,
            @RequestBody(required = false) JsonNode update) {
        if (webhookSecret == null || webhookSecret.isBlank() || secretHeader == null || !constantTimeEquals(webhookSecret, secretHeader)) {
            return ResponseEntity.status(403).build();
        }
        if (update == null) {
            return ResponseEntity.ok().build();
        }
        JsonNode callback = update.path("callback_query");
        if (!callback.isMissingNode()) {
            String data = callback.path("data").asText("");
            String callbackQueryId = callback.path("id").asText(null);
            JsonNode message = callback.path("message");
            String chatId = message.path("chat").path("id").asText(null);
            Integer messageId = message.path("message_id").isMissingNode() ? null : message.path("message_id").asInt();
            String originalText = message.path("text").asText("");

            if (data.startsWith("ack:")) {
                telegramNotifier.acknowledgeCallback(callbackQueryId, chatId, messageId,
                        originalText + "\n\n✅ Acknowledged");
            } else {
                telegramNotifier.acknowledgeCallback(callbackQueryId, null, null, null);
            }
        }
        return ResponseEntity.ok().build();
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
