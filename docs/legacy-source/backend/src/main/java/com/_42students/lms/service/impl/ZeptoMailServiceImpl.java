package com._42students.lms.service.impl;

import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.config.ZeptoMailTemplateIdResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * ZeptoMail service implementation for sending emails via ZeptoMail API
 */
@Service
@Slf4j
public class ZeptoMailServiceImpl implements ZeptoMailService {

    @Value("${zeptomail.api.url:https://api.zeptomail.in/v1.1/email/template}")
    private String apiUrl;

    @Value("${zeptomail.send.mail.token:}")
    private String apiKey;

    /** Default ZeptoMail template ID (used when template row has no external_template_id). */
    @Value("${zeptomail.template.id:2518b.4c361928d9526a75.k1.167c45b0-e4d7-11f0-908d-8e9a6c33ddc2.19b6b08ad8b}")
    private String defaultZeptoMailTemplateId;

    @Value("${zeptomail.from.address:hello@42lms.com}")
    private String fromAddress;

    @Value("${zeptomail.from.name:42Learn}")
    private String fromName;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Lazy
    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;

    @Autowired(required = false)
    private ZeptoMailTemplateIdResolver zeptoMailTemplateIdResolver;

    public ZeptoMailServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
        
        // Set custom error handler to capture response body for all errors
        this.restTemplate.setErrorHandler(new DefaultResponseErrorHandler() {
            @Override
            public void handleError(ClientHttpResponse response) throws IOException {
                // Read the response body before throwing exception
                try {
                    java.io.InputStream inputStream = response.getBody();
                    if (inputStream != null) {
                        java.io.BufferedReader reader = new java.io.BufferedReader(
                            new java.io.InputStreamReader(inputStream, StandardCharsets.UTF_8));
                        StringBuilder body = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            body.append(line);
                        }
                        log.error("ZeptoMail Error Response (Status: {}): {}", response.getStatusCode(), body.toString());
                    }
                } catch (Exception e) {
                    log.error("Could not read error response body: {}", e.getMessage());
                }
                
                // Call parent to throw the exception
                super.handleError(response);
            }
        });
    }

    private static final String TEMP_ID_PLACEHOLDER = "TEMP_ID_PLACEHOLDER";


    @Override
    public void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo, null);
    }

    @Override
    public void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo, senderName, null);
    }

    @Override
    public void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName, String replyTo) throws Exception {
        sendEmailWithTemplateId(zeptoTemplateId, toEmail, mergeInfo, senderName, replyTo, null);
    }

    @Override
    public void sendEmailWithTemplateId(String zeptoTemplateId, String toEmail, Map<String, String> mergeInfo, String senderName, String replyTo, String fromAddressOverride) throws Exception {
        String effectiveApiKey = apiKey != null ? apiKey.trim() : "";
        if (effectiveApiKey.isEmpty()) {
            throw new IllegalStateException("ZeptoMail token is not configured");
        }
        if (zeptoTemplateId == null || zeptoTemplateId.trim().isEmpty()) {
            throw new IllegalArgumentException("ZeptoMail template ID is required");
        }
        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Recipient email is required");
        }
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("template_key", zeptoTemplateId.trim());
        Map<String, String> from = new HashMap<>();
        from.put("address", fromAddressOverride == null || fromAddressOverride.isBlank() ? fromAddress : fromAddressOverride.trim());
        from.put("name", senderName == null || senderName.isBlank() ? fromName : senderName);
        requestBody.put("from", from);
        if (replyTo != null && !replyTo.isBlank()) {
            Map<String, String> reply = new HashMap<>();
            reply.put("address", replyTo.trim());
            reply.put("name", senderName == null || senderName.isBlank() ? fromName : senderName);
            requestBody.put("reply_to", Collections.singletonList(reply));
        }
        Map<String, Object> emailAddress = new HashMap<>();
        emailAddress.put("address", toEmail);
        emailAddress.put("name", toEmail);
        requestBody.put("to", Collections.singletonList(Map.of("email_address", emailAddress)));
        requestBody.put("merge_info", mergeInfo != null ? mergeInfo : Collections.emptyMap());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        String authHeader = effectiveApiKey;
        if (authHeader.startsWith("\"") && authHeader.endsWith("\"")) {
            authHeader = authHeader.substring(1, authHeader.length() - 1);
        }
        headers.set("Authorization", authHeader);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to {} via template {}", toEmail, zeptoTemplateId);
            } else {
                throw new RuntimeException("ZeptoMail API returned " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error sending email to {} via template {}: ", toEmail, zeptoTemplateId, e);
            throw new Exception("Failed to send email: " + e.getMessage(), e);
        }
    }
}

