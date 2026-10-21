package com._42students.lms.service.impl;

import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;
import java.util.Set;

/**
 * SMS Service implementation using BulkSMSApps provider.
 * API Documentation: http://www.bulksmsapps.com
 * 
 * IMPORTANT: BulkSMSApps requires the message to match the registered DLT template exactly.
 * 
 * Issue Fixed: BulkSMSApps does NOT properly decode URL-encoded query parameters.
 * Characters like (, ), and , were being encoded as %28, %29, %2C causing DLT template mismatches.
 * 
 * Solution: Only encode spaces (as %20) which is required for valid URLs.
 * Parentheses, commas, periods, and hyphens are NOT encoded as they are URL-safe.
 * 
 * DLT Template: {#var#} is the One Time Password (OTP) to access your account at 42LMS.COM. 
 *               For security reasons, please do not share this OTP with anyone. -JRSPF.
 */
@Service
@Slf4j
public class BulkSmsAppsServiceImpl implements SmsService {

    private static final String SMS_API_URL = "https://www.bulksmsapps.com/api/apismsv2.aspx";
    private static final String SENDER_ID_DEFAULT = "FLERNR";

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    // GLOBAL: the DLT-registered sender ID is a single platform-wide TRAI registration, not
    // something that legitimately varies per college (superadmin > Notification Templates).
    private String senderId() {
        String v = appSettingsService != null
                ? appSettingsService.getString("GLOBAL", null, "sms.senderId").orElse(null)
                : null;
        return (v != null && !v.trim().isEmpty()) ? v.trim() : SENDER_ID_DEFAULT;
    }

    /** TRAI-approved single template for all job-related SMS. {#var#} = recipient name only. */
    private static final String TRAI_JOB_UPDATE_TEMPLATE_DEFAULT = "Reminder: Hello {#var#}, You have an update on the 42 LMS Jobs Portal. Login to 42lms.com to check - JRSPF";

    // GLOBAL, editable (superadmin > Notification Templates > SMS). Hardcoded "42lms.com" sent
    // every custom-domain tenant's candidates to the wrong URL -- same DLT-matching caveat as
    // senderId() above: whatever this is set to must match the actual DLT registration.
    private String traiJobUpdateTemplate() {
        String v = appSettingsService != null
                ? appSettingsService.getString("GLOBAL", null, "sms.traiJobUpdateTemplate").orElse(null)
                : null;
        return (v != null && !v.trim().isEmpty()) ? v : TRAI_JOB_UPDATE_TEMPLATE_DEFAULT;
    }

    /** Template keys that use the single TRAI job-update SMS (offer and hired are manual; not sent). */
    private static final Set<String> TRAI_SMS_TEMPLATE_KEYS = Set.of(
            "application-submitted",
            "shortlisted",
            "interview-round-update",
            "selected",
            "rejected",
            "interview.reminder",
            "interview.confirmed"
    );

    @Value("${sms.bulksmsapps.apikey:}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public BulkSmsAppsServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public boolean sendOtp(String phoneNumber, String otp) {
        // Default to LMS context for backward compatibility
        return sendOtp(phoneNumber, otp, NotificationTemplateContext.LMS);
    }
    
    @Override
    public boolean sendOtp(String phoneNumber, String otp, NotificationTemplateContext context) {
        // For login OTP, always use hardcoded template to avoid interfering with existing login flow
        // Templates are optional and should not break core login functionality
        // Login was implemented before templates and should remain fast and reliable
        // If templates are needed for OTP in the future, they should be created and tested separately
        
        // Use original hardcoded implementation (login was working before templates)
        String message = otp + " is the One Time Password (OTP) to access your account at 42LMS.COM. " +
                "For security reasons, please do not share this OTP with anyone. -JRSPF.";
        return sendSms(phoneNumber, message, "otp");
    }

    @Override
    public boolean sendJobUpdateSms(String phoneNumber, String recipientName) {
        String name = recipientName != null ? recipientName.trim() : "";
        if (name.isEmpty()) {
            name = "User";
        }
        // NC-08: strip DLT template syntax and enforce max length to prevent TRAI template mismatch
        name = name.replaceAll("\\{#.*?#\\}", "").trim();
        if (name.isEmpty()) name = "User";
        if (name.length() > 30) name = name.substring(0, 30).trim();
        String message = traiJobUpdateTemplate().replace("{#var#}", name);
        return sendSms(phoneNumber, message, "job.update");
    }

    @Override
    public boolean sendSmsWithTemplate(String templateKey, String phoneNumber, Map<String, Object> variables, NotificationTemplateContext context) {
        if (context == null) {
            log.error("NotificationTemplateContext is required");
            return false;
        }
        if (TRAI_SMS_TEMPLATE_KEYS.contains(templateKey)) {
            String name = variables != null && variables.get("learnerName") != null
                    ? variables.get("learnerName").toString()
                    : "User";
            return sendJobUpdateSms(phoneNumber, name);
        }
        log.warn("Non-TRAI SMS template key '{}' is not supported. All job/course SMS use the single TRAI template via NotificationDispatcherService.", templateKey);
        return false;
    }

    @Override
    public boolean sendNotification(String phoneNumber, String message) {
        // "notification" covers the attendance absence/correction messages, which is where audit
        // 4.4's parent-facing question comes from.
        return sendSms(phoneNumber, message, "notification");
    }

