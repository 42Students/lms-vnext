package com._42students.lms.model;

import com._42students.lms.config.UtcLocalDateTimeSerializer;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * One company for the whole platform (recruiter phase 1, design L1; V202). Its identity is its email domain(s), kept in
 * {@link CompanyDomain}; this row holds only what everyone sees: name, logo, website, industry, description.
 *
 * Each college's private side (notes, contact details, deleted-at-this-college) lives in {@link CollegeCompany}. The
 * contact and notes fields below are request/response carriers for that private side: {@code @Transient}, never stored
 * on this shared row (their old columns are left unused). {@code collegeId}/{@code organizationId} are legacy: the
 * college that first had the company, kept for history.
 */
@Entity
@Table(name = "company")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class Company extends BaseModel {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 150, message = "Company name must be between 2 and 150 characters")
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Size(max = 500)
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Size(max = 500)
    @Column(name = "website", length = 500)
    private String website;

    @Size(max = 100)
    @Column(name = "industry", length = 100)
    private String industry;

    @Size(max = 2000)
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 150)
    @Transient
    private String contactPersonName;

    @Size(max = 150)
    @Transient
    private String contactEmail;

    @Size(max = 30)
    @Transient
    private String contactPhone;

    @Size(max = 2000)
    @Transient
    private String internalNotes;

    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "added_by_user_id")
    private Integer addedByUserId;

    @Column(name = "added_by_user_type", length = 20)
    private String addedByUserType;

    @Column(name = "added_by_college_id")
    private Integer addedByCollegeId;

    /** On 42's curated list: its name is the one everyone sees, and nobody but 42 changes it (N3). */
    @Column(name = "verified_by_42", nullable = false)
    private Boolean verifiedBy42 = false;

    @Column(name = "verified_by_42_at")
    private LocalDateTime verifiedBy42At;

    @Column(name = "verified_by_42_user_id")
    private Integer verifiedBy42UserId;

    /** Set on an old duplicate that V202 folded into another company; such rows are soft-deleted. */
    @Column(name = "merged_into_company_id")
    private Integer mergedIntoCompanyId;

    /** The company's domains, filled by the service for responses. */
    @Transient
    private java.util.List<String> domains;

    // Populated by the service layer for the admin list view — "how many drives has this
    // company run, and when did they last post one" is what actually tells an admin whether a
    // recruiter is a currently-engaged partner or one dormant for years. Not persisted.
    @Transient
    private Long driveCount;

    // Explicit @JsonSerialize (rather than relying solely on JacksonConfig's global
    // LocalDateTime customizer) because Spring's module registration order can let
    // jackson-datatype-jsr310's default array-based serializer win over a customizer-registered
    // one — an explicit per-field annotation always takes precedence, so this can't silently
    // regress to serializing as a raw [year,month,day,...] array again.
    @Transient
    @JsonSerialize(using = UtcLocalDateTimeSerializer.class)
    private LocalDateTime lastActiveAt;
}
