package com._42students.lms.service.impl;

import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.model.Course;
import com._42students.lms.model.Interview;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.NotificationRepository;
import com._42students.lms.repository.StudentAssignmentRepository;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Scheduled job service for sending reminder notifications
 * Runs daily at 9:00 AM to send reminders for interviews and assignments
 */
@Slf4j
@Service
public class NotificationSchedulerService {

    @Autowired
    private CourseService courseService;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private LessonContentsRepository lessonContentsRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private StudentAssignmentRepository studentAssignmentRepository;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Doc 20: these jobs reach users. Without a lock every replica sends every reminder, so a
     * learner with an assignment due tomorrow gets the notification once per pod.
     */
    @Autowired(required = false)
    private com._42students.lms.service.SchedulerLockService schedulerLock;

    private void exclusively(String jobName, java.time.Duration lease, Runnable task) {
        if (schedulerLock == null) {
            task.run();
            return;
        }
        schedulerLock.runExclusively(jobName, lease, task);
    }

    /** Caps one tick's work so a large backlog drains over several ticks instead of one long one. */
    private static final int RELEASE_BATCH_SIZE = 200;

    @Autowired(required = false)
    private com._42students.lms.sse.SseEmitterRegistry sseEmitterRegistry;

    /**
     * M2 (super-admin audit): release notifications that were composed with a "send later" time.
     *
     * <p>Until this runs, a scheduled notification is invisible to its recipients -- the
     * recipient-facing repository queries all carry
     * {@code scheduled_at is null or scheduled_at <= now()} -- so the job's only jobs are to flip
     * the delivery status and push the live SSE event that an immediate notification would have
     * got at creation time.
     *
     * <p>Every minute rather than daily: a notification scheduled for 09:00 that arrives at
     * midnight the next day is not a scheduled notification, it is a late one. The query is
     * indexed on (delivery_status, scheduled_at) and returns nothing on almost every tick.
     *
     * <p>Each row is released independently and a failure is recorded on that row as FAILED with
     * its reason, so one bad notification cannot stall the queue behind it and an admin can see
     * why and resend it.
     */
    @Scheduled(fixedDelayString = "${lms.notification.release-interval-ms:60000}")
    public void releaseScheduledNotifications() {
        exclusively("notification.release", java.time.Duration.ofMinutes(5), this::releaseScheduledNotificationsInternal);
    }

    private void releaseScheduledNotificationsInternal() {
        List<com._42students.lms.model.Notification> due;
        try {
            due = notificationRepository.findDueScheduled(LocalDateTime.now(),
                    org.springframework.data.domain.PageRequest.of(0, RELEASE_BATCH_SIZE));
        } catch (Exception e) {
            log.error("Scheduled-notification release: lookup failed", e);
            return;
        }
        if (due == null || due.isEmpty()) {
            return;
        }
        int released = 0;
        int failed = 0;
        for (com._42students.lms.model.Notification n : due) {
            try {
                n.setDeliveryStatus("SENT");
                n.setDeliveredAt(LocalDateTime.now());
                n.setDeliveryError(null);
                notificationRepository.save(n);
                released++;
                // Best-effort live push, exactly as save() does for an immediate notification.
                // A dropped SSE frame must not mark the notification failed: it is already
                // persisted and visible on the recipient's next fetch.
                if (sseEmitterRegistry != null && n.getClassId() > 0) {
                    try {
                        sseEmitterRegistry.deliver(n.getClassId(), n.getLearnerId(),
                                new com._42students.lms.dto.response.NotificationResponseDTO(n));
                    } catch (Exception sse) {
                        log.warn("Scheduled-notification release: SSE broadcast failed for classId {}: {}",
                                n.getClassId(), sse.getMessage());
                    }
                }
            } catch (Exception e) {
                failed++;
                try {
                    n.setDeliveryStatus("FAILED");
                    String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    n.setDeliveryError(reason.length() > 500 ? reason.substring(0, 500) : reason);
                    notificationRepository.save(n);
                } catch (Exception ignored) {
                    // If we cannot even record the failure, leave the row SCHEDULED so the next
                    // tick retries it rather than losing the notification entirely.
                    log.error("Scheduled-notification release: could not record failure for id {}", n.getId(), e);
                }
            }
        }
        log.info("Scheduled-notification release: {} sent, {} failed", released, failed);
    }

