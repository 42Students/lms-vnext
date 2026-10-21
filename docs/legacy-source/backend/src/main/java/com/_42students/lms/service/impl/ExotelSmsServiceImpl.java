package com._42students.lms.service.impl;

import com._42students.lms.model.SmsDeliveryLog;
import com._42students.lms.repository.SmsDeliveryLogRepository;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.SmsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

/** Exotel is the primary transport for every LMS SMS path. Missing DLT mappings fail closed. */
@Service
@Primary
@Slf4j
public class ExotelSmsServiceImpl implements SmsService {
    private static final Set<String> JOB_TEMPLATE_KEYS = Set.of(
            "application-submitted", "shortlisted", "interview-round-update",
            "selected", "rejected", "interview.reminder", "interview.confirmed");
    private static final String DEFAULT_JOB_BODY = "Reminder: Hello {#var#}, You have an update on the 42 LMS Jobs Portal. Login to 42lms.com to check - JRSPF";
    private static final String OTP_SUFFIX = " is the One Time Password (OTP) to access your account at 42LMS.COM. "
            + "For security reasons, please do not share this OTP with anyone. -JRSPF.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @Autowired(required = false)
    private SmsDeliveryLogRepository smsDeliveryLogRepository;

    @Value("${EXOTEL_API_KEY:}")
    private String apiKey;
    @Value("${EXOTEL_API_TOKEN:}")
    private String apiToken;
    @Value("${EXOTEL_ACCOUNT_SID:42students1}")
    private String accountSid;
    @Value("${EXOTEL_API_BASE_URL:https://api.exotel.com}")
    private String apiBaseUrl;
    @Value("${EXOTEL_DLT_ENTITY_ID:1001650442971323333}")
    private String dltEntityId;
    @Value("${EXOTEL_OTP_SENDER_ID:FLERNR}")
    private String otpSenderId;
    @Value("${EXOTEL_OTP_DLT_TEMPLATE_ID:1707176554481180936}")
    private String otpDltTemplateId;
    @Value("${EXOTEL_OTP_SMS_TYPE:transactional_opt_in}")
    private String otpSmsType;
    @Value("${EXOTEL_JOB_SENDER_ID:FLERNR}")
    private String jobSenderId;
    @Value("${EXOTEL_JOB_DLT_TEMPLATE_ID:}")
    private String jobDltTemplateId;
    @Value("${EXOTEL_NOTIFICATION_SENDER_ID:FLERNR}")
    private String notificationSenderId;
    @Value("${EXOTEL_NOTIFICATION_DLT_TEMPLATE_ID:}")
    private String notificationDltTemplateId;

    public ExotelSmsServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean sendOtp(String phoneNumber, String otp) {
        return sendOtp(phoneNumber, otp, NotificationTemplateContext.LMS);
    }

    @Override
    public boolean sendOtp(String phoneNumber, String otp, NotificationTemplateContext context) {
        if (otp == null || !otp.matches("[0-9]{4,8}")) {
            log.warn("Exotel OTP not sent: invalid OTP format");
            return false;
        }
        return send(phoneNumber, otp + OTP_SUFFIX, otpSenderId, otpDltTemplateId,
                otpSmsType, "high", "otp");
    }

    @Override
    public boolean sendJobUpdateSms(String phoneNumber, String recipientName) {
        String dltId = globalSetting("sms.exotel.jobUpdateDltTemplateId", jobDltTemplateId);
        if (blank(dltId)) {
            log.warn("Exotel job SMS not sent: job-update DLT template ID not configured");
            record("job.update", phoneNumber, "FAILED", null, "DLT template ID not configured");
            return false;
        }
        String name = recipientName == null ? "" : recipientName.trim();
        name = name.replaceAll("\\{#.*?#\\}", "").trim();
        if (name.isEmpty()) name = "User";
        if (name.length() > 30) name = name.substring(0, 30).trim();
        String body = globalSetting("sms.traiJobUpdateTemplate", DEFAULT_JOB_BODY)
                .replace("{#var#}", name);
        return send(phoneNumber, body, jobSenderId, dltId, "transactional_opt_in", "normal", "job.update");
    }

    @Override
    public boolean sendSmsWithTemplate(String templateKey, String phoneNumber,
                                       Map<String, Object> variables, NotificationTemplateContext context) {
        if (context == null || templateKey == null || !JOB_TEMPLATE_KEYS.contains(templateKey)) {
            log.warn("Exotel SMS not sent: unsupported template key or missing context");
            return false;
        }
        Object learnerName = variables == null ? null : variables.get("learnerName");
        return sendJobUpdateSms(phoneNumber, learnerName == null ? "User" : learnerName.toString());
    }

