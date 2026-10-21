package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import com._42students.lms.model.Notification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Notification payload for API responses. created_at is [year, month (0-indexed), day] for frontend compatibility.
 */
@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class NotificationResponseDTO {
    private int id;
    private String message;
    private String title;
    private int classId;
    private int courseId;
    private Integer learnerId;
    private String courseSlug;
    /** Course name resolved in one batch with the slug, so the page no longer looks each course up (LRN-N-04). */
    private String courseName;
    private boolean isRead;
    private List<Integer> created_at;
    private String notificationType;
    private String contextLabel;
    /** Gap 8.7: Deep link params for job notifications */
    private Integer applicationId;
    private Integer jobId;
    /** 21.1.5: Assessment URL for Take Assessment CTA */
    private String assessmentUrl;
    /** Gap #12: Deep link to interview */
    private Integer interviewId;

    /**
     * M2 delivery state. Present so the admin console can show and act on a scheduled or failed
     * notification: this DTO is what the per-class endpoint returns, and a college admin reads
     * that endpoint rather than the super-admin-only /fetchAll.
     *
     * <p>A learner never sees anything but a delivered notification -- the learner-facing
     * repository queries filter on scheduled_at -- so these fields read as SENT for them.
     */
    private String deliveryStatus;
    private String scheduledAt;
    private String deliveryError;

    public NotificationResponseDTO(Notification n) {
        if (n == null) return;
        this.id = n.getId();
        this.message = n.getMessage();
        this.title = n.getTitle();
        this.classId = n.getClassId();
        this.courseId = n.getCourseId();
        this.learnerId = n.getLearnerId();
        this.courseSlug = n.getCourseSlug();
        this.courseName = n.getCourseName();
        this.isRead = n.isRead();
        this.notificationType = n.getNotificationType();
        this.contextLabel = n.getContextLabel();
        this.applicationId = n.getApplicationId();
        this.jobId = n.getJobId();
        this.assessmentUrl = n.getAssessmentUrl();
        this.interviewId = n.getInterviewId();
        this.deliveryStatus = n.getDeliveryStatus();
        this.scheduledAt = n.getScheduledAt() != null ? n.getScheduledAt().toString() : null;
        this.deliveryError = n.getDeliveryError();
        LocalDateTime createdAt = n.getCreatedAt();
        if (createdAt != null) {
            this.created_at = new ArrayList<>();
            this.created_at.add(createdAt.getYear());
            this.created_at.add(createdAt.getMonthValue() - 1);
            this.created_at.add(createdAt.getDayOfMonth());
        }
    }
}

