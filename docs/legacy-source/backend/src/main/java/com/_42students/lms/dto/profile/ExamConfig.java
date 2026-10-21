package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import java.util.List;

/**
 * Configuration for a qualifying exam
 */
@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ExamConfig {
    private String examCode;       // "CAT", "JEE_MAIN", etc.
    private String examName;       // "CAT", "JEE Main"
    private String level;          // "UG", "PG"
    private List<ExamFieldConfig> fields;
}


