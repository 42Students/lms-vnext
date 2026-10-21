package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class PublicationDTO {
    private String title;
    private String journal;
    private String year;
    private String doi;
    private String link;
    private String authors;  // Comma-separated author names
    private String description;  // Abstract/description
}

