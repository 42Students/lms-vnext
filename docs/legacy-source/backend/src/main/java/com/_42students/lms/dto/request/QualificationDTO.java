package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.Map;

/**
 * DTO for a single qualification entry (matches LMS structure)
 */
@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class QualificationDTO {
    @NotBlank @Size(max = 255)
    private String educationType;      // 10th, 12th, Diploma, UG, PG, PhD
    @Size(max = 255)
    private String program;            // B.Tech, BE, MBA, etc. (optional for 10th/12th)
    @Size(max = 255)
    private String specialization;     // CSE, ECE, Finance, etc. (optional for 10th/12th)
    @NotBlank @Size(max = 255)
    private String institutionName;    // School/College Name (required)
    private String startYear;          // Start Year (optional)
    private String endYear;            // End Year (optional, disabled if currently pursuing)
    private Boolean isCurrentlyPursuing; // Currently pursuing this education
    private Boolean isRecentEducation;   // Recent education (typically same as isCurrentlyPursuing)
    private String gradingType;        // CGPA, Percentage, Grade, GPA
    private String grade;              // Grade/Marks value
    private String qualifyingExam;     // Qualifying Exam code (optional, e.g., "KCET", "JEE_MAIN", "CAT")
    private String examRank;           // Legacy field - Rank/Percentile (optional)
    private Map<String, Object> examDetails; // Structured exam details JSON (e.g., {"year": 2023, "percentile": 95.5, "air": 1500})
}



