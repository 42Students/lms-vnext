package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ProfileHeaderDTO {
    private String firstName;
    private String lastName;
    private String rollNumber;      // For learner
    private String uniqueId;        // For faculty (employee ID)
    private String department;
    private Integer programId;      // For learner
    private Integer collegeId;
    private Integer deptId;         // For faculty
    private String facultyType;     // For faculty
    private String profileImage;
}

