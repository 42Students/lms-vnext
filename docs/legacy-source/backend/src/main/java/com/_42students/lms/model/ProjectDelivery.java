package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.persistence.Table;
import javax.persistence.Version;

@Data
@Entity
@Table(name = "project_delivery")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectDelivery extends BaseModel {

    @Column(name = "project_id", nullable = false, unique = true)
    private Integer projectId;

    @Column(name = "status", length = 60)
    private String status = "Draft";

    @Column(name = "snapshot", columnDefinition = "TEXT")
    private String snapshot;

    @Transient
    private String summary;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_mime_type", length = 160)
    private String fileMimeType;

    @Column(name = "storage_key", columnDefinition = "TEXT")
    private String storageKey;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    // A list of {url, label, fileName, addedById, addedByName, addedAt} maps — lets the team
    // assemble the final submission additively instead of each paste/upload overwriting the
    // single attachmentUrl/sourceUrl above (which are kept as the "primary"/legacy attachment
    // for backward compatibility, untouched by this list).
    @Type(type = "json")
    @Column(name = "attachments", columnDefinition = "json")
    private Object attachments;

    @Column(name = "revision_count")
    private Integer revisionCount = 0;

    @Column(name = "draft_saved_at")
    private java.time.LocalDateTime draftSavedAt;

    @Column(name = "draft_saved_by_id")
    private Integer draftSavedById;

    @Column(name = "draft_saved_by_name", length = 160)
    private String draftSavedByName;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

    @Column(name = "submitted_by_id")
    private Integer submittedById;

    @Column(name = "submitted_by_name", length = 160)
    private String submittedByName;

    @Column(name = "submitted_by_type", length = 20)
    private String submittedByType;

    @Column(name = "review_status", length = 60)
    private String reviewStatus;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_id")
    private Integer reviewedById;

    @Column(name = "reviewed_by_name", length = 160)
    private String reviewedByName;

    @Column(name = "reviewed_by_type", length = 20)
    private String reviewedByType;

    @Column(name = "last_updated_at")
    private java.time.LocalDateTime lastUpdatedAt;

    @Column(name = "last_updated_by_id")
    private Integer lastUpdatedById;

    @Column(name = "last_updated_by_name", length = 160)
    private String lastUpdatedByName;

    @Column(name = "last_updated_by_type", length = 20)
    private String lastUpdatedByType;

    @Column(name = "locked_at")
    private java.time.LocalDateTime lockedAt;

    @Column(name = "locked_by_id")
    private Integer lockedById;

    @Column(name = "locked_by_name", length = 160)
    private String lockedByName;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
