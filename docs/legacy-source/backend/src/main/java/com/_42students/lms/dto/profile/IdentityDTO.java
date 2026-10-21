package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class IdentityDTO {
    private String aadhaarNumber;
    private String panNumber;
    private String aadhaarUpload;
    private String panUpload;
}

