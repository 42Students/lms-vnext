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
import java.time.LocalDateTime;

/**
 * A result staged for one applicant in one round, waiting for the TPO (or a per-drive
 * auto-apply toggle) to apply it. Never shown to the student until applied. See
 * TPO V1 - Locked.docx §5 "Results staging".
 */
@Entity
@Table(name = "round_result")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class RoundResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Integer applicationId;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    /** PASS|FAIL|ABSENT|HOLD (HOLD = ranked waitlist). */
    @Column(name = "outcome", nullable = false)
    private String outcome;

    @Column(name = "waitlist_rank")
    private Integer waitlistRank;

    @Column(name = "score")
    private Double score;

    /** APTITUDE|TECHNICAL|COMMUNICATION|OTHER — feeds readiness; never shown outside the college. */
    @Column(name = "reason_category")
    private String reasonCategory;

    /** Company-private when source = PANELIST. Never exported. */
    @Column(name = "comment")
    private String comment;

    /** recruiter|PANELIST|DRIVE_DAY|EXCEL|TPO */
    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "submitted_by_type", nullable = false)
    private String submittedByType;

    @Column(name = "submitted_by_id")
    private Integer submittedById;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /** Null = still staged. */
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "applied_by")
    private Integer appliedBy;

    @Column(name = "superseded_by")
    private Long supersededBy;
}
