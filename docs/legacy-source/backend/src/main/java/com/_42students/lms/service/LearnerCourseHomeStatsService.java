package com._42students.lms.service;

import com._42students.lms.dto.response.LearnerCourseHomeStatsDTO;

/**
 * Aggregates learner course home dashboard stats (progress, grades, next content).
 */
public interface LearnerCourseHomeStatsService {
    /**
     * Get home stats for a learner viewing a specific course.
     *
     * @param learnerId learner ID (must be the current user)
     * @param courseId  course ID (resolved from slug if needed)
     * @param classId   learner's class ID; if null or &lt;= 0, uses generic content only
     * @return full stats DTO or null if course/learner invalid
     */
    LearnerCourseHomeStatsDTO getHomeStats(int learnerId, int courseId, Integer classId);
}

