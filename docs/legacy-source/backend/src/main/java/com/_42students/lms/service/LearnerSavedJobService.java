package com._42students.lms.service;

import com._42students.lms.model.Job;

import java.util.List;
import java.util.Set;

/**
 * 8.5 / 21.2.6: Saved jobs - learner bookmark for later.
 */
public interface LearnerSavedJobService {
    /**
     * Save a job for a learner (bookmark).
     * Idempotent: if already saved, no-op.
     */
    void saveJob(Integer learnerId, Integer jobId);

    /**
     * Unsave a job for a learner.
     */
    void unsaveJob(Integer learnerId, Integer jobId);

    /**
     * Check if a learner has saved a job.
     */
    boolean isSaved(Integer learnerId, Integer jobId);

    /**
     * Get set of job IDs saved by a learner.
     */
    Set<Integer> getSavedJobIds(Integer learnerId);

    /**
     * Get saved jobs for a learner (jobs that exist and are not deleted).
     */
    List<Job> getSavedJobs(Integer learnerId);
}

