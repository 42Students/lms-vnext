package com._42students.lms.model;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * A college's private side with a company (design L1; V202): its notes and contact details, and whether the company is in
 * (or removed from) this college's list. Never shown to another college.
 */
@Entity
@Table(name = "college_company")
@Getter
@Setter
public class CollegeCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "contact_person_name", length = 150)
    private String contactPersonName;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "owner_faculty_id")
    private Integer ownerFacultyId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    /** A trusted company's drives go live without the placement cell's review (recruiter phase 1, N5). */
    @Column(name = "trusted", nullable = false)
    private Boolean trusted = false;

    /** This college's unique join link for the company (hashed); anyone with a proven email on its domain can join. */
    @Column(name = "join_token_hash", length = 64)
    private String joinTokenHash;

    @Column(name = "join_link_created_at")
    private LocalDateTime joinLinkCreatedAt;

    @Column(name = "join_link_opens", nullable = false)
    private Integer joinLinkOpens = 0;

    @Column(name = "join_link_joins", nullable = false)
    private Integer joinLinkJoins = 0;
}
