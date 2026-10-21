package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 8.5 / 21.2.6: Saved jobs - learner bookmark for later.
 * Unique per (learner_id, job_id).
 */
@Data
@Entity
@Table(name = "learner_saved_job", uniqueConstraints = @UniqueConstraint(columnNames = {"learner_id", "job_id"}))
public class LearnerSavedJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    @Column(name = "job_id", nullable = false)
    private Integer jobId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", insertable = false, updatable = false)
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", insertable = false, updatable = false)
    private Job job;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

