package com._42students.lms.dto.response;

import com._42students.lms.model.Course;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;


@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class FacultyCourseClassMappingDTO {
    private int mappingId;
    private int facultyId;
    private String facultyName;
    private int courseId;
    private String courseSlug;
    private String courseName;
    private int classId;
    private String className;
}

