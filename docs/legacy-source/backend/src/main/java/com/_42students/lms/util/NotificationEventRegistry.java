package com._42students.lms.util;

import com._42students.lms.enums.NotificationEvent;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * In-code notification configuration per event: channels and in-app content.
 * No DB or CSV. Used by NotificationDispatcherService.
 */
public final class NotificationEventRegistry {

    /**
     * Events that send In-App (job + course). JOB_OFFER_EXTENDED/JOB_HIRED and
     * INTERVIEW_CANCELLED/INTERVIEW_RESCHEDULED are all real, actively-dispatched events
     * (JobNotificationHelper.sendStatusNotification, InterviewServiceImpl) that were missing from
     * every set below — the code believed it was sending a notification (an unconditional
     * log.info fires after dispatch()) but every channel silently no-op'd, so a learner offered/
     * hired for a job, or whose interview was cancelled/rescheduled, got nothing at all.
     */
    private static final Set<NotificationEvent> JOB_COURSE_EVENTS = EnumSet.of(
            NotificationEvent.JOB_APPLICATION_CONFIRMATION,
            NotificationEvent.JOB_SHORTLISTED,
            NotificationEvent.JOB_ASSESSMENT_INVITE,
            NotificationEvent.JOB_INTERVIEW_SCHEDULED,
            NotificationEvent.JOB_OFFER_EXTENDED,
            NotificationEvent.JOB_HIRED,
            NotificationEvent.JOB_APPLICATION_REJECTED,
            NotificationEvent.JOB_WAITLISTED,
            NotificationEvent.INTERVIEW_REMINDER,
            NotificationEvent.INTERVIEW_CONFIRMED,
            NotificationEvent.INTERVIEW_CANCELLED,
            NotificationEvent.INTERVIEW_RESCHEDULED,
            NotificationEvent.COURSE_ASSIGNMENT_DUE,
            NotificationEvent.COURSE_ASSIGNMENT_SUBMITTED,
            NotificationEvent.COURSE_GRADE_PUBLISHED
    );

    /**
     * Events that send Email (job/interview + pre-login). JOB_OFFER_EXTENDED/JOB_HIRED/
     * INTERVIEW_CANCELLED/INTERVIEW_RESCHEDULED are intentionally NOT here yet — email requires a
     * configured Zepto template id (zepto.template.<key> in application.properties), and none
     * exists for these four events' template keys (offer-issued, hired, interview.cancelled,
     * interview.rescheduled). Add them here once those templates are provisioned; until then,
     * in-app (above) is the only channel for these four, which is still a real fix over "nothing
     * at all."
     */
    // 13 Oct 2026, owner: email to students costs per send, so students get email only for urgent things. Application
    // submitted, shortlisted and rejected are in-app only (the highest-volume ones); the learner welcome email was removed.
    private static final Set<NotificationEvent> EMAIL_EVENTS = EnumSet.of(
            NotificationEvent.JOB_INTERVIEW_SCHEDULED,
            NotificationEvent.INTERVIEW_REMINDER,
            NotificationEvent.INTERVIEW_CONFIRMED,
            NotificationEvent.SYSTEM_EMAIL_VERIFICATION,
            NotificationEvent.SYSTEM_APPLICATION_APPROVED,
            NotificationEvent.SYSTEM_APPLICATION_REJECTED
    );

    /** Events that use TRAI-approved SMS (single template, var = name). See EMAIL_EVENTS comment
     *  above — the same four events are excluded here for the same missing-template reason. */
    private static final Set<NotificationEvent> TRAI_SMS_EVENTS = EnumSet.of(
            NotificationEvent.JOB_APPLICATION_CONFIRMATION,
            NotificationEvent.JOB_SHORTLISTED,
            NotificationEvent.JOB_INTERVIEW_SCHEDULED,
            NotificationEvent.JOB_APPLICATION_REJECTED,
            NotificationEvent.INTERVIEW_REMINDER,
            NotificationEvent.INTERVIEW_CONFIRMED
    );

    /** Pre-login: Email only, no In-App. */
    private static final Set<NotificationEvent> PRE_LOGIN_EMAIL_ONLY = EnumSet.of(
            NotificationEvent.SYSTEM_EMAIL_VERIFICATION,
            NotificationEvent.SYSTEM_APPLICATION_APPROVED,
            NotificationEvent.SYSTEM_APPLICATION_REJECTED
    );

