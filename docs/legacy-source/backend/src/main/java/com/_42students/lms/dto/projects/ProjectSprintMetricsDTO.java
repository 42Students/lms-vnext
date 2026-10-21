package com._42students.lms.dto.projects;

import lombok.Data;

// Stage 5: one row per COMPLETED sprint, for the velocity chart. Only computed for sprints that
// have actually closed — an ACTIVE or PLANNED sprint has no committed/completed split yet, since
// completeSprint() is what decides which linked tasks count as "finished" (see
// ProjectWorkspaceServiceImpl.completeSprint).
@Data
public class ProjectSprintMetricsDTO {
    private String sprintKey;
    private Integer sprintNumber;
    private String title;
    // Points on tasks that were ever linked to this sprint (completed + carried over).
    private Integer committedPoints;
    // Points on tasks still linked to this sprint at read time — since completeSprint() only
    // ever clears the link on non-DONE tasks, every task still linked to a COMPLETED sprint was
    // DONE when it closed.
    private Integer completedPoints;
    private Integer carriedOverTaskCount;
}
