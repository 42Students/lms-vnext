package com._42students.lms.dto.request;

import com._42students.lms.enums.FacultyType;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;


@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class FacultyDTO {
    @NotBlank @Size(max = 255)
    private String firstName;
    @Min(1)
    private Integer facultyId;
    @Size(max = 255)
    private String lastName;
    @Size(max = 255)
    private String uniqueId;
    @Size(max = 255)
    private String contactMobile;
    @Size(max = 255)
    private String contactPhone;
    @Email @Size(max = 255)
    private String contactMail;
    @NotNull @Min(1)
    private Integer deptId;
    @NotNull @Min(1)
    private Integer collegeId;
    private FacultyType facultyType;
    @Size(max = 255)
    private String userType;
    @Size(max = 255)
    private String description;
    @Size(max = 255)
    private String gender;
    @Size(max = 255)
    private String dob;
    @Size(max = 255)
    private String department;
    @Size(max = 255)
    private String address;
    @Pattern(regexp = "^(https?://.*)?$")
    private String website;
    private List<String> skills;
    private List<OrganizationData> organizations;
    private List<Experience> experiences;
    private List<Qualifications> qualifications;
}

