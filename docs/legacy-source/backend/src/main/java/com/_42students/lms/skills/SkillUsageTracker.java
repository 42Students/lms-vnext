package com._42students.lms.skills;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Tracks skill usage for popularity ranking
 * 
 * Uses in-memory map with periodic DB sync.
 * Lightweight - doesn't block search operations.
 */
@Component
@Slf4j
public class SkillUsageTracker {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private SkillsCache skillsCache;
    
    // In-memory usage counts
    private Map<String, Integer> usageCounts = new ConcurrentHashMap<>();
    
    // Cache of popular skills (refreshed periodically)
    private List<SkillDTO> popularSkillsCache = new ArrayList<>();
    
    @PostConstruct
    public void init() {
        createTableIfNotExists();
        loadUsageCounts();
        refreshPopularCache();
    }
    
    /**
     * Create skill_usage table if not exists
     */
    private void createTableIfNotExists() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS skill_usage (" +
                "  skill_name VARCHAR(200) PRIMARY KEY," +
                "  usage_count INT DEFAULT 0," +
                "  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                ")"
            );
            log.info("skill_usage table ready");
        } catch (Exception e) {
            log.warn("Could not create skill_usage table: {}", e.getMessage());
        }
    }
    
    /**
     * Load usage counts from database
     */
    private void loadUsageCounts() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT skill_name, usage_count FROM skill_usage"
            );
            
            for (Map<String, Object> row : rows) {
                String name = (String) row.get("skill_name");
                Integer count = (Integer) row.get("usage_count");
                if (name != null && count != null) {
                    usageCounts.put(name.toLowerCase(), count);
                }
            }
            
            log.info("Loaded {} skill usage entries", usageCounts.size());
        } catch (Exception e) {
            log.warn("Could not load usage counts: {}", e.getMessage());
        }
    }
    
    /**
     * Record skill usage (async - doesn't block)
     */
    @Async
    public void recordUsage(String skillName) {
        if (skillName == null || skillName.isEmpty()) return;
        
        String normalized = skillName.toLowerCase();
        
        // Update in-memory
        usageCounts.merge(normalized, 1, Integer::sum);
        
        // Persist to database
        try {
            jdbcTemplate.update(
                "INSERT INTO skill_usage (skill_name, usage_count) VALUES (?, 1) " +
                "ON DUPLICATE KEY UPDATE usage_count = usage_count + 1",
                normalized
            );
        } catch (Exception e) {
            log.debug("Could not persist usage for skill: {}", skillName);
        }
    }
    
    /**
     * Record multiple usages
     */
    @Async
    public void recordUsages(List<String> skillNames) {
        for (String name : skillNames) {
            recordUsage(name);
        }
    }
    
    /**
     * Get usage count for a skill
     */
    public int getUsageCount(String skillName) {
        if (skillName == null) return 0;
        return usageCounts.getOrDefault(skillName.toLowerCase(), 0);
    }
    
    /**
     * Get popular skills based on usage
     */
    public List<SkillDTO> getPopularSkills(int limit) {
        if (popularSkillsCache.isEmpty() || popularSkillsCache.size() < limit) {
            refreshPopularCache();
        }
        return popularSkillsCache.stream().limit(limit).collect(Collectors.toList());
    }
    
    /**
     * Refresh popular skills cache
     */
    public void refreshPopularCache() {
        try {
            // Sort by usage count
            List<Map.Entry<String, Integer>> sorted = usageCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(100)
                .collect(Collectors.toList());
            
            List<SkillDTO> popular = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : sorted) {
                Optional<SkillDTO> skill = skillsCache.getByName(entry.getKey());
                skill.ifPresent(popular::add);
            }
            
            popularSkillsCache = popular;
            log.debug("Refreshed popular skills cache: {} entries", popular.size());
            
        } catch (Exception e) {
            log.warn("Could not refresh popular cache: {}", e.getMessage());
        }
    }
    
    /**
     * Get count of tracked skills
     */
    public int getTrackedCount() {
        return usageCounts.size();
    }
    
    /**
     * Get top N skills with usage counts
     */
    public Map<String, Integer> getTopSkills(int limit) {
        return usageCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(limit)
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (e1, e2) -> e1,
                LinkedHashMap::new
            ));
    }
}


