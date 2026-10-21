package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;
import java.time.LocalDate;

// Real Release entity (V119) — replaces the free-text project_sprint.release_label
// "flag on the sprint" workaround from V118. Sprints (ProjectSprint) point at a release
// via release_id; a release's own status (PLANNED/IN_PROGRESS/SHIPPED) is set explicitly by
// a mentor via the ship action, which is gated on every linked sprint being COMPLETED first
// — see ProjectWorkspaceServiceImpl#shipProjectRelease.
@Data
@Entity
@Table(name = "project_release", uniqueConstraints = @UniqueConstraint(name = "uk_project_release_key", columnNames = {"project_id", "release_key"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectRelease extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "release_key", nullable = false, length = 64)
    private String releaseKey;

    @Column(name = "title", nullable = false, length = 220)
    private String title;

    @Column(name = "target_date")
    private LocalDate targetDate;

    // PLANNED | IN_PROGRESS | SHIPPED. Never set to SHIPPED directly by a plain update —
    // only the dedicated ship action, which enforces every linked sprint is COMPLETED first.
    @Column(name = "status", length = 20)
    private String status = "PLANNED";

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities — see the matching comment on
    // ProjectSprint.version for why a non-null default breaks persist().
    private Long version;
}
