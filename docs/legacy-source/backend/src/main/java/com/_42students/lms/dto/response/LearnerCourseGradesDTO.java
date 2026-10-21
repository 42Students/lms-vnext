package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Grade metrics for learner course home.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerCourseGradesDTO {
    private Double assignmentAvgPercent;
    private Double quizAvgPercent;
    private boolean hasGrades;
}

