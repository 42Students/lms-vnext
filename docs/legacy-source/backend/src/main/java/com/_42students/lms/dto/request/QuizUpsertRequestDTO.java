package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class QuizUpsertRequestDTO {
    @Min(1)
    private int lessonId;
    @Min(1)
    private int courseId;
    private Integer classId;
    @NotBlank
    @Size(max = 255)
    private String title;
    @Size(max = 5000)
    private String description;
    private LocalDateTime dueAt;
    @Min(1)
    @Max(20)
    private int maxAttempts = 1;
    private boolean publish;

    /** Audit 2.7: per-quiz randomisation. Both default false, so an existing quiz is unchanged. */
    private boolean shuffleQuestions;
    private boolean shuffleOptions;
    @Valid
    private List<QuizQuestionRequestDTO> questions = new ArrayList<>();
}
