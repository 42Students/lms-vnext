package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.Size;

@Data
public class AdminProjectBulkCreateDTO {
    private String title;
    private String summary;
    @Size(max = 160, message = "courseLabel must not exceed 160 characters")
    private String courseLabel;
    private String status;
    private String phase;
    private Integer progress;
    private Integer organizationId;
    private Integer collegeId;
    private Integer classId;
    private Integer templateId;
    private Integer mentorId;
}
