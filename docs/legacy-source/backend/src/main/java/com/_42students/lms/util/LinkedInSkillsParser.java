package com._42students.lms.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Utility class to parse LinkedIn Skills Dump RTF file
 */
@Slf4j
public class LinkedInSkillsParser {
    
    /**
     * Parse RTF file and extract unique skills
     * @param resourcePath Path to RTF file in resources
     * @return Set of normalized skill names
     */
    public static Set<String> parseSkillsFromRTF(String resourcePath) {
        Set<String> skills = new HashSet<>();
        
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                
                String line;
                while ((line = reader.readLine()) != null) {
                    // Skip RTF formatting lines
                    if (line.trim().isEmpty() || 
                        line.startsWith("{\\rtf") || 
                        line.startsWith("\\") && !line.matches("^[a-zA-Z0-9%\\-\\+\\.]+\\\\$")) {
                        continue;
                    }
                    
                    // Extract skill name (remove trailing backslash)
                    String skillLine = line.trim();
                    if (skillLine.endsWith("\\")) {
                        skillLine = skillLine.substring(0, skillLine.length() - 1);
                    }
                    
                    // Skip empty lines and RTF control sequences
                    if (skillLine.isEmpty() || 
                        skillLine.startsWith("\\") || 
                        skillLine.startsWith("{") ||
                        skillLine.startsWith("}") ||
                        skillLine.contains("\\f") ||
                        skillLine.contains("\\cf") ||
                        skillLine.contains("\\fs") ||
                        skillLine.contains("\\b") ||
                        skillLine.contains("\\pard")) {
                        continue;
                    }
                    
                    // URL decode and normalize
                    String normalized = SkillCategorizer.normalizeSkillName(skillLine);
                    
                    if (!normalized.isEmpty() && normalized.length() <= 200) {
                        skills.add(normalized.toLowerCase());
                    }
                }
            }
            
            log.info("Parsed {} unique skills from RTF file", skills.size());
            
        } catch (Exception e) {
            log.error("Error parsing RTF file: {}", resourcePath, e);
            throw new RuntimeException("Failed to parse LinkedIn skills RTF file", e);
        }
        
        return skills;
    }
    
    /**
     * Parse skills and return as list of Skill objects with categorization
     */
    public static List<SkillData> parseAndCategorizeSkills(String resourcePath) {
        Set<String> skillNames = parseSkillsFromRTF(resourcePath);
        
        return skillNames.stream()
                .map(skillName -> {
                    String displayName = SkillCategorizer.createDisplayName(skillName);
                    String category = SkillCategorizer.categorize(skillName);
                    
                    return new SkillData(skillName, displayName, category);
                })
                .sorted(Comparator.comparing(SkillData::getDisplayName))
                .collect(Collectors.toList());
    }
    
    /**
     * Data class for parsed skill information
     */
    public static class SkillData {
        private final String name;
        private final String displayName;
        private final String category;
        
        public SkillData(String name, String displayName, String category) {
            this.name = name;
            this.displayName = displayName;
            this.category = category;
        }
        
        public String getName() {
            return name;
        }
        
        public String getDisplayName() {
            return displayName;
        }
        
        public String getCategory() {
            return category;
        }
    }
}


