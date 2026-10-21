package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_application", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"learner_id", "job_id"})
})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class JobApplication extends BaseModel {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "application_status")
    private String applicationStatus = "APPLIED"; // Phase 4: APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED

    @Column(name = "organization_id")
    private Integer organizationId; // Phase 4: Organization scoping - derived from job for performance

    @Column(name = "applied_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime appliedAt;

    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    /**
     * User ID who last updated the status (admin/recruiter)
     */
    @Column(name = "status_updated_by")
    private Integer statusUpdatedBy;

    /**
     * Application source (INTERNAL, LINKEDIN, DIRECT_LINK, etc.)
     * Tracks where the application came from for analytics
     */
    @Column(name = "source", length = 50)
    private String source;

    /**
     * Whether the applicant requested PAP (Placement Assistance Program) enrollment
     */
    @Column(name = "pap_requested", nullable = false)
    private Boolean papRequested = false;

    /**
     * Resume URL for this application (optional)
     * Can be different from learner's profile resume if uploaded during application
     */
    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl;

    /**
     * Assessment URL assigned specifically to this application. This is distinct from
     * Job.assessmentUrl: admins may use a one-off candidate/batch link without changing
     * the job-level default used for future moves to Assessment.
     */
    @Column(name = "assessment_url", columnDefinition = "TEXT")
    private String assessmentUrl;

    // Reapplying (after a withdraw) reactivates and overwrites this same row's resumeUrl in
    // place with no record of what was there before — a list of {url, replacedAt} snapshots so
    // an earlier revision isn't lost when the learner updates their resume and reapplies.
    @org.hibernate.annotations.Type(type = "json")
    @Column(name = "resume_history", columnDefinition = "json")
    private Object resumeHistory;

    /**
     * Internal notes (recruiter/placement only, not visible to learner).
     * For handover and audit.
     */
    @JsonIgnore
    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    /**
     * Rejection reason when status is REJECTED (optional).
     * Passed to notification templates for JOB_APPLICATION_REJECTED.
     */
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Withdrawing overwrites applicationStatus with "WITHDRAWN", so this preserves whatever
    // status the application was in right before that — otherwise the anti-reapply guard in
    // JobServiceImpl.applyToJob has nothing left to check a withdraw-then-reapply against.
    @Column(name = "status_before_withdrawal", length = 30)
    private String statusBeforeWithdrawal;

    // The state machine supports OFFERED->HIRED, but nothing tracked the actual offer-letter
    // document — admins had no way to attach it or record when it was sent. No e-sign/acceptance
    // workflow here (that needs a real e-sign provider); acceptance is already captured via the
    // learner's Accept/Decline action (see JobService.respondToOffer), which sets HIRED/REJECTED.
    @Column(name = "offer_letter_url", columnDefinition = "TEXT")
    private String offerLetterUrl;

    @Column(name = "offer_letter_sent_at")
    private LocalDateTime offerLetterSentAt;

    // The screening/match score is computed for every application (ScreeningServiceImpl) but was
    // never surfaced to admins — only ever used internally as a sort key. Populated by the
    // service layer from ApplicationScreening after fetching a page of applications; not a
    // persisted column.
    @Transient
    private Double screeningScore;

    // TRUST & FAIRNESS: mirrors ApplicationScreening.isPartialScore so the admin ranking UI can
    // flag scores computed from an incomplete attribute set (some attribute excluded for missing
    // data) instead of silently ranking/sorting/filtering them identically to complete scores.
    @Transient
    private Boolean isPartialScore;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;

    // ============================================
    // TPO V1 (see docs/recruiter-tpo-flows/TPO V1 - Locked.docx)
    // ============================================

    /** Which job_round this applicant is currently in; independent of applicationStatus. */
    @Column(name = "current_round_id")
    private Long currentRoundId;

    /** Company portal reference ID (e.g. TCS CT/DT number), filled in by the student. */
    @Column(name = "external_ref")
    private String externalRef;

    /** Stable, non-sequential ID handed to companies/ATS instead of the internal DB id. */
    @Column(name = "public_ref")
    private String publicRef;

    /**
     * recruiter/TPO-only note on a stage change. NEVER serialised to the learner — see
     * LearnerApplicationWithInterviewsDTO, which must never map this field.
     * {@link #getRejectionReason()} (existing column) stays the student-facing message.
     */
    // Never serialised: the learner endpoints that return this entity (applications/details, apply, offer-response) used to
    // send the placement cell's internal reason ("Weak resume") to the student. Staff screens read it through their own queries.
    @JsonIgnore
    @Column(name = "internal_reason")
    private String internalReason;

    /** SELF|PLACED_ELSEWHERE|TPO_APPROVED|INELIGIBLE|DRIVE_CANCELLED */
    @Column(name = "withdrawal_reason")
    private String withdrawalReason;

    /** "Apply on behalf" — the student did not click apply themselves. */
    @Column(name = "applied_by_college", nullable = false)
    private Boolean appliedByCollege = false;

    @Column(name = "applied_by_college_opt_out_until")
    private LocalDateTime appliedByCollegeOptOutUntil;

    /** A corrected or imported record made this applicant ineligible. Flagged for the TPO, never removed. */
    @Column(name = "ineligible_flag_at")
    private LocalDateTime ineligibleFlagAt;

    /**
     * Every application gets its company-facing id when it is saved. Only "add to drive" set one, so a student who applied
     * themselves had none: shared lists showed them with a blank id and the recruiter could not send a result or selection for them.
     */
    @PrePersist
    void assignPublicRef() {
        if (publicRef == null || publicRef.isBlank()) publicRef = newPublicRef();
    }

    public static String newPublicRef() {
        return "A" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}

