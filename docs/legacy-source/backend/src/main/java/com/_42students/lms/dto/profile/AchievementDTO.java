package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class AchievementDTO {
    @Size(max = 300)
    private String title;
    @Size(max = 10000)
    private String description;
    @Pattern(regexp = "^(\\d{4})?$", message = "Year must be a 4-digit number or empty")
    private String year;
}

