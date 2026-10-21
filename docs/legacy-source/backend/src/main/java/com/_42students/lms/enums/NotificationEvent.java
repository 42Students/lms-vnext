package com._42students.lms.enums;

/**
 * All notification events. Used by NotificationDispatcherService and NotificationEventRegistry.
 * OTP (SYSTEM_OTP_SMS) is not dispatched; it uses SmsService.sendOtp directly.
 */
public enum NotificationEvent {

    // Job (milestone-driven: one template per stage)
    JOB_APPLICATION_CONFIRMATION("application-submitted"),   // APPLIED
    JOB_SHORTLISTED("shortlisted"),                         // SHORTLISTED
    JOB_ASSESSMENT_INVITE("assessment-invite"),             // ASSESSMENT – in-app only for now; email later
    JOB_INTERVIEW_SCHEDULED("interview-round-update"),      // INTERVIEW (reusable for all rounds)
    JOB_OFFER_EXTENDED("offer-issued"),                     // OFFERED
    JOB_HIRED("hired"),                                     // HIRED
    JOB_APPLICATION_REJECTED("rejected"),                    // REJECTED
    JOB_WAITLISTED("waitlisted"),                           // WAITLISTED

    // Interview
    INTERVIEW_REMINDER("interview.reminder"),
    INTERVIEW_CONFIRMED("interview.confirmed"),
    INTERVIEW_CANCELLED("interview.cancelled"),
    INTERVIEW_RESCHEDULED("interview.rescheduled"),

    // Course
    COURSE_ASSIGNMENT_DUE("course.assignment.due"),
    COURSE_ASSIGNMENT_SUBMITTED("course.assignment.submitted"),
    COURSE_GRADE_PUBLISHED("course.grade.published"),

    // System (pre-login, email only)
    SYSTEM_EMAIL_VERIFICATION("system.email.verification"),
    SYSTEM_APPLICATION_APPROVED("system.application.approved"),
    SYSTEM_APPLICATION_REJECTED("system.application.rejected"),

    // OTP - not dispatched; controllers call SmsService.sendOtp directly
    SYSTEM_OTP_SMS("system.otp.sms");

    private final String templateKey;

    NotificationEvent(String templateKey) {
        this.templateKey = templateKey;
    }

    public String getTemplateKey() {
        return templateKey;
    }

    public static NotificationEvent fromTemplateKey(String templateKey) {
        if (templateKey == null || templateKey.isBlank()) return null;
        for (NotificationEvent e : values()) {
            if (e.templateKey.equals(templateKey.trim())) return e;
        }
        return null;
    }
}

