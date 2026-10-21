package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Version;

@Data
@Entity
@Table(name = "project_template")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectTemplate extends BaseModel {

    // Uniqueness is enforced at the DB level on this column alone (see
    // V136__project_template_global.sql) — templates are now a single platform-wide catalog, not
    // a per-college tenant entity, so two templates can no longer legitimately share a slug the
    // way two different colleges' templates once could.
    @Column(name = "slug", nullable = false, length = 80)
    private String slug;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "course_label", length = 160)
    private String courseLabel;

    @Column(name = "status", length = 40)
    private String status = "IN_PROGRESS";

    @Column(name = "template_version", nullable = false)
    private Integer templateVersion = 1;

    @Column(name = "lifecycle_status", length = 20)
    private String lifecycleStatus = "DRAFT";

    @Column(name = "published_at")
    private java.time.LocalDateTime publishedAt;

    @Column(name = "archived_at")
    private java.time.LocalDateTime archivedAt;

    @Column(name = "phase", length = 80)
    private String phase;

    // Templates went global (see V136__project_template_global.sql): this is always NULL now.
    // Kept rather than dropped in case a future, different requirement resurfaces a per-org
    // template need — that would only need this column repopulated, not a schema change.
    @Column(name = "organization_id")
    private Integer organizationId;

    // Templates went global: always NULL now. A workspace created from a template still gets its
    // own collegeId (from the workspace payload) — this field is the template's own scope, which
    // no longer exists. See ProjectTemplateService/ProjectWorkspaceServiceImpl for the read/write
    // access rules that replaced the old "collegeId must match" check.
    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Type(type = "json")
    @Column(name = "overview", columnDefinition = "json")
    private Object overview;

    @Type(type = "json")
    @Column(name = "sprints", columnDefinition = "json")
    private Object sprints;

    @Type(type = "json")
    @Column(name = "tasks", columnDefinition = "json")
    private Object tasks;

    @Type(type = "json")
    @Column(name = "resources", columnDefinition = "json")
    private Object resources;

    @Type(type = "json")
    @Column(name = "delivery", columnDefinition = "json")
    private Object delivery;

    @Type(type = "json")
    @Column(name = "meetings", columnDefinition = "json")
    private Object meetings;

    @Type(type = "json")
    @Column(name = "activity", columnDefinition = "json")
    private Object activity;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for @Version
    // fields is "version == null" — a non-null default makes it call merge() instead of
    // persist() for brand-new rows, silently discarding the generated id on the caller's entity
    // reference (merge() returns a different managed instance).
    private Long version;
}
