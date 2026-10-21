package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class OrganizationData {
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String role;
    @Size(max = 255)
    private String image;
}

