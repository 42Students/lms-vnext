package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectWorkspaceDTO {
    private String id;
    private Integer numericId;
    private String title;
    private Integer collegeId;
    private String course;
    private Integer templateId;
    private Long teamGroupId;
    private String templateSlug;
    private String templateTitle;
    private Integer templateVersion;
    private String lifecycleStatus;
    private String publishedAt;
    private String archivedAt;
    private Boolean templateBound;
    private Boolean recoverableContent;
    private String mentor;
    private String status;
    private String phase;
    private Integer progress;
    private String blocker;
    private String nextAction;
    private String dueLabel;
    private String summary;
    private String lastActivityAt;
    private List<ProjectMemberDTO> members;
    private List<ProjectMemberDTO> resolvedMembers;
    private Object overview;
    private Object resolvedOverview;
    private List<ProjectSprintDTO> sprints;
    private List<ProjectSprintDTO> resolvedSprints;
    private Object tasks;
    private List<ProjectTaskDTO> resolvedTasks;
    private Object resources;
    private Object resolvedResources;
    /** Concurrency tokens for saves (see ProjectWorkspaceUpdateDTO); set on the single-workspace detail view only. */
    private String detailsToken;
    private String tasksToken;
    private String resourcesToken;
    private String sprintsToken;
    private String meetingsToken;
    private ProjectDeliveryDTO delivery;
    private ProjectDeliveryDTO resolvedDelivery;
    private List<ProjectMeetingDTO> meetingsList;
    private List<ProjectMeetingDTO> resolvedMeetingsList;
    private List<ProjectActivityDTO> activity;
    private List<ProjectActivityDTO> resolvedActivity;
    // PR1: the admin edit form can now change a workspace's class assignment, so it needs the
    // current value to prefill -- the read DTO never exposed it.
    private Integer classId;
    private Integer tasksOpen;
    private Integer meetings;
    private ProjectReadinessDTO readiness;

    // Stage 1/5.
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private Integer sprintLengthWeeks;
    private String estimationUnit;
    // Only COMPLETED sprints appear here — see ProjectSprintMetricsDTO.
    private java.util.List<ProjectSprintMetricsDTO> sprintMetrics;
    // Share of tasks that have ever missed a sprint (carriedOverFromSprintKey set), out of every
    // task that has ever been in a sprint at all. Null until at least one sprint has completed —
    // an all-PLANNED project has no over-commitment signal to show yet.
    private Integer carryOverRatePercent;
}
