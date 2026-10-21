package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class AssignmentResourceDTO {
    private String id;
    private String type;
    private String title;
    private String text;
    private String link;
    private FileDTO fileDTO;
}
