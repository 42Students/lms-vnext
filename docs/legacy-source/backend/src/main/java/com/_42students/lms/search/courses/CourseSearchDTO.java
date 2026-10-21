package com._42students.lms.search.courses;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for course search
 * Used for fast in-memory search without database queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSearchDTO implements SearchableDTO {
    
    private Integer id;
    private String slug; // Public identifier for URL obfuscation
    private String courseName;
    private String shortTitle;
    private Integer deptId;
    private String deptName;
    private Boolean active;
    private Boolean enabled;
    
    @Override
    public Object getId() {
        return id;
    }
    
    @Override
    public String getDisplayName() {
        if (courseName != null && !courseName.isEmpty()) {
            return courseName;
        }
        if (shortTitle != null && !shortTitle.isEmpty()) {
            return shortTitle;
        }
        return "";
    }
    
    /**
     * Get searchable text (all fields combined)
     */
    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (courseName != null) sb.append(courseName).append(" ");
        if (shortTitle != null) sb.append(shortTitle).append(" ");
        if (deptName != null) sb.append(deptName).append(" ");
        return sb.toString().trim();
    }
}


