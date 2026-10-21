package com._42students.lms.dto.response;

import com._42students.lms.model.FacultyTeachingAssignment;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class FacultyTeachingAssignmentResponseDTO {
    private Integer id;
    private Integer facultyId;
    private String facultyName;
    private Integer courseId;
    private String courseSlug;
    private String courseName;
    private Integer classId;
    private String className;
    private Integer batchId;
    private String batchName;
    private Integer semesterNumber;
    private String academicYear;
    private String role;
    private Boolean isActive;
    private String courseImageUrl;
    /** An orphaned reference is degraded data, not a healthy unnamed course. */
    private Boolean metadataIncomplete;

    public FacultyTeachingAssignmentResponseDTO() {}

    public FacultyTeachingAssignmentResponseDTO(FacultyTeachingAssignment assignment) {
        this.id = assignment.getId();
        this.facultyId = assignment.getFacultyId();
        this.courseId = assignment.getCourseId();
        this.classId = assignment.getClassId();
        this.batchId = assignment.getBatchId();
        this.semesterNumber = assignment.getSemesterNumber();
        this.academicYear = assignment.getAcademicYear();
        this.role = assignment.getRole() != null ? assignment.getRole().name() : "PRIMARY";
        this.isActive = assignment.getIsActive();
        this.metadataIncomplete = false;
    }
}
