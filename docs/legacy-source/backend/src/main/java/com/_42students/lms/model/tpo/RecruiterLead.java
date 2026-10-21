package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Slim RecruiterLeads V1. Manual stages are NEW/CONTACTED/NOT_NOW; the derived stages (Invited, Joined,
 * Drive planned, Recruited) are worked out from facts at read time — never stored, so they can't
 * drift. See TPO V1 - Locked.docx §3.
 */
@Entity
@Table(name = "recruiter_lead") // "lead" is a reserved word in MySQL 8 (the LEAD() window function); the table was tpo_lead before V193
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class RecruiterLead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "recruiter_id")
    private Long recruiterId;

    /** Set when the placement cell posted a drive and invited this person to review it (N5 c): the drive is theirs once they join. */
    @Column(name = "review_job_id")
    private Integer reviewJobId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "designation")
    private String designation;

    @Column(name = "email_norm")
    private String emailNorm;

    @Column(name = "phone_norm")
    private String phoneNorm;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_logo")
    private String companyLogo;

    @Column(name = "owner_faculty_id")
    private Integer ownerFacultyId;

    /** NEW|CONTACTED|NOT_NOW */
    @Column(name = "manual_stage", nullable = false)
    private String manualStage = "NEW";

    @Column(name = "not_now_reason")
    private String notNowReason;

    @Column(name = "not_now_until")
    private LocalDate notNowUntil;

    @Column(name = "source")
    private String source;

    /** SHA-256 of the live invite token. Never serialised: the list endpoints return this entity. */
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "invite_token_hash")
    private String inviteTokenHash;

    @Column(name = "invite_sent_at")
    private LocalDateTime inviteSentAt;

    @Column(name = "invite_clicked_at")
    private LocalDateTime inviteClickedAt;

    @Column(name = "invite_reminder_sent_at")
    private LocalDateTime inviteReminderSentAt;

    @Column(name = "invite_bounced_at")
    private LocalDateTime inviteBouncedAt;

    @Column(name = "unsubscribed_at")
    private LocalDateTime unsubscribedAt;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
