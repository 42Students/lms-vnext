package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class ProjectTaskCommentUpsertDTO {
    @NotBlank(message = "message is required")
    private String message;
    private Integer progressValue;
    private String commentType;
    private String taskStatusSnapshot;
}
