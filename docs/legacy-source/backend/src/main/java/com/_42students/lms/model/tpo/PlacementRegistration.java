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

@Entity
@Table(name = "placement_registration")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class PlacementRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    /** PLACEMENTS|HIGHER_STUDIES|NOT_INTERESTED (the student's own choice), or ENTREPRENEURSHIP|COMPETITIVE_EXAMS (set by the placement cell) */
    @Column(name = "choice", nullable = false)
    private String choice;

    @Column(name = "consent_version")
    private String consentVersion;

    @Column(name = "consent_at")
    private LocalDateTime consentAt;

    /** SELF|TPO|BACKFILL */
    @Column(name = "source", nullable = false)
    private String source = "SELF";

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
