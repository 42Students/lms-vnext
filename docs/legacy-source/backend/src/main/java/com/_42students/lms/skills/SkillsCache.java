package com._42students.lms.skills;

import com._42students.lms.util.FuzzySearchUtil;
import com._42students.lms.util.SkillCategorizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-Memory Skills Cache
 * 
 * Loads skills from CSV file on startup for ultra-fast autocomplete.
 * No database required for skill lookups.
 * 
 * Features:
 * - O(1) exact match lookup
 * - Fast prefix search with pre-built index
 * - Fuzzy search with Levenshtein distance
 * - Synonym expansion
 * - Thread-safe
 */
@Component
@Slf4j
public class SkillsCache {
    
    @Value("${lms.skills.csv.path:skills-data/skills.csv}")
    private String csvPath;
    
    @Value("${lms.skills.rtf.path:skills-data/LISKILLSDUMP.rtf}")
    private String rtfPath;
    
    // Main storage
    private List<SkillDTO> allSkills = new ArrayList<>();
    
    // Lookup indexes for O(1) access
    private Map<String, SkillDTO> nameIndex = new ConcurrentHashMap<>();
    
    // Prefix index for fast prefix search
    private Map<String, List<SkillDTO>> prefixIndex = new ConcurrentHashMap<>();
    
    // Category index
    private Map<String, List<SkillDTO>> categoryIndex = new ConcurrentHashMap<>();
    
    // Common synonyms
    private static final Map<String, String> SYNONYMS = new HashMap<>();
    
    static {
        // Programming Languages
        SYNONYMS.put("js", "javascript");
        SYNONYMS.put("ts", "typescript");
        SYNONYMS.put("py", "python");
        SYNONYMS.put("rb", "ruby");
        SYNONYMS.put("cpp", "c++");
        SYNONYMS.put("csharp", "c#");
        SYNONYMS.put("golang", "go");
        
        // Frameworks
        SYNONYMS.put("rn", "react native");
        SYNONYMS.put("ng", "angular");
        SYNONYMS.put("node", "node.js");
        
        // Cloud & DevOps
        SYNONYMS.put("k8s", "kubernetes");
        SYNONYMS.put("aws", "amazon web services");
        SYNONYMS.put("gcp", "google cloud");
        SYNONYMS.put("az", "azure");
        
        // Data & AI
        SYNONYMS.put("ml", "machine learning");
        SYNONYMS.put("ai", "artificial intelligence");
        SYNONYMS.put("dl", "deep learning");
        SYNONYMS.put("nlp", "natural language processing");
        SYNONYMS.put("ds", "data science");
        
        // Other
        SYNONYMS.put("db", "database");
        SYNONYMS.put("fe", "frontend");
        SYNONYMS.put("be", "backend");
        SYNONYMS.put("ui", "user interface");
        SYNONYMS.put("ux", "user experience");
        SYNONYMS.put("qa", "quality assurance");
        SYNONYMS.put("pm", "project management");
    }
    
    @PostConstruct
    public void init() {
        log.info("Initializing Skills Cache...");
        
        // Try to load from CSV first, if not exists, generate from RTF
        if (!loadFromCsv()) {
            log.info("CSV not found, generating from RTF file...");
            generateFromRtf();
        }
        
        // Build indexes
        buildIndexes();
        
        log.info("Skills Cache initialized: {} skills loaded", allSkills.size());
    }
    
