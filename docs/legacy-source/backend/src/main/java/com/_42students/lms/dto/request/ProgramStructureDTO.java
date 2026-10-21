package com._42students.lms.dto.request;

import com._42students.lms.model.Course;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ProgramStructureDTO {
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String startDate;
    @Size(max = 255)
    private String endDate;
    private List<Integer> courseIds;
    private List<Course> courses;
}

