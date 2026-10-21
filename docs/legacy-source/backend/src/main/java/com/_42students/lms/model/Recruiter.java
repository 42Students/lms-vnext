package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Version;
import java.time.LocalDateTime;

/**
 * A recruiter (industry recruiter) identity: one row per real person. Not a faculty or learner.
 * The colleges this person may enter are {@link RecruiterCollegeAccess} grants. See docs/recruiter-tpo/DESIGN.md.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity(name = "recruiter")
@Table(name = "recruiter")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Recruiter extends BaseModel {

    public static final String USER_TYPE = "RECRUITER";
    /** True for a recruiter's user type. */
    public static boolean isUserType(String type) {
        return USER_TYPE.equalsIgnoreCase(type);
    }

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    /**
     * Normalised 10-digit mobile; unique, including soft-deleted rows. Optional since recruiter V1 (§10 of
     * Recruiter V1 - Locked.docx): email is the account key now, phone is an optional second channel. A row
     * has at least one of contactMobile / contactMail — enforced in service code, since a database
     * CHECK constraint cannot see a value in the same statement that writes it.
     */
    @Column(name = "contact_mobile", length = 15)
    private String contactMobile;

    /** Unique when present (see V169). The account key: RecruiterRepository always normalises to lower case before writing or querying it. */
    @Column(name = "contact_mail", length = 255)
    private String contactMail;

    @Column(name = "designation", length = 150)
    private String designation;

    /** Legacy (industry_company, by name). Replaced by {@link #companyId} in V202; not read any more. */
    @Column(name = "industry_company_id")
    private Integer industryCompanyId;

    /** The recruiter's company: the shared company owning their work email's domain (recruiter phase 1, L1). */
    @Column(name = "company_id")
    private Integer companyId;

    /** Non-null means suspended: login and every request are refused. */
    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @JsonIgnore
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_by_user_id")
    private Integer createdByUserId;

    @Column(name = "created_by_user_type", length = 20)
    private String createdByUserType;

    // Must stay null for new entities (Spring Data isNew() check), same as Faculty.version.
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    /** Usable for login and requests: not deleted and not suspended. */
    public boolean isUsable() {
        return !Boolean.TRUE.equals(getIsDeleted()) && suspendedAt == null;
    }
}
