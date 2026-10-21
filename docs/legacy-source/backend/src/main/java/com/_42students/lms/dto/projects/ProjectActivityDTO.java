package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.Map;

@Data
public class ProjectActivityDTO {
    private String id;
    private Integer projectId;
    private String projectSlug;
    private String eventKey;
    private String eventCode;
    private String eventType;
    private String title;
    private String summary;
    private String sourceTab;
    private String entityType;
    private String entityId;
    private Integer actorUserId;
    private String actorUserType;
    private String actorName;
    private Map<String, Object> metadata;
    private String createdAt;
    private String updatedAt;
}
