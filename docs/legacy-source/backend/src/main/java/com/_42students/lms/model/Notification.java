package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "notification")
@Table(name = "notification")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class Notification extends BaseModel {
    @Column(name = "message")
    private String message;
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "class_id")
    private int classId;
    
    @Column(name = "course_id")
    private int courseId;

    /** The one person this is for, when it is personal: a learner id, or a faculty id when recipientType is FACULTY. */
    @Column(name = "learner_id")
    private Integer learnerId;

    /**
     * Whose id learner_id holds: LEARNER or FACULTY (mentors, faculty). Learners and faculty are numbered separately, so without
     * it faculty #12 and student #12 saw each other's notices (full test run, 15 Oct 2026; V227). Null when nobody is named.
     */
    @Column(name = "recipient_type", length = 10)
    private String recipientType;

    public static final String RECIPIENT_LEARNER = "LEARNER";
    public static final String RECIPIENT_FACULTY = "FACULTY";

    /** Every write path (service, scheduler, seed) gets a type: a named recipient is a learner unless the sender said faculty. */
    @PrePersist
    @PreUpdate
    void defaultRecipientType() {
        if (learnerId == null || learnerId <= 0) {
            recipientType = null;
        } else if (recipientType == null) {
            recipientType = RECIPIENT_LEARNER;
        }
    }

    @Transient
    private String courseSlug; // Populated for API response; not persisted

    @Transient
    private String courseName; // Populated for API response (LRN-N-04); not persisted
    @Column(name = "is_read")
    private boolean isRead;

    @Column(name = "notification_type", length = 20)
    private String notificationType;

    @Column(name = "context_label")
    private String contextLabel;

    /** Phase 4 - Gap 8.7: Deep link to application when notification_type is JOB */
    @Column(name = "application_id")
    private Integer applicationId;

    @Column(name = "job_id")
    private Integer jobId;

    /** 21.1.5: Assessment URL for JOB_ASSESSMENT_INVITE - Take Assessment CTA */
    @Column(name = "assessment_url", length = 2048)
    private String assessmentUrl;

    /** Gap #12: Deep link to specific interview (e.g. /learn/interviews?highlight=interviewId) */
    @Column(name = "interview_id")
    private Integer interviewId;

    /** IDOR fix: tracks which faculty created this notification so delete is restricted to owner or admin */
    @Column(name = "creator_faculty_id")
    private Integer creatorFacultyId;

    /**
     * M2: when to release this notification to its recipients. Null (every pre-existing row, and
     * every notification composed without a schedule) means "immediately", so the recipient-facing
     * queries treat null and a past timestamp identically.
     */
    @Column(name = "scheduled_at")
    private java.time.LocalDateTime scheduledAt;

    /** SCHEDULED (not yet due), SENT, or FAILED. Null on rows created before scheduling existed. */
    @Column(name = "delivery_status", length = 20)
    private String deliveryStatus;

    /** Why the last release attempt failed, for the resend control. Truncated to fit the column. */
    @Column(name = "delivery_error", length = 500)
    private String deliveryError;

    @Column(name = "delivered_at")
    private java.time.LocalDateTime deliveredAt;
}

