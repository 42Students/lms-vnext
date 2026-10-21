package com._42students.lms.search.jobs;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight DTO for job search
 * Used for fast in-memory search without database queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchDTO implements SearchableDTO {

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
    private Boolean isActive;
    private Integer organizationId;
    private Integer collegeId;
    private Integer targetDepartmentId;
    private String targetDepartmentName;
    private Integer targetProgramId;
    private String targetProgramName;

    @Override
    public Object getId() {
        return id;
    }

    @Override
    public String getDisplayName() {
        // Prefer job title, fallback to job title only
        return jobTitle != null ? jobTitle : "";
    }

    /**
     * Get searchable text (all fields combined)
     */
    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (jobTitle != null) sb.append(jobTitle).append(" ");
        if (companyName != null) sb.append(companyName).append(" ");
        if (jobDescription != null) sb.append(jobDescription).append(" ");
        if (jobResponsibilities != null) sb.append(jobResponsibilities).append(" ");
        if (jobType != null) sb.append(jobType).append(" ");
        if (location != null) sb.append(location).append(" ");
        if (targetDepartmentName != null) sb.append(targetDepartmentName).append(" ");
        if (targetProgramName != null) sb.append(targetProgramName).append(" ");
        return sb.toString().trim();
    }
}

