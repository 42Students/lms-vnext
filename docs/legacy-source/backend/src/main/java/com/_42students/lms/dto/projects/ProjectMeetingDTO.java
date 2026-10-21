package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectMeetingDTO {
    private Integer id;
    private Integer projectId;
    private String meetingId;
    private String meetingKey;
    private Integer sortOrder;
    private String title;
    private String agenda;
    private String notes;
    private String outcome;
    private String meetingStatus;
    private String status;
    private String meetingType;
    // Stage 6 retro: filled in only when meetingType == "RETRO". Kept as a JSON-serialized
    // structure {wentWell:[], didntGoWell:[], actions:[{text, taskKey}]} inside `notes` is
    // deliberately avoided — retroNotes is its own field so a retro renders distinctly from a
    // free-text meeting and actions can be promoted to backlog tasks without parsing prose.
    private String retroWentWell;
    private String retroDidntGoWell;
    private String retroActions;
    private String meetingDate;
    private String startTime;
    private String endTime;
    private String timezone;
    private List<ProjectMeetingActionItemDTO> actionItems;
    private String linkedSprintKey;
    private String linkedSprintLabel;
    private String linkedTaskKey;
    private String linkedTaskLabel;
    private String followUpAt;
    private String followUpStatus;
    private String followUpNotes;
    private String meetingUrl;
    private Integer createdBy;
    private String createdByType;
    private Integer updatedBy;
    private List<ProjectMeetingHistoryDTO> history;
    private Long version;
    private String calendarSyncStatus;
    private String calendarSyncError;
}
