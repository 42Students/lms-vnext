package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizSubmittedAnswerResponseDTO {
    private int questionId;
    private List<Integer> selectedOptionIds;
    private Boolean correct;
    private Long pointsAwarded;
}
