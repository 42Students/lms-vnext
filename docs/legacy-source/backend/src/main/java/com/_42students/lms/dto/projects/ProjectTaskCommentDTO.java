package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProjectTaskCommentDTO {
    private Integer id;
    private Integer projectId;
    private Integer projectTaskId;
    private Integer commenterId;
    private String commenterType;
    private String commenterName;
    private String message;
    private Integer progressValue;
    private String commentType;
    private String taskStatusSnapshot;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
