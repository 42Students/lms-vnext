package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "project_delivery_event")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectDeliveryEvent extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "delivery_id", nullable = false)
    private Integer deliveryId;

    @Column(name = "action", length = 60)
    private String action;

    @Column(name = "status", length = 60)
    private String status;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "actor_name", length = 160)
    private String actorName;

    @Column(name = "actor_type", length = 20)
    private String actorType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "revision_count")
    private Integer revisionCount = 0;
}
