package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Progress metrics for learner course home.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerCourseProgressDTO {
    private int overallPercent;
    private int lessonsCompleted;
    private int lessonsTotal;
    private int videosWatched;
    private int videosTotal;
    private int assignmentsSubmitted;
    private int assignmentsTotal;
    private int quizzesCompleted;
    private int quizzesTotal;
}

