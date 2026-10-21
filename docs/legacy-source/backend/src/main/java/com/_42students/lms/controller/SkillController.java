package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.SkillSearchDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Skill;
import com._42students.lms.repository.SkillRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.SkillSearchService;
import com._42students.lms.service.SkillService;
import com._42students.lms.util.LinkedInSkillsParser;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.util.SkillsVerificationUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/skills")
@Slf4j
@Api(tags = "Skills API")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class SkillController extends BaseController {
    
    @Autowired
    private SkillService skillService;
    
    @Autowired
    private SkillSearchService skillSearchService;
    
    @Autowired
    private SkillsVerificationUtil verificationUtil;
    
    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Value("${lms.skills.rtf.path:skills-data/LISKILLSDUMP.rtf}")
    private String rtfFilePath;
    
    // ==================== ADVANCED SEARCH ENDPOINTS ====================
    
    @GetMapping("/search")
    @ApiOperation(value = "Search skills with advanced ranking", 
                  notes = "Search skills with weighted ranking, popularity boost, synonym expansion, and fuzzy matching")
    public ResponseEntity<Response<List<SkillSearchDTO>>> searchSkills(
            @ApiParam(value = "Search query (min 1 character)", example = "java")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results to return", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit) {
        try {
            List<SkillSearchDTO> skills = skillSearchService.searchSkills(query, limit);
            return new ResponseEntity<>(
                    new Response<>("success", "Skills retrieved successfully", skills),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error searching skills: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to search skills. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/popular")
    @ApiOperation(value = "Get popular skills", notes = "Returns most commonly used skills based on selection frequency")
    public ResponseEntity<Response<List<SkillSearchDTO>>> getPopularSkills(
            @ApiParam(value = "Number of popular skills to return", example = "10")
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            List<SkillSearchDTO> skills = skillSearchService.getPopularSkills(limit);
            return new ResponseEntity<>(
                    new Response<>("success", "Popular skills retrieved successfully", skills),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching popular skills: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch popular skills. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping("/{skillId}/select")
    @ApiOperation(value = "Record skill selection", notes = "Records that a user selected this skill (for popularity tracking)")
    public ResponseEntity<Response<Void>> recordSkillSelection(
            @ApiParam(value = "Skill ID", required = true)
            @PathVariable Integer skillId) {
        try {
            skillSearchService.recordSkillSelection(skillId);
            return new ResponseEntity<>(
                    new Response<>("success", "Selection recorded", null),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error recording skill selection: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to record selection", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping("/select/batch")
    @ApiOperation(value = "Record multiple skill selections", notes = "Records selection of multiple skills in one request")
    public ResponseEntity<Response<Void>> recordSkillSelectionsBatch(
            @ApiParam(value = "List of skill IDs", required = true)
            @RequestBody Map<String, List<Integer>> request) {
        try {
            List<Integer> skillIds = request.get("skillIds");
            if (skillIds != null && !skillIds.isEmpty()) {
                skillSearchService.recordSkillSelections(skillIds);
            }
            return new ResponseEntity<>(
                    new Response<>("success", "Selections recorded", null),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error recording skill selections: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to record selections", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // ==================== CATEGORY ENDPOINTS ====================
    
    @GetMapping("/categories")
    @ApiOperation(value = "Get all skill categories", notes = "Returns list of all distinct skill categories")
    public ResponseEntity<Response<List<String>>> getAllCategories() {
        try {
            List<String> categories = skillSearchService.getAllCategories();
            return new ResponseEntity<>(
                    new Response<>("success", "Categories retrieved successfully", categories),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching categories: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch categories. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/category/{category}")
    @ApiOperation(value = "Get skills by category", notes = "Returns skills in the specified category")
    public ResponseEntity<Response<List<SkillSearchDTO>>> getSkillsByCategory(
            @ApiParam(value = "Category name", required = true, example = "Technical Skills")
            @PathVariable String category,
            @ApiParam(value = "Maximum results", example = "50")
            @RequestParam(required = false, defaultValue = "50") int limit) {
        try {
            List<SkillSearchDTO> skills = skillSearchService.getSkillsByCategory(category, limit);
            return new ResponseEntity<>(
                    new Response<>("success", "Skills retrieved successfully", skills),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching skills by category: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to fetch skills. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    @PostMapping("/cache/evict")
    @ApiOperation(value = "Evict skill search caches", notes = "Admin endpoint to clear search caches")
    public ResponseEntity<Response<Void>> evictCaches() {
        // Was documented as "Admin endpoint" in the ApiOperation notes above but had zero actual
        // access control — reachable by any authenticated user. This is a global cache, not
        // college-scoped, so gate on super-admin rather than requirePerformAdminActionForCollege.
        accessControlService.requireSuperAdmin(securityContextUtil.getAuthenticatedUserPrincipal());
        try {
            skillSearchService.evictSearchCaches();
            return new ResponseEntity<>(
                    new Response<>("success", "Caches evicted successfully", null),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error evicting caches: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to evict caches", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // ==================== VERIFICATION ====================
    
    @GetMapping("/verify")
    @ApiOperation(value = "Verify RTF skills are in database", 
                  notes = "Compares RTF file skills with database and reports missing/extra skills")
    public ResponseEntity<Response<Map<String, Object>>> verifySkills() {
        try {
            SkillsVerificationUtil.VerificationReport report = 
                verificationUtil.verifySkills(rtfFilePath);
            
            Map<String, Object> result = new HashMap<>();
            result.put("rtfTotal", report.getRtfTotal());
            result.put("dbTotal", report.getDbTotal());
            result.put("matching", report.getMatching());
            result.put("matchPercentage", String.format("%.2f%%", report.getMatchPercentage()));
            result.put("missingCount", report.getMissingCount());
            result.put("extraCount", report.getExtraCount());
            result.put("missing", report.getMissing().stream().limit(100).collect(Collectors.toList()));
            result.put("extra", report.getExtra().stream().limit(100).collect(Collectors.toList()));
            
            return new ResponseEntity<>(
                    new Response<>("success", "Verification complete", result),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error verifying skills: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to verify skills. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping("/load-missing")
    @ApiOperation(value = "Load missing skills from RTF file", 
                  notes = "Loads skills from RTF file that are not in database. This may take a few minutes.")
    public ResponseEntity<Response<Map<String, Object>>> loadMissingSkills() {
        // Same gap as evictCaches above — was documented as admin-only with no enforcement.
        accessControlService.requireSuperAdmin(securityContextUtil.getAuthenticatedUserPrincipal());
        try {
            log.info("Manual trigger: Loading missing skills...");
            
            // Parse RTF
            Set<String> rtfSkills = com._42students.lms.util.LinkedInSkillsParser.parseSkillsFromRTF(rtfFilePath);
            
            // Get existing
            List<Skill> existing = skillRepository.findByIsActiveTrueOrderByDisplayNameAsc();
            Set<String> existingNames = existing.stream()
                .map(Skill::getName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
            
            // Find missing
            Set<String> missing = rtfSkills.stream()
                .filter(s -> !existingNames.contains(s.toLowerCase()))
                .collect(Collectors.toSet());
            
            if (missing.isEmpty()) {
                return new ResponseEntity<>(
                    new Response<>("success", "No missing skills found. Database is complete!", 
                        Map.of("loaded", 0, "total", skillRepository.count())),
                    HttpStatus.OK);
            }
            
            // Load missing skills
            List<LinkedInSkillsParser.SkillData> skillsData = missing.stream()
                .map(skillName -> {
                    String displayName = com._42students.lms.util.SkillCategorizer.createDisplayName(skillName);
                    String category = com._42students.lms.util.SkillCategorizer.categorize(skillName);
                    return new LinkedInSkillsParser.SkillData(skillName, displayName, category);
                })
                .collect(Collectors.toList());
            
            int batchSize = 1000;
            int totalSaved = 0;
            
            for (int i = 0; i < skillsData.size(); i += batchSize) {
                int end = Math.min(i + batchSize, skillsData.size());
                List<LinkedInSkillsParser.SkillData> batch = skillsData.subList(i, end);
                
                List<Skill> skills = batch.stream()
                    .map(data -> {
                        Skill skill = new Skill();
                        skill.setName(data.getName());
                        skill.setDisplayName(data.getDisplayName());
                        skill.setCategory(data.getCategory());
                        skill.setIsActive(true);
                        skill.setUsageCount(0);
                        skill.setSearchPriority(0);
                        return skill;
                    })
                    .collect(Collectors.toList());
                
                skillRepository.saveAll(skills);
                totalSaved += skills.size();
                log.info("Loaded batch: {}/{}", totalSaved, skillsData.size());
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("loaded", totalSaved);
            result.put("total", skillRepository.count());
            result.put("message", "Successfully loaded " + totalSaved + " missing skills");
            
            return new ResponseEntity<>(
                    new Response<>("success", "Missing skills loaded successfully", result),
                    HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error loading missing skills: ", e);
            return new ResponseEntity<>(
                    new Response<>("error", "Failed to load missing skills. Please try again or contact support.", null),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}