    /**
     * Load skills from CSV file
     */
    private boolean loadFromCsv() {
        try {
            ClassPathResource resource = new ClassPathResource(csvPath);
            if (!resource.exists()) {
                return false;
            }
            
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                
                String line;
                boolean isHeader = true;
                
                while ((line = reader.readLine()) != null) {
                    if (isHeader) {
                        isHeader = false;
                        continue; // Skip header
                    }
                    
                    SkillDTO skill = SkillDTO.fromCsvLine(line);
                    if (skill != null && skill.getName() != null && !skill.getName().isEmpty()) {
                        allSkills.add(skill);
                    }
                }
            }
            
            log.info("Loaded {} skills from CSV", allSkills.size());
            return !allSkills.isEmpty();
            
        } catch (Exception e) {
            log.warn("Failed to load skills from CSV: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Generate skills from RTF file
     */
    private void generateFromRtf() {
        try {
            ClassPathResource resource = new ClassPathResource(rtfPath);
            Set<String> skillNames = new HashSet<>();
            
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                
                String line;
                while ((line = reader.readLine()) != null) {
                    // Skip RTF formatting
                    if (line.trim().isEmpty() || 
                        line.startsWith("{\\rtf") ||
                        line.contains("\\f0\\") ||
                        line.contains("\\f1\\") ||
                        line.contains("\\cf0") ||
                        line.contains("\\pard") ||
                        line.contains("\\fonttbl") ||
                        line.contains("\\colortbl")) {
                        continue;
                    }
                    
                    // Clean RTF formatting
                    String skillLine = line.trim()
                        .replaceAll("\\\\[a-z]+\\d*\\s?", "") // Remove RTF commands
                        .replaceAll("[{}]", "") // Remove braces
                        .trim();
                    
                    if (skillLine.endsWith("\\")) {
                        skillLine = skillLine.substring(0, skillLine.length() - 1);
                    }
                    
                    if (skillLine.isEmpty() || skillLine.length() > 200) {
                        continue;
                    }
                    
                    // URL decode
                    try {
                        String decoded = URLDecoder.decode(skillLine, StandardCharsets.UTF_8);
                        decoded = decoded.trim().toLowerCase();
                        
                        // Filter out garbage
                        if (decoded.length() >= 1 && 
                            decoded.length() <= 200 &&
                            !decoded.matches("^\\d+$") &&
                            !decoded.startsWith("linkedin")) {
                            skillNames.add(decoded);
                        }
                    } catch (Exception e) {
                        // Skip invalid entries
                    }
                }
            }
            
            // Convert to DTOs
            for (String name : skillNames) {
                String displayName = SkillCategorizer.createDisplayName(name);
                String category = SkillCategorizer.categorize(name);
                
                allSkills.add(SkillDTO.builder()
                    .name(name)
                    .displayName(displayName)
                    .category(category)
                    .build());
            }
            
            // Sort by display name
            allSkills.sort(Comparator.comparing(SkillDTO::getDisplayName));
            
            log.info("Generated {} skills from RTF", allSkills.size());
            
            // Save to CSV for future use
            saveToCsv();
            
        } catch (Exception e) {
            log.error("Failed to generate skills from RTF", e);
        }
    }
    
    /**
     * Save skills to CSV file
     */
    private void saveToCsv() {
        try {
            // Try to find the resources directory relative to the class loader
            String resourcePath = getClass().getClassLoader().getResource("").getPath();
            // Handle Windows path issues
            if (resourcePath.startsWith("/") && resourcePath.contains(":")) {
                resourcePath = resourcePath.substring(1);
            }
            
            // Navigate from target/classes to src/main/resources
            File targetClasses = new File(resourcePath);
            File projectRoot = targetClasses.getParentFile().getParentFile();
            File outputFile = new File(projectRoot, "src/main/resources/" + csvPath);
            
            outputFile.getParentFile().mkdirs();
            
            try (PrintWriter writer = new PrintWriter(new FileWriter(outputFile))) {
                writer.println("name,display_name,category");
                for (SkillDTO skill : allSkills) {
                    writer.println(skill.toCsvLine());
                }
            }
            
            log.info("Saved {} skills to CSV: {}", allSkills.size(), outputFile.getAbsolutePath());
            
        } catch (Exception e) {
            log.warn("Could not save skills to CSV (non-critical): {}", e.getMessage());
            // Non-critical - skills will be generated from RTF on next startup
        }
    }
    
    /**
     * Build search indexes for fast lookups
     */
    private void buildIndexes() {
        // Name index for O(1) exact lookup
        for (SkillDTO skill : allSkills) {
            nameIndex.put(skill.getName().toLowerCase(), skill);
        }
        
        // Prefix index for fast prefix search
        for (SkillDTO skill : allSkills) {
            String name = skill.getName().toLowerCase();
            for (int i = 1; i <= Math.min(5, name.length()); i++) {
                String prefix = name.substring(0, i);
                prefixIndex.computeIfAbsent(prefix, k -> new ArrayList<>()).add(skill);
            }
            
            // Also index first word of display name
            String[] words = skill.getDisplayName().toLowerCase().split("\\s+");
            if (words.length > 0) {
                String firstWord = words[0];
                for (int i = 1; i <= Math.min(5, firstWord.length()); i++) {
                    String prefix = firstWord.substring(0, i);
                    List<SkillDTO> list = prefixIndex.computeIfAbsent(prefix, k -> new ArrayList<>());
                    if (!list.contains(skill)) {
                        list.add(skill);
                    }
                }
            }
        }
        
        // Category index
        for (SkillDTO skill : allSkills) {
            categoryIndex.computeIfAbsent(skill.getCategory(), k -> new ArrayList<>()).add(skill);
        }
        
        log.info("Built indexes: {} name entries, {} prefix entries, {} categories",
            nameIndex.size(), prefixIndex.size(), categoryIndex.size());
    }
    
    // ==================== PUBLIC SEARCH METHODS ====================
    
    /**
     * Search skills with weighted ranking
     * 
     * @param query Search query
     * @param limit Maximum results
     * @return Sorted list of matching skills
     */
    public List<SkillDTO> search(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return getPopular(limit);
        }
        
        String normalizedQuery = query.trim().toLowerCase();
        
        // Expand synonyms
        String expandedQuery = SYNONYMS.getOrDefault(normalizedQuery, normalizedQuery);
        
        // Try exact match first
        SkillDTO exact = nameIndex.get(expandedQuery);
        if (exact != null && normalizedQuery.equals(expandedQuery)) {
            List<SkillDTO> results = new ArrayList<>();
            results.add(exact);
            
            // Add prefix matches
            List<SkillDTO> prefixMatches = prefixIndex.getOrDefault(expandedQuery, Collections.emptyList());
            for (SkillDTO skill : prefixMatches) {
                if (!results.contains(skill) && results.size() < limit) {
                    results.add(skill);
                }
            }
            
            return results;
        }
        
        // Prefix search
        List<SkillDTO> prefixMatches = prefixIndex.getOrDefault(
            expandedQuery.substring(0, Math.min(3, expandedQuery.length())), 
            Collections.emptyList()
        );
        
        // Score and sort results
        List<ScoredSkill> scored = new ArrayList<>();
        
        // Add prefix matches
        for (SkillDTO skill : prefixMatches) {
            int score = calculateScore(expandedQuery, skill);
            if (score > 0) {
                scored.add(new ScoredSkill(skill, score));
            }
        }
        
        // If few results, do fuzzy search
        if (scored.size() < 5 && normalizedQuery.length() >= 3) {
            List<SkillDTO> fuzzyMatches = FuzzySearchUtil.fuzzySearch(
                allSkills, normalizedQuery, SkillDTO::getName, 2, limit
            );
            
            for (SkillDTO skill : fuzzyMatches) {
                if (scored.stream().noneMatch(s -> s.skill.getName().equals(skill.getName()))) {
                    scored.add(new ScoredSkill(skill, 20)); // Lower score for fuzzy
                }
            }
        }
        
        // Sort by score descending
        scored.sort((a, b) -> Integer.compare(b.score, a.score));
        
        // Convert to list and limit
        return scored.stream()
            .limit(limit)
            .map(s -> s.skill)
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate match score
     */
    private int calculateScore(String query, SkillDTO skill) {
        String name = skill.getName().toLowerCase();
        String displayName = skill.getDisplayName().toLowerCase();
        
        // Exact match
        if (name.equals(query)) return 100;
        if (displayName.equalsIgnoreCase(query)) return 95;
        
        // Starts with
        if (name.startsWith(query)) return 80;
        if (displayName.toLowerCase().startsWith(query)) return 75;
        
        // Word starts with
        String[] words = displayName.split("\\s+");
        for (String word : words) {
            if (word.toLowerCase().startsWith(query)) return 60;
        }
        
        // Contains
        if (name.contains(query)) return 40;
        if (displayName.toLowerCase().contains(query)) return 35;
        
        return 0;
    }
    
    /**
     * Get popular skills (for empty query)
     */
    public List<SkillDTO> getPopular(int limit) {
        // Return some common skills
        List<String> popularNames = Arrays.asList(
            "java", "python", "javascript", "react", "sql", "excel",
            "communication", "leadership", "project management", "data analysis",
            "machine learning", "aws", "docker", "git", "agile"
        );
        
        List<SkillDTO> popular = new ArrayList<>();
        for (String name : popularNames) {
            SkillDTO skill = nameIndex.get(name);
            if (skill != null && popular.size() < limit) {
                popular.add(skill);
            }
        }
        
        // Fill remaining with alphabetically first skills
        if (popular.size() < limit) {
            for (SkillDTO skill : allSkills) {
                if (!popular.contains(skill) && popular.size() < limit) {
                    popular.add(skill);
                }
            }
        }
        
        return popular;
    }
    
    /**
     * Get exact skill by name
     */
    public Optional<SkillDTO> getByName(String name) {
        if (name == null) return Optional.empty();
        return Optional.ofNullable(nameIndex.get(name.toLowerCase()));
    }
    
    /**
     * Get skills by category
     */
    public List<SkillDTO> getByCategory(String category, int limit) {
        return categoryIndex.getOrDefault(category, Collections.emptyList())
            .stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all categories
     */
    public List<String> getCategories() {
        return new ArrayList<>(categoryIndex.keySet());
    }
    
    /**
     * Get total skill count
     */
    public int size() {
        return allSkills.size();
    }
    
    /**
     * Check if skill exists
     */
    public boolean exists(String name) {
        return name != null && nameIndex.containsKey(name.toLowerCase());
    }
    
    // Helper class for scoring
    private static class ScoredSkill {
        final SkillDTO skill;
        final int score;
        
        ScoredSkill(SkillDTO skill, int score) {
            this.skill = skill;
            this.score = score;
        }
    }
}


