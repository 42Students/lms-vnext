package com._42students.lms.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;

/**
 * Skill synonyms for alternative search terms
 * e.g., "js" -> "javascript", "ml" -> "machine learning"
 */
@Entity
@Table(name = "skill_synonyms", indexes = {
    @Index(name = "idx_synonym", columnList = "synonym"),
    @Index(name = "idx_skill_id", columnList = "skill_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillSynonym {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @Column(name = "synonym", nullable = false, length = 100)
    private String synonym; // Alternative search term (lowercase)
    
    public SkillSynonym(Skill skill, String synonym) {
        this.skill = skill;
        this.synonym = synonym.toLowerCase().trim();
    }
}