    /**
     * NC-03: Soft-delete notifications older than 90 days to prevent unbounded table growth.
     * Runs weekly on Sunday at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    public void cleanupOldNotifications() {
        exclusively("notification.cleanup", java.time.Duration.ofHours(1), this::cleanupOldNotificationsInternal);
    }

    private void cleanupOldNotificationsInternal() {
        try {
            java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(90);
            int deleted = notificationRepository.softDeleteOlderThan(cutoff);
            log.info("NC-03: Soft-deleted {} notifications older than 90 days", deleted);
        } catch (Exception e) {
            log.error("NC-03: Notification cleanup job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Interviews booked on the older Interviews screen (the `interview` table; placement-cell rounds have their own reminder in
     * InterviewReminderService): one reminder the evening before, 7 pm India time, like the rounds. It ran at 9:00 UTC and took
     * only interviews 23-26 hours away, so only those starting 1:30-4:30 pm India time the next day were ever reminded, and the
     * time it wrote was UTC (19 Oct 2026). The JVM runs in UTC; scheduledDate is stored in UTC.
     */
    @Scheduled(cron = "0 0 19 * * *", zone = "Asia/Kolkata")
    public void sendInterviewReminders() {
        exclusively("notification.interviewReminders", java.time.Duration.ofHours(1), this::sendInterviewRemindersInternal);
    }

    /** [from, to) in UTC: the whole of the next India day. */
    static LocalDateTime[] tomorrowInIndiaAsUtc(java.time.ZonedDateTime nowIndia) {
        LocalDate day = nowIndia.withZoneSameInstant(REMINDER_ZONE).toLocalDate().plusDays(1);
        LocalDateTime from = day.atStartOfDay(REMINDER_ZONE).withZoneSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime();
        return new LocalDateTime[]{from, from.plusDays(1)};
    }

    private void sendInterviewRemindersInternal() {
        log.info("Starting interview reminder job");

        try {
            LocalDateTime[] window = tomorrowInIndiaAsUtc(java.time.ZonedDateTime.now(REMINDER_ZONE));
            // findByScheduledDateBetween is inclusive at both ends; an interview at exactly midnight belongs to the next day.
            List<Interview> upcomingInterviews = interviewRepository.findByScheduledDateBetween(window[0], window[1].minusNanos(1000));

            log.info("Found {} interviews tomorrow (India time)", upcomingInterviews.size());

            for (Interview interview : upcomingInterviews) {
                // Skip if interview is already cancelled or completed
                if ("CANCELLED".equals(interview.getInterviewStatus()) || 
                    "COMPLETED".equals(interview.getInterviewStatus())) {
                    continue;
                }

                Learner learner = interview.getLearner();
                if (learner == null) {
                    log.warn("Cannot send interview reminder - learner is null for interview {}", interview.getId());
                    continue;
                }

                sendInterviewReminderNotification(interview, learner);
            }

            log.info("Interview reminder job completed successfully");
        } catch (Exception e) {
            log.error("Error in interview reminder job: {}", e.getMessage(), e);
        }
    }

    /**
     * Parse assignment due date string. Tries yyyy-MM-dd HH:mm:ss, then date-only (yyyy-MM-dd) as 23:59:59, then ISO date-time.
     * @return parsed LocalDateTime or null if unparseable (logs warning and skips assignment)
     */
    // Deadlines are India wall-clock (see AssignmentServiceImpl.isPastDeadline); the JVM runs in UTC.
    static final java.time.ZoneId REMINDER_ZONE = java.time.ZoneId.of("Asia/Kolkata");

    /**
     * When the assignment is due, in India wall-clock time: the real deadline column first (what
     * submission is checked against), then the legacy content-data due_date.
     */
    LocalDateTime dueAtOf(LessonContents assignment) {
        if (assignment.getDeadline() != null) return assignment.getDeadline();
        if (assignment.getContentDataDTO() == null) return null;
        String dueDateStr = assignment.getContentDataDTO().getDueDate();
        if (dueDateStr == null || dueDateStr.trim().isEmpty()) return null;
        return parseDueDate(dueDateStr.trim(), assignment.getId());
    }

    /**
     * The job runs once a day, so each run takes the next 24-hour slice of deadlines (12 to 36 hours
     * ahead). Back-to-back runs cover every deadline exactly once. The old 22-26 hour window only
     * caught deadlines that happened to fall in a 4-hour band, so most assignments were never reminded.
     */
    static boolean dueInReminderWindow(LocalDateTime now, LocalDateTime dueAt) {
        if (now == null || dueAt == null) return false;
        long minutes = ChronoUnit.MINUTES.between(now, dueAt);
        return minutes >= 12 * 60 && minutes < 36 * 60;
    }

