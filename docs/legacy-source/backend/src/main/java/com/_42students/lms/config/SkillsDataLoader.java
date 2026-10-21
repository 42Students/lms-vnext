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

/**
 * CommandLineRunner to load LinkedIn skills data into database
 * Only runs if skills table is empty and load.skills.enabled=true
 */
@Slf4j
@Component
@Order(1)
public class SkillsDataLoader implements CommandLineRunner {
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Value("${lms.skills.load.enabled:false}")
    private boolean loadSkillsEnabled;
    
    @Value("${lms.skills.rtf.path:skills-data/LISKILLSDUMP.rtf}")
    private String rtfFilePath;
    
    @Override
    public void run(String... args) {
        if (!loadSkillsEnabled) {
            log.info("Skills data loading is disabled. Set lms.skills.load.enabled=true to enable.");
            return;
        }
        
        // Check if skills already exist
        long existingSkillsCount = skillRepository.count();
        if (existingSkillsCount > 0) {
            log.info("Skills table already contains {} skills. Skipping data load.", existingSkillsCount);
            return;
        }
        
        log.info("Starting LinkedIn skills data load from: {}", rtfFilePath);
        
        try {
            // Parse RTF file
            List<LinkedInSkillsParser.SkillData> skillsData = 
                LinkedInSkillsParser.parseAndCategorizeSkills(rtfFilePath);
            
            log.info("Parsed {} skills from RTF file. Starting database insert...", skillsData.size());
            
            // Convert to Skill entities and save in batches
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
                        return skill;
                    })
                    .collect(java.util.stream.Collectors.toList());
                
                skillRepository.saveAll(skills);
                totalSaved += skills.size();
                
                log.info("Saved batch: {}/{} skills", totalSaved, skillsData.size());
            }
            
            log.info("Successfully loaded {} skills into database", totalSaved);
            
        } catch (Exception e) {
            log.error("Error loading skills data", e);
            throw new RuntimeException("Failed to load skills data", e);
        }
    }
}


