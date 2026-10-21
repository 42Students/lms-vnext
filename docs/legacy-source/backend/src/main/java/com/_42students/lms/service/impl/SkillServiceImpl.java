package com._42students.lms.service.impl;

import com._42students.lms.model.Skill;
import com._42students.lms.repository.SkillRepository;
import com._42students.lms.service.SkillService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SkillServiceImpl implements SkillService {
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Override
    public List<Skill> searchSkills(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return skillRepository.findByIsActiveTrueOrderByDisplayNameAsc()
                    .stream()
                    .limit(limit)
                    .collect(Collectors.toList());
        }
        
        List<Skill> results = skillRepository.searchSkills(query.trim());
        
        // Limit results
        return results.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<String> getAllCategories() {
        return skillRepository.findAllDistinctCategories();
    }
    
    @Override
    public List<Skill> getSkillsByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return skillRepository.findByIsActiveTrueOrderByDisplayNameAsc();
        }
        
        return skillRepository.findByCategoryAndIsActiveTrueOrderByDisplayNameAsc(category.trim());
    }
    
    @Override
    public List<Skill> getPopularSkills(int limit) {
        // For now, return first N skills alphabetically
        // TODO: Implement popularity based on actual usage in learner/faculty profiles
        return skillRepository.findByIsActiveTrueOrderByDisplayNameAsc()
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    @Override
    public Skill findByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        
        return skillRepository.findByNameIgnoreCase(name.trim())
                .orElse(null);
    }
}



