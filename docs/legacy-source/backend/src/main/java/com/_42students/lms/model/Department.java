package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "department")
@Table(name = "department")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Department extends BaseModel {
    @Column(name = "name")
    private String name;
    @Column(name = "dept_chair_id")
    private Integer deptChairId;
    @Column(name = "dept_vice_chair_id")
    private Integer deptViceChairId;
    @Column(name = "college_id")
    private int collegeId;
}

