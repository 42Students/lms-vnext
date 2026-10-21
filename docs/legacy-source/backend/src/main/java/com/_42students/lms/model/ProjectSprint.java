package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;
import java.time.LocalDate;

// One word, everywhere: this is a sprint in the product, in the API, in the JSON and in the
// database. It used to be a "milestone" below the UI layer — the entity, table, columns and
// stored JSON kept that name while the product had said "Sprint" since V100 — and an earlier
// version of this comment argued for keeping the split, on the grounds that renaming the storage
// layer meant rewriting the JSON of every template ever saved.
//
// That was re-decided and carried out in V141/V142/V143, which renamed the table, its columns,
// the indexes, the JSON keys inside every template and archived snapshot, the stored key values,
// and the activity-feed rows. The reason: the split name kept inviting the mistake where someone
// reads this table beside its own sprint_number/sprint_state columns and concludes sprints and
// milestones are two different things, then writes logic for a relationship that never existed.
//
// If you are here because you found "milestone" somewhere: the only places it legitimately
// survives are the historical migrations (V34-V140, immutable — editing one breaks its Flyway
// checksum), the migrations V141-V143 that perform the rename and must name both vocabularies,
// the third-party skills taxonomy in skills-data (where "Milestones" is a skill name), and
// user-authored content someone typed into a title.
@Data
@Entity
// Mirrors the unique constraint created as uk_project_milestone_key in
// V87__project_milestones_and_task_links.sql and renamed to uk_project_sprint_key in V141.
@Table(name = "project_sprint", uniqueConstraints = @UniqueConstraint(name = "uk_project_sprint_key", columnNames = {"project_id", "sprint_key"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectSprint extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "deleted_by_workspace", nullable = false)
    private Boolean deletedByWorkspace = false;

    @Column(name = "sprint_key", nullable = false, length = 120)
    private String sprintKey;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "title", nullable = false, length = 220)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sprint_status", length = 40)
    private String sprintStatus = "UPCOMING";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "due_label", length = 80)
    private String dueLabel;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // PLANNED | ACTIVE | COMPLETED — the lifecycle a mentor drives explicitly via
    // start/complete sprint actions. Distinct from sprintStatus, which is a derived
    // read of task progress (UPCOMING/IN_PROGRESS/COMPLETED/OVERDUE) and never set directly.
    // Dates are editable while PLANNED; the service layer rejects date edits once ACTIVE —
    // a fixed time box is what makes velocity across sprints comparable.
    @Column(name = "sprint_state", length = 20)
    private String sprintState = "PLANNED";

    @Column(name = "sprint_number")
    private Integer sprintNumber;

    @Column(name = "goal", columnDefinition = "TEXT")
    private String goal;

    // Non-null only on the sprint that ships a numbered release (every 4th sprint in our
    // seeded templates). A flag on the sprint, not a separate release entity — see V100.
    @Column(name = "release_label", length = 160)
    private String releaseLabel;

    // V119: real link to project_release.id. releaseLabel above is kept only as the pre-V119
    // display fallback (see V119's backfill, which also created a matching ProjectRelease row
    // and populated this for every sprint that had a label) — new links should go through this.
    //
    // V173: a sprint only ever exists inside a release now -- releases stopped being an optional
    // grouping. `nullable = false` mirrors the DB constraint V173 adds (after confirming/removing
    // the only 2 sprints, both junk test rows, that had no release at the time). Every write path
    // (applySprintPayload) rejects a save that can't resolve a real release before this column is
    // ever touched, so this is a backstop, not the only enforcement point.
    @Column(name = "release_id", nullable = false)
    private Integer releaseId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    // Lifecycle attribution (V181): written only by startSprint / completeSprint, never by a
    // generic edit, so "Started by" / "Completed by" can't be silently reattributed.
    @Column(name = "started_by")
    private Integer startedBy;

    @Column(name = "started_at")
    private java.time.LocalDateTime startedAt;

    @Column(name = "completed_by")
    private Integer completedBy;

    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
