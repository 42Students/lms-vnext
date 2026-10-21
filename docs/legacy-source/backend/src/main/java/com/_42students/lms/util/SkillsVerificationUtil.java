package com._42students.lms.util;

import com._42students.lms.model.Skill;
import com._42students.lms.repository.SkillRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Utility to verify all skills from RTF file are in database
 */
@Component
@Slf4j
public class SkillsVerificationUtil {
    
    @Autowired
    private SkillRepository skillRepository;
    
    /**
     * Verify all RTF skills are in database
     * @param rtfFilePath Path to RTF file
     * @return Verification report
     */
    public VerificationReport verifySkills(String rtfFilePath) {
        log.info("Starting skills verification...");
        
        // Parse RTF file
        Set<String> rtfSkills = LinkedInSkillsParser.parseSkillsFromRTF(rtfFilePath);
        log.info("Found {} unique skills in RTF file", rtfSkills.size());
        
        // Get all skills from database
        List<Skill> dbSkills = skillRepository.findByIsActiveTrueOrderByDisplayNameAsc();
        Set<String> dbSkillNames = dbSkills.stream()
            .map(Skill::getName)
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        log.info("Found {} skills in database", dbSkillNames.size());
        
        // Find missing skills
        Set<String> missingSkills = new HashSet<>(rtfSkills);
        missingSkills.removeAll(dbSkillNames);
        
        // Find extra skills in DB (not in RTF)
        Set<String> extraSkills = new HashSet<>(dbSkillNames);
        extraSkills.removeAll(rtfSkills);
        
        // Find matching skills
        Set<String> matchingSkills = new HashSet<>(rtfSkills);
        matchingSkills.retainAll(dbSkillNames);
        
        VerificationReport report = new VerificationReport();
        report.setRtfTotal(rtfSkills.size());
        report.setDbTotal(dbSkillNames.size());
        report.setMatching(matchingSkills.size());
        report.setMissing(missingSkills);
        report.setExtra(extraSkills);
        report.setMissingCount(missingSkills.size());
        report.setExtraCount(extraSkills.size());
        
        log.info("Verification complete:");
        log.info("  RTF skills: {}", report.getRtfTotal());
        log.info("  DB skills: {}", report.getDbTotal());
        log.info("  Matching: {}", report.getMatching());
        log.info("  Missing from DB: {}", report.getMissingCount());
        log.info("  Extra in DB: {}", report.getExtraCount());
        
        if (!missingSkills.isEmpty()) {
            log.warn("Missing skills (first 20): {}", 
                missingSkills.stream().limit(20).collect(Collectors.toList()));
        }
        
        return report;
    }
    
    /**
     * Verification report
     */
    public static class VerificationReport {
        private int rtfTotal;
        private int dbTotal;
        private int matching;
        private int missingCount;
        private int extraCount;
        private Set<String> missing = new HashSet<>();
        private Set<String> extra = new HashSet<>();
        
        // Getters and setters
        public int getRtfTotal() { return rtfTotal; }
        public void setRtfTotal(int rtfTotal) { this.rtfTotal = rtfTotal; }
        
        public int getDbTotal() { return dbTotal; }
        public void setDbTotal(int dbTotal) { this.dbTotal = dbTotal; }
        
        public int getMatching() { return matching; }
        public void setMatching(int matching) { this.matching = matching; }
        
        public int getMissingCount() { return missingCount; }
        public void setMissingCount(int missingCount) { this.missingCount = missingCount; }
        
        public int getExtraCount() { return extraCount; }
        public void setExtraCount(int extraCount) { this.extraCount = extraCount; }
        
        public Set<String> getMissing() { return missing; }
        public void setMissing(Set<String> missing) { this.missing = missing; }
        
        public Set<String> getExtra() { return extra; }
        public void setExtra(Set<String> extra) { this.extra = extra; }
        
        public double getMatchPercentage() {
            if (rtfTotal == 0) return 0;
            return (matching * 100.0) / rtfTotal;
        }
    }
}


