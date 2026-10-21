package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class VideoIntroDTO {
    private String videoIntroUrl;
    private Boolean hasVideoIntro; // Indicates if video intro has been uploaded
    private String uploadedAt; // ISO timestamp string
}


