package com._42students.lms.dto.response;

import lombok.Data;

@Data
public class CourseInfoDTO {
    private Integer courseId;
    private String courseSlug;
    private String courseName;
    private Integer deptId;
}

