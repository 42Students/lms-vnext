package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class Qualifications {
    @NotBlank @Size(max = 255)
    private String organization;
    @Size(max = 255)
    private String score;
    @Size(max = 255)
    private String description;
    @Size(max = 255)
    private String from;
    @Size(max = 255)
    private String to;
}


