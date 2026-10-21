package com._42students.lms.model;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Phase 4 - Gap 8.2: Audit trail for JobApplication status changes.
 * Populated on each status transition; supports timeline UI and transparency.
 */
@Entity
@Table(name = "job_application_status_history")
@Getter
@Setter
public class JobApplicationStatusHistory extends BaseModel {

    @Column(name = "application_id", nullable = false)
    private Integer applicationId;

    @Column(name = "old_status", length = 50)
    private String oldStatus;

    @Column(name = "new_status", length = 50, nullable = false)
    private String newStatus;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "changed_by")
    private Integer changedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}

