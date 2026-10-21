package com._42students.lms.service.impl;

import com._42students.lms.dto.request.NotificationDTO;
import com._42students.lms.dto.response.NotificationResponseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Notification;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.NotificationRepository;
import com._42students.lms.service.NotificationService;
import com._42students.lms.sse.SseEmitterRegistry;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    SseEmitterRegistry sseEmitterRegistry;

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private void setNotificationFields(Notification notification, NotificationDTO dto) {
        if (dto.getHtmlContent() != null) notification.setMessage(
                Jsoup.clean(dto.getHtmlContent(), Safelist.relaxed()
                        .addTags("u", "s", "sub", "sup")
                        // "style" attribute removed — allows CSS-based XSS vectors
                        .addAttributes("a", "target")
                        .addProtocols("a", "href", "http", "https", "mailto")));
        if (dto.getTitle() != null) notification.setTitle(
                Jsoup.clean(dto.getTitle(), Safelist.none()));
        if (dto.getClassId() > 0) notification.setClassId(dto.getClassId());
        int courseId = resolveCourseId(dto.getCourseSlug(), dto.getCourseId());
        notification.setCourseId(courseId);
        notification.setLearnerId(dto.getLearnerId());
        // is_read is a single boolean column on the notification row itself, not a per-recipient
        // join table. For a personal notification (learnerId > 0) that's fine — exactly one
        // recipient owns the row. For a class/broadcast notification (learnerId null/0, one row
        // read by every learner in the class), applying an isRead change here would flip the read
        // state for the entire class from a single learner's action and SSE-broadcast that as if
        // it were everyone's state. There is currently no UI flow that calls this endpoint to mark
        // a notification read (see NotifivationDropdown.js), so this hasn't surfaced yet in
        // practice — but the endpoint itself must not allow it once such a flow is added. A full
        // fix needs a per-recipient read-state table (notification_id + learner_id + read_at) so
        // "class-wide notification, read by learner X" is representable; until that exists, only
        // honor isRead changes on personally-scoped notifications.
        boolean isPersonalNotification = notification.getLearnerId() != null && notification.getLearnerId() > 0;
        if (isPersonalNotification) {
            notification.setRead(dto.isRead());
        } else if (dto.isRead() != notification.isRead()) {
            logger.warn("Ignoring isRead change on broadcast notification id={} (classId={}): " +
                    "is_read is a shared column for all recipients of a class-wide notification " +
                    "and cannot be toggled per-learner until per-recipient read state exists.",
                    notification.getId(), notification.getClassId());
        }
        if (dto.getNotificationType() != null) notification.setNotificationType(dto.getNotificationType());
        if (dto.getContextLabel() != null) notification.setContextLabel(dto.getContextLabel());
        if (dto.getApplicationId() != null) notification.setApplicationId(dto.getApplicationId());
        if (dto.getJobId() != null) notification.setJobId(dto.getJobId());
        if (dto.getAssessmentUrl() != null && !dto.getAssessmentUrl().trim().isEmpty()) {
            String assessmentUrl = dto.getAssessmentUrl().trim();
            if (!assessmentUrl.startsWith("https://") && !assessmentUrl.startsWith("http://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assessment URL must use http or https");
            }
            notification.setAssessmentUrl(assessmentUrl);
        }
        if (dto.getInterviewId() != null) notification.setInterviewId(dto.getInterviewId());
        if (dto.getCreatorFacultyId() != null) notification.setCreatorFacultyId(dto.getCreatorFacultyId());
    }

    private int resolveCourseId(String courseSlug, int fallbackCourseId) {
        if (courseSlug != null && !courseSlug.trim().isEmpty()) {
            Course course = courseRepository.findBySlug(courseSlug.trim());
            if (course != null) return course.getId();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found for slug");
        }
        return fallbackCourseId;
    }

    /** Delivery states for a notification with a schedule. See V130. */
    public static final String DELIVERY_SCHEDULED = "SCHEDULED";
    public static final String DELIVERY_SENT = "SENT";
    public static final String DELIVERY_FAILED = "FAILED";

    private static final java.time.format.DateTimeFormatter SCHEDULE_FMT =
            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Accepts "yyyy-MM-dd HH:mm:ss", the same shape the class-schedule API uses, and also plain
     * ISO-8601 so a browser's toISOString() works. An unparseable value is rejected outright
     * rather than silently sending immediately: a typo'd schedule that fires instantly is worse
     * than one that errors.
     */
    private java.time.LocalDateTime parseScheduledAt(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String v = raw.trim();
        try {
            return java.time.LocalDateTime.parse(v, SCHEDULE_FMT);
        } catch (Exception ignored) {
            // fall through to ISO
        }
        try {
            return java.time.LocalDateTime.parse(v.replace("Z", ""));
        } catch (Exception e) {
            throw new IllegalArgumentException("scheduledAt must be yyyy-MM-dd HH:mm:ss");
        }
    }

    @Override
    public Notification save(NotificationDTO notificationDTO) {
        return save(notificationDTO, null);
    }

    /** recipientType is set by the server only (never from a request body); null means a learner when one is named. */
    private Notification save(NotificationDTO notificationDTO, String recipientType) {
        Notification notification = new Notification();
        setNotificationFields(notification, notificationDTO);
        notification.setRecipientType(recipientType);
        notification.setIsDeleted(notificationDTO.isDeleted());
        ensureNotificationType(notification);
        // M2: an optional "send later" timestamp. Only a *future* time schedules -- a past or
        // absent one means deliver now, which is what every caller of this method did before.
        java.time.LocalDateTime scheduledAt = parseScheduledAt(notificationDTO.getScheduledAt());
        boolean scheduled = scheduledAt != null && scheduledAt.isAfter(java.time.LocalDateTime.now());
        if (scheduled) {
            notification.setScheduledAt(scheduledAt);
            notification.setDeliveryStatus(DELIVERY_SCHEDULED);
        } else {
            notification.setDeliveryStatus(DELIVERY_SENT);
            notification.setDeliveredAt(java.time.LocalDateTime.now());
        }
        Notification saved = notificationRepository.save(notification);
        // Push to all connected SSE clients for this classId. A scheduled notification must not
        // be broadcast now -- the release job broadcasts it when it comes due, and the
        // recipient-facing repository queries hide it until then.
        if (!scheduled && saved.getClassId() > 0) {
            try {
                NotificationResponseDTO dto = new NotificationResponseDTO(saved);
                if (saved.getCourseId() != 0) {
                    courseRepository.findById(saved.getCourseId())
                            .ifPresent(c -> saved.setCourseSlug(c.getSlug()));
                }
                sseEmitterRegistry.deliver(saved.getClassId(), saved.getLearnerId(), dto);
            } catch (Exception e) {
                logger.warn("SSE broadcast failed for classId {}: {}", saved.getClassId(), e.getMessage());
            }
        }
        return saved;
    }

    @Override
    public List<Notification> findAll() {
        return notificationRepository.findAllActive();
    }

    @Override
    public org.springframework.data.domain.Page<Notification> findAllPaged(int pageNo, int pageSize) {
        int size = Math.min(Math.max(pageSize, 1), 200);
        return notificationRepository.findAllActivePaged(PageRequest.of(Math.max(pageNo, 0), size));
    }

    @Override
    public org.springframework.data.domain.Page<Notification> findAllPagedScoped(Integer orgId, Integer collegeId, int pageNo, int pageSize) {
        int size = Math.min(Math.max(pageSize, 1), 200);
        org.springframework.data.domain.Pageable pageable = PageRequest.of(Math.max(pageNo, 0), size);
        if (collegeId != null) {
            return notificationRepository.findAllActivePagedByCollegeScope(collegeId, pageable);
        }
        if (orgId != null) {
            return notificationRepository.findAllActivePagedByOrgScope(orgId, pageable);
        }
        // Global mode: intentionally unscoped
        return notificationRepository.findAllActivePaged(pageable);
    }

    @Override
    public Optional<Notification> findById(Integer id) {
        return notificationRepository.findById(id);
    }

    @Override
    public List<Notification> fetch(int classId, int courseId) {
        List<Notification> notifications = notificationRepository.fetch(classId, courseId);
        setCourseSlugs(notifications);
        return notifications;
    }

    @Override
    public List<Notification> fetch(int classId, int courseId, Integer learnerId) {
        List<Notification> notifications = (learnerId != null && learnerId > 0)
                ? notificationRepository.fetchForLearner(classId, courseId, learnerId)
                : notificationRepository.fetch(classId, courseId);
        setCourseSlugs(notifications);
        return notifications;
    }

    @Override
    public Notification updateNotification(Integer id, NotificationDTO notificationDTO) {
        return notificationRepository.findById(id).map(notification -> {
            Integer previousRecipient = notification.getLearnerId();
            setNotificationFields(notification, notificationDTO);
            // An edit through the API can only address a learner; a faculty notice keeps its type only while its recipient stays.
            if (!java.util.Objects.equals(previousRecipient, notification.getLearnerId())) {
                notification.setRecipientType(null);
            }
            Notification updated = notificationRepository.save(notification);
            if (updated.getClassId() > 0) {
                try {
                    sseEmitterRegistry.deliver(updated.getClassId(), updated.getLearnerId(), new NotificationResponseDTO(updated));
                } catch (Exception e) {
                    logger.warn("SSE broadcast failed for updated notification classId {}: {}", updated.getClassId(), e.getMessage());
                }
            }
            return updated;
        }).orElseThrow(() -> new RuntimeException("Notification not found with id " + id));
    }

    @Override
    public void deleteNotification(int notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            notificationRepository.deleteNotification(notificationId);
            if (n.getClassId() > 0) {
                try {
                    java.util.Map<String, Object> deleteEvent = new java.util.HashMap<>();
                    deleteEvent.put("type", "notification_deleted");
                    deleteEvent.put("id", notificationId);
                    sseEmitterRegistry.deliver(n.getClassId(), n.getLearnerId(), deleteEvent);
                } catch (Exception e) {
                    logger.warn("SSE broadcast failed for deleted notification classId {}: {}", n.getClassId(), e.getMessage());
                }
            }
        });
        // Fallback if not found (already deleted)
        notificationRepository.deleteNotification(notificationId);
    }

    @Override
    public List<Notification> getNotificationsByClassId(int classId) {
        List<Notification> notifications = notificationRepository.getNotificationsByClassId(classId);
        setCourseSlugs(notifications);
        return notifications;
    }

    @Override
    public List<Notification> getNotificationsByClassId(int classId, Integer learnerId) {
        List<Notification> notifications = (learnerId != null && learnerId > 0)
                ? notificationRepository.getNotificationsByClassIdForLearner(classId, learnerId)
                : notificationRepository.getNotificationsByClassId(classId);
        setCourseSlugs(notifications);
        return notifications;
    }

    private static final int DEFAULT_PAGE_SIZE = 100;
    private static final int MAX_PAGE_SIZE = 500;

    @Override
    public List<NotificationResponseDTO> getNotificationsByClassIdAsDtos(int classId, Integer page, Integer size) {
        return getNotificationsByClassIdAsDtos(classId, null, page, size);
    }

    @Override
    public List<NotificationResponseDTO> getNotificationsByClassIdAsDtos(int classId, Integer learnerId, Integer page, Integer size) {
        List<Notification> notifications;
        if (page != null && size != null) {
            int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
            notifications = (learnerId != null && learnerId > 0)
                    ? notificationRepository.getNotificationsByClassIdForLearner(classId, learnerId, PageRequest.of(page, safeSize))
                    : notificationRepository.getNotificationsByClassId(classId, PageRequest.of(page, safeSize));
        } else {
            // Default to first page at DEFAULT_PAGE_SIZE to avoid loading entire table into memory
            notifications = (learnerId != null && learnerId > 0)
                    ? notificationRepository.getNotificationsByClassIdForLearner(classId, learnerId, PageRequest.of(0, DEFAULT_PAGE_SIZE))
                    : notificationRepository.getNotificationsByClassId(classId, PageRequest.of(0, DEFAULT_PAGE_SIZE));
        }
        setCourseSlugs(notifications);
        return notifications.stream().map(NotificationResponseDTO::new).collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponseDTO> getNotificationsForRecipientAsDtos(int recipientId, String recipientType, Integer page, Integer size) {
        int safePage = (page != null && page >= 0) ? page : 0;
        int safeSize = (size != null) ? Math.min(Math.max(1, size), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
        String type = Notification.RECIPIENT_FACULTY.equals(recipientType) ? Notification.RECIPIENT_FACULTY : Notification.RECIPIENT_LEARNER;
        List<Notification> notifications = notificationRepository.findByRecipientId(recipientId, type, PageRequest.of(safePage, safeSize));
        setCourseSlugs(notifications);
        return notifications.stream().map(NotificationResponseDTO::new).collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponseDTO> fetchAsDtos(int classId, int courseId) {
        return fetchAsDtos(classId, courseId, null);
    }

    @Override
    public List<NotificationResponseDTO> fetchAsDtos(int classId, int courseId, Integer learnerId) {
        List<Notification> notifications = (learnerId != null && learnerId > 0)
                ? notificationRepository.fetchForLearner(classId, courseId, learnerId)
                : notificationRepository.fetch(classId, courseId);
        setCourseSlugs(notifications);
        return notifications.stream().map(NotificationResponseDTO::new).collect(Collectors.toList());
    }

    /**
     * If notificationType is still null after field mapping, infer it:
     * courseId > 0 → COURSE (with course name as context if missing),
     * otherwise → GENERAL (admin announcement).
     */
    private void ensureNotificationType(Notification notification) {
        if (notification.getNotificationType() != null) return;
        if (notification.getCourseId() > 0) {
            notification.setNotificationType("COURSE");
            if (notification.getContextLabel() == null) {
                try {
                    courseRepository.findById(notification.getCourseId()).ifPresent(course -> {
                        String name = course.getCourseName() != null ? course.getCourseName() : course.getShortTitle();
                        if (name != null && !name.isBlank()) {
                            notification.setContextLabel(name);
                        }
                    });
                } catch (Exception ignored) { }
            }
        } else {
            notification.setNotificationType("GENERAL");
        }
    }

    /** Batch-load course slugs for notifications to avoid N+1. */
    private void setCourseSlugs(List<Notification> notifications) {
        if (notifications == null || notifications.isEmpty()) return;
        List<Integer> courseIds = notifications.stream()
                .map(Notification::getCourseId)
                .filter(id -> id != 0)
                .distinct()
                .collect(Collectors.toList());
        if (courseIds.isEmpty()) return;
        List<Course> courses = courseRepository.findAllById(courseIds);
        Map<Integer, String> slugById = courses.stream()
                .filter(c -> c != null && c.getSlug() != null)
                .collect(Collectors.toMap(Course::getId, Course::getSlug, (a, b) -> a));
        Map<Integer, String> nameById = courses.stream()
                .filter(c -> c != null && c.getCourseName() != null)
                .collect(Collectors.toMap(Course::getId, Course::getCourseName, (a, b) -> a));
        for (Notification n : notifications) {
            if (n.getCourseId() != 0) {
                n.setCourseSlug(slugById.get(n.getCourseId()));
                n.setCourseName(nameById.get(n.getCourseId()));
            }
        }
    }
    
    @Override
    public Notification createFacultyNotification(String title, String body, Integer facultyId, String notificationType, String contextLabel) {
        if (facultyId == null || facultyId <= 0) {
            throw new IllegalArgumentException("facultyId is required");
        }
        NotificationDTO dto = new NotificationDTO();
        dto.setTitle(title != null ? title : "");
        dto.setHtmlContent(body != null ? body : "");
        dto.setClassId(0);
        dto.setCourseId(0);
        dto.setLearnerId(facultyId);
        dto.setNotificationType(notificationType);
        dto.setContextLabel(contextLabel);
        dto.setRead(false);
        dto.setDeleted(false);
        return save(dto, Notification.RECIPIENT_FACULTY);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId) {
        return createNotification(title, body, classId, courseId, null, null, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId, Integer learnerId) {
        return createNotification(title, body, classId, courseId, learnerId, null, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           String notificationType, String contextLabel) {
        return createNotification(title, body, classId, courseId, null, notificationType, contextLabel, null, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           Integer learnerId, String notificationType, String contextLabel) {
        return createNotification(title, body, classId, courseId, learnerId, notificationType, contextLabel, null, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId) {
        return createNotification(title, body, classId, courseId, null, notificationType, contextLabel, applicationId, jobId, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           Integer learnerId, String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId) {
        return createNotification(title, body, classId, courseId, learnerId, notificationType, contextLabel, applicationId, jobId, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId, String assessmentUrl) {
        return createNotification(title, body, classId, courseId, null, notificationType, contextLabel,
                applicationId, jobId, assessmentUrl, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           Integer learnerId, String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId, String assessmentUrl) {
        return createNotification(title, body, classId, courseId, learnerId, notificationType, contextLabel,
                applicationId, jobId, assessmentUrl, null);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId, String assessmentUrl, Integer interviewId) {
        return createNotification(title, body, classId, courseId, null, notificationType, contextLabel,
                applicationId, jobId, assessmentUrl, interviewId);
    }

    @Override
    public Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                           Integer learnerId, String notificationType, String contextLabel,
                                           Integer applicationId, Integer jobId, String assessmentUrl, Integer interviewId) {
        NotificationDTO dto = new NotificationDTO();
        dto.setTitle(title != null ? title : "");
        dto.setHtmlContent(body != null ? body : "");
        dto.setClassId(classId != null ? classId : 0);
        dto.setCourseId(courseId != null ? courseId : 0);
        dto.setLearnerId(learnerId);
        dto.setNotificationType(notificationType);
        dto.setContextLabel(contextLabel);
        dto.setApplicationId(applicationId);
        dto.setJobId(jobId);
        dto.setAssessmentUrl(assessmentUrl);
        dto.setInterviewId(interviewId);
        dto.setRead(false);
        dto.setDeleted(false);
        return save(dto);
    }
}

