package com._42students.lms.repository;

import com._42students.lms.model.SkillSynonym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillSynonymRepository extends JpaRepository<SkillSynonym, Integer> {
    
    /**
     * Find all synonyms for a skill
     */
    List<SkillSynonym> findBySkillId(Integer skillId);
    
    /**
     * Check if synonym exists
     */
    boolean existsBySynonym(String synonym);
    
    /**
     * Find synonym by exact match
     */
    @Query("SELECT ss FROM SkillSynonym ss WHERE LOWER(ss.synonym) = LOWER(:synonym)")
    List<SkillSynonym> findBySynonymIgnoreCase(@Param("synonym") String synonym);
}


