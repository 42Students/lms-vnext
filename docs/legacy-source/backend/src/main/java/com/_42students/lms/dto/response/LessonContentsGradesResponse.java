package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class LessonContentsGradesResponse {
    private int lessonContentId;
    private int lessonId;
    private Integer courseId;
    private String courseSlug;
    private String courseName;
    private Integer classId;
    private Integer facultyId;
    private long points;
    private String lessonContentName;
}

