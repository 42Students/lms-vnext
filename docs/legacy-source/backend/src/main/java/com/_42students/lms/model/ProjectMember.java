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
// Mirrors uk_project_member_user in V74__project_workspaces.sql — this triple is a hard unique
// key regardless of is_deleted, so callers must revive the soft-deleted row instead of inserting.
@Table(name = "project_member", uniqueConstraints = @UniqueConstraint(name = "uk_project_member_user", columnNames = {"project_id", "user_id", "user_type"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectMember extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_type", nullable = false, length = 20)
    private String userType;

    @Column(name = "display_name", length = 160)
    private String displayName;

    @Column(name = "role_label", length = 80)
    private String roleLabel;

    @Column(name = "member_status", length = 40)
    private String memberStatus = "ACTIVE";

    @Column(name = "deleted_by_workspace", nullable = false)
    private Boolean deletedByWorkspace = false;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for @Version
    // fields is "version == null" — a non-null default makes it call merge() instead of
    // persist() for brand-new rows, silently discarding the generated id on the caller's entity
    // reference (merge() returns a different managed instance).
    private Long version;
}
