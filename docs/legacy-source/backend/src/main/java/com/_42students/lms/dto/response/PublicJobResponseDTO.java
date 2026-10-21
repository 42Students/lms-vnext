package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for public job information (safe fields only, no internal data)
 * Used for external job links and public-facing APIs
 */
@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class PublicJobResponseDTO {
    
    private Integer id;
    private String jobTitle;
    private String companyName;
    private String companyLogo;
    private String jobDescription;
    private String jobResponsibilities;
    private String jobType;
    private String location;
    private String ctcRange;
    private LocalDateTime postedDate;
    private LocalDateTime applicationDeadline;
    /** Important dates (e.g. Application deadline, Screening round). List of { "label", "date" }. */
    private List<Map<String, Object>> importantDates;
    private String jobSlug;
    
    // Note: Excluded fields for security:
    // - evaluationConfig (internal screening rules)
    // - createdBy (admin user ID)
    // - organizationId (internal org scoping)
    // - collegeId (internal college scoping)
    // - targetDepartmentId, targetProgramId, etc. (targeting criteria)
    // - candidatePreferences (display-only, but not needed for external)
}


