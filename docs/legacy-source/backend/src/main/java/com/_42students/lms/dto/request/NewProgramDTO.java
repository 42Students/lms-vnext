package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class NewProgramDTO {
    @NotBlank @Size(max = 255)
    private String name;
    @Min(1)
    private int deptId;
    @Min(1)
    private int durationYears; // Duration in years (e.g., 4 for B.Tech)
}

