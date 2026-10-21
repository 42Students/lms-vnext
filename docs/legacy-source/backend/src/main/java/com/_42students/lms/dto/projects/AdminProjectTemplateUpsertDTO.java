package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class AdminProjectTemplateUpsertDTO {
    private String slug;
    private String title;
    private String summary;
    private String courseLabel;
    private String status;
    private String lifecycleStatus;
    private String phase;
    private Integer organizationId;
    private Integer collegeId;
    private Object overview;
    private Object sprints;
    private Object tasks;
    private Object resources;
    private Object delivery;
    private Object meetings;
    private Object activity;
    /**
     * The templateVersion the editor loaded. When sent, the save is rejected (409) if anyone saved the template since, so a
     * stale page cannot overwrite newer edits (R7-01). A save with no title is a section-only save and keeps the stored
     * slug/title/summary/course/phase instead of rewriting them from the page's copy.
     */
    private Integer expectedTemplateVersion;
}
