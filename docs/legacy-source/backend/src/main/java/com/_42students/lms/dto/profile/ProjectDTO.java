package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ProjectDTO {
    @Size(max = 300)
    private String name;
    @Size(max = 10000)
    private String description;
    @Pattern(regexp = "^(https?://.*)?$", message = "URL must use http or https")
    @Size(max = 500)
    private String githubUrl;
    @Pattern(regexp = "^(https?://.*)?$", message = "URL must use http or https")
    @Size(max = 500)
    private String liveUrl;
    private List<String> skillsUsed;
    private String startDate;
    private String endDate;
}

