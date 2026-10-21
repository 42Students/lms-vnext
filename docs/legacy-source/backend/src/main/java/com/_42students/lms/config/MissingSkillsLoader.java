package com._42students.lms.config;

import com._42students.lms.model.Skill;
import com._42students.lms.repository.SkillRepository;
import com._42students.lms.util.LinkedInSkillsParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Loads missing skills from RTF file that are not in database
 * Run this to complete the skills database
 */
@Component
@Order(3) // Run after SkillsDataLoader and SynonymDataLoader
@Slf4j
public class MissingSkillsLoader implements CommandLineRunner {
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Value("${lms.skills.missing.load.enabled:false}")
    private boolean loadMissingEnabled;
    
    @Value("${lms.skills.rtf.path:skills-data/LISKILLSDUMP.rtf}")
    private String rtfFilePath;
    
    @Override
    public void run(String... args) {
        if (!loadMissingEnabled) {
            log.info("Missing skills loading is disabled. Set lms.skills.missing.load.enabled=true to enable.");
            return;
        }
        
        log.info("Starting missing skills load from: {}", rtfFilePath);
        
        try {
            // Parse RTF file
            Set<String> rtfSkills = LinkedInSkillsParser.parseSkillsFromRTF(rtfFilePath);
            log.info("Parsed {} unique skills from RTF file", rtfSkills.size());
            
            // Get existing skills from database
            List<Skill> existingSkills = skillRepository.findByIsActiveTrueOrderByDisplayNameAsc();
            Set<String> existingSkillNames = existingSkills.stream()
                .map(Skill::getName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
            log.info("Found {} existing skills in database", existingSkillNames.size());
            
            // Find missing skills
            Set<String> missingSkills = rtfSkills.stream()
                .filter(skill -> !existingSkillNames.contains(skill.toLowerCase()))
                .collect(Collectors.toSet());
            
            log.info("Found {} missing skills to load", missingSkills.size());
            
            if (missingSkills.isEmpty()) {
                log.info("No missing skills found. Database is complete!");
                return;
            }
            
            // Parse and categorize missing skills
            List<LinkedInSkillsParser.SkillData> skillsData = missingSkills.stream()
                .map(skillName -> {
                    String displayName = com._42students.lms.util.SkillCategorizer.createDisplayName(skillName);
                    String category = com._42students.lms.util.SkillCategorizer.categorize(skillName);
                    return new LinkedInSkillsParser.SkillData(skillName, displayName, category);
                })
                .sorted(java.util.Comparator.comparing(LinkedInSkillsParser.SkillData::getDisplayName))
                .collect(Collectors.toList());
            
            // Save in batches
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
                
                log.info("Saved batch: {}/{} missing skills", totalSaved, skillsData.size());
            }
            
            log.info("Successfully loaded {} missing skills into database", totalSaved);
            log.info("Total skills in database now: {}", skillRepository.count());
            
        } catch (Exception e) {
            log.error("Error loading missing skills", e);
            throw new RuntimeException("Failed to load missing skills", e);
        }
    }
}


