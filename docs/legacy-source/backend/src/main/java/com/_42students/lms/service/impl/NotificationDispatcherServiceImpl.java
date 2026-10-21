package com._42students.lms.service.impl;

import com._42students.lms.config.ZeptoMailTemplateIdResolver;
import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.model.Notification;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.util.EmailVariableValidator;
import com._42students.lms.util.NotificationEventRegistry;
import com._42students.lms.util.NotificationTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Central dispatcher: In-App (from registry), Email (ZeptoMail by template ID), TRAI SMS (single template).
 */
@Service
@Slf4j
public class NotificationDispatcherServiceImpl implements NotificationDispatcherService {

    private static final String TEMP_ID_PLACEHOLDER = "TEMP_ID_PLACEHOLDER";

    private final NotificationService notificationService;
    private final ZeptoMailService zeptoMailService;
    private final SmsService smsService;
    private final ZeptoMailTemplateIdResolver zeptoMailTemplateIdResolver;

    /** Outside prod, email only DEV_MAIL_ALLOW (13 Oct 2026): the dev database holds real students' addresses. */
    @org.springframework.beans.factory.annotation.Value("${STAGE:}")
    private String stage;
    @org.springframework.beans.factory.annotation.Value("${DEV_MAIL_ALLOW:}")
    private String devMailAllow;

    public NotificationDispatcherServiceImpl(NotificationService notificationService,
                                             ZeptoMailService zeptoMailService,
                                             SmsService smsService,
                                             ZeptoMailTemplateIdResolver zeptoMailTemplateIdResolver) {
        this.notificationService = notificationService;
        this.zeptoMailService = zeptoMailService;
        this.smsService = smsService;
        this.zeptoMailTemplateIdResolver = zeptoMailTemplateIdResolver;
    }

