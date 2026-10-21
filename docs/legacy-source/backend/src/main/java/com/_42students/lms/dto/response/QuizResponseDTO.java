package com._42students.lms.dto.response;

import com._42students.lms.config.IndiaLocalDateTimeSerializer;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizResponseDTO {
    private int id;
    private int lessonId;
    private String lessonName;
    private int courseId;
    private String courseName;
    private Integer classId;
    private Integer facultyId;
    private String title;
    private String description;
    private String status;
    // Stored as India wall-clock time -- see IndiaLocalDateTimeSerializer.
    @JsonSerialize(using = IndiaLocalDateTimeSerializer.class)
    private LocalDateTime dueAt;
    private int maxAttempts;
    private boolean shuffleQuestions;
    private boolean shuffleOptions;
    private long totalPoints;
    private Integer attemptCount;
    private Boolean submitted;
    private Long latestScore;
    private Long latestMaxScore;
    private boolean gradePublished;
    private List<QuizQuestionResponseDTO> questions;
}
