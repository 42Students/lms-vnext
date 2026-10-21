package com._42students.lms.dto.profile;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public class EducationDTO {
    // New structured fields
    @Size(max = 100)
    private String educationType; // 10th, 12th, Diploma, UG, PG, PhD
    @Size(max = 100)
    private String program; // B.Tech, BE, MBA, etc.
    @Size(max = 100)
    private String specialization; // CSE, ECE, Finance, etc.
    @NotBlank @Size(max = 300)
    private String institutionName;
    private String startYear;
    private String endYear;
    private Boolean isCurrentlyPursuing;
    @Size(max = 100)
    private String gradingType; // CGPA, Percentage, Grade, GPA
    @Size(max = 100)
    private String grade; // Grade obtained
    @Size(max = 100)
    private String maxGrade; // Optional: max scale (e.g. 10, 100, 4) for normalized screening
    private Boolean isRecentEducation; // Shows at top when true
    @Size(max = 100)
    private String qualifyingExam; // e.g., KCET, JEE_MAIN, GATE, CAT
    @Size(max = 200)
    private String examRank; // Legacy field - e.g., "23rd Rank", "95th percentile", "AIR 1500"
    private Map<String, Object> examDetails; // Structured exam details JSON

    // Legacy fields (keeping for backward compatibility)
    @Size(max = 100)
    private String degree;
    @Size(max = 100)
    private String field;
    @Size(max = 100)
    private String score;
    @Size(max = 2000)
    private String description;
    private String certificateUpload;
}

