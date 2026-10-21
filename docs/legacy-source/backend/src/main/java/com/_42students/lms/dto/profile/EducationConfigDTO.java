package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import java.util.Map;

/**
 * DTO for education configuration (types, programs, specializations)
 * Used to provide dropdown options to frontend
 */
@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class EducationConfigDTO {
    private Map<String, EducationTypeConfig> educationTypes;
    
    @Data
    public static class EducationTypeConfig {
        private String label;
        private Boolean requiresInstitutionAutocomplete; // true for UG/PG (use autocomplete), false for others (manual input)
        private Map<String, ProgramConfig> programs;
    }
    
    @Data
    public static class ProgramConfig {
        private String label;
        private String[] specializations;
    }
}



