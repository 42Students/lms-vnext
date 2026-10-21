package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectMeetingActionItemDTO {
    private String actionKey;
    private String id;
    private String label;
    private String value;
    private String text;
    private Boolean completed;
    private String assigneeName;
}
