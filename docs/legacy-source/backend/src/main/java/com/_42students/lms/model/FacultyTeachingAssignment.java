package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.sql.Date;

/**
 * FacultyTeachingAssignment entity - assigns faculty to courses for specific classes.
 * This tracks who teaches what course to which class, with semester and academic year context.
 */
@Data
@Entity
@Table(name = "faculty_teaching_assignment")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class FacultyTeachingAssignment extends BaseModel {

    @Column(name = "faculty_id", nullable = false)
    private Integer facultyId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @Column(name = "batch_id")
    private Integer batchId; // Denormalized for easier queries

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber; // Which semester (1, 2, 3... 8)

    @Column(name = "academic_year")
    private String academicYear; // "2024-25"

    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    private TeachingRole role = TeachingRole.PRIMARY;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "start_date")
    private Date startDate;

    @Column(name = "end_date")
    private Date endDate;

    // Enum for teaching roles
    public enum TeachingRole {
        PRIMARY,      // Main instructor
        CO_TEACHER,   // Co-instructor
        TA            // Teaching Assistant
    }

    // Constructors
    public FacultyTeachingAssignment() {}

    public FacultyTeachingAssignment(Integer facultyId, Integer courseId, Integer classId, 
                                      Integer semesterNumber, String academicYear) {
        this.facultyId = facultyId;
        this.courseId = courseId;
        this.classId = classId;
        this.semesterNumber = semesterNumber;
        this.academicYear = academicYear;
        this.role = TeachingRole.PRIMARY;
        this.isActive = true;
    }
}

