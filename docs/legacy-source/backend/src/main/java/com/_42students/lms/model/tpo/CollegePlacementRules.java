package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;
import java.time.LocalDateTime;

/**
 * The closed V1 placement-rules set, one row per college. Written in Settings as plain
 * sentences with blanks; read by apply eligibility, the offer-blocked check, and the accept
 * cascade. See TPO V1 - Locked.docx §9.
 */
@Entity
@Table(name = "college_placement_rules")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class CollegePlacementRules {

    @Id
    @Column(name = "college_id")
    private Integer collegeId;

    /** SELECTED | OFFER_RELEASED | OFFER_ACCEPTED */
    @Column(name = "counts_as_placed_at", nullable = false)
    private String countsAsPlacedAt = "OFFER_RELEASED";

    @Column(name = "max_held_offers", nullable = false)
    private Integer maxHeldOffers = 1;

    @Column(name = "uplift_pct", nullable = false)
    private Integer upliftPct = 40;

    @Column(name = "min_response_hours", nullable = false)
    private Integer minResponseHours = 48;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
