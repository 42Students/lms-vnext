package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "project_activity_event")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectActivityEvent extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "project_slug", nullable = false, length = 120)
    private String projectSlug;

    @Column(name = "event_key", nullable = false, length = 120)
    private String eventKey;

    // Stable machine code (e.g. "PROJECT_TASK_CREATED"), distinct from eventType below which
    // holds the human-readable label the Activity tab displays — eventKey is a UUID-suffixed
    // unique row id, neither of which a future API consumer can reliably filter on.
    @Column(name = "event_code", length = 60)
    private String eventCode;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "source_tab", length = 40)
    private String sourceTab;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id", length = 120)
    private String entityId;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_user_type", length = 20)
    private String actorUserType;

    @Column(name = "actor_name", length = 160)
    private String actorName;

    @Type(type = "json")
    @Column(name = "metadata_json", columnDefinition = "json")
    private Object metadataJson;
}
