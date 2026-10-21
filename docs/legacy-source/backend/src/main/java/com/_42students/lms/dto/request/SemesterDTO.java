package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class SemesterDTO {
    @Min(1)
    private Integer id;
    @NotNull @Min(1)
    private Integer programId;
    @NotNull @Min(1)
    private Integer semesterNumber;
    @NotBlank @Size(max = 255)
    private String name;
    private Boolean isActive;
    @Min(0)
    private Integer totalCredits;
}

