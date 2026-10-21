// ActiveCourseResponseDTO.java
package com._42students.lms.dto.response;

import lombok.Data;

@Data
public class ActiveCourseResponseDTO {
    private long mappingId;
    private String slug; // Public identifier; internal courseId omitted for learner/teacher-facing response
    private String courseName;
    private Integer deptId;

    // Constructors, getters, setters, etc.
}
 
