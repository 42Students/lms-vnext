package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizAttemptResponseDTO {
    private int id;
    private int quizId;
    private int learnerId;
    private String learnerName;
    private String learnerRollNumber;
    private String learnerMobile;
    private int attemptNumber;
    private String status;
    private Long score;
    private Long maxScore;
    private boolean resultsVisible;
    private LocalDateTime submittedAt;
    private List<QuizSubmittedAnswerResponseDTO> answers;
}
