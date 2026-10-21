package com._42students.lms.util;

import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

/**
 * Shared helper for sending job application status notifications.
 * Single source of truth for notification logic used by job services.
 */
@Component
@Slf4j
public class JobNotificationHelper {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;

    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired(required = false)
    private InterviewRepository interviewRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.JobPreferencesRepository jobPreferencesRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.JobApplicationRepository jobApplicationRepository;

    /**
     * Async entry point for bulk status-update loops. Bulk-rejecting/shortlisting a batch used to
     * run this helper's email/SMS dispatch (each with blocking HTTP calls and retry sleeps)
     * synchronously once per row, inside the caller's transaction — holding DB locks on every
     * row in the batch for as long as the slowest notification took, and risking a request
     * timeout well before a large batch finished. Re-fetches the application fresh by id (with
     * associations eagerly joined) rather than reusing the caller's entity reference, since that
     * reference's lazy learner/job proxies would throw LazyInitializationException once accessed
     * from this method's own thread after the caller's transaction/session has closed.
     */
    @org.springframework.scheduling.annotation.Async
    public void sendStatusNotificationAsync(Integer applicationId, String newStatus) {
        if (jobApplicationRepository == null || applicationId == null) return;
        jobApplicationRepository.findByIdWithAssociations(applicationId)
                .ifPresent(application -> sendStatusNotification(application, newStatus));
    }

    /** No JobPreferences row means the learner never touched the setting — default to notified. */
    private boolean isOptedOut(Integer learnerId) {
        if (jobPreferencesRepository == null || learnerId == null) return false;
        return jobPreferencesRepository.findByLearnerIdAndIsDeletedFalse(learnerId)
                .map(prefs -> Boolean.FALSE.equals(prefs.getJobNotificationsEnabled()))
                .orElse(false);
    }

