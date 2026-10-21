package com._42students.lms.repository;

import com._42students.lms.model.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Integer> {
    
    // ==================== ADVANCED SEARCH METHODS ====================
    
    /**
     * Tier 1: Exact match search (highest priority)
     */
    @Query("SELECT s FROM Skill s WHERE s.isActive = true AND LOWER(s.name) = LOWER(:query)")
    Optional<Skill> findExactMatch(@Param("query") String query);
    
    /**
     * Tier 2: Weighted/Ranked search - prioritizes exact match, then prefix, then contains
     * Includes popularity boost and search priority
     */
    @Query(value = 
        "SELECT s.*, " +
        "  (CASE " +
        "    WHEN LOWER(s.name) = LOWER(:query) THEN 100 " +
        "    WHEN LOWER(s.name) LIKE LOWER(CONCAT(:query, '%')) THEN 80 " +
        "    WHEN LOWER(s.display_name) LIKE LOWER(CONCAT(:query, '%')) THEN 70 " +
        "    WHEN LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) THEN 40 " +
        "    ELSE 20 " +
        "  END) + " +
        "  LEAST(s.usage_count / 10, 50) + " +
        "  s.search_priority AS relevance_score " +
        "FROM skills s " +
        "WHERE s.is_active = true AND (" +
        "  LOWER(s.name) LIKE LOWER(CONCAT(:query, '%')) OR " +
        "  LOWER(s.display_name) LIKE LOWER(CONCAT(:query, '%')) OR " +
        "  LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))" +
        ") " +
        "ORDER BY relevance_score DESC, LENGTH(s.name) ASC, s.display_name ASC " +
        "LIMIT :limit", 
        nativeQuery = true)
    List<Skill> searchSkillsRanked(@Param("query") String query, @Param("limit") int limit);
    
    /**
     * Tier 3: Full-text search for complex/multi-word queries
     * Note: Requires FULLTEXT index on name and display_name columns
     */
    @Query(value = 
        "SELECT s.* FROM skills s " +
        "WHERE s.is_active = true AND (" +
        "  LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        "  LOWER(s.display_name) LIKE LOWER(CONCAT('%', :query, '%'))" +
        ") " +
        "ORDER BY " +
        "  CASE WHEN LOWER(s.name) LIKE LOWER(CONCAT(:query, '%')) THEN 0 ELSE 1 END, " +
        "  s.usage_count DESC, LENGTH(s.name) ASC " +
        "LIMIT :limit", 
        nativeQuery = true)
    List<Skill> searchSkillsFullText(@Param("query") String query, @Param("limit") int limit);
    
    // ==================== POPULARITY METHODS ====================
    
    /**
     * Get popular skills (sorted by usage count)
     */
    @Query("SELECT s FROM Skill s WHERE s.isActive = true ORDER BY s.usageCount DESC, s.displayName ASC")
    List<Skill> findPopularSkills(Pageable pageable);
    
    /**
     * Increment usage count when a skill is selected
     */
    @Modifying
    @Transactional
    @Query("UPDATE Skill s SET s.usageCount = s.usageCount + 1 WHERE s.id = :skillId")
    void incrementUsageCount(@Param("skillId") Integer skillId);
    
    /**
     * Batch update usage counts for multiple skills
     */
    @Modifying
    @Transactional
    @Query("UPDATE Skill s SET s.usageCount = s.usageCount + 1 WHERE s.id IN :skillIds")
    void incrementUsageCountBatch(@Param("skillIds") List<Integer> skillIds);
    
    // ==================== SYNONYM SEARCH ====================
    
    /**
     * Search skills by synonym
     */
    @Query(value = 
        "SELECT DISTINCT s.* FROM skills s " +
        "INNER JOIN skill_synonyms syn ON s.id = syn.skill_id " +
        "WHERE s.is_active = true AND LOWER(syn.synonym) LIKE LOWER(CONCAT(:query, '%')) " +
        "ORDER BY s.usage_count DESC " +
        "LIMIT :limit", 
        nativeQuery = true)
    List<Skill> searchBySynonym(@Param("query") String query, @Param("limit") int limit);
    
    // ==================== BASIC METHODS ====================
    
    /**
     * Legacy search method (kept for backward compatibility)
     */
    @Query("SELECT s FROM Skill s WHERE s.isActive = true AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY s.displayName ASC")
    List<Skill> searchSkills(@Param("query") String query);
    
    /**
     * Find skill by exact name match (case-insensitive)
     */
    Optional<Skill> findByNameIgnoreCase(String name);
    
    /**
     * Find all active skills by category
     */
    List<Skill> findByCategoryAndIsActiveTrueOrderByDisplayNameAsc(String category);
    
    /**
     * Get all distinct categories
     */
    @Query("SELECT DISTINCT s.category FROM Skill s WHERE s.isActive = true ORDER BY s.category ASC")
    List<String> findAllDistinctCategories();
    
    /**
     * Find all active skills (for fuzzy matching cache)
     */
    List<Skill> findByIsActiveTrueOrderByDisplayNameAsc();
    
    /**
     * Find all active skills ordered by popularity
     */
    List<Skill> findByIsActiveTrueOrderByUsageCountDesc();
    
    /**
     * Count skills by category
     */
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.category = :category AND s.isActive = true")
    Long countByCategory(@Param("category") String category);
    
    /**
     * Find skills by IDs
     */
    List<Skill> findByIdIn(List<Integer> ids);
}



