package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectTemplateDTO {
    private Integer id;
    private String slug;
    private String title;
    private String summary;
    private String courseLabel;
    private String status;
    private Integer templateVersion;
    private String lifecycleStatus;
    private String publishedAt;
    private String archivedAt;
    private String phase;
    private Integer organizationId;
    private Integer collegeId;
    private Integer createdBy;
    private Object overview;
    private Object sprints;
    private Object tasks;
    private Object resources;
    private Object delivery;
    private Object meetings;
    private Object activity;
}
