package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Student V1 §5 "Off-campus offer": a placement cell-verified offer the student got outside the
 * college's own drives. Its CTC counts toward the same held-offer/uplift rules as an on-campus
 * offer (see PlacementCascadePolicy/PlacementRulesService) — that is what "counted as placed
 * under the same rules" means. See TpoRequestService.decide for how one gets created.
 */
@Entity
@Table(name = "external_placement")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class ExternalPlacement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "ctc_lpa")
    private BigDecimal ctcLpa;

    @Column(name = "letter_url")
    private String letterUrl;

    @Column(name = "verified_by")
    private Integer verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
