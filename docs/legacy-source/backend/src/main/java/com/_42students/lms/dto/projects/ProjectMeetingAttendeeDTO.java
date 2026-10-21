package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectMeetingAttendeeDTO {
    private String attendeeKey;
    private String id;
    private String label;
    private String value;
    private String text;
}
