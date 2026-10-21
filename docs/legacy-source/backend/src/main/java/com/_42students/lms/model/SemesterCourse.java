package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * SemesterCourse entity - maps courses to semesters.
 * This defines which courses are taught in which semester of a program.
 */
@Data
@Entity
@Table(name = "semester_course", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"semester_id", "course_id"})
})
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class SemesterCourse extends BaseModel {

    @Column(name = "semester_id", nullable = false)
    private Integer semesterId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "is_mandatory")
    private Boolean isMandatory = true; // Core course or Elective

    @Column(name = "credits")
    private Integer credits = 3;

    @Column(name = "course_order")
    private Integer courseOrder; // Display order within the semester

    // Constructors
    public SemesterCourse() {}

    public SemesterCourse(Integer semesterId, Integer courseId) {
        this.semesterId = semesterId;
        this.courseId = courseId;
        this.isMandatory = true;
        this.credits = 3;
    }

    public SemesterCourse(Integer semesterId, Integer courseId, Boolean isMandatory, Integer credits) {
        this.semesterId = semesterId;
        this.courseId = courseId;
        this.isMandatory = isMandatory;
        this.credits = credits;
    }
}

