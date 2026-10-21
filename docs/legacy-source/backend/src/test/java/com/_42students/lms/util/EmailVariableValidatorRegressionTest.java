package com._42students.lms.util;

import static com._42students.lms.enums.NotificationEvent.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com._42students.lms.enums.NotificationEvent;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Covers the pre-dispatch variable gate, not actual provider delivery. */
class EmailVariableValidatorRegressionTest {
    private Map<String, Object> job() {
        Map<String, Object> vars = new HashMap<>();
        vars.put("learnerName", "Learner");
        vars.put("jobTitle", "Engineer");
        vars.put("companyName", "Company");
        vars.put("applicationId", 17);
        return vars;
    }

    private Map<String, Object> interview() {
        Map<String, Object> vars = job();
        vars.put("roundDescription", "Technical");
        vars.put("interviewDate", "2026-09-25");
        vars.put("interviewTime", "10:00");
        vars.put("interviewMode", "ONLINE");
        vars.put("meetingLink", "https://example.test/meeting");
        return vars;
    }

    private void missing(NotificationEvent event, Map<String, Object> vars, String key) {
        // Copy the caller's map: Map.of and other immutable maps cannot be mutated.
        Map<String, Object> withoutKey = new HashMap<>(vars);
        withoutKey.remove(key);
        assertEquals("missing or blank required variable for email: " + key,
                EmailVariableValidator.getSkipReason(event, withoutKey));
    }

    @Test void nullEventBlocksDispatch() {
        assertEquals("event is null", EmailVariableValidator.getSkipReason(null, job()));
    }

    @Test void interviewScheduledRequiresRoundDescription() {
        missing(JOB_INTERVIEW_SCHEDULED, interview(), "roundDescription");
    }

    @Test void interviewScheduledRequiresInterviewDate() {
        missing(JOB_INTERVIEW_SCHEDULED, interview(), "interviewDate");
    }

    @Test void interviewScheduledRequiresInterviewTime() {
        missing(JOB_INTERVIEW_SCHEDULED, interview(), "interviewTime");
    }

    @Test void interviewScheduledRequiresInterviewMode() {
        missing(JOB_INTERVIEW_SCHEDULED, interview(), "interviewMode");
    }

    @Test void interviewScheduledRequiresLocationOrMeetingLink() {
        Map<String, Object> vars = interview();
        vars.remove("meetingLink");
        assertTrue(EmailVariableValidator.getSkipReason(JOB_INTERVIEW_SCHEDULED, vars)
                .contains("meetingLink, venueAddress"));
    }

    @Test void interviewScheduledAllowsPhysicalVenueInsteadOfMeetingLink() {
        Map<String, Object> vars = interview();
        vars.remove("meetingLink");
        vars.put("venueAddress", "Campus Hall");
        assertNull(EmailVariableValidator.getSkipReason(JOB_INTERVIEW_SCHEDULED, vars));
    }

    @Test void interviewScheduledAllowsMeetingLinkInsteadOfPhysicalVenue() {
        assertNull(EmailVariableValidator.getSkipReason(JOB_INTERVIEW_SCHEDULED, interview()));
    }

    @Test void interviewReminderRequiresLocation() {
        Map<String, Object> vars = interview();
        missing(INTERVIEW_REMINDER, vars, "interviewLocation");
    }

    @Test void interviewConfirmedRequiresLocation() {
        Map<String, Object> vars = interview();
        missing(INTERVIEW_CONFIRMED, vars, "interviewLocation");
    }

    @Test void applicationConfirmationRequiresApplicationId() {
        missing(JOB_APPLICATION_CONFIRMATION, job(), "applicationId");
    }

    @Test void shortlistRequiresCompanyName() {
        missing(JOB_SHORTLISTED, job(), "companyName");
    }

    @Test void rejectionRequiresJobTitle() {
        missing(JOB_APPLICATION_REJECTED, job(), "jobTitle");
    }

    @Test void offerRequiresLearnerName() {
        missing(JOB_OFFER_EXTENDED, job(), "learnerName");
    }

    @Test void hiredRequiresApplicationId() {
        missing(JOB_HIRED, job(), "applicationId");
    }

    @Test void verificationEmailRequiresOtp() {
        missing(SYSTEM_EMAIL_VERIFICATION, new HashMap<>(), "otp");
    }

    @Test void systemRejectionRequiresReasonAndAcceptsCompleteVariables() {
        Map<String, Object> vars = new HashMap<>();
        vars.put("learnerName", "Learner");
        vars.put("applicationId", 17);
        missing(SYSTEM_APPLICATION_REJECTED, vars, "rejectionReason");
        vars.put("rejectionReason", "Incomplete documents");
        assertNull(EmailVariableValidator.getSkipReason(SYSTEM_APPLICATION_REJECTED, vars));
    }
}
