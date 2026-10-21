package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "project_template_version")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectTemplateVersion extends BaseModel {

    @Column(name = "template_id", nullable = false)
    private Integer templateId;

    @Column(name = "template_version", nullable = false)
    private Integer templateVersion;

    @Column(name = "action_type", nullable = false, length = 40)
    private String actionType;

    @Column(name = "lifecycle_status", length = 20)
    private String lifecycleStatus;

    @Column(name = "changed_by")
    private Integer changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Type(type = "json")
    @Column(name = "snapshot_json", columnDefinition = "json")
    private Object snapshotJson;
}
