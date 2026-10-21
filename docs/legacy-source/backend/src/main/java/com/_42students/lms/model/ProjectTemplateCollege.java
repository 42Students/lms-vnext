package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Data
@Entity
// A row's only two states are "exists" (assigned) or "doesn't" (unassigned) — unassigning
// deletes the row rather than flipping a status, so there is nothing here to soft-delete or
// update in place.
@Table(name = "project_template_college", uniqueConstraints = @UniqueConstraint(name = "uk_project_template_college", columnNames = {"template_id", "college_id"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectTemplateCollege extends BaseModel {

    @Column(name = "template_id", nullable = false)
    private Integer templateId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "assigned_by")
    private Integer assignedBy;
}
