package com._42students.lms.dto;

import com._42students.lms.model.Skill;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for skill search responses
 * Contains all necessary information for autocomplete and display
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SkillSearchDTO {
    
    private Integer id;
    private String name;
    private String displayName;
    private String category;
    private Integer usageCount;
    private Boolean isPopular;
    
    /**
     * Create DTO from Skill entity
     */
    public static SkillSearchDTO fromEntity(Skill skill) {
        if (skill == null) return null;
        
        return SkillSearchDTO.builder()
            .id(skill.getId())
            .name(skill.getName())
            .displayName(skill.getDisplayName())
            .category(skill.getCategory())
            .usageCount(skill.getUsageCount())
            .isPopular(skill.getUsageCount() != null && skill.getUsageCount() > 100)
            .build();
    }
}


