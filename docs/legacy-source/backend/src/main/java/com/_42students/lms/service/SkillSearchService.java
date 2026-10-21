package com._42students.lms.service;

import com._42students.lms.dto.SkillSearchDTO;
import com._42students.lms.model.Skill;
import com._42students.lms.repository.SkillRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Advanced Skill Search Service
 * Implements multi-tier search with caching, fuzzy matching, and synonym support
 */
@Service
@Slf4j
public class SkillSearchService {
    
    @Autowired
    private SkillRepository skillRepository;
    
    // Common abbreviations/synonyms for in-memory lookup
    private static final Map<String, String> COMMON_SYNONYMS = new HashMap<>();
    
    static {
        // Programming Languages
        COMMON_SYNONYMS.put("js", "javascript");
        COMMON_SYNONYMS.put("ts", "typescript");
        COMMON_SYNONYMS.put("py", "python");
        COMMON_SYNONYMS.put("rb", "ruby");
        COMMON_SYNONYMS.put("cpp", "c++");
        COMMON_SYNONYMS.put("csharp", "c#");
        COMMON_SYNONYMS.put("golang", "go");
        
        // Frameworks & Libraries
        COMMON_SYNONYMS.put("rn", "react native");
        COMMON_SYNONYMS.put("ng", "angular");
        COMMON_SYNONYMS.put("vue", "vue.js");
        COMMON_SYNONYMS.put("node", "node.js");
        COMMON_SYNONYMS.put("express", "express.js");
        COMMON_SYNONYMS.put("spring", "spring boot");
        
        // Cloud & DevOps
        COMMON_SYNONYMS.put("k8s", "kubernetes");
        COMMON_SYNONYMS.put("aws", "amazon web services");
        COMMON_SYNONYMS.put("gcp", "google cloud platform");
        COMMON_SYNONYMS.put("az", "azure");
        COMMON_SYNONYMS.put("ci", "continuous integration");
        COMMON_SYNONYMS.put("cd", "continuous deployment");
        COMMON_SYNONYMS.put("cicd", "ci/cd");
        
        // Data Science & AI
        COMMON_SYNONYMS.put("ml", "machine learning");
        COMMON_SYNONYMS.put("ai", "artificial intelligence");
        COMMON_SYNONYMS.put("dl", "deep learning");
        COMMON_SYNONYMS.put("nlp", "natural language processing");
        COMMON_SYNONYMS.put("cv", "computer vision");
        COMMON_SYNONYMS.put("ds", "data science");
        
        // Databases
        COMMON_SYNONYMS.put("db", "database");
        COMMON_SYNONYMS.put("sql", "sql");
        COMMON_SYNONYMS.put("nosql", "nosql");
        COMMON_SYNONYMS.put("mongo", "mongodb");
        COMMON_SYNONYMS.put("postgres", "postgresql");
        COMMON_SYNONYMS.put("mysql", "mysql");
        
        // Other
        COMMON_SYNONYMS.put("fe", "frontend");
        COMMON_SYNONYMS.put("be", "backend");
        COMMON_SYNONYMS.put("ui", "user interface");
        COMMON_SYNONYMS.put("ux", "user experience");
        COMMON_SYNONYMS.put("api", "rest api");
        COMMON_SYNONYMS.put("qa", "quality assurance");
        COMMON_SYNONYMS.put("pm", "project management");
        COMMON_SYNONYMS.put("scrum", "scrum");
    }
    
    /**
     * Main search method - combines all search strategies
     * 
     * Search Flow:
     * 1. Expand synonyms (js -> javascript)
     * 2. Try ranked search (weighted by relevance + popularity)
     * 3. Try full-text search if few results
     * 4. Try synonym table search
     * 5. Fall back to fuzzy matching for typos
     */
    @Cacheable(value = "skillSearch", key = "#query.toLowerCase() + '_' + #limit", unless = "#result.isEmpty()")
    public List<SkillSearchDTO> searchSkills(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return getPopularSkills(limit);
        }
        
        String normalizedQuery = query.trim().toLowerCase();
        log.debug("Searching skills with query: '{}', limit: {}", normalizedQuery, limit);
        
        // Step 1: Expand common synonyms
        String expandedQuery = expandSynonyms(normalizedQuery);
        log.debug("Expanded query: '{}'", expandedQuery);
        
        // Step 2: Try ranked search first
        List<Skill> results = skillRepository.searchSkillsRanked(expandedQuery, limit);
        log.debug("Ranked search returned {} results", results.size());
        
        // Step 3: If query differs from expanded, also search with expanded
        if (!expandedQuery.equals(normalizedQuery) && results.size() < limit) {
            List<Skill> expandedResults = skillRepository.searchSkillsRanked(normalizedQuery, limit);
            results = mergeResults(results, expandedResults, limit);
        }
        
        // Step 4: If few results, try full-text search
        if (results.size() < 3 && normalizedQuery.length() >= 3) {
            List<Skill> fullTextResults = skillRepository.searchSkillsFullText(expandedQuery, limit);
            results = mergeResults(results, fullTextResults, limit);
            log.debug("Full-text search added results, total: {}", results.size());
        }
        
