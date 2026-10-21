package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;

@Data
@Entity
// Mirrors uk_project_resource_key in V79__project_resources.sql.
@Table(name = "project_resource", uniqueConstraints = @UniqueConstraint(name = "uk_project_resource_key", columnNames = {"project_id", "resource_key"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectResource extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "deleted_by_workspace", nullable = false)
    private Boolean deletedByWorkspace = false;

    @Column(name = "resource_key", nullable = false, length = 120)
    private String resourceKey;

    @Column(name = "resource_order")
    private Integer resourceOrder = 0;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "resource_type", length = 40)
    private String resourceType = "File";

    @Column(name = "resource_kind", length = 40)
    private String resourceKind = "File";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "access_notes", columnDefinition = "TEXT")
    private String accessNotes;

    @Column(name = "visibility", length = 40)
    private String visibility = "Shared";

    @Column(name = "status", length = 40)
    private String status = "Active";

    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Column(name = "sprint_key", length = 120)
    private String sprintKey;

    @Column(name = "sprint_label", length = 200)
    private String sprintLabel;

    @Column(name = "task_key", length = 120)
    private String taskKey;

    @Column(name = "task_label", length = 200)
    private String taskLabel;

    @Column(name = "resource_url", columnDefinition = "TEXT")
    private String resourceUrl;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "uploaded_by_user_id")
    private Integer uploadedByUserId;

    @Column(name = "uploaded_by_name", length = 160)
    private String uploadedByName;

    @Column(name = "created_by")
    private Integer createdBy;

    // LEARNER or FACULTY: learner and faculty ids are separate sequences, so createdBy alone cannot say who the
    // creator is (V197). Null on rows the migration could not attribute; those are never treated as learner-owned.
    @Column(name = "created_by_type", length = 20)
    private String createdByType;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "download_url", columnDefinition = "TEXT")
    private String downloadUrl;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
