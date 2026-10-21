package com._42students.lms.model;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "skills", indexes = {
    @Index(name = "idx_name", columnList = "name"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_display_name", columnList = "display_name"),
    @Index(name = "idx_active_category", columnList = "is_active,category"),
    @Index(name = "idx_usage_count", columnList = "usage_count"),
    @Index(name = "idx_search_priority", columnList = "search_priority")
})
@Data
public class Skill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", nullable = false, unique = true, length = 200)
    private String name; // Normalized skill name (lowercase, URL-decoded)
    
    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName; // Human-readable skill name
    
    @Column(name = "category", length = 50)
    private String category; // Technical Skills, Soft Skills, Domain Skills, Certifications, General
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // Usage count for popularity tracking - incremented when users select this skill
    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;
    
    // Manual search priority boost (0-100) - for important skills
    @Column(name = "search_priority", nullable = false)
    private Integer searchPriority = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}



