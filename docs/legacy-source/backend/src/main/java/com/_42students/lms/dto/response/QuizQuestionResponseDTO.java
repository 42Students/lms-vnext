package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizQuestionResponseDTO {
    private int id;
    private String type;
    private String prompt;
    private long points;
    private int sequence;
    private List<QuizOptionResponseDTO> options;
}
