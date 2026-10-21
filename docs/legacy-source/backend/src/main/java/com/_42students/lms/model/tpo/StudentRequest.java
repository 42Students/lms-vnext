package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * One queue for every student-to-TPO request: withdrawal, offer extension, registration change,
 * absence dispute, correction, external offer, PAP. Shown on Home as a single "Requests" card
 * type. See TPO V1 - Locked.docx §6.
 */
@Entity
@Table(name = "student_request")
@TypeDefs({@TypeDef(name = "json", typeClass = JsonType.class)})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class StudentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    /** WITHDRAWAL|OFFER_EXTENSION|REGISTRATION_CHANGE|ABSENCE_DISPUTE|CORRECTION|EXTERNAL_OFFER|PAP */
    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "job_id")
    private Integer jobId;

    @Column(name = "application_id")
    private Integer applicationId;

    @Type(type = "json")
    @Column(name = "payload_json", columnDefinition = "json")
    private Object payloadJson;

    /** PENDING|APPROVED|REJECTED|AUTO_APPROVED */
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "reason")
    private String reason;

    @Column(name = "decided_by")
    private Integer decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decision_reason")
    private String decisionReason;

    @Column(name = "escalate_at")
    private LocalDateTime escalateAt;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