    @Override
    public void dispatch(NotificationEvent event, NotificationTemplateContext context,
                         NotificationRecipientDTO recipient, Map<String, Object> variables) {
        if (event == null || context == null) {
            log.warn("Dispatch skipped: event or context is null");
            return;
        }
        if (event == NotificationEvent.SYSTEM_OTP_SMS) {
            log.debug("OTP is sent directly by controllers; skipping dispatcher");
            return;
        }

        Map<String, Object> vars = variables != null ? new HashMap<>(variables) : new HashMap<>();
        if (recipient != null && recipient.getRecipientName() != null && !vars.containsKey("learnerName")) {
            vars.put("learnerName", recipient.getRecipientName());
        }

        // In-App (job/course events only)
        if (NotificationEventRegistry.sendInApp(event)) {
            NotificationEventRegistry.InAppContent content = NotificationEventRegistry.getInAppContent(event);
            if (content != null && notificationService != null) {
                Integer classId = recipient != null && recipient.getClassId() != null ? recipient.getClassId() : 0;
                Integer courseId = recipient != null && recipient.getCourseId() != null ? recipient.getCourseId() : 0;
                String notificationType = NotificationEventRegistry.getNotificationType(event);
                String contextLabel = deriveContextLabel(notificationType, vars);
                try {
                    String title = NotificationTemplateRenderer.render(content.getSubject(), vars);
                    String body = NotificationTemplateRenderer.render(content.getBody(), vars);
                    Integer learnerId = recipient != null && recipient.getLearnerId() != null ? recipient.getLearnerId() : null;
                    Object appIdObj = vars.get("applicationId");
                    Object jobIdObj = vars.get("jobId");
                    Object assessmentUrlObj = vars.get("assessmentUrl");
                    Object interviewIdObj = vars.get("interviewId");
                    Integer applicationId = (appIdObj instanceof Number) ? ((Number) appIdObj).intValue() : null;
                    Integer jobId = (jobIdObj instanceof Number) ? ((Number) jobIdObj).intValue() : null;
                    String assessmentUrl = (assessmentUrlObj instanceof String && !((String) assessmentUrlObj).isBlank())
                            ? ((String) assessmentUrlObj).trim() : null;
                    Integer interviewId = (interviewIdObj instanceof Number) ? ((Number) interviewIdObj).intValue() : null;
                    if (applicationId != null && applicationId <= 0) applicationId = null;
                    if (jobId != null && jobId <= 0) jobId = null;
                    if (interviewId != null && interviewId <= 0) interviewId = null;
                    Notification created = notificationService.createNotification(
                            title, body, classId, courseId, learnerId, notificationType, contextLabel, applicationId, jobId, assessmentUrl, interviewId);
                    if (created != null) {
                        log.info("In-app notification created for event {} (id={}, type={}, context={})",
                                event, created.getId(), notificationType, contextLabel);
                    }
                } catch (Exception e) {
                    log.error("Failed to create in-app notification for event {}: {}", event, e.getMessage(), e);
                }
            }
        }

        // Email (job/course + pre-login)
        if (NotificationEventRegistry.sendEmail(event)) {
            if (recipient == null) {
                log.warn("NC-15: Email skipped for event {}: no recipient provided", event);
            } else {
                String email = recipient.getEmail();
                if (email == null || email.isBlank()) {
                    log.warn("NC-15: Email skipped for event {}: recipient '{}' has no email address on record",
                            event, recipient.getRecipientName() != null ? recipient.getRecipientName() : "(unknown)");
                } else if (!isValidEmailForSend(email)) {
                    log.warn("Email skipped for event {} to {}: invalid email format", event, email);
                } else if (!com._42students.lms.service.tpo.TpoMailService.mayEmail(stage, devMailAllow, email)) {
                    log.info("Email for event {} not sent on {}: {} is not in DEV_MAIL_ALLOW", event, stage, email);
                } else {
                    String skipReason = EmailVariableValidator.getSkipReason(event, vars);
                    if (skipReason != null) {
                        log.warn("Email skipped for event {} to {}: {}", event, email, skipReason);
                    } else {
                        String zeptoTemplateId = zeptoMailTemplateIdResolver.getTemplateId(event);
                        if (zeptoTemplateId == null || zeptoTemplateId.isBlank() || TEMP_ID_PLACEHOLDER.equals(zeptoTemplateId.trim())) {
                            log.debug("Zepto template ID not configured for event {}; skipping email", event);
                        } else {
                            // NC-05: retry up to 3 times with exponential backoff on transient failures
                            Map<String, String> mergeInfo = toMergeInfo(vars);
                            int maxAttempts = 3;
                            Exception lastEx = null;
                            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                                try {
                                    zeptoMailService.sendEmailWithTemplateId(zeptoTemplateId.trim(), email.trim(), mergeInfo);
                                    log.info("Email sent for event {} to {} (attempt {})", event, email, attempt);
                                    lastEx = null;
                                    break;
                                } catch (Exception e) {
                                    lastEx = e;
                                    if (attempt < maxAttempts) {
                                        log.warn("NC-05: Email attempt {}/{} failed for event {} to {}: {}. Retrying...",
                                                attempt, maxAttempts, event, email, e.getMessage());
                                        try { Thread.sleep(500L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                                    }
                                }
                            }
                            if (lastEx != null) {
                                log.error("NC-05: All {} email attempts failed for event {} to {}: {}",
                                        maxAttempts, event, email, lastEx.getMessage(), lastEx);
                            }
                        }
                    }
                }
            }
        }

        // TRAI SMS (job events only)
        if (NotificationEventRegistry.sendSmsTrai(event)) {
            if (recipient != null && recipient.getPhone() != null && !recipient.getPhone().isBlank() && smsService != null) {
                String name = recipient.getRecipientName();
                if (name == null || name.isBlank()) {
                    Object ln = vars.get("learnerName");
                    name = ln != null ? Objects.toString(ln) : "User";
                }
                try {
                    smsService.sendJobUpdateSms(recipient.getPhone().trim(), name);
                    log.info("TRAI SMS sent for event {} to {}", event, recipient.getPhone());
                } catch (Exception e) {
                    log.error("Failed to send SMS for event {}: {}", event, e.getMessage(), e);
                }
            }
        }
    }


    /** Max length per merge value to avoid API/DoS issues (ZeptoMail and JSON limits). */
    private static final int MAX_MERGE_VALUE_LENGTH = 8192;

    private static Map<String, String> toMergeInfo(Map<String, Object> variables) {
        Map<String, String> out = new HashMap<>();
        if (variables == null) return out;
        for (Map.Entry<String, Object> e : variables.entrySet()) {
            String key = e.getKey();
            if (key == null || key.isBlank()) continue;
            Object v = e.getValue();
            String s = v != null ? v.toString() : "";
            if (s.length() > MAX_MERGE_VALUE_LENGTH) {
                s = s.substring(0, MAX_MERGE_VALUE_LENGTH - 3) + "...";
            }
            out.put(key, s);
        }
        return out;
    }

    /**
     * Derive a human-readable context label from the notification variables based on type.
     * JOB    → "JobTitle at CompanyName"
     * COURSE → "CourseName" or "CourseName — AssignmentName" or just "AssignmentName"
     */
    private static String deriveContextLabel(String notificationType, Map<String, Object> vars) {
        if (vars == null || notificationType == null) return null;
        if ("JOB".equals(notificationType)) {
            Object jobTitle = vars.get("jobTitle");
            Object companyName = vars.get("companyName");
            if (jobTitle != null && companyName != null) {
                return jobTitle + " at " + companyName;
            }
            if (companyName != null) return companyName.toString();
            if (jobTitle != null) return jobTitle.toString();
            return null;
        }
        if ("COURSE".equals(notificationType)) {
            Object rawCourse = vars.get("courseName");
            Object rawAssignment = vars.get("assignmentName");
            String course = rawCourse != null ? rawCourse.toString().trim() : "";
            String assignment = rawAssignment != null ? rawAssignment.toString().trim() : "";
            if (!course.isEmpty() && !assignment.isEmpty()) {
                return course + " — " + assignment;
            }
            if (!course.isEmpty()) return course;
            if (!assignment.isEmpty()) return assignment;
            return null;
        }
        return null;
    }

    /** NC-04: RFC-compliant email format check — rejects user@, @domain.com, user@@x.com, user@localhost. */
    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");

    private static boolean isValidEmailForSend(String email) {
        if (email == null) return false;
        String t = email.trim();
        if (t.isEmpty() || t.length() > 254) return false;
        return EMAIL_PATTERN.matcher(t).matches();
    }
}

