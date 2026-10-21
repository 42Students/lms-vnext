package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class QuizOptionRequestDTO {
    private Integer id;
    @NotBlank
    @Size(max = 2000)
    private String text;
    private boolean correct;
}
