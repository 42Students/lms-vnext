package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Next content for "Continue learning" on learner course home.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerCourseNextContentDTO {
    private Integer lessonId;
    private String lessonName;
    private Integer contentId;
    private String contentTitle;
    private String contentType; // VIDEO, YOUTUBE, ASSIGNMENT, QUIZ
    private String progressStatus; // IN_PROGRESS, NOT_STARTED
    private Integer lastPositionSeconds;
    private Integer totalSeconds;
    private String resumeUrl;
}

