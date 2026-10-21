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
import javax.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * An offer, separate from job_application.application_status. Releasing an offer (status ->
 * RELEASED) is the only thing that sets the application to OFFERED, so the existing learner
 * accept/decline flow (JobServiceImpl.respondToOffer) keeps working unchanged. See
 * TPO V1 - Locked.docx §5 "Offers".
 */
@Entity
@Table(name = "job_offer")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Integer applicationId;

    /** LOI | OFFER */
    @Column(name = "kind", nullable = false)
    private String kind = "OFFER";

    @Column(name = "role_option_name")
    private String roleOptionName;

    @Column(name = "ctc_lpa")
    private BigDecimal ctcLpa;

    @Column(name = "fixed_lpa")
    private BigDecimal fixedLpa;

    @Column(name = "variable_lpa")
    private BigDecimal variableLpa;

    @Column(name = "joining_bonus_lpa")
    private BigDecimal joiningBonusLpa;

    // bond_months / bond_amount: the columns stay (never filled); the bond was removed on 8 Oct 2026.

    /** Null = "to be announced". */
    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "respond_by")
    private LocalDateTime respondBy;

    @Column(name = "letter_url")
    private String letterUrl;

    /** SELECTED|PENDING_VERIFICATION|RELEASED|ACCEPTED|DECLINED|EXPIRED|WITHDRAWN|REVOKED */
    @Column(name = "status", nullable = false)
    private String status = "SELECTED";

    /** IN_APP | EXTERNAL_IMPORT */
    @Column(name = "acceptance_channel")
    private String acceptanceChannel;

    /** For EXTERNAL_IMPORT: the 48h window the student can dispute in before the cascade runs. */
    @Column(name = "accepted_disputable_until")
    private LocalDateTime acceptedDisputableUntil;

    /** JOINED|DEFERRED|NOT_JOINED */
    @Column(name = "joining_status")
    private String joiningStatus;

    /** Groups every application row this offer's accept auto-withdrew (for reversal). */
    @Column(name = "cascade_id")
    private String cascadeId;

    @Column(name = "revoke_reason")
    private String revokeReason;

    /** TPO | recruiter */
    @Column(name = "created_by_type", nullable = false)
    private String createdByType = "TPO";

    @Column(name = "created_by_id")
    private Integer createdById;

    @Column(name = "verified_by")
    private Integer verifiedBy;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
