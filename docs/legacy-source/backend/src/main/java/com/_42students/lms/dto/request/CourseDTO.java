package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class CourseDTO {
    @NotBlank(message = "short_title is required")
    @Size(max = 255, message = "short_title must be at most 255 characters")
    private String shortTitle;
    @Positive(message = "dept_id must be a positive department ID")
    private int deptId;
    @NotBlank(message = "course_name is required")
    @Size(max = 255, message = "course_name must be at most 255 characters")
    private String courseName;
    // Boxed (not primitive int like deptId) specifically so setCourseFields can distinguish
    // "field absent from this payload -- leave it alone" (null) from "field explicitly sent as 0
    // -- clear the parent course" (non-null 0). A primitive here could only ever mean the former,
    // so a course's parentCourseId could be set but never cleared through the API.
    private Integer parentCourseId;
    private Integer createdByOrgId;
    private Boolean active;
    private Boolean enabled;
    private Integer allowedForDisplay;
    private MetaData metaData;
}

