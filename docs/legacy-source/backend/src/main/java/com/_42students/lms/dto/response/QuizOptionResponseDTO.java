package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizOptionResponseDTO {
    private int id;
    private String text;
    private boolean correct;
    private int sequence;
}