    /**
     * Send SMS using BulkSMSApps API.
     * 
     * API Format: http://www.bulksmsapps.com/api/apismsv2.aspx?apikey=XXX&sender=FLERNR&number=XXX&message=XXX
     * 
     * IMPORTANT FIX: BulkSMSApps does NOT decode URL-encoded query parameters properly.
     * This causes DLT template mismatches when characters like (, ), and , are encoded.
     * 
     * Solution: Only encode spaces (as %20), which is required for valid URLs.
     * Other characters in the DLT template ((, ), ,, ., -) are safe for URLs and should NOT be encoded.
     * 
     * DLT Template: {#var#} is the One Time Password (OTP) to access your account at 42LMS.COM. 
     *               For security reasons, please do not share this OTP with anyone. -JRSPF.
     */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.SmsDeliveryLogRepository smsDeliveryLogRepository;

    /**
     * Audit 4.4: keep a record of what was attempted and what the provider said.
     *
     * <p>Stores neither the message body nor the full number — these messages name a child, a
     * course and a time, and this table is read by more people and kept longer than the send path.
     * The last four digits answer "did you send it to the number ending 4821", which is the
     * question support is actually asked.
     *
     * <p>Best-effort by construction: a logging failure must never turn a delivered SMS into a
     * failed one, so everything here is swallowed.
     */
    private void record(String purpose, String phoneNumber, String status, String providerMessageId, String error) {
        if (smsDeliveryLogRepository == null) return;
        try {
            com._42students.lms.model.SmsDeliveryLog row = new com._42students.lms.model.SmsDeliveryLog();
            row.setPurpose(purpose != null ? purpose : "unknown");
            row.setRecipientSuffix(lastFour(phoneNumber));
            row.setStatus(status);
            row.setProviderMessageId(providerMessageId);
            row.setErrorSummary(error != null && error.length() > 500 ? error.substring(0, 500) : error);
            smsDeliveryLogRepository.save(row);
        } catch (Exception e) {
            log.warn("Could not record SMS delivery attempt: {}", e.getMessage());
        }
    }

    private String lastFour(String phoneNumber) {
        if (phoneNumber == null) return null;
        String digits = phoneNumber.replaceAll("[^0-9]", "");
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }

    private boolean sendSms(String phoneNumber, String message, String purpose) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("SMS API key is not configured. Set 'sms.bulksmsapps.apikey' in application.properties");
            record(purpose, phoneNumber, "FAILED", null, "SMS API key is not configured");
            return false;
        }

        try {
            // Only encode spaces - BulkSMSApps does not decode other URL-encoded characters properly
            // This ensures the message matches the DLT template exactly
            String urlSafeMessage = message.replace(" ", "%20");

            // Build URL string directly without additional encoding
            String url = SMS_API_URL + 
                    "?apikey=" + apiKey + 
                    "&sender=" + senderId() + 
                    "&number=" + phoneNumber + 
                    "&message=" + urlSafeMessage;

            log.info("Sending SMS to {} via BulkSMSApps", phoneNumber);
            log.debug("SMS Message: {}", message);

            // Create URI from string to prevent RestTemplate from re-encoding
            URI uri = URI.create(url);
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);

            String responseBody = response.getBody();
            // Log summary only — BulkSMSApps returns HTML; avoid flooding logs and exposing api key in form action
            if (responseBody != null && (responseBody.length() > 200 || responseBody.trim().toLowerCase().startsWith("<!") || responseBody.contains("<html"))) {
                log.info("SMS Response: [length={}, contains MessageId: {}]", responseBody.length(), responseBody.contains("MessageId-"));
                log.debug("SMS Response body: {}", responseBody);
            } else {
                log.info("SMS Response: {}", responseBody);
            }

            // Check if response contains "MessageId-" which indicates success
            // BulkSMSApps returns HTML with MessageId-{number} on success
            if (responseBody != null && responseBody.contains("MessageId-")) {
                // Extract MessageId for logging
                String messageId = extractMessageId(responseBody);
                log.info("SMS sent successfully to {} with MessageId: {}", phoneNumber, messageId);
                record(purpose, phoneNumber, "SENT", messageId, null);
                return true;
            } else {
                String errSummary = responseBody == null ? "null" : (responseBody.length() > 300 ? responseBody.substring(0, 300) + "..." : responseBody);
                log.error("SMS sending failed. Response: {}", errSummary);
                record(purpose, phoneNumber, "FAILED", null, errSummary);
                return false;
            }

        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            record(purpose, phoneNumber, "FAILED", null,
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return false;
        }
    }
    
    /**
     * Extract MessageId from BulkSMSApps response (HTML or plain text)
     * Format: MessageId-{number}
     */
    private String extractMessageId(String responseBody) {
        if (responseBody == null) {
            return "unknown";
        }
        
        // Look for MessageId- pattern
        int startIndex = responseBody.indexOf("MessageId-");
        if (startIndex != -1) {
            int endIndex = startIndex + "MessageId-".length();
            // Extract the number after MessageId-
            StringBuilder messageId = new StringBuilder("MessageId-");
            while (endIndex < responseBody.length() && 
                   Character.isDigit(responseBody.charAt(endIndex))) {
                messageId.append(responseBody.charAt(endIndex));
                endIndex++;
            }
            return messageId.toString();
        }
        
        return "unknown";
    }
}

