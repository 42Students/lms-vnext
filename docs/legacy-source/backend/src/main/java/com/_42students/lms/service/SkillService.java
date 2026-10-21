package com._42students.lms.service;

import com._42students.lms.model.Skill;

import java.util.List;

public interface SkillService {
    
    /**
     * Search skills by query string
     * @param query Search term
     * @param limit Maximum number of results
     * @return List of matching skills
     */
    List<Skill> searchSkills(String query, int limit);
    
    /**
     * Get all skill categories
     * @return List of distinct category names
     */
    List<String> getAllCategories();
    
    /**
     * Get skills by category
     * @param category Category name
     * @return List of skills in the category
     */
    List<Skill> getSkillsByCategory(String category);
    
    /**
     * Get popular skills (most commonly used in profiles)
     * @param limit Maximum number of results
     * @return List of popular skills
     */
    List<Skill> getPopularSkills(int limit);
    
    /**
     * Find skill by exact name match
     * @param name Skill name (case-insensitive)
     * @return Skill if found, null otherwise
     */
    Skill findByName(String name);
}



