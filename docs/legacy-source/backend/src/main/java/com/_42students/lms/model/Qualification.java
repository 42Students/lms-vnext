package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.util.Map;

@Data
@Entity(name = "qualification")
@Table(name = "qualification")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Qualification extends BaseModel {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;
    
    // New structured fields
    @Column(name = "education_type", nullable = false)
    private String educationType; // 10th, 12th, Diploma, UG, PG, PhD, etc.
    
    @Column(name = "program")
    private String program; // B.Tech, BE, MBA, M.Tech, etc.
    
    @Column(name = "specialization")
    private String specialization; // CSE, ECE, EEE, Finance, Marketing, etc.
    
    @Column(name = "institution_name", nullable = false)
    private String institutionName;
    
    @Column(name = "start_year")
    private String startYear;
    
    @Column(name = "end_year")
    private String endYear;
    
    @Column(name = "is_currently_pursuing", columnDefinition = "boolean default false")
    private Boolean isCurrentlyPursuing;
    
    @Column(name = "grading_type")
    private String gradingType; // CGPA, Percentage, Grade, etc.
    
    @Column(name = "grade")
    private String grade;

    @Column(name = "max_grade", length = 20)
    private String maxGrade; // Optional: e.g. "10" for CGPA, "100" for Percentage; enables normalized screening
    
    @Column(name = "is_recent_education", columnDefinition = "boolean default false")
    private Boolean isRecentEducation; // Shows at top when true
    
    // Legacy fields (keeping for backward compatibility, can be removed later)
    @Column(name = "degree")
    private String degree;
    
    @Column(name = "field")
    private String field;
    
    @Column(name = "score")
    private String score;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "certificate_upload", columnDefinition = "TEXT")
    private String certificateUpload;
    
    // Qualifying exam fields
    @Column(name = "qualifying_exam")
    private String qualifyingExam; // e.g., "KCET", "JEE_MAIN", "GATE", "CAT"
    
    @Column(name = "exam_rank")
    private String examRank; // Legacy field - e.g., "23rd Rank", "95th percentile", "AIR 1500"
    
    // Structured exam details (JSON) - Dynamic fields based on exam type
    @Column(name = "exam_details", columnDefinition = "json")
    @Type(type = "json")
    private Map<String, Object> examDetails; // e.g., {"year": 2023, "percentile": 95.5, "air": 1500}
}

