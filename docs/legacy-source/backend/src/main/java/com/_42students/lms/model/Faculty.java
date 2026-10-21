package com._42students.lms.model;

import com._42students.lms.dto.profile.*;
import com._42students.lms.dto.request.OrganizationData;
import com._42students.lms.enums.FacultyType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import javax.persistence.Version;
import java.util.List;
import java.util.Map;

@Data
@Entity(name = "faculty")
@Table(name = "faculty")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Faculty extends BaseModel {
    // Reversible account suspension — distinct from BaseModel.isDeleted (hard delete). Non-null
    // means the account is currently suspended; login must be blocked while set and reactivation
    // clears both fields.
    @Column(name = "suspended_at")
    private java.time.LocalDateTime suspendedAt;

    @Column(name = "suspension_reason")
    private String suspensionReason;

    // Basic Info
    @Column(name = "first_name")
    private String firstName;
    
    @Column(name = "last_name")
    private String lastName;
    
    @Column(name = "unique_id")
    private String uniqueId;
    
    @Column(name = "dept_id")
    private Integer deptId;
    
    @Column(name = "college_id")
    private Integer collegeId;
    
    @Column(name = "organization_id")
    private Integer organizationId; // Phase 4: Organization scoping
    
    @Column(name = "faculty_type")
    private FacultyType facultyType;
    
    @Column(columnDefinition = "varchar(22) default 'FACULTY'")
    private String userType;
    
    // JWT token version - incremented on password change to invalidate all tokens
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
    
    @Column(name = "department")
    private String department;
    
    // About Me
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // Personal Details
    @Column(name = "gender")
    private String gender;
    
    @Column(name = "dob")
    private String dob;
    
    @Column(name = "blood_group")
    private String bloodGroup;
    
    // Contact Information
    @Column(name = "contact_phone")
    private String contactPhone;
    
    @Column(name = "contact_mobile")
    private String contactMobile;
    
    @Column(name = "contact_mail")
    private String contactMail;
    
    // Address (legacy field - keeping for backward compatibility)
    @Column(name = "address")
    private String address;
    
    // New Address Fields
    @Column(name = "current_address", columnDefinition = "TEXT")
    private String currentAddress;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    // Legacy shared city/state/pincode - kept for backward compatibility, superseded by the current*/permanent* fields below
    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "current_city")
    private String currentCity;

    @Column(name = "current_state")
    private String currentState;

    @Column(name = "current_pincode")
    private String currentPincode;

    @Column(name = "permanent_city")
    private String permanentCity;

    @Column(name = "permanent_state")
    private String permanentState;

    @Column(name = "permanent_pincode")
    private String permanentPincode;
    
    // Social Profiles
    @Column(name = "website")
    private String website; // Used as profile image URL
    
    @Column(name = "linkedin")
    private String linkedin;
    
    @Column(name = "google_scholar")
    private String googleScholar;
    
    @Column(name = "research_gate")
    private String researchGate;
    
    // Identity Documents (JSON)
    @Column(name = "identity", columnDefinition = "json")
    @Type(type = "json")
    private IdentityDTO identity;
    
    // Languages (JSON Array)
    @Column(name = "languages", columnDefinition = "json")
    @Type(type = "json")
    private List<LanguageDTO> languages;
    
    // Skills (JSON Array) - Updated to use SkillDTO with proficiency
    @Column(name = "skills", columnDefinition = "json")
    @Type(type = "json")
    private List<SkillDTO> skills;
    
    // Education/Qualifications (JSON Array) - Updated structure
    @Column(name = "qualifications", columnDefinition = "json")
    @Type(type = "json")
    private List<EducationDTO> qualifications;
    
    // Certifications (JSON Array)
    @Column(name = "certifications", columnDefinition = "json")
    @Type(type = "json")
    private List<CertificationDTO> certifications;
    
    // Work Experience (JSON Array) - Updated structure
    @Column(name = "experiences", columnDefinition = "json")
    @Type(type = "json")
    private List<ExperienceDTO> experiences;
    
    // Publications & Research (JSON Array)
    @Column(name = "publications", columnDefinition = "json")
    @Type(type = "json")
    private List<PublicationDTO> publications;
    
    // Awards & Recognitions (JSON Array)
    @Column(name = "awards", columnDefinition = "json")
    @Type(type = "json")
    private List<AwardDTO> awards;
    
    // Organizations (legacy - keeping for backward compatibility)
    @Column(name = "organizations", columnDefinition = "json")
    @Type(type = "json")
    private List<OrganizationData> organizations;
    
    // Profile Metadata (JSON) - For extra information later
    @Column(name = "metadata", columnDefinition = "json")
    @Type(type = "json")
    private Map<String, Object> metadata;
}

