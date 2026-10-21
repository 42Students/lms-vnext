package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
@Data
public class FileDTO {
    private long size;
    private String encoding;
    private String mimetype;
    private String fieldName;
    private String originalName;
    private String cloudStorageObject;
}
 
