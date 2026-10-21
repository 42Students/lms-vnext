package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectTaskDTO {
    private Integer id;
    private String taskId;
    private Integer projectId;
    private String taskKey;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private String dueLabel;
    private String sprintKey;
    private String sprintLabel;
    // Stage 3: relative sizing in the project's estimationUnit (points by default). Null means
    // not yet estimated — a task can sit in the backlog unestimated, but sprint planning should
    // discourage pulling one in without a size, since it breaks velocity.
    private Integer estimatePoints;
    // STORY | BUG | CHORE | SPIKE.
    private String taskType;
    // The "done when" from the underwriting doc's task explanations — kept separate from
    // description (which is "what it is") so the board/detail view can show them distinctly.
    private String acceptanceCriteria;
    // The worked "how to do this" guidance for the task — distinct from acceptanceCriteria
    // (the "done when" condition) and description (what the task is).
    private String approach;
    // Set when this task returned to the backlog at a sprint close and was later pulled into a
    // different sprint than the one it missed — the honest carry-over trail (Stage 3). Null for
    // a task still in its original sprint, or one that was never in a sprint.
    private String carriedOverFromSprintKey;
    private Integer assigneeId;
    private String assigneeType;
    private String assigneeName;
    private String blockerReason;
    // Per-task submission link (commit/Drive/deployed URL/whatever) attached when the assigned
    // learner moves their own task to IN_REVIEW, plus real lifecycle-specific attribution.
    private String submissionUrl;
    private Integer submittedBy;
    private LocalDateTime submittedAt;
    private Integer sortOrder;
    private Integer createdBy;
    // Brutal-audit finding: never exposed here even though the backend itself needs this to
    // disambiguate createdBy (a bare int shared between the independent Learner/Faculty id
    // sequences -- the exact ambiguity isLearnerAssignee already resolves for assigneeId). Without
    // it, a client-side "did I create this" check can only compare the numeric id, which is wrong
    // in the same rare id-collision case that check already has to guard against for assignee.
    private String createdByType;
    private Integer updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ProjectTaskCommentDTO> comments;
    // True when this task was materialized from a template item that no longer exists in the
    // template's current content (e.g. an admin renamed/removed it after this workspace already
    // materialized it). The row is kept — deleting learner-visible content just because an admin
    // edited the template elsewhere would be its own kind of data loss — but the client should
    // signal that it's no longer part of the "official" template.
    private Boolean removedFromTemplate;
    private Long version;
}
