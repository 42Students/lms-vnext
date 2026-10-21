package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectWorkspaceUpdateDTO {
    private String title;
    private String status;
    private String phase;
    private Integer progress;
    private String blocker;
    private String nextAction;
    private String dueLabel;
    private String summary;
    private String courseLabel;
    private Object overview;
    private Object sprints;
    private Object tasks;
    private Object resources;
    private Object delivery;
    private Object meetingsList;
    private Object activity;

    /**
     * Concurrency tokens from the detail view (ProjectWorkspaceDTO), echoed back on a save. When present, the save is
     * rejected (409) if that part of the workspace changed since the caller loaded it: detailsToken covers the scalar
     * fields and overview; each section token covers that section's rows, so a stale full-array save cannot
     * overwrite or delete rows another user added or edited meanwhile.
     */
    private String detailsToken;
    private String tasksToken;
    private String resourcesToken;
    private String sprintsToken;
    private String meetingsToken;

    /**
     * PR1 in the super-admin audit: 26 entity fields against 12 form controls. These five existed
     * on ProjectWorkspace and could only ever be set at creation -- no update path carried them,
     * so a wrong start/end date or estimation unit was permanent. phase/dueLabel/courseLabel were
     * already updatable above; these complete the set.
     */
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private Integer sprintLengthWeeks;
    private String estimationUnit;
    private Integer classId;

    @Data
    public static class OverviewDTO {
        private String goal;
        private String currentFocus;
        private List<String> deliverables;
    }
}
