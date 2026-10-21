package com._42students.lms.dto.request;

import java.sql.Date;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class AttendanceDetailsRequestDTO {
    @NotNull
    @Min(1)
    private int classId;
    @NotNull
    @Min(1)
    private int courseId;
    @NotNull
    @Min(1)
    private int facultyId;
    @NotNull
    private Date startDate;
    @NotNull
    private Date endDate;
}
 
