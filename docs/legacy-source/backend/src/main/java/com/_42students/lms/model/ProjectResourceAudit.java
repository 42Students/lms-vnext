package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "project_resource_audit")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectResourceAudit extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "project_resource_id")
    private Integer projectResourceId;

    @Column(name = "resource_key", nullable = false, length = 120)
    private String resourceKey;

    @Column(name = "action_type", nullable = false, length = 40)
    private String actionType;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_user_type", length = 20)
    private String actorUserType;

    @Column(name = "actor_name", length = 160)
    private String actorName;

    @Column(name = "resource_order")
    private Integer resourceOrder;

    @Column(name = "before_json", columnDefinition = "json")
    @Type(type = "json")
    private Object beforeJson;

    @Column(name = "after_json", columnDefinition = "json")
    @Type(type = "json")
    private Object afterJson;

    @Column(name = "changed_fields", columnDefinition = "json")
    @Type(type = "json")
    private Object changedFields;
}
