package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectMeetingHistoryDTO {
    private Integer id;
    private Integer projectId;
    private Integer projectMeetingId;
    private String meetingKey;
    private String actionType;
    private Integer actorUserId;
    private String actorUserType;
    private String actorName;
    private Object beforeJson;
    private Object afterJson;
    private Object changedFields;
    private String notes;
    private String createdAt;
}
