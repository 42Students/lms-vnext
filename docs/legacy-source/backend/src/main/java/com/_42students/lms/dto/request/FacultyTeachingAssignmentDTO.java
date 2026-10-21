package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.sql.Date;
import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class FacultyTeachingAssignmentDTO {
    @Min(1)
    private Integer id;
    // Create and bulk require facultyId through TeachingAssignmentScopeValidator.
    // An update may omit it and retain the existing assignment's faculty.
    @Min(1)
    private Integer facultyId;
    @Min(1)
    private Integer courseId;
    @Min(1)
    private Integer classId;
    @Min(1)
    private Integer batchId;
    @Min(1)
    private Integer semesterNumber;
    @Size(max = 255)
    private String academicYear;
    @Size(max = 255)
    private String role; // PRIMARY, CO_TEACHER, TA
    private Boolean isActive;
    private Date startDate;
    private Date endDate;
    private List<Integer> courseIds;
}