    private static final Map<NotificationEvent, InAppContent> IN_APP_CONTENT = Map.ofEntries(
            map(NotificationEvent.JOB_APPLICATION_CONFIRMATION,
                    "Application Submitted",
                    "You have successfully applied for {{jobTitle}} at {{companyName}}."),
            map(NotificationEvent.JOB_SHORTLISTED,
                    "Shortlisted",
                    "You have been shortlisted for {{jobTitle}} at {{companyName}}. Check dashboard for next steps."),
            map(NotificationEvent.JOB_ASSESSMENT_INVITE,
                    "Online Assessment",
                    "You have been invited for the online assessment for {{jobTitle}} at {{companyName}}. Check My Applications for the assessment link."),
            map(NotificationEvent.JOB_INTERVIEW_SCHEDULED,
                    "Interview Round Scheduled",
                    "{{roundName}} for {{jobTitle}} at {{companyName}} has been scheduled. Check dashboard for details."),
            map(NotificationEvent.JOB_APPLICATION_REJECTED,
                    "Application Update",
                    "Update regarding your application for {{jobTitle}} at {{companyName}}."),
            map(NotificationEvent.JOB_OFFER_EXTENDED,
                    "Offer Extended",
                    "You've received an offer for {{jobTitle}} at {{companyName}}. Check dashboard for details."),
            map(NotificationEvent.JOB_HIRED,
                    "You're Hired!",
                    "Congratulations! You've been hired for {{jobTitle}} at {{companyName}}."),
            map(NotificationEvent.JOB_WAITLISTED,
                    "Waitlisted",
                    "Your application for {{jobTitle}} at {{companyName}} has been moved to the waitlist. Check dashboard for updates."),
            map(NotificationEvent.INTERVIEW_REMINDER,
                    "Interview reminder",
                    "Your interview for {{jobTitle}} at {{companyName}} is tomorrow – {{interviewDate}} at {{interviewTime}}. Be on time!"),
            map(NotificationEvent.INTERVIEW_CONFIRMED,
                    "Interview confirmed",
                    "You confirmed the interview for {{jobTitle}} at {{companyName}} on {{interviewDate}} at {{interviewTime}}."),
            map(NotificationEvent.INTERVIEW_CANCELLED,
                    "Interview Cancelled",
                    "Your interview for {{jobTitle}} at {{companyName}} scheduled for {{interviewDate}} at {{interviewTime}} has been cancelled."),
            map(NotificationEvent.INTERVIEW_RESCHEDULED,
                    "Interview Rescheduled",
                    "Your interview for {{jobTitle}} at {{companyName}} has been rescheduled to {{interviewDate}} at {{interviewTime}}."),
            map(NotificationEvent.COURSE_ASSIGNMENT_DUE,
                    "Assignment due",
                    "Assignment \"{{assignmentName}}\" is due on {{dueDate}}. Please submit on time."),
            map(NotificationEvent.COURSE_ASSIGNMENT_SUBMITTED,
                    "Assignment submitted",
                    "You have submitted \"{{assignmentName}}\" for {{courseName}}. Submission received."),
            map(NotificationEvent.COURSE_GRADE_PUBLISHED,
                    "Grade published",
                    "Your grade for \"{{assignmentName}}\" is now available. Grade: {{grade}}.")
    );

    private static Map.Entry<NotificationEvent, InAppContent> map(NotificationEvent e, String subject, String body) {
        return Map.entry(e, new InAppContent(subject, body));
    }

    private NotificationEventRegistry() {
    }

    public static boolean sendInApp(NotificationEvent event) {
        return JOB_COURSE_EVENTS.contains(event);
    }

    public static boolean sendEmail(NotificationEvent event) {
        return EMAIL_EVENTS.contains(event);
    }

    public static boolean sendSmsTrai(NotificationEvent event) {
        return TRAI_SMS_EVENTS.contains(event);
    }

    public static InAppContent getInAppContent(NotificationEvent event) {
        return IN_APP_CONTENT.get(event);
    }

    private static final Set<NotificationEvent> JOB_TYPE_EVENTS = EnumSet.of(
            NotificationEvent.JOB_APPLICATION_CONFIRMATION,
            NotificationEvent.JOB_SHORTLISTED,
            NotificationEvent.JOB_ASSESSMENT_INVITE,
            NotificationEvent.JOB_INTERVIEW_SCHEDULED,
            NotificationEvent.JOB_APPLICATION_REJECTED,
            NotificationEvent.JOB_HIRED,
            NotificationEvent.JOB_OFFER_EXTENDED,
            NotificationEvent.JOB_WAITLISTED,
            NotificationEvent.INTERVIEW_REMINDER,
            NotificationEvent.INTERVIEW_CONFIRMED,
            NotificationEvent.INTERVIEW_CANCELLED,
            NotificationEvent.INTERVIEW_RESCHEDULED
    );

    private static final Set<NotificationEvent> COURSE_TYPE_EVENTS = EnumSet.of(
            NotificationEvent.COURSE_ASSIGNMENT_DUE,
            NotificationEvent.COURSE_ASSIGNMENT_SUBMITTED,
            NotificationEvent.COURSE_GRADE_PUBLISHED
    );

    /**
     * Returns the notification category for the given event: "JOB", "COURSE", or "SYSTEM".
     */
    public static String getNotificationType(NotificationEvent event) {
        if (event == null) return "SYSTEM";
        if (JOB_TYPE_EVENTS.contains(event)) return "JOB";
        if (COURSE_TYPE_EVENTS.contains(event)) return "COURSE";
        return "SYSTEM";
    }

    /** ZeptoMail template ID is resolved from properties using event's template key (e.g. zepto.template.job.application.confirmation). */
    public static String getZeptoPropertyKey(NotificationEvent event) {
        return "zepto.template." + event.getTemplateKey();
    }

    public static final class InAppContent {
        private final String subject;
        private final String body;

        public InAppContent(String subject, String body) {
            this.subject = subject;
            this.body = body;
        }

        public String getSubject() {
            return subject;
        }

        public String getBody() {
            return body;
        }
    }
}