    LocalDateTime parseDueDate(String dueDateStr, Integer assignmentId) {
        try {
            return LocalDateTime.parse(dueDateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (DateTimeParseException e1) {
            try {
                LocalDate date = LocalDate.parse(dueDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                return date.atTime(23, 59, 59);
            } catch (DateTimeParseException e2) {
                try {
                    return LocalDateTime.parse(dueDateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException e3) {
                    try {
                        // The assignment builder saves due_date with toISOString() ("2026-10-03T08:30:00.153Z").
                        // That shape was rejected here, so every such assignment was skipped and no
                        // reminder was ever sent. Read it as an instant and convert to India time.
                        return java.time.OffsetDateTime.parse(dueDateStr).atZoneSameInstant(REMINDER_ZONE).toLocalDateTime();
                    } catch (DateTimeParseException e4) {
                        log.warn("Skipping assignment {} due to invalid dueDate format: {}", assignmentId, dueDateStr);
                        return null;
                    }
                }
            }
        }
    }

    /**
     * Send assignment due reminders 24 hours before due date
     * Runs daily at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * *") // Every day at 9:00 AM
    public void sendAssignmentDueReminders() {
        exclusively("notification.assignmentReminders", java.time.Duration.ofHours(1), this::sendAssignmentDueRemindersInternal);
    }

    private void sendAssignmentDueRemindersInternal() {
        log.info("Starting assignment due reminder job");
        
        try {
            LocalDateTime now = LocalDateTime.now(REMINDER_ZONE);

            // Find all active assignments AND quizzes with due dates. This job used to query only
            // "assignment", so its "QUIZ" contentType branch below could never be reached and quiz
            // deadline reminders silently never fired.
            List<LessonContents> assignments = lessonContentsRepository.findByContentTypeInAndActiveTrue(
                    java.util.Arrays.asList("assignment", "quiz"));

            log.info("Checking {} assignments/quizzes for due date reminders", assignments.size());

            for (LessonContents assignment : assignments) {
                try {
                    if (Boolean.TRUE.equals(assignment.getIsDeleted())) {
                        continue;
                    }
                    LocalDateTime dueDate = dueAtOf(assignment);
                    if (dueInReminderWindow(now, dueDate)) {
                        if (assignment.getClassId() == null || assignment.getClassId() < 1) {
                            // Generic content: skip for now (no single class to query)
                            continue;
                        }
                        // Find all learners in the class who haven't submitted
                        List<Learner> learners = learnerRepository.getStudentDetailsByClassId(assignment.getClassId());
                        
                        for (Learner learner : learners) {
                            // Check if learner has already submitted
                            boolean alreadySubmitted = studentAssignmentRepository
                                .existsByStudentIdAndLessonContentId(learner.getId(), assignment.getId());
                            
                            if (!alreadySubmitted) {
                                sendAssignmentDueReminderNotification(assignment, learner);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error processing assignment {} for due reminders: {}", 
                        assignment.getId(), e.getMessage());
                }
            }

            log.info("Assignment due reminder job completed successfully");
        } catch (Exception e) {
            log.error("Error in assignment due reminder job: {}", e.getMessage(), e);
        }
    }

    // A daily attendance-alert job (@Scheduled(cron = "0 0 8 * * *")) used to live here but was a
    // pure no-op that only logged "not yet fully implemented" — misleading because it looked like
    // a working scheduled job. Removed rather than left in place: a real implementation needs a
    // configurable threshold, a NotificationEvent + template, and de-duplication so a learner
    // below the threshold isn't re-alerted every single day, none of which exist yet. A per-learner
    // attendance percentage is available via LearnerService#getAttendancePercentage(studentId) for
    // whoever builds this as its own feature.

    /**
     * Send interview reminder notification.
     * Requires jobApplication and job so that applicationId is always set (every job email must include applicationId).
     */
    private void sendInterviewReminderNotification(Interview interview, Learner learner) {
        try {
            if (interview.getJobApplication() == null || interview.getJobApplication().getJob() == null) {
                log.warn("Skipping interview reminder for interview {}: jobApplication or job is null (applicationId required)", interview.getId());
                return;
            }
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("jobTitle", interview.getJobApplication().getJob().getJobTitle());
            variables.put("companyName", interview.getJobApplication().getJob().getCompanyName());
            variables.put("applicationId", interview.getJobApplication().getId());
            if (interview.getJobApplication().getAppliedAt() != null) {
                variables.put("applicationDate", interview.getJobApplication().getAppliedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
            }
            if (interview.getScheduledDate() != null) {
                // Stored in UTC; the student reads India time.
                variables.put("interviewDate", com._42students.lms.util.PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "dd MMM yyyy"));
                variables.put("interviewTime", com._42students.lms.util.PlacementDateTimeUtils.indiaFormat(interview.getScheduledDate(), "hh:mm a"));
            }
            
            if (interview.getInterviewMode() != null) {
                variables.put("interviewMode", interview.getInterviewMode());
            }
            
            if (interview.getLocation() != null) {
                variables.put("interviewLocation", interview.getLocation());
            }

            // Gap #7: roundName and roundDescription so learner can tell which round when multiple in 24h
            String roundName = formatRoundName(interview.getInterviewType());
            variables.put("roundName", roundName != null ? roundName : "Interview");
            variables.put("roundDescription", interview.getRoundDescription() != null ? interview.getRoundDescription().trim() : "");
            variables.put("interviewId", interview.getId());

            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
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
                try {
                    notificationDispatcherService.dispatch(NotificationEvent.INTERVIEW_REMINDER, context, recipient, variables);
                    log.info("Interview reminder notifications sent for learner {} with {} context", learner.getId(), context);
                } catch (Exception e) {
                    log.error("Failed to send interview reminder notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending interview reminder notification: {}", e.getMessage(), e);
        }
    }

    private static String formatRoundName(String interviewType) {
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

    /**
     * Send assignment due reminder notification
     */
    private void sendAssignmentDueReminderNotification(LessonContents assignment, Learner learner) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("learnerName", learner.getFirstName() + " " + learner.getLastName());
            variables.put("assignmentName", assignment.getContentTitle() != null ? assignment.getContentTitle() : "Assignment");
            // Templates + feature-flag gating are shared for assignments & quizzes; make the originating content explicit.
            String ct = assignment.getContentType() != null ? assignment.getContentType().trim().toUpperCase() : "";
            variables.put("contentType", "QUIZ".equals(ct) ? "QUIZ" : "ASSIGNMENT");
            
            // Readable India time ("4 Oct 2026, 11:59 PM"), not the raw stored ISO string.
            LocalDateTime dueAt = dueAtOf(assignment);
            if (dueAt != null) {
                variables.put("dueDate", dueAt.format(DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", java.util.Locale.ENGLISH)));
            }
            
            variables.put("assignmentId", assignment.getId());
            
            // Add courseId, courseSlug and courseName if available (courseSlug for URLs in emails)
            if (assignment.getCourseId() != null) {
                variables.put("courseId", assignment.getCourseId());
                Course course = courseService.fetchCourse(assignment.getCourseId());
                if (course != null) {
                    if (course.getSlug() != null) {
                        variables.put("courseSlug", course.getSlug());
                    }
                    if (!variables.containsKey("courseName") && course.getCourseName() != null) {
                        variables.put("courseName", course.getCourseName());
                    }
                }
            }
            if (assignment.getCourseName() != null && !assignment.getCourseName().trim().isEmpty()) {
                variables.put("courseName", assignment.getCourseName());
            }

            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            String learnerName = learner.getFirstName() + " " + learner.getLastName();
            Integer courseId = assignment.getCourseId() != null ? assignment.getCourseId() : null;
            NotificationRecipientDTO recipient = NotificationRecipientDTO.builder()
                    .email(learner.getContactMail())
                    .phone(learner.getContactMobile())
                    .recipientName(learnerName)
                    .learnerId(learner.getId())
                    .classId(learner.getClassId())
                    .courseId(courseId)
                    .build();
            if (notificationDispatcherService != null) {
                try {
                    notificationDispatcherService.dispatch(NotificationEvent.COURSE_ASSIGNMENT_DUE, context, recipient, variables);
                    log.info("Assignment due reminder notifications sent for learner {} with {} context", learner.getId(), context);
                } catch (Exception e) {
                    log.error("Failed to send assignment due reminder notifications: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error sending assignment due reminder notification: {}", e.getMessage(), e);
        }
    }
}

