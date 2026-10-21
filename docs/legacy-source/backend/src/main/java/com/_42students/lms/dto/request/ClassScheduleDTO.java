package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import java.sql.Timestamp;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ClassScheduleDTO {
    @Min(value = 1, message = "classId must be a positive number")
    private int classId;

    @Min(value = 1, message = "facultyId must be a positive number")
    private int facultyId;

    private int courseId;
    private String courseSlug;   // Optional: when set, resolved to courseId on server

    @NotBlank(message = "startTime is required")
    private String startTime;

    @NotBlank(message = "endTime is required")
    private String endTime;

    private int lectureHallId;
    private String title;
}

