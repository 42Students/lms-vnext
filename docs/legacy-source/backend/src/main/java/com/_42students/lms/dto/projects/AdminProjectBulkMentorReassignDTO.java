package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class AdminProjectBulkMentorReassignDTO {
    private Integer collegeId;
    private List<String> projectIds;
    private Integer mentorId;
    private String roleLabel;
}
