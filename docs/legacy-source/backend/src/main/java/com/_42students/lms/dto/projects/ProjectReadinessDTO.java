package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectReadinessDTO {
    private Boolean readyForSubmission;
    private String readinessState;
    private String reason;
    private Integer totalSprints;
    private Integer completedSprints;
    private Integer totalTasks;
    private Integer completedTasks;
    // V119: informational only — a project isn't blocked from submission by unshipped releases
    // (a release groups sprints for reporting, it isn't itself a submission requirement), but a
    // mentor/admin deciding whether a project is really "done" should be able to see this
    // without opening the Sprints tab separately.
    private Integer totalReleases;
    private Integer shippedReleases;
    private Boolean submissionExists;
    private String submissionStatus;
    private Boolean overrideActive;
    private Boolean overrideValue;
    private String overrideNote;
    private Integer overrideBy;
    private String overrideByName;
    private String overrideAt;
}
