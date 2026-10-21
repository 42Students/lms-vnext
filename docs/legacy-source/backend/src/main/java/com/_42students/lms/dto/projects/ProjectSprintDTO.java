package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectSprintDTO {
    private Integer id;
    private String sprintId;
    private Integer projectId;
    private String sprintKey;
    private String title;
    private String description;
    private String status;
    private LocalDate dueDate;
    private String dueLabel;
    private LocalDate startDate;
    private LocalDate endDate;
    private String sprintState;
    private Integer sprintNumber;
    private String goal;
    private String releaseLabel;
    // V119: real link to project_release. releaseLabel above is kept only as the pre-V119
    // display fallback for sprints that predate a linked release — new sprints should be
    // linked via releaseKey, not releaseLabel.
    private Integer releaseId;
    private String releaseKey;
    private String releaseTitle;
    private Integer sortOrder;
    private Integer progress;
    private Integer taskCount;
    private Integer completedTaskCount;
    private Integer createdBy;
    private Integer updatedBy;
    private Integer startedBy;
    private java.time.LocalDateTime startedAt;
    private Integer completedBy;
    private java.time.LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // See ProjectTaskDTO.removedFromTemplate — same meaning here.
    private Boolean removedFromTemplate;
    // Was missing entirely, unlike tasks/meetings/resources/deliveries — a full-replace sync
    // save with no version echo means JPA's optimistic check always matches the freshly loaded
    // row in this transaction and never fires, so a concurrent edit could be silently overwritten.
    private Long version;
}
