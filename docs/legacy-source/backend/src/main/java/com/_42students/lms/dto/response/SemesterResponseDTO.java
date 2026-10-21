package com._42students.lms.dto.response;

import com._42students.lms.model.Semester;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class SemesterResponseDTO {
    private Integer id;
    private Integer programId;
    private String programName;
    private Integer semesterNumber;
    private String name;
    private Boolean isActive;
    private Integer totalCredits;
    private List<CourseInfoDTO> courses;

    public SemesterResponseDTO() {}

    public SemesterResponseDTO(Semester semester) {
        this.id = semester.getId();
        this.programId = semester.getProgramId();
        this.semesterNumber = semester.getSemesterNumber();
        this.name = semester.getName();
        this.isActive = semester.getIsActive();
        this.totalCredits = semester.getTotalCredits();
    }

    public SemesterResponseDTO(Semester semester, String programName) {
        this(semester);
        this.programName = programName;
    }

    @Data
    @JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
    public static class CourseInfoDTO {
        private Integer id;              // Course ID
        private Integer mappingId;       // SemesterCourse mapping ID (for update/delete)
        private Integer courseId;        // Course ID (explicit)
        private String courseSlug;       // Public identifier for URL obfuscation
        private String courseName;
        private Integer credits;
        private Boolean isMandatory;
        private String courseCode;
        private Integer courseOrder;
    }
}

