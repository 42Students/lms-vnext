package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectReleaseDTO {
    private Integer id;
    private Integer projectId;
    private String releaseKey;
    private String title;
    private LocalDate targetDate;
    private String status;
    private Integer sortOrder;
    private String notes;
    // Rollup, computed in ProjectWorkspaceServiceImpl from the sprints linked to this release
    // — not stored columns, so they're always live rather than a snapshot that can drift.
    private Integer sprintCount;
    private Integer completedSprintCount;
    private Integer committedPoints;
    private Integer completedPoints;
    // True only when every linked sprint is COMPLETED and sprintCount > 0 — mirrors the
    // server-side gate in shipProjectRelease, so the UI can disable "Ship" before the click
    // instead of only finding out from a rejected request.
    private Boolean readyToShip;
    private Integer createdBy;
    private Integer updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;
}