        // Step 5: Try synonym table search
        if (results.size() < 3) {
            try {
                List<Skill> synonymResults = skillRepository.searchBySynonym(normalizedQuery, limit);
                results = mergeResults(results, synonymResults, limit);
                log.debug("Synonym search added results, total: {}", results.size());
            } catch (Exception e) {
                // Synonym table might not exist yet
                log.debug("Synonym search skipped: {}", e.getMessage());
            }
        }
        
        // Step 6: If still no results, try fuzzy matching
        if (results.isEmpty() && normalizedQuery.length() >= 3) {
            results = fuzzySearch(normalizedQuery, limit);
            log.debug("Fuzzy search returned {} results", results.size());
        }
        
        return results.stream()
            .map(SkillSearchDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Get popular skills for empty queries or suggestions
     */
    @Cacheable(value = "popularSkills", key = "#limit")
    public List<SkillSearchDTO> getPopularSkills(int limit) {
        log.debug("Fetching top {} popular skills", limit);
        return skillRepository.findPopularSkills(PageRequest.of(0, limit))
            .stream()
            .map(SkillSearchDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Get skills by category
     */
    @Cacheable(value = "skillCategories", key = "#category")
    public List<SkillSearchDTO> getSkillsByCategory(String category, int limit) {
        return skillRepository.findByCategoryAndIsActiveTrueOrderByDisplayNameAsc(category)
            .stream()
            .limit(limit)
            .map(SkillSearchDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all categories
     */
    @Cacheable(value = "skillCategories", key = "'all'")
    public List<String> getAllCategories() {
        return skillRepository.findAllDistinctCategories();
    }
    
    /**
     * Record skill selection for popularity tracking
     * This runs asynchronously to not block the main request
     */
    @Async
    public void recordSkillSelection(Integer skillId) {
        try {
            skillRepository.incrementUsageCount(skillId);
            log.debug("Incremented usage count for skill ID: {}", skillId);
        } catch (Exception e) {
            log.warn("Failed to increment usage count for skill ID: {}", skillId, e);
        }
    }
    
    /**
     * Record multiple skill selections (batch)
     */
    @Async
    public void recordSkillSelections(List<Integer> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return;
        try {
            skillRepository.incrementUsageCountBatch(skillIds);
            log.debug("Incremented usage count for {} skills", skillIds.size());
        } catch (Exception e) {
            log.warn("Failed to batch increment usage counts", e);
        }
    }
    
    /**
     * Evict search caches (call after significant data changes)
     */
    @CacheEvict(value = {"skillSearch", "popularSkills", "allActiveSkills"}, allEntries = true)
    public void evictSearchCaches() {
        log.info("Search caches evicted");
    }
    
    // ==================== PRIVATE METHODS ====================
    
    /**
     * Expand common abbreviations to full terms
     */
    private String expandSynonyms(String query) {
        String expanded = COMMON_SYNONYMS.get(query);
        return expanded != null ? expanded : query;
    }
    
    /**
     * Fuzzy search using Levenshtein distance for typo tolerance
     */
    private List<Skill> fuzzySearch(String query, int limit) {
        // Get all skills for fuzzy matching (cached)
        List<Skill> allSkills = getCachedActiveSkills();
        
        return allSkills.stream()
            .map(skill -> {
                // Calculate distance to both name and first word of name
                int distanceName = levenshteinDistance(query, skill.getName().toLowerCase());
                String firstWord = getFirstWord(skill.getName().toLowerCase());
                int distanceFirstWord = levenshteinDistance(query, firstWord);
                int minDistance = Math.min(distanceName, distanceFirstWord);
                
                return new AbstractMap.SimpleEntry<>(skill, minDistance);
            })
            .filter(entry -> entry.getValue() <= 2) // Max 2 character difference
            .sorted(Comparator.<Map.Entry<Skill, Integer>>comparingInt(Map.Entry::getValue)
                .thenComparing(entry -> -entry.getKey().getUsageCount())) // Higher usage first
            .limit(limit)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all active skills (cached for fuzzy matching)
     */
    @Cacheable(value = "allActiveSkills")
    public List<Skill> getCachedActiveSkills() {
        return skillRepository.findByIsActiveTrueOrderByUsageCountDesc();
    }
    
    /**
     * Merge two result lists, avoiding duplicates
     */
    private List<Skill> mergeResults(List<Skill> primary, List<Skill> secondary, int limit) {
        Set<Integer> existingIds = primary.stream()
            .map(Skill::getId)
            .collect(Collectors.toSet());
        
        List<Skill> merged = new ArrayList<>(primary);
        
        for (Skill skill : secondary) {
            if (!existingIds.contains(skill.getId()) && merged.size() < limit) {
                merged.add(skill);
                existingIds.add(skill.getId());
            }
        }
        
        return merged;
    }
    
    /**
     * Get first word of a string
     */
    private String getFirstWord(String s) {
        if (s == null || s.isEmpty()) return "";
        int space = s.indexOf(' ');
        return space > 0 ? s.substring(0, space) : s;
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     * Used for fuzzy matching / typo tolerance
     */
    private int levenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) return Integer.MAX_VALUE;
        if (s1.equals(s2)) return 0;
        if (s1.isEmpty()) return s2.length();
        if (s2.isEmpty()) return s1.length();
        
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
}


