package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.*;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class CertificationDTO {
    @Size(max = 300)
    private String authority;

    @NotBlank
    @Size(max = 300)
    private String name;

    private String certificationDate;
    private String validityDate;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String certificateLink;

    private String certificateUpload;
    private String description;
}

