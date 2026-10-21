package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class AttendanceDTO {
    @NotBlank(message = "studentId is required")
    private String studentId;

    @NotNull(message = "classScheduleId is required")
    @Positive(message = "classScheduleId must be positive")
    private Integer classScheduleId;

    private String dropClassReason;
}
 
