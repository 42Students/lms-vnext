package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class AdminProjectTemplateAttachDTO {
    private Integer collegeId;
    private Integer templateId;
    private Boolean reapplyDefaults = true;
}
