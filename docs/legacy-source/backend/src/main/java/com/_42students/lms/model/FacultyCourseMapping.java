package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "faculty_course_mapping")
@Table(name = "faculty_course_mapping")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class FacultyCourseMapping extends BaseModel {
    @Column(name = "faculty_id")
    private int facultyId;
    @Column(name = "course_id")
    private Integer courseId;
    @Column(name = "class_id")
    private Integer classId;
    @Column(name = "active")
    private int active = 1; // Set default value to 1

}
 
