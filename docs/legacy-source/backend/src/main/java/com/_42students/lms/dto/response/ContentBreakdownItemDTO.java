package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One row in the content progress breakdown (videos, assignments, quizzes).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentBreakdownItemDTO {
    private String type;   // VIDEO, ASSIGNMENT, QUIZ
    private int completed;
    private int total;
    private int percent;
}

