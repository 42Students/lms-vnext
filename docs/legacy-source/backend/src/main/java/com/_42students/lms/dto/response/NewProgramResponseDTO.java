package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class NewProgramResponseDTO {
    private int id;
    private String name;
    private int deptId;
    private String deptName;
    private int durationYears;
}

