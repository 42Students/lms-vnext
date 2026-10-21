package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ExperienceDTO {
    @NotBlank(message = "Organization name is required")
    @Size(max = 200, message = "Organization name cannot exceed 200 characters")
    private String organization;

    @Size(max = 200, message = "Designation cannot exceed 200 characters")
    private String designation;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private String from;
    private String to;
    private String experienceType; // Full-time, Part-time, Internship, Teaching, Industry
    private String location;
    private String internshipCertificateUpload;
    private String offerLetterUpload;
    private Boolean isPaid; // Whether the job/experience was paid

    @Size(max = 100, message = "Salary cannot exceed 100 characters")
    private String salary; // Salary/Compensation (e.g., "5 LPA", "$50k/year", "₹30k/month")
}

