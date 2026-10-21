package com._42students.lms.service;

import com._42students.lms.model.JobApplicationStatusHistory;

import java.util.List;

/**
 * Phase 4 - Gap 8.2: Service for recording and retrieving application status history.
 */
public interface JobApplicationStatusHistoryService {

    /**
     * Record a status change. Call after persisting the application update.
     * No-op if oldStatus equals newStatus (caller should avoid invoking in that case).
     */
    void recordStatusChange(Integer applicationId, String oldStatus, String newStatus, Integer changedBy, String rejectionReason);

    /**
     * Get timeline for an application, ordered by changedAt ascending.
     * Returns empty list if application not found or no history.
     */
    List<JobApplicationStatusHistory> getHistoryForApplication(Integer applicationId);
}

