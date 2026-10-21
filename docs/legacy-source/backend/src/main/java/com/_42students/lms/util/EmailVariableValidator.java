package com._42students.lms.util;

import com._42students.lms.enums.NotificationEvent;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Validates that required template variables are present and non-blank before sending email.
 * If validation fails, the dispatcher skips sending the email instead of sending one with
 * missing/blank variables or literal {{placeholder}} text.
 * <p>
 * Edge cases: null/empty variables map is treated as no vars; only known keys are checked
 * (so null keys in the map do not affect validation). Values are considered blank if
 * null or toString().trim().isEmpty().
 */
public final class EmailVariableValidator {

    private EmailVariableValidator() {}

    /**
     * @param event     the notification event (email template)
     * @param variables the merge variables to be sent (may be null or empty)
     * @return null if email should be sent; otherwise a reason string to skip sending (and log)
     */
    public static String getSkipReason(NotificationEvent event, Map<String, Object> variables) {
        if (event == null) return "event is null";
        Map<String, Object> vars = variables != null ? variables : Collections.emptyMap();

        switch (event) {
            case JOB_INTERVIEW_SCHEDULED:
                String r = validateRequired(vars, "learnerName", "jobTitle", "companyName", "applicationId", "roundDescription", "interviewDate", "interviewTime", "interviewMode");
                if (r != null) return r;
                return validateAtLeastOneOf(vars, Arrays.asList("meetingLink", "venueAddress"));

            case INTERVIEW_REMINDER:
            case INTERVIEW_CONFIRMED:
                return validateRequired(vars, "learnerName", "jobTitle", "companyName", "applicationId", "interviewDate", "interviewTime", "interviewMode", "interviewLocation");

            case JOB_APPLICATION_CONFIRMATION:
            case JOB_SHORTLISTED:
            case JOB_APPLICATION_REJECTED:
                return validateRequired(vars, "learnerName", "jobTitle", "companyName", "applicationId");

            case JOB_OFFER_EXTENDED:
            case JOB_HIRED:
                // NC-12: enabled — require same variables as other job status events
                return validateRequired(vars, "learnerName", "jobTitle", "companyName", "applicationId");

            case SYSTEM_EMAIL_VERIFICATION:
                return validateRequired(vars, "otp");

            case SYSTEM_APPLICATION_APPROVED:
                return validateRequired(vars, "learnerName", "applicationId");

            case SYSTEM_APPLICATION_REJECTED:
                return validateRequired(vars, "learnerName", "applicationId", "rejectionReason");

            case COURSE_ASSIGNMENT_DUE:
            case COURSE_ASSIGNMENT_SUBMITTED:
            case COURSE_GRADE_PUBLISHED:
            case SYSTEM_OTP_SMS:
            default:
                return null; // no rule or no email for this event: allow send
        }
    }

    private static String validateRequired(Map<String, Object> vars, String... keys) {
        for (String key : keys) {
            if (!isNonBlank(vars.get(key))) {
                return "missing or blank required variable for email: " + key;
            }
        }
        return null;
    }

    private static String validateAtLeastOneOf(Map<String, Object> vars, List<String> keys) {
        for (String key : keys) {
            if (isNonBlank(vars.get(key))) return null;
        }
        return "at least one of [" + String.join(", ", keys) + "] must be set for email";
    }

    private static boolean isNonBlank(Object value) {
        if (value == null) return false;
        String s;
        try {
            s = value.toString();
        } catch (Exception e) {
            return false;
        }
        return s != null && !s.trim().isEmpty();
    }
}

