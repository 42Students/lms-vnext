package com._42students.lms.model;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * One email/web domain of a company (recruiter phase 1, N2; V202). A domain belongs to exactly one company (unique), and is
 * always the registrable domain produced by {@code CompanyDomainService}.
 */
@Entity
@Table(name = "company_domain")
@Getter
@Setter
public class CompanyDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "domain", nullable = false, length = 253)
    private String domain;

    @Column(name = "verified_by_42", nullable = false)
    private Boolean verifiedBy42 = false;

    @Column(name = "added_by_user_id")
    private Integer addedByUserId;

    @Column(name = "added_by_user_type", length = 20)
    private String addedByUserType;

    @Column(name = "added_by_college_id")
    private Integer addedByCollegeId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
