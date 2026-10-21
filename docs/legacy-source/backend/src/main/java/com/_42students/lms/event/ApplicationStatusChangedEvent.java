package com._42students.lms.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Event published when a job application status changes.
 * Processed after the main transaction commits to avoid lock contention.
 */
@Getter
@AllArgsConstructor
public class ApplicationStatusChangedEvent {

    private final Integer applicationId;
    private final String oldStatus;
    private final String newStatus;
    private final Integer changedBy;
    private final String rejectionReason;
}

