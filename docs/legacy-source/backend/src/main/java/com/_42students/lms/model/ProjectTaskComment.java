package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "project_task_comment")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectTaskComment extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "project_task_id", nullable = false)
    private Integer projectTaskId;

    @Column(name = "commenter_id")
    private Integer commenterId;

    @Column(name = "commenter_type", length = 20)
    private String commenterType;

    @Column(name = "commenter_name", length = 160)
    private String commenterName;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "progress_value")
    private Integer progressValue;

    @Column(name = "comment_type", length = 30)
    private String commentType;

    @Column(name = "task_status_snapshot", length = 30)
    private String taskStatusSnapshot;
}
