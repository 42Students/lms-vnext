package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class AdminProjectMentorAssignDTO {
    private Integer collegeId;
    private Integer mentorId;
    private String roleLabel;
}
