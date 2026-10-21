package com._42students.lms.model;

import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Application Screening Result
 * Stores screening results for job applications after they are submitted.
 * Screening runs asynchronously after application is created.
 */
@Entity
@Table(name = "application_screening", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"application_id"})
})
@TypeDef(name = "json", typeClass = JsonType.class)
@Getter
@Setter
public class ApplicationScreening extends BaseModel {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private JobApplication application;

    /**
     * Screening status: PENDING | COMPLETED | FAILED
     * - PENDING: Screening record created, screening not yet performed
     * - COMPLETED: Screening successfully completed with scores
     * - FAILED: Screening failed due to error
     */
    @Column(name = "screening_status", nullable = false)
    private String screeningStatus = "PENDING";

    /**
     * Overall screening score (0.0 to 1.0)
     * Higher score = better match
     * Only populated when screening_status = COMPLETED
     */
    @Column(name = "overall_score")
    private Double overallScore;

    /**
     * Skill match score (0.0 to 1.0)
     */
    @Column(name = "skill_score")
    private Double skillScore = 0.0;

    /**
     * Education match score (0.0 to 1.0)
     */
    @Column(name = "education_score")
    private Double educationScore = 0.0;

    /**
     * List of matched skills (skills learner has that job requires)
     */
    @Type(type = "json")
    @Column(name = "matched_skills", columnDefinition = "json")
    private Object matchedSkills; // JSON: List<String>

    /**
     * List of missing skills (skills job requires that learner doesn't have)
     */
    @Type(type = "json")
    @Column(name = "missing_skills", columnDefinition = "json")
    private Object missingSkills; // JSON: List<String>

    /**
     * Human-readable explanation of screening result
     * Includes information about excluded attributes and partial scoring
     */
    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    /**
     * TRUST & FAIRNESS: Is this a partial score?
     * true = Some attributes excluded from scoring (missing data or not defined)
     * false = All defined attributes included in scoring (complete score)
     */
    @Column(name = "is_partial_score")
    private Boolean isPartialScore = false;

    /**
     * TRUST & FAIRNESS: Excluded attributes from scoring
     * JSON structure: {
     *   "excludedSkills": "reason",
     *   "excludedEducation": "reason",
     *   "excludedDegree": "reason",
     *   "excludedGpa": "reason",
     *   ...
     * }
     * Tracks which attributes were excluded and why (missing data, not defined, etc.)
     */
    @Type(type = "json")
    @Column(name = "excluded_attributes", columnDefinition = "json")
    private Object excludedAttributes; // JSON: Map<String, String> (attribute -> reason)

    /**
     * Screening version/algorithm version used
     * Allows re-screening with updated logic
     */
    @Column(name = "screening_version")
    private String screeningVersion = "v1";

    /**
     * Timestamp when screening was performed
     */
    @Column(name = "screened_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime screenedAt;

    /**
     * NON-NEGOTIABLE AUDITABILITY: User ID or system identifier who performed the screening
     * Can be admin user ID or "SYSTEM" for automated screening
     * IMMUTABLE once set (cannot be changed after screening)
     */
    @Column(name = "screened_by")
    private String screenedBy;

    /**
     * NON-NEGOTIABLE AUDITABILITY: Screening method/algorithm used
     * Examples: "AUTOMATED_V1", "MANUAL_REVIEW", "AI_SCREENING_V2"
     * IMMUTABLE once set (cannot be changed after screening)
     */
    @Column(name = "screening_method")
    private String screeningMethod;

    /**
     * NON-NEGOTIABLE AUDITABILITY: Additional screening metadata
     * JSON structure for extensible metadata:
     * {
     *   "screeningDurationMs": 150,
     *   "dataSources": ["learner_profile", "qualifications", "job_preferences"],
     *   "confidence": 0.95,
     *   "notes": "Manual override applied"
     * }
     */
    @Type(type = "json")
    @Column(name = "screening_metadata", columnDefinition = "json")
    private Object screeningMetadata; // JSON: Map<String, Object>
}


