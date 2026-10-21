package com._42students.lms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Thin wrapper over Telegram's Bot API sendMessage call. Deliberately never throws: a notification
 * failure must never break whatever triggered it (an alert-worthy log entry, say). Also
 * deliberately does nothing but log at DEBUG when bot-token/chat-id are unset, which they are until
 * the operator hands over real credentials -- everything that calls this can ship and run today and
 * will simply start actually delivering once those two config values are set.
 */
@Slf4j
@Service
public class TelegramNotifierService {

    private final String botToken;
    private final String chatId;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired(required = false)
    private AlertEnvironment alertEnvironment;

    void setAlertEnvironment(AlertEnvironment alertEnvironment) {
        this.alertEnvironment = alertEnvironment;
    }

    /** The message as sent: "[dev] " first anywhere but production. */
    String outgoingText(String text) {
        boolean dev = alertEnvironment != null && !alertEnvironment.isProduction();
        return dev ? alertEnvironment.tag() + (text == null ? "" : text) : text;
    }

    /** No Acknowledge button anywhere but production: the bot's one webhook is production's. */
    String outgoingCallback(String callback) {
        return alertEnvironment != null && !alertEnvironment.isProduction() ? null : callback;
    }

    @Autowired
    public TelegramNotifierService(
            @Value("${telegram.alert.bot-token:}") String botToken,
            @Value("${telegram.alert.chat-id:}") String chatId,
            ObjectMapper objectMapper) {
        this(botToken, chatId, objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    /** Package-private constructor for injecting a test double, mirroring GcpCloudLoggingService's own pattern. */
    TelegramNotifierService(String botToken, String chatId, ObjectMapper objectMapper, HttpClient httpClient) {
        this.botToken = botToken;
        this.chatId = chatId;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public boolean isConfigured() {
        return botToken != null && !botToken.isBlank() && chatId != null && !chatId.isBlank();
    }

    /**
     * Plain alert, no inline buttons.
     * @return true if either nothing needed sending (not configured yet) or Telegram accepted the
     *         message; false if a send was attempted and failed. Callers that only want to record
     *         "this was delivered" once it actually was (see LogAlertingService) should treat false
     *         as "try again later," not as "this failed forever."
     */
    public boolean send(String text) {
        return send(text, null);
    }

    /**
     * @param acknowledgeCallbackData when non-null, attaches a single "Acknowledge" inline button
     *                                whose callback_data is this value -- the acknowledge webhook
     *                                (once wired up with real credentials) reads it back to know
     *                                which alert was acknowledged.
     */
    public boolean send(String text, String acknowledgeCallbackData) {
        // Anything but production says so first, and has no Acknowledge button: the bot has one webhook, production's, which
        // would not know a dev alert (13 Oct 2026).
        text = outgoingText(text);
        acknowledgeCallbackData = outgoingCallback(acknowledgeCallbackData);
        if (!isConfigured()) {
            log.debug("Telegram alert suppressed (not configured yet): {}", text);
            return true;
        }

        HttpRequest request;
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("chat_id", chatId);
            // No parse_mode: log messages and stack traces routinely contain underscores, asterisks
            // and brackets, all of which Telegram's Markdown parser treats as formatting syntax --
            // an unescaped one makes the whole sendMessage call fail with a 400 "can't parse
            // entities". Plain text sacrifices bold/code styling but means an alert can never fail
            // to send just because of what happened to be in the error it's reporting.
            body.put("text", text);
            body.put("disable_web_page_preview", true);
            if (acknowledgeCallbackData != null) {
                ObjectNode button = objectMapper.createObjectNode();
                button.put("text", "✅ Acknowledge");
                button.put("callback_data", acknowledgeCallbackData);
                ArrayNode row = objectMapper.createArrayNode();
                row.add(button);
                ArrayNode keyboard = objectMapper.createArrayNode();
                keyboard.add(row);
                ObjectNode replyMarkup = objectMapper.createObjectNode();
                replyMarkup.set("inline_keyboard", keyboard);
                body.set("reply_markup", replyMarkup);
            }
            request = HttpRequest.newBuilder(
                            URI.create("https://api.telegram.org/bot" + botToken + "/sendMessage"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
        } catch (Exception e) {
            log.warn("Telegram alert send threw while building the request: {}", e.getMessage());
            return false;
        }

        // One retry on a transport-level failure (connection reset, timeout) -- seen in practice on
        // a pod's very first outbound call before a connection to api.telegram.org is warmed up.
        // Never retries on an HTTP response that came back (a 400 like BUTTON_DATA_INVALID will
        // fail identically every time; retrying it would just be three log lines instead of one).
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    log.warn("Telegram alert send failed: status={} body={}", response.statusCode(), response.body());
                    return false;
                }
                return true;
            } catch (Exception e) {
                log.warn("Telegram alert send threw (attempt {}/2): {}", attempt, e.getMessage());
                if (attempt == 2) return false;
            }
        }
        return false;
    }

    /**
     * Answers a callback query (required by Telegram so the button stops showing a loading spinner
     * on the user's client) and edits the original message to show it was acknowledged.
     */
    public void acknowledgeCallback(String callbackQueryId, String chatIdForEdit, Integer messageId, String newText) {
        if (!isConfigured()) return;
        try {
            ObjectNode answerBody = objectMapper.createObjectNode();
            answerBody.put("callback_query_id", callbackQueryId);
            postSilently("answerCallbackQuery", answerBody);

            if (chatIdForEdit != null && messageId != null) {
                ObjectNode editBody = objectMapper.createObjectNode();
                editBody.put("chat_id", chatIdForEdit);
                editBody.put("message_id", messageId);
                editBody.put("text", newText);
                postSilently("editMessageText", editBody);
            }
        } catch (Exception e) {
            log.warn("Telegram acknowledge-callback handling failed: {}", e.getMessage());
        }
    }

    private void postSilently(String method, ObjectNode body) {
        try {
            HttpRequest request = HttpRequest.newBuilder(
                            URI.create("https://api.telegram.org/bot" + botToken + "/" + method))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Telegram {} call failed: {}", method, e.getMessage());
        }
    }

    /** Registers (or clears, with a blank url) the webhook Telegram will POST updates to. */
    public String setWebhook(String url) {
        if (!isConfigured()) return "not configured";
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("url", url == null ? "" : url);
            HttpRequest request = HttpRequest.newBuilder(
                            URI.create("https://api.telegram.org/bot" + botToken + "/setWebhook"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return "failed: " + e.getMessage();
        }
    }
}
