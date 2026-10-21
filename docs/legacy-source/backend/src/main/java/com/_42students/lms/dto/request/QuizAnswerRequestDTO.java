package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Data
public class QuizAnswerRequestDTO {
    @Min(1)
    private int questionId;
    @NotEmpty
    @Size(max = 20)
    private List<Integer> selectedOptionIds = new ArrayList<>();
}
