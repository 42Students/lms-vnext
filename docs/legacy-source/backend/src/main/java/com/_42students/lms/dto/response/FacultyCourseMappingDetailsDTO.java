package com._42students.lms.dto.response;

import com._42students.lms.model.Course;
import lombok.Data;

@Data
public class FacultyCourseMappingDetailsDTO {
    private int facultyId;
    private Integer courseId;
    private String courseSlug;   // Public identifier for URL obfuscation
    private Integer classId;
    private Course course;
    private String className;
}

