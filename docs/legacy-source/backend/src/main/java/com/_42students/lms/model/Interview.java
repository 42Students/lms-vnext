package com._42students.lms.model;

import com._42students.lms.config.UtcLocalDateTimeSerializer;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Phase 5: Interview entity — organization-scoped interview scheduling.
 * API timezone contract: scheduledDate is stored and compared in UTC.
 * Clients should send ISO-8601 timestamps in UTC (e.g. with 'Z' suffix).
 * Note: createdAt, updatedAt, isDeleted, and id are inherited from BaseModel.
 */
@Entity
@Table(name = "interview")
@TypeDefs({
    @TypeDef(name = "json", typeClass = JsonType.class)
})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class Interview extends BaseModel {

    @NotNull(message = "organization_id is required")
    @Column(name = "organization_id", nullable = false)
    private Integer organizationId; // Phase 5: Organization scoping

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id", nullable = false)
    private JobApplication jobApplication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @Column(name = "interview_type")
    private String interviewType; // SCREENING, TECHNICAL, recruiter, MANAGERIAL, FINAL

    @Column(name = "interview_status")
    private String interviewStatus = "SCHEDULED"; // SCHEDULED, CONFIRMED, RESCHEDULE_REQUESTED, COMPLETED, CANCELLED, NO_SHOW

    @NotNull(message = "scheduled_date is required")
    @Column(name = "scheduled_date", nullable = false)
    @JsonSerialize(using = UtcLocalDateTimeSerializer.class)
    private LocalDateTime scheduledDate;

    /**
     * Hour slot — kept as nullable column for backward compatibility after V48 dropped the unique index.
     * No longer written by application code. Will be dropped in V49.
     * @deprecated Overlap is now enforced at application level in InterviewServiceImpl.
     */
    @Deprecated
    @Column(name = "scheduled_date_hour")
    private LocalDateTime scheduledDateHour;

    @Column(name = "interview_mode")
    private String interviewMode; // ONLINE, OFFLINE

    @Column(name = "location")
    private String location; // Physical location or meeting link

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "duration_minutes")
    private Integer durationMinutes; // Persisted for calendar block sizing; default 60 when not set

    @Column(name = "round_description", columnDefinition = "TEXT")
    private String roundDescription; // Mandatory when scheduling: what this round is about (for candidate context in notifications)

    @Column(name = "created_by")
    private Integer createdBy; // Admin user ID who scheduled

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;

    /**
     * Interview feedback (after round completion). Hidden from learners — admin/faculty only.
     * SECURITY FIX (this audit round): these fields used to carry @JsonIgnore directly on the
     * entity, which made them invisible not just to learners but also to every admin-facing
     * response that serializes the raw Interview entity (getInterviewsForOrganization/
     * getInterviewsForCollege, submitInterviewFeedback's own response) — the exact responses
     * InterviewFeedbackForm.js reads to compute its "already submitted" check, which as a result
     * could never fire, letting an admin resubmit feedback indefinitely. Learner-facing endpoints
     * never serialize this entity directly — they exclusively return
     * LearnerApplicationWithInterviewsDTO.LearnerInterviewView, a strict allowlist DTO that never
     * copies these fields (see its class comment) — so it, not @JsonIgnore on the entity, is what
     * actually keeps feedback hidden from learners. Removing @JsonIgnore here is therefore safe.
     */
    @Column(name = "feedback_rating")
    private Integer feedbackRating; // 1-5

    @Column(name = "feedback_comments", columnDefinition = "TEXT")
    private String feedbackComments;

    /**
     * Student V1 §7: the learner's reason, note and preferred time windows from their reschedule
     * request — {reason, note, windows}. Null for interviews rescheduled before this existed, or
     * an admin-initiated reschedule (only the learner's own request populates it). Admin-facing
     * only: never copied by LearnerApplicationWithInterviewsDTO.LearnerInterviewView, same as
     * feedbackComments above — the learner already knows what they typed.
     */
    @Type(type = "json")
    @Column(name = "reschedule_request_json", columnDefinition = "json")
    private Object rescheduleRequestJson;

    /**
     * Student V1 §7 "Changed slot" badge: the value scheduledDate held before the most recent
     * reschedule, and when that change happened. Both null once the student re-confirms (see
     * confirmInterview) or if this interview was never rescheduled. Deliberately learner-facing
     * (unlike feedbackComments/rescheduleRequestJson above) — LearnerInterviewView does copy this.
     */
    @Column(name = "previous_scheduled_date")
    private LocalDateTime previousScheduledDate;

    @Column(name = "scheduled_date_changed_at")
    private LocalDateTime scheduledDateChangedAt;

    /**
     * Legacy boolean column — kept nullable for rollback safety after V48 migration.
     * Replaced by feedbackRecommendAction. Will be dropped in V49.
     * @deprecated Use feedbackRecommendAction instead.
     */
    @Deprecated
    @Column(name = "feedback_recommend")
    private Boolean feedbackRecommend;

    /**
     * Recommendation action after interview round.
     * Valid values: PROCEED_NEXT_ROUND, HIRE, REJECT, HOLD.
     * Null = not yet submitted.
     */
    @Column(name = "feedback_recommend_action")
    private String feedbackRecommendAction;

    @Column(name = "feedback_submitted_at")
    private LocalDateTime feedbackSubmittedAt;

    @Column(name = "feedback_submitted_by")
    private Integer feedbackSubmittedBy; // Admin user ID

    /**
     * Free-text name(s) of the interviewer(s) conducting this round (comma-separate for a panel).
     * Previously nothing recorded who actually conducted a round — only feedbackSubmittedBy
     * (which may be a different admin logging feedback on the interviewer's behalf), so "my
     * interviews" queues and per-interviewer workload/accountability reporting were impossible.
     */
    @Column(name = "interviewer_name", length = 255)
    private String interviewerName;

    /** Computed 1-based round index when returning lists (by scheduledDate order). Not persisted. */
    @Transient
    private Integer roundIndex;

    // Note: createdAt, updatedAt, isDeleted are inherited from BaseModel
}



