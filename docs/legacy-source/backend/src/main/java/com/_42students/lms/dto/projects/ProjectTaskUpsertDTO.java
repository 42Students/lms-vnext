package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectTaskUpsertDTO {
    private String taskKey;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private String dueLabel;
    private String sprintKey;
    // A blank/absent sprintKey means "field not sent, don't touch it" everywhere else in this
    // DTO's handling (see applyTaskPayload) — so explicitly un-assigning a task from its sprint
    // (the Board's "move to Backlog" drag) needs its own signal rather than overloading null.
    private Boolean clearSprint;
    private Integer estimatePoints;
    private String taskType;
    private String acceptanceCriteria;
    private String approach;
    private Integer assigneeId;
    private String assigneeType;
    private String assigneeName;
    // Same ambiguity clearSprint exists to solve: a null assigneeId already means "field not
    // sent, don't touch it" everywhere in applyTaskPayload, so un-assigning a task (the
    // Tasks & Performance "Unassigned" drop/dropdown) needs its own explicit signal.
    private Boolean clearAssignee;
    private String blockerReason;
    // Per-task submission: set by the assigned learner when moving their own task to IN_REVIEW.
    // Required for that specific transition (enforced in applyTaskPayload) -- optional otherwise.
    private String submissionUrl;
    private Integer sortOrder;
    private Long version;
}
