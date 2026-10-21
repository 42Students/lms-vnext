package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import java.util.List;

/**
 * Configuration for a single field in an exam
 */
@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ExamFieldConfig {
    private String name;           // "year", "percentile", "air", etc.
    private String label;          // "Year", "Percentile", "All India Rank"
    private String type;           // "number", "text", "dropdown"
    private Boolean required;
    private Double min;            // For validation (e.g., percentile: 0-100)
    private Double max;
    private String placeholder;
    private List<String> options;  // For dropdown type
}


