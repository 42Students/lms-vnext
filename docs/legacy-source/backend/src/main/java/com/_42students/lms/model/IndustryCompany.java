package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Version;

/**
 * A company from industry, shared across colleges (unlike {@link Company}, which is per college).
 * recruiter accounts belong to one. See docs/recruiter-tpo/DESIGN.md.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity(name = "industry_company")
@Table(name = "industry_company")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class IndustryCompany extends BaseModel {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "created_by_user_id")
    private Integer createdByUserId;

    @Column(name = "created_by_user_type", length = 20)
    private String createdByUserType;

    // Must stay null for new entities (Spring Data isNew() check), same as Faculty.version.
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