    /**
     * Send status-change notifications for a job application.
     * Non-blocking: failures are logged but never rethrown.
     */
    public void sendStatusNotification(JobApplication application, String newStatus) {
        try {
            Learner learner = application.getLearner();
            Job job = application.getJob();
            if (learner == null || job == null) {
                log.warn("Cannot send notifications - learner or job is null for application {}", application.getId());
                return;
            }
            if (isOptedOut(learner.getId())) {
                log.debug("Skipping job status notification for learner {} — opted out", learner.getId());
                return;
            }

            Map<String, Object> variables = buildBaseVariables(application, learner, job, newStatus);

            NotificationTemplateContext context = contextResolver.getContextForCollege(job.getCollegeId());
            boolean shouldNotify = true;

            switch (newStatus) {
                case "INTERVIEW":
                    shouldNotify = enrichInterviewVariables(application, variables);
                    break;
                case "REJECTED":
                case "SHORTLISTED":
                case "ASSESSMENT":
                    break;
                case "OFFERED":
                case "HIRED":
                    // 8.8: Now enabled – notifications sent when event mapping exists
                    break;
                case "WAITLISTED":
                    // Was in `default` (no notification at all) despite being a real, reachable
                    // status (JobApplicationStatusValidator allows INTERVIEW -> WAITLISTED) and a
                    // meaningful change for the candidate — their application is now conditional
                    // on capacity, not just quietly parked.
                    break;
                default:
                    shouldNotify = false;
                    break;
            }

            if (!shouldNotify) {
                return;
            }

            NotificationEvent event = mapStatusToEvent(newStatus);
            if (event == null) {
                return;
            }

            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learnerName)
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(null)
                    .build();

            if (notificationDispatcherService != null) {
                notificationDispatcherService.dispatch(event, context, recipient, variables);
                log.info("Sent {} notification for application {} (status: {})", event, application.getId(), newStatus);
            }
        } catch (Exception e) {
            log.error("Error sending job application status notification for application {}: {}",
                    application.getId(), e.getMessage(), e);
        }
    }

    private Map<String, Object> buildBaseVariables(JobApplication application, Learner learner, Job job, String newStatus) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
        variables.put("jobTitle", job.getJobTitle());
        variables.put("companyName", job.getCompanyName());
        variables.put("status", newStatus);
        variables.put("applicationId", application.getId());
        variables.put("jobId", job.getId());
        variables.put("applicationDate", application.getAppliedAt() != null
                ? application.getAppliedAt().format(DATE_FMT)
                : (application.getStatusUpdatedAt() != null
                        ? application.getStatusUpdatedAt().format(DATE_FMT)
                        : ""));
        if ("INTERVIEW".equals(newStatus) || "OFFERED".equals(newStatus)) {
            String phone = learner.getContactMobile() != null ? learner.getContactMobile() : learner.getContactPhone();
            if (phone != null) {
                variables.put("contactPhone", phone);
            }
        }
        // Assessment: a one-off per-application link outranks the reusable job default.
        if ("ASSESSMENT".equals(newStatus)) {
            String assessmentUrl = application.getAssessmentUrl();
            if (assessmentUrl == null || assessmentUrl.trim().isEmpty()) {
                assessmentUrl = job.getAssessmentUrl();
            }
            if (assessmentUrl != null && !assessmentUrl.trim().isEmpty()) {
                variables.put("assessmentUrl", assessmentUrl.trim());
            }
        }
        // 4.2 Rejection: add rejectionReason for JOB_APPLICATION_REJECTED
        if ("REJECTED".equals(newStatus) && application.getRejectionReason() != null && !application.getRejectionReason().trim().isEmpty()) {
            variables.put("rejectionReason", application.getRejectionReason().trim());
        }
        return variables;
    }

    /**
     * Enrich variables with the latest non-cancelled interview details.
     * Returns false (shouldNotify=false) if no interview with a meeting link or venue exists.
     */
    private boolean enrichInterviewVariables(JobApplication application, Map<String, Object> variables) {
        try {
            if (interviewRepository == null) return false;

            interviewRepository.findByJobApplicationId(application.getId())
                    .stream()
                    .filter(i -> !"CANCELLED".equalsIgnoreCase(i.getInterviewStatus()))
                    .max(Comparator.comparing(i -> i.getScheduledDate() != null ? i.getScheduledDate() : LocalDateTime.MIN))
                    .ifPresent(interview -> {
                        variables.put("interviewId", interview.getId());
                        if (interview.getScheduledDate() != null) {
                            // Stored in UTC; the student reads India time.
                            variables.put("interviewDate", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                            variables.put("interviewTime", PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
                        }
                        if (interview.getInterviewMode() != null) {
                            variables.put("interviewMode", interview.getInterviewMode());
                        }
                        String roundName = formatRoundName(interview.getInterviewType());
                        variables.put("roundName", roundName != null ? roundName : "Interview");
                        variables.put("roundDescription",
                                interview.getRoundDescription() != null ? interview.getRoundDescription().trim() : "");
                        if (interview.getLocation() != null) {
                            boolean online = "ONLINE".equalsIgnoreCase(interview.getInterviewMode());
                            variables.put(online ? "meetingLink" : "venueAddress", interview.getLocation());
                            variables.put(online ? "venueAddress" : "meetingLink", "");
                        } else {
                            variables.put("meetingLink", "");
                            variables.put("venueAddress", "");
                        }
                    });
        } catch (Exception e) {
            log.debug("Could not fetch interview details for status notification: {}", e.getMessage());
            variables.put("roundName", "Interview");
            variables.put("roundDescription", "");
            variables.put("meetingLink", "");
            variables.put("venueAddress", "");
        }

        // Interview.location is optional at schedule time, so a round with no link/venue yet is
        // a normal (if incomplete) state — this used to skip the notification outright, which
        // meant the learner never even learned they'd been moved to INTERVIEW at all. Notify
        // regardless, substituting a placeholder so the template still reads sensibly; the
        // location can be added later via edit, which does trigger its own update notification.
        Object ml = variables.get("meetingLink");
        Object va = variables.get("venueAddress");
        boolean hasLinkOrVenue = (ml != null && !ml.toString().trim().isEmpty())
                || (va != null && !va.toString().trim().isEmpty());
        if (!hasLinkOrVenue) {
            variables.put("meetingLink", "");
            variables.put("venueAddress", "Details to follow — check the portal closer to the date.");
        }
        return true;
    }

    /**
     * Maps application status to notification event.
     * 8.8: OFFERED and HIRED now mapped to events (enable JOB_OFFER_EXTENDED, JOB_HIRED when templates exist).
     */
    public static NotificationEvent mapStatusToEvent(String newStatus) {
        if (newStatus == null) return null;
        switch (newStatus) {
            case "INTERVIEW": return NotificationEvent.JOB_INTERVIEW_SCHEDULED;
            case "OFFERED": return NotificationEvent.JOB_OFFER_EXTENDED;
            case "HIRED": return NotificationEvent.JOB_HIRED;
            case "ASSESSMENT":
                return NotificationEvent.JOB_ASSESSMENT_INVITE; // In-app; email when template has {{assessmentUrl}}
            case "REJECTED": return NotificationEvent.JOB_APPLICATION_REJECTED;
            case "SHORTLISTED": return NotificationEvent.JOB_SHORTLISTED;
            case "WAITLISTED": return NotificationEvent.JOB_WAITLISTED;
            default: return null;
        }
    }

    public static String formatRoundName(String interviewType) {
        if (interviewType == null || interviewType.isBlank()) return null;
        String normalized = interviewType.trim().toLowerCase();
        switch (normalized) {
            case "screening": return "Screening Round";
            case "technical": return "Technical Round";
            case "hr": return "HR Round";
            case "managerial": return "Managerial Round";
            case "final": return "Final Round";
            default: return interviewType.trim() + " Round";
        }
    }
}

