package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * Semester entity - represents a semester within a program.
 * Each program (e.g., B.Tech CS - 4 years) has multiple semesters (e.g., 8 semesters).
 * Courses are mapped to semesters via SemesterCourse entity.
 */
@Data
@Entity
@Table(name = "semester", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"program_id", "semester_number"})
})
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class Semester extends BaseModel {

    @Column(name = "program_id", nullable = false)
    private Integer programId;

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber; // 1, 2, 3... 8

    @Column(name = "name")
    private String name; // "Semester 1" or "First Year - Term 1"

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "total_credits")
    private Integer totalCredits;

    // Constructors
    public Semester() {}

    public Semester(Integer programId, Integer semesterNumber, String name) {
        this.programId = programId;
        this.semesterNumber = semesterNumber;
        this.name = name;
        this.isActive = true;
    }
}

