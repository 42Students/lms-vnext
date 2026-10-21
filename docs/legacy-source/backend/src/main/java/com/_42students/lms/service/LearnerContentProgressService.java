package com._42students.lms.service;

import com._42students.lms.dto.request.ContentProgressSaveRequest;
import com._42students.lms.dto.response.ContentProgressResponse;

import java.util.List;

/**
 * Save and retrieve learner progress for lesson content (e.g. video position, completed).
 */
public interface LearnerContentProgressService {

    /**
     * Save or update progress for the given learner and request (lesson content must exist and be accessible).
     */
    ContentProgressResponse saveProgress(int learnerId, ContentProgressSaveRequest request);

    /**
     * Get progress for one lesson content. Returns NOT_STARTED if no record.
     */
    ContentProgressResponse getProgress(int learnerId, int lessonContentId);

    /**
     * Get progress for multiple lesson contents. Only returns entries for content that has progress or is requested;
     * for requested IDs with no record, returns NOT_STARTED with 0 position.
     */
    List<ContentProgressResponse> getProgressBulk(int learnerId, List<Integer> lessonContentIds);
}

