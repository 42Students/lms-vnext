package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class SemesterCourseDTO {
    @Min(1)
    private Integer id;
    @Min(1)
    private Integer semesterId;
    @Min(1)
    private Integer courseId;
    private Boolean isMandatory;
    @Min(0)
    private Integer credits;
    @Min(0)
    private Integer courseOrder;
    
    // For bulk operations
    private List<Integer> courseIds;
}

