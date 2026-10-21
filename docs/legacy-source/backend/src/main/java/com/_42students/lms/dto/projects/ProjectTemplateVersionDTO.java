package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectTemplateVersionDTO {
    private Integer id;
    private Integer templateId;
    private Integer templateVersion;
    private String actionType;
    private String lifecycleStatus;
    private Integer changedBy;
    private String changedAt;
    private String notes;
    private Object snapshotJson;
}
