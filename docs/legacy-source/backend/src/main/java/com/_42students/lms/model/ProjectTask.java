package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;
import java.time.LocalDate;

@Data
@Entity
// Mirrors uk_project_task_key in V75__project_tasks.sql.
@Table(name = "project_task", uniqueConstraints = @UniqueConstraint(name = "uk_project_task_key", columnNames = {"project_id", "task_key"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectTask extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "deleted_by_workspace", nullable = false)
    private Boolean deletedByWorkspace = false;

    @Column(name = "task_key", nullable = false, length = 120)
    private String taskKey;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "task_status", length = 40)
    private String taskStatus = "TO_DO";

    @Column(name = "priority", length = 40)
    private String priority = "MEDIUM";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "due_label", length = 80)
    private String dueLabel;

    @Column(name = "sprint_key", length = 120)
    private String sprintKey;

    @Column(name = "sprint_label", length = 220)
    private String sprintLabel;

    @Column(name = "estimate_points")
    private Integer estimatePoints;

    @Column(name = "task_type", length = 20)
    private String taskType = "STORY";

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "approach", columnDefinition = "TEXT")
    private String approach;

    @Column(name = "carried_over_from_sprint_key", length = 120)
    private String carriedOverFromSprintKey;

    @Column(name = "assignee_id")
    private Integer assigneeId;

    @Column(name = "assignee_type", length = 20)
    private String assigneeType;

    @Column(name = "assignee_name", length = 160)
    private String assigneeName;

    @Column(name = "blocker_reason", columnDefinition = "TEXT")
    private String blockerReason;

    // Per-task submission: a link (commit, deployed URL, Drive file, whatever fits the work) the
    // assigned learner attaches when moving their own task to IN_REVIEW. Link-only by design, no
    // file storage at this granularity. submittedBy/submittedAt are real lifecycle-specific
    // attribution -- deliberately NOT reusing the generic updatedBy/updatedAt, the exact mistake
    // the sprint attribution audit fix called out elsewhere in this lifecycle.
    @Column(name = "submission_url", length = 2048)
    private String submissionUrl;

    @Column(name = "submitted_by")
    private Integer submittedBy;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_by_type", length = 20)
    private String createdByType;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
