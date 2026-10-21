package com._42students.lms.model;

import com._42students.lms.validation.ValidCtcRange;
import com._42students.lms.validation.ValidEligibilityRules;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.*;
import javax.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job")
@TypeDefs({
    @TypeDef(name = "json", typeClass = JsonType.class)
})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class Job extends BaseModel {

    @NotBlank(message = "Job title is required")
    @Size(min = 3, max = 100, message = "Job title must be between 3 and 100 characters")
    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Size(max = 500, message = "Company logo URL must not exceed 500 characters")
    @Column(name = "company_logo")
    private String companyLogo; // URL to company logo image (optional)

    // Optional link to a reusable Company record — companyName/companyLogo above stay the
    // source of truth for display and are kept in sync with the linked company at save time, so
    // every existing consumer of those two fields (reports, CSV export, the learner-facing job
    // list, etc.) keeps working unchanged whether or not a job is linked to a Company.
    @Column(name = "company_id")
    private Integer companyId;

    @Size(max = 5000, message = "Job description must not exceed 5000 characters")
    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    /** Happened outside the platform and recorded by the placement cell: publishing it tells no student. */
    @Column(name = "recorded_outside", nullable = false)
    private Boolean recordedOutside = false;

    /**
     * Whether offers from this drive count as placed (TPO notes item 15). Comes from the job type: the built-in types have a
     * fixed answer (Internship no, the rest yes, see JobTypes); a college's own type has the answer the college gave, set by
     * the drive form (JobTypeService). Every placed count and held-offer check reads this column.
     */
    @Column(name = "counts_as_placed", nullable = false)
    private Boolean countsAsPlaced = true;

    /** Link to the uploaded job description file (PDF or Word). */
    @Column(name = "jd_url", length = 500)
    private String jdUrl;

    @Size(max = 5000, message = "Job responsibilities must not exceed 5000 characters")
    @Column(name = "job_responsibilities", columnDefinition = "TEXT")
    private String jobResponsibilities; // Rich text content

    @Size(max = 50, message = "Job type must not exceed 50 characters")
    @Column(name = "job_type")
    private String jobType; // Internship, Full-time, etc.

    @Size(max = 200, message = "Location must not exceed 200 characters")
    @Column(name = "location")
    private String location; // Can be comma-separated for multiple locations

    @ValidCtcRange(message = "CTC range must be in format like '6-10 LPA' or '500000-800000'")
    @Column(name = "ctc_range")
    private String ctcRange; // e.g., "6-10 LPA"

    @Column(name = "posted_date")
    private LocalDateTime postedDate; // Auto-set on creation

    @Column(name = "application_deadline")
    private LocalDateTime applicationDeadline; // Derived from important_dates entry "Application deadline"; blocks apply after this date

    /**
     * Important dates (e.g. Application deadline, Screening round, Technical round).
     * JSON array: [ { "label": "Application deadline", "date": "2025-03-01T23:59:59" }, ... ].
     * Shown on admin Interview Calendar and learner Career Calendar.
     * If an entry has label "Application deadline" (case-insensitive), applicationDeadline is set from that date.
     */
    @Type(type = "json")
    @Column(name = "important_dates", columnDefinition = "json")
    private Object importantDates;

    // ============================================
    // LAYER 1: TARGETING (HARD - visibility gate)
    // Controls who can SEE & APPLY
    // ============================================
    
    @Column(name = "target_department_id")
    private Integer targetDepartmentId; // null = all departments

    @Column(name = "target_program_id")
    private Integer targetProgramId; // null = all programs

    @Column(name = "target_batch_id")
    private Integer targetBatchId; // null = all batches

    @Column(name = "target_class_id")
    private Integer targetClassId; // null = all classes

    @NotNull(message = "Active status is required")
    @Column(name = "is_active")
    private Boolean isActive = true;

    /** 10.1 / 21.2.7: Draft state - true = draft (not visible to learners), false = published */
    @Column(name = "is_draft", nullable = false)
    private Boolean isDraft = false;

    @Column(name = "organization_id", nullable = false)
    private Integer organizationId; // Organization scoping - each job belongs to one org

    @Column(name = "college_id")
    private Integer collegeId; // Optional

    @Column(name = "created_by")
    private Integer createdBy; // Admin ID who created the job

    // ============================================
    // LAYER 2: CANDIDATE PREFERENCES (SOFT)
    // Displayed to learners to set expectations
    // MUST NOT block visibility or apply
    // ============================================
    
    /**
     * Candidate Preferences (SOFT - display only)
     * Displayed to learners but NOT blocking visibility or apply
     * JSON structure: {
     *   "preferredSkills": ["Java", "Spring Boot"],
     *   "preferredDegree": "B.Tech",
     *   "preferredSpecialization": "CSE",
     *   "preferredGpa": 7.5,
     *   "preferredGraduationYear": "2024",
     *   "preferredCity": "Bangalore"
     * }
     * 
     * Note: These are PREFERENCES, not requirements.
     * Learners can apply even if they don't meet all preferences.
     */
    @Type(type = "json")
    @Column(name = "candidate_preferences", columnDefinition = "json")
    // A purpose-built validator (EligibilityRulesValidator) exists specifically to guard this
    // field's structure/ranges but was never actually attached to it — garbage values
    // (impossible GPA thresholds, garbled graduation years, unknown keys) were saving and
    // publishing straight to the learner-facing UI with no server-side check at all.
    @ValidEligibilityRules
    private Object candidatePreferences; // JSON: Display-only preferences

    // ============================================
    // LAYER 3: EVALUATION CONFIG (INTERNAL)
    // Defines how candidates are evaluated AFTER apply
    // NOT visible to learners
    // ============================================
    
    /**
     * Evaluation Configuration (INTERNAL - screening rules)
     * Defines how candidates are evaluated after application
     * JSON structure: {
     *   "skillWeight": 0.4,
     *   "educationWeight": 0.3,
     *   "experienceWeight": 0.2,
     *   "otherWeight": 0.1,
     *   "autoShortlistThreshold": 0.7
     * }
     * 
     * Note: This is INTERNAL configuration.
     * Read by ScreeningService but never visible to learners.
     *
     * WRITE_ONLY (not plain @JsonIgnore, unlike assessmentUrl): AdminJobServiceImpl.updateJobInternal
     * and PlacementJobServiceImpl.updateJob both deserialize this straight off the incoming
     * @RequestBody Job (job.getEvaluationConfig()) to let an admin set new screening weights via
     * the generic job-update endpoint. A plain @JsonIgnore blocks deserialization too, which would
     * silently drop those admin edits. WRITE_ONLY still accepts it on the way in while never
     * emitting it in any outgoing response (learner or admin), which is all the security fix needs
     * — no controller currently reads this field back out of a Job JSON response to pre-fill an
     * admin edit form.
     */
    @Type(type = "json")
    @Column(name = "evaluation_config", columnDefinition = "json")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Object evaluationConfig; // JSON: Internal screening configuration

    // ============================================
    // SCREENING VERSION (PREVENTS MIXED LOGIC)
    // All applications under a job share the same screening version
    // Prevents sorting across different scoring logic versions
    // ============================================
    
    /**
     * Screening Version (INVARIANT: One version per job)
     * All applications under this job must be screened with the same version
     * Prevents mixed logic scoring when sorting applications
     * Default: "v1"
     */
    @Column(name = "screening_version", nullable = false)
    private String screeningVersion = "v1";

    // ============================================
    // VISIBILITY & EXTERNAL LINKING
    // Controls job visibility and external access
    // ============================================
    
    /**
     * Visibility Type (INTERNAL_ONLY, HYBRID, EXTERNAL_ONLY)
     * - INTERNAL_ONLY: Only visible to LMS learners matching targeting criteria
     * - HYBRID: Visible in LMS AND via external link
     * - EXTERNAL_ONLY: Hidden from LMS; only accessible via external link
     */
    @Column(name = "visibility_type", nullable = false)
    private String visibilityType = "INTERNAL_ONLY";

    /**
     * Job Slug (Unique identifier for external links)
     * Format: smr-{random16chars}
     * Used for tracking applications from external sources
     * Nullable: Only required for HYBRID and EXTERNAL_ONLY jobs
     */
    @Column(name = "job_slug", unique = true, length = 32)
    private String jobSlug;

    /**
     * External assessment/exam URL for this job.
     * Set when the company provides it (after job creation). Used when moving candidates to ASSESSMENT.
     * Learners see this in My Applications when their status is ASSESSMENT.
     */
    @JsonIgnore
    @Size(max = 2048, message = "Assessment URL must not exceed 2048 characters")
    @Pattern(regexp = "^(https?://.*)?$", message = "Assessment URL must start with http:// or https://")
    @Column(name = "assessment_url", length = 2048)
    private String assessmentUrl;

    /**
     * Transient count for admin list views.
     * Populated by service layer to avoid N+1 calls from frontend.
     */
    @Transient
    private Long applicationCount;

    /**
     * Backward-compatible alias used by some frontend branches.
     */
    @Transient
    private Long applicantCount;

    /**
     * Deadline for completing the assessment (optional).
     * Used for learner messaging and reminders (see Gap 3.6).
     */
    @Column(name = "assessment_deadline")
    private LocalDateTime assessmentDeadline;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;

    // ============================================
    // TPO V1 (see docs/recruiter-tpo-flows/TPO V1 - Locked.docx)
    // ============================================

    /** ON_CAMPUS | POOL | OFF_CAMPUS. See {@link com._42students.lms.model.tpo.DriveMode}. */
    @Column(name = "drive_mode", nullable = false)
    private String driveMode = "ON_CAMPUS";

    /**
     * REQUEST|SENT_BACK|REJECTED|DRAFT|PUBLISHED|CLOSED|CANCELLED. Written only by
     * JobLifecycleService, which keeps isDraft/isActive in sync so every existing learner
     * query (which still reads isDraft/isActive) keeps working unchanged.
     */
    @Column(name = "lifecycle_status", nullable = false)
    private String lifecycleStatus = "PUBLISHED";

    /** REGULAR|DREAM|SUPER_DREAM. Defaults from CTC; can be overridden with a reason. */
    @Column(name = "category")
    private String category;

    @Column(name = "category_override_reason")
    private String categoryOverrideReason;

    @Column(name = "season_id")
    private Long seasonId;

    /** Faculty id of the drive owner (a TPO admin). */
    @Column(name = "owner_faculty_id")
    private Integer ownerFacultyId;

    /** Set when this job is one college's copy of a multi-college recruiter drive. */
    @Column(name = "drive_group_id")
    private Long driveGroupId;

    /** recruiter who requested this drive. Null on the no-login (TPO-run) path — the primary V1 path. */
    @Column(name = "recruiter_id")
    private Long recruiterId;

    /** Who last saved the drive form and when (recruiter phase 1, N10). */
    @Column(name = "last_saved_by_faculty_id")
    private Integer lastSavedByFacultyId;

    @Column(name = "last_saved_at")
    private LocalDateTime lastSavedAt;

    /** The saver's name for the form; filled by the TPO drive endpoints, never stored. */
    @Transient
    private String lastSavedByName;

    @Column(name = "requires_external_registration", nullable = false)
    private Boolean requiresExternalRegistration = false;

    @Column(name = "external_portal_name")
    private String externalPortalName;

    @Column(name = "external_portal_url")
    private String externalPortalUrl;

    /** Off-campus/virtual drives: the company's own application link. */
    @Column(name = "external_apply_url")
    private String externalApplyUrl;

    @Column(name = "host_college_name")
    private String hostCollegeName;

    @Column(name = "reporting_at")
    private LocalDateTime reportingAt;

    @Column(name = "travel_note")
    private String travelNote;

    /** Closed V1 eligibility rule set. See {@link com._42students.lms.model.tpo.JobEligibility}. */
    @Type(type = "json")
    @Column(name = "eligibility_json", columnDefinition = "json")
    private Object eligibilityJson;

    /** Array of role options (pay, bond). See {@link com._42students.lms.model.tpo.JobRoleOption}. */
    @Type(type = "json")
    @Column(name = "role_options_json", columnDefinition = "json")
    private Object roleOptionsJson;

    /** The request as the recruiter last submitted it before resubmitting (title, description, location, role options, eligibility, deadline). */
    @Type(type = "json")
    @Column(name = "previous_request_json", columnDefinition = "json")
    private Object previousRequestJson;

    /** Per drive: apply recruiter/company decisions automatically instead of waiting for the TPO. */
    @Column(name = "results_auto_apply", nullable = false)
    private Boolean resultsAutoApply = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_reason")
    private String cancelledReason;

    @Column(name = "sent_back_note")
    private String sentBackNote;

    /** Every institutional change request on this drive was answered (recruiter phase 1, N14): back to the top of the review queue. */
    @Column(name = "changes_made_at")
    private LocalDateTime changesMadeAt;

    /**
     * Jobs created or edited through the existing college-admin pages only ever touch
     * isDraft/isActive, so lifecycleStatus would go stale (a legacy draft would read PUBLISHED, a
     * closed one too). Re-derive it from the legacy flags on every write. This never contradicts
     * JobLifecycleService, which always writes both flags consistently: TPO-only states are kept
     * when the flags agree with them.
     */
    @PrePersist
    @PreUpdate
    void reconcileLifecycleWithLegacyFlags() {
        // A built-in job type always carries its own answer, whichever page wrote the drive (the older admin pages set
        // job_type as free text); a college's own type keeps the answer the drive form set.
        Boolean builtin = com._42students.lms.service.tpo.JobTypes.builtinCountsAsPlaced(jobType);
        if (builtin != null) countsAsPlaced = builtin;
        else if (countsAsPlaced == null) countsAsPlaced = true;

        boolean active = !Boolean.FALSE.equals(isActive);
        boolean draft = Boolean.TRUE.equals(isDraft);
        String current = lifecycleStatus == null ? "PUBLISHED" : lifecycleStatus;
        if (!active) {
            lifecycleStatus = "CANCELLED".equals(current) ? current : "CLOSED";
        } else if (draft) {
            lifecycleStatus = java.util.Set.of("REQUEST", "SENT_BACK", "REJECTED", "DRAFT").contains(current) ? current : "DRAFT";
        } else {
            lifecycleStatus = "PUBLISHED";
        }
    }

}

