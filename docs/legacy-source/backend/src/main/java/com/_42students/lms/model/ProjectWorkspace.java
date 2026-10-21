package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Version;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "project_workspace")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectWorkspace extends BaseModel {

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "course_label", length = 160)
    private String courseLabel;

    @Column(name = "status", length = 40)
    private String status = "IN_PROGRESS";

    @Column(name = "phase", length = 80)
    private String phase;

    @Column(name = "progress")
    private Integer progress = 0;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Default sprint length new sprints are generated at (project-level, not per-sprint —
    // see ProjectSprint.startDate/endDate comment for why sprint length isn't editable
    // per sprint once a sprint is ACTIVE).
    @Column(name = "sprint_length_weeks")
    private Integer sprintLengthWeeks = 4;

    // POINTS | HOURS. Set once; UI should warn before changing it on a project with any
    // estimated task, since points and hours aren't convertible and a mixed-unit velocity
    // history is meaningless.
    @Column(name = "estimation_unit", length = 20)
    private String estimationUnit = "POINTS";

    @Column(name = "blocker", columnDefinition = "TEXT")
    private String blocker;

    @Column(name = "next_action", columnDefinition = "TEXT")
    private String nextAction;

    @Column(name = "due_label", length = 80)
    private String dueLabel;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "template_id")
    private Integer templateId;

    // V191: the PROJECT_TEAM group that owns this workspace's learners (docs/groups/PROJECT-TEAMS.md).
    // NULL = learners live only in project_member, as before.
    @Column(name = "team_group_id")
    private Long teamGroupId;

    // Immutable copy of the template version explicitly attached to this workspace. Existing
    // workspaces no longer observe in-progress edits to the mutable global template row.
    @Type(type = "json")
    @Column(name = "template_snapshot", columnDefinition = "json")
    private Object templateSnapshot;

    @Column(name = "recoverable_content", nullable = false)
    private Boolean recoverableContent = false;

    // Set ONLY by the bulk-per-learner creation path (bulkCreateProjectsForClass) — it's the
    // learner this specific auto-generated workspace was created for, used purely to give the DB
    // a real uniqueness constraint against duplicate workspaces from a concurrent/double-submitted
    // batch. Stays null for every manually created (possibly multi-learner) workspace.
    @Column(name = "bulk_learner_id")
    private Integer bulkLearnerId;

    @Type(type = "json")
    @Column(name = "overview", columnDefinition = "json")
    private Object overview;

    @Column(name = "readiness_override")
    private Boolean readinessOverride;

    @Column(name = "readiness_override_note", columnDefinition = "TEXT")
    private String readinessOverrideNote;

    @Column(name = "readiness_override_by")
    private Integer readinessOverrideBy;

    @Column(name = "readiness_override_at")
    private java.time.LocalDateTime readinessOverrideAt;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