    @Override
    public boolean sendNotification(String phoneNumber, String message) {
        String dltId = globalSetting("sms.exotel.notificationDltTemplateId", notificationDltTemplateId);
        if (blank(dltId)) {
            log.warn("Exotel notification SMS not sent: notification DLT template ID not configured");
            record("notification", phoneNumber, "FAILED", null, "DLT template ID not configured");
            return false;
        }
        // The caller must provide the exact approved template text and variable substitutions.
        return send(phoneNumber, message, notificationSenderId, dltId,
                "transactional_opt_in", "normal", "notification");
    }

    private String globalSetting(String key, String fallback) {
        if (appSettingsService == null) return fallback;
        try {
            return appSettingsService.getString("GLOBAL", null, key)
                    .filter(s -> !s.isBlank()).orElse(fallback);
        } catch (RuntimeException e) {
            log.warn("Exotel setting lookup failed for {}: {}", key, e.getClass().getSimpleName());
            return fallback;
        }
    }

    private boolean send(String phone, String body, String sender, String templateId,
                         String smsType, String priority, String purpose) {
        if (blank(apiKey) || blank(apiToken) || blank(accountSid) || blank(dltEntityId)
                || blank(sender) || blank(templateId)) {
            log.warn("Exotel {} SMS not sent: required credentials or DLT configuration missing", purpose);
            record(purpose, phone, "FAILED", null, "Exotel configuration incomplete");
            return false;
        }
        String recipient = normalizePhone(phone);
        if (recipient == null || blank(body) || body.length() > 2000
                || !accountSid.matches("[A-Za-z0-9_-]+")
                || !"https://api.exotel.com".equals(apiBaseUrl.replaceAll("/+$", ""))) {
            log.warn("Exotel {} SMS not sent: invalid recipient, message, account SID or API host", purpose);
            record(purpose, phone, "FAILED", null, "Invalid SMS request parameters");
            return false;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(apiKey, apiToken, StandardCharsets.UTF_8);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("From", sender);
            form.add("To", recipient);
            form.add("Body", body);
            form.add("DltEntityId", dltEntityId);
            form.add("DltTemplateId", templateId);
            form.add("SmsType", smsType);
            form.add("Priority", priority);
            // The ".json" suffix is what selects the response format. Without it Exotel ignores the
            // Accept header above and answers 200 with XML, which readTree() below rejects with a
            // JsonParseException. The SMS had already been sent by then, so every OTP request
            // returned 503 OTP_DELIVERY_FAILED while the handset still received the code.
            URI endpoint = URI.create("https://api.exotel.com/v1/Accounts/" + accountSid + "/Sms/send.json");
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint, HttpMethod.POST, new HttpEntity<>(form, headers), String.class);
            if (!response.getStatusCode().is2xxSuccessful() || blank(response.getBody())) {
                record(purpose, phone, "FAILED", null, "Exotel request not accepted");
                return false;
            }
            JsonNode message = objectMapper.readTree(response.getBody()).path("SMSMessage");
            String sid = message.path("Sid").asText("");
            String status = message.path("Status").asText("");
            if (sid.isBlank() || status.isBlank() || status.toLowerCase(java.util.Locale.ROOT).startsWith("failed")) {
                log.warn("Exotel {} SMS not accepted (status={})", purpose, status);
                record(purpose, phone, "FAILED", null, "Exotel request not accepted");
                return false;
            }
            // SENT in the existing schema means API-accepted, never handset delivery.
            record(purpose, phone, "SENT", sid, null);
            log.info("Exotel {} SMS accepted (status={})", purpose, status);
            return true;
        } catch (Exception e) {
            // Never log the request URI, Basic Auth, phone number, OTP, or provider response body.
            log.warn("Exotel {} SMS request failed: {}", purpose, e.getClass().getSimpleName());
            record(purpose, phone, "FAILED", null, e.getClass().getSimpleName());
            return false;
        }
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String normalizePhone(String phone) {
        if (phone == null) return null;
        String normalized = phone.replaceAll("[\\s()-]", "");
        if (normalized.matches("[0-9]{10}")) return "+91" + normalized;
        if (normalized.matches("91[0-9]{10}")) return "+" + normalized;
        if (normalized.matches("\\+[1-9][0-9]{7,14}")) return normalized;
        return null;
    }

    private void record(String purpose, String phone, String status, String messageId, String reason) {
        if (smsDeliveryLogRepository == null) return;
        try {
            SmsDeliveryLog row = new SmsDeliveryLog();
            row.setPurpose(purpose);
            row.setRecipientSuffix(lastFour(phone));
            row.setStatus(status);
            row.setProviderMessageId(messageId);
            row.setErrorSummary(reason);
            smsDeliveryLogRepository.save(row);
        } catch (Exception e) {
            log.warn("Could not record Exotel SMS attempt: {}", e.getClass().getSimpleName());
        }
    }

    private static String lastFour(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }
}
