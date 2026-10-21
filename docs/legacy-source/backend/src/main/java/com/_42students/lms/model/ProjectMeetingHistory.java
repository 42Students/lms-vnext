package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "project_meeting_history")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectMeetingHistory extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "project_meeting_id")
    private Integer projectMeetingId;

    @Column(name = "meeting_key", nullable = false, length = 120)
    private String meetingKey;

    @Column(name = "action_type", nullable = false, length = 40)
    private String actionType;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_user_type", length = 20)
    private String actorUserType;

    @Column(name = "actor_name", length = 160)
    private String actorName;

    @Type(type = "json")
    @Column(name = "before_json", columnDefinition = "json")
    private Object beforeJson;

    @Type(type = "json")
    @Column(name = "after_json", columnDefinition = "json")
    private Object afterJson;

    @Type(type = "json")
    @Column(name = "changed_fields", columnDefinition = "json")
    private Object changedFields;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
