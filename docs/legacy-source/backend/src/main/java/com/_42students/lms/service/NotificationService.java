package com._42students.lms.service;

import com._42students.lms.dto.request.NotificationDTO;
import com._42students.lms.dto.response.NotificationResponseDTO;
import com._42students.lms.model.Notification;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;


public interface NotificationService {
    Notification save(NotificationDTO notificationDTO);

    List<Notification> findAll();

    /** NC-17: DB-level paginated fetch to prevent loading all rows into memory */
    Page<Notification> findAllPaged(int pageNo, int pageSize);

    /** Superadmin scoped fetch: respects orgId/collegeId from JWT scope. */
    Page<Notification> findAllPagedScoped(Integer orgId, Integer collegeId, int pageNo, int pageSize);

    Optional<Notification> findById(Integer id);

    List<Notification> fetch(int classId, int courseId);

    List<Notification> fetch(int classId, int courseId, Integer learnerId);

    Notification updateNotification(Integer id, NotificationDTO notificationDTO);

    void deleteNotification(int notificationId);

    List<Notification> getNotificationsByClassId(int classId);

    List<Notification> getNotificationsByClassId(int classId, Integer learnerId);

    /**
     * Get notifications for a class as DTOs (created_at as array). Batch-loads course slugs to avoid N+1.
     * When page and size are null, returns all up to default limit. When set, returns that page.
     */
    List<NotificationResponseDTO> getNotificationsByClassIdAsDtos(int classId, Integer page, Integer size);

    List<NotificationResponseDTO> getNotificationsByClassIdAsDtos(int classId, Integer learnerId, Integer page, Integer size);

    /**
     * Get notifications for class+course as DTOs. Batch-loads course slugs.
     */
    List<NotificationResponseDTO> fetchAsDtos(int classId, int courseId);

    List<NotificationResponseDTO> fetchAsDtos(int classId, int courseId, Integer learnerId);

    /**
     * Cross-class notifications for a single recipient: learner_id holds the id and recipient_type says whose
     * (Notification.RECIPIENT_LEARNER or RECIPIENT_FACULTY), so a mentor and a student with the same number never see each
     * other's. Lets a mentor see notifications from classless project workspaces, which have no classId to scope a call to.
     */
    List<NotificationResponseDTO> getNotificationsForRecipientAsDtos(int recipientId, String recipientType, Integer page, Integer size);

    /** A personal notice for one faculty member or mentor (class 0, course 0): only their own recipient feed shows it. */
    Notification createFacultyNotification(String title, String body, Integer facultyId, String notificationType, String contextLabel);

    /**
     * Create in-app notification with given title and body (used by NotificationDispatcherService).
     * @param title notification title
     * @param body notification message body
     * @param classId target class ID (can be 0 or null)
     * @param courseId target course ID (can be 0 or null)
     * @return created notification
     */
    Notification createNotification(String title, String body, Integer classId, Integer courseId);

    Notification createNotification(String title, String body, Integer classId, Integer courseId, Integer learnerId);

    /**
     * Create in-app notification with type and context label.
     * @param title notification title
     * @param body notification message body
     * @param classId target class ID (can be 0 or null)
     * @param courseId target course ID (can be 0 or null)
     * @param notificationType "JOB", "COURSE", or "SYSTEM"
     * @param contextLabel human-readable label (course name, company name, etc.)
     * @return created notification
     */
    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    String notificationType, String contextLabel);

    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    Integer learnerId, String notificationType, String contextLabel);

    /**
     * Create in-app notification with optional application/job deep link (Gap 8.7).
     */
    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId);

    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    Integer learnerId, String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId);

    /**
     * Create in-app notification with optional application/job deep link and assessment URL (21.1.5).
     */
    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId, String assessmentUrl);

    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    Integer learnerId, String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId, String assessmentUrl);

    /**
     * Create in-app notification with interview deep link (Gap #12).
     */
    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId, String assessmentUrl, Integer interviewId);

    Notification createNotification(String title, String body, Integer classId, Integer courseId,
                                    Integer learnerId, String notificationType, String contextLabel,
                                    Integer applicationId, Integer jobId, String assessmentUrl, Integer interviewId);
}

