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

/** A named-student include ("company agreed") or exclude, logged with a reason. */
@Entity
@Table(name = "job_eligibility_override")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class JobEligibilityOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Integer jobId;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    /** INCLUDE | EXCLUDE */
    @Column(name = "override_type", nullable = false)
    private String overrideType;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "created_by")
    private Integer createdBy;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
