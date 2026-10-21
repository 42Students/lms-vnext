package com._42students.lms.dto.response;

import com._42students.lms.model.Course;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class FacultyCourseMappingDTO {
    private int facultyId;
    private Integer courseId;
    private String courseSlug;   // Public identifier for URL obfuscation
    private Integer classId;
    private Course course;
    private int mapping_id;
    private String section_name;

    
}



