package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity
@Table(name = "new_program")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class NewProgram extends BaseModel {
    @Column(name = "name")
    private String name;

    @Column(name = "dept_id")
    private int deptId;

    @Column(name = "duration_years")
    private int durationYears; // Duration in years (e.g., 4 for B.Tech, 2 for MBA)
}

