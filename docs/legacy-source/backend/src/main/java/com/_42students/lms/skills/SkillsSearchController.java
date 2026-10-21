package com._42students.lms.skills;

import com._42students.lms.dto.response.Response;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Skills Search Controller
 * 
 * Uses in-memory cache for ultra-fast autocomplete.
 * No database queries - all searches are in-memory.
 */
@RestController
@RequestMapping("/api/v2/skills")
@Slf4j
@Api(tags = "Skills Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class SkillsSearchController {
    
    @Autowired
    private SkillsCache skillsCache;
    
    @Autowired
    private SkillUsageTracker usageTracker;
    
    @GetMapping("/search")
    @ApiOperation(value = "Search skills (in-memory)", 
                  notes = "Ultra-fast skill search using in-memory cache. Supports fuzzy matching and synonyms.")
    public ResponseEntity<Response<List<SkillDTO>>> search(
            @ApiParam(value = "Search query", example = "java")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit) {
        
        long start = System.currentTimeMillis();
        List<SkillDTO> results = skillsCache.search(query, limit);
        long duration = System.currentTimeMillis() - start;
        
        log.debug("Skill search '{}' returned {} results in {}ms", query, results.size(), duration);
        
        return ResponseEntity.ok(
            new Response<>("success", "Skills retrieved in " + duration + "ms", results)
        );
    }
    
    @GetMapping("/popular")
    @ApiOperation(value = "Get popular skills", notes = "Returns commonly used skills")
    public ResponseEntity<Response<List<SkillDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        
        // Get popular skills from usage tracker, fall back to cache defaults
        List<SkillDTO> popular = usageTracker.getPopularSkills(limit);
        
        if (popular.isEmpty()) {
            popular = skillsCache.getPopular(limit);
        }
        
        return ResponseEntity.ok(
            new Response<>("success", "Popular skills retrieved", popular)
        );
    }
    
    @GetMapping("/categories")
    @ApiOperation(value = "Get all skill categories")
    public ResponseEntity<Response<List<String>>> getCategories() {
        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", skillsCache.getCategories())
        );
    }
    
    @GetMapping("/category/{category}")
    @ApiOperation(value = "Get skills by category")
    public ResponseEntity<Response<List<SkillDTO>>> getByCategory(
            @PathVariable String category,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        
        List<SkillDTO> skills = skillsCache.getByCategory(category, limit);
        return ResponseEntity.ok(
            new Response<>("success", "Skills retrieved", skills)
        );
    }
    
    @PostMapping("/{skillName}/select")
    @ApiOperation(value = "Record skill selection", notes = "Track skill usage for popularity ranking")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable String skillName) {
        
        usageTracker.recordUsage(skillName);
        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }
    
    @GetMapping("/stats")
    @ApiOperation(value = "Get skills cache statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSkills", skillsCache.size());
        stats.put("categories", skillsCache.getCategories().size());
        stats.put("popularSkillsTracked", usageTracker.getTrackedCount());
        
        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }
    
    @GetMapping("/exists/{skillName}")
    @ApiOperation(value = "Check if skill exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String skillName) {
        return ResponseEntity.ok(
            new Response<>("success", "Checked", skillsCache.exists(skillName))
        );
    }
}



