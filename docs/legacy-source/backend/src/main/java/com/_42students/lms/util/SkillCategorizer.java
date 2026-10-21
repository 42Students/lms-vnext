package com._42students.lms.util;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Utility class for categorizing skills automatically based on keywords
 */
public class SkillCategorizer {
    
    private static final Set<String> TECHNICAL_KEYWORDS = new HashSet<>(Arrays.asList(
        "java", "python", "javascript", "react", "angular", "vue", "node", "sql", "database",
        "aws", "azure", "cloud", "docker", "kubernetes", "git", "linux", "windows", "ios", "android",
        "spring", "django", "flask", "express", "framework", "api", "rest", "graphql",
        "html", "css", "sass", "less", "typescript", "php", "ruby", "go", "rust", "c++", "c#",
        "mongodb", "mysql", "postgresql", "redis", "elasticsearch", "oracle",
        "machine learning", "ai", "artificial intelligence", "data science", "big data",
        "devops", "ci/cd", "jenkins", "terraform", "ansible", "puppet", "chef"
    ));
    
    private static final Set<String> SOFT_SKILLS_KEYWORDS = new HashSet<>(Arrays.asList(
        "communication", "leadership", "teamwork", "problem solving", "critical thinking",
        "time management", "project management", "agile", "scrum", "collaboration",
        "negotiation", "presentation", "public speaking", "mentoring", "coaching",
        "emotional intelligence", "adaptability", "creativity", "innovation"
    ));
    
    private static final Set<String> CERTIFICATION_KEYWORDS = new HashSet<>(Arrays.asList(
        "certified", "certification", "aws", "azure", "google cloud", "oracle", "microsoft",
        "cisco", "comptia", "pmp", "scrum", "agile", "itil", "six sigma"
    ));
    
    private static final Set<String> DOMAIN_KEYWORDS = new HashSet<>(Arrays.asList(
        "healthcare", "finance", "banking", "insurance", "retail", "e-commerce",
        "manufacturing", "logistics", "supply chain", "pharmaceutical", "biotech",
        "education", "legal", "consulting", "marketing", "sales", "hr", "human resources"
    ));
    
    /**
     * Categorize a skill based on its name
     * @param skillName The skill name to categorize
     * @return Category name: "Technical Skills", "Soft Skills", "Certifications", "Domain Skills", or "General"
     */
    public static String categorize(String skillName) {
        if (skillName == null || skillName.trim().isEmpty()) {
            return "General";
        }
        
        String lowerSkill = skillName.toLowerCase().trim();
        
        // Check for certifications first (most specific)
        if (containsAnyKeyword(lowerSkill, CERTIFICATION_KEYWORDS)) {
            return "Certifications";
        }
        
        // Check for technical skills
        if (containsAnyKeyword(lowerSkill, TECHNICAL_KEYWORDS)) {
            return "Technical Skills";
        }
        
        // Check for soft skills
        if (containsAnyKeyword(lowerSkill, SOFT_SKILLS_KEYWORDS)) {
            return "Soft Skills";
        }
        
        // Check for domain skills
        if (containsAnyKeyword(lowerSkill, DOMAIN_KEYWORDS)) {
            return "Domain Skills";
        }
        
        // Default category
        return "General";
    }
    
    /**
     * Check if skill name contains any of the keywords
     */
    private static boolean containsAnyKeyword(String skillName, Set<String> keywords) {
        for (String keyword : keywords) {
            if (skillName.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Normalize skill name: URL decode, trim, and format
     */
    public static String normalizeSkillName(String rawSkill) {
        if (rawSkill == null) {
            return "";
        }
        
        // URL decode
        String decoded = java.net.URLDecoder.decode(rawSkill, java.nio.charset.StandardCharsets.UTF_8);
        
        // Replace hyphens and underscores with spaces for better readability
        decoded = decoded.replace("-", " ").replace("_", " ");
        
        // Trim and clean up multiple spaces
        decoded = decoded.trim().replaceAll("\\s+", " ");
        
        return decoded;
    }
    
    /**
     * Create display name from normalized name (capitalize first letter of each word)
     */
    public static String createDisplayName(String normalizedName) {
        if (normalizedName == null || normalizedName.trim().isEmpty()) {
            return "";
        }
        
        String[] words = normalizedName.split("\\s+");
        StringBuilder displayName = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            if (i > 0) {
                displayName.append(" ");
            }
            if (!words[i].isEmpty()) {
                displayName.append(words[i].substring(0, 1).toUpperCase())
                          .append(words[i].substring(1).toLowerCase());
            }
        }
        
        return displayName.toString();
    }
}



