package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Data
public class QuizQuestionRequestDTO {
    private Integer id;
    @NotBlank
    @Size(max = 30)
    private String type;
    @NotBlank
    @Size(max = 5000)
    private String prompt;
    @Min(1)
    @Max(100)
    private long points = 1;
    @Min(0)
    private int sequence;
    @Valid
    @NotEmpty
    @Size(max = 20)
    private List<QuizOptionRequestDTO> options = new ArrayList<>();
}
