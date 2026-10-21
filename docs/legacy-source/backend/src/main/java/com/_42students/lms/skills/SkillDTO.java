package com._42students.lms.skills;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for in-memory skill storage
 * Used for fast autocomplete without database
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillDTO {
    private String name;           // Normalized name (lowercase)
    private String displayName;    // Human-readable name
    private String category;       // Technical Skills, Soft Skills, etc.
    
    /**
     * Create CSV line
     */
    public String toCsvLine() {
        return String.format("%s,%s,%s", 
            escapeCsv(name), 
            escapeCsv(displayName), 
            escapeCsv(category));
    }
    
    /**
     * Parse from CSV line
     */
    public static SkillDTO fromCsvLine(String line) {
        String[] parts = line.split(",", 3);
        if (parts.length < 3) return null;
        
        return SkillDTO.builder()
            .name(unescapeCsv(parts[0]))
            .displayName(unescapeCsv(parts[1]))
            .category(unescapeCsv(parts[2]))
            .build();
    }
    
    private static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
    
    private static String unescapeCsv(String value) {
        if (value == null) return "";
        value = value.trim();
        if (value.startsWith("\"") && value.endsWith("\"")) {
            value = value.substring(1, value.length() - 1);
            value = value.replace("\"\"", "\"");
        }
        return value;
    }
}


