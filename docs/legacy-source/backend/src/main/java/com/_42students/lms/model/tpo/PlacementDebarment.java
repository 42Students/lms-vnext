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

/** Manual only in V1 — the TPO confirms every debarment; never shown to companies. */
@Entity
@Table(name = "placement_debarment")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class PlacementDebarment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "until_date")
    private LocalDate untilDate;

    @Column(name = "until_drives")
    private Integer untilDrives;

    @Column(name = "drives_counted", nullable = false)
    private Integer drivesCounted = 0;

    @Column(name = "created_by")
    private Integer createdBy;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "lifted_at")
    private LocalDateTime liftedAt;

    @Column(name = "lifted_reason")
    private String liftedReason;

    public boolean isActive() {
        if (liftedAt != null) return false;
        if (untilDate != null) return !LocalDate.now().isAfter(untilDate);
        return untilDrives == null || drivesCounted < untilDrives;
    }
}
