package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * The verified (or, until imported, self-reported) academic record used for eligibility.
 * source=VERIFIED always wins over a student's self-reported profile values. See
 * TPO V1 - Locked.docx §6 "Students".
 */
@Entity
@Table(name = "learner_academic_record")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class LearnerAcademicRecord {

    @Id
    @Column(name = "learner_id")
    private Integer learnerId;

    @Column(name = "cgpa")
    private java.math.BigDecimal cgpa;

    // No backlogs: the LMS has no source for them. The active_backlogs / past_backlogs columns stay in the table, unmapped.

    @Column(name = "tenth_pct")
    private java.math.BigDecimal tenthPct;

    @Column(name = "twelfth_pct")
    private java.math.BigDecimal twelfthPct;

    @Column(name = "diploma_pct")
    private java.math.BigDecimal diplomaPct;

    @Column(name = "ug_pct")
    private java.math.BigDecimal ugPct;

    @Column(name = "gap_years")
    private Integer gapYears = 0;

    @Column(name = "is_lateral_entry", nullable = false)
    private Boolean isLateralEntry = false;

    @Column(name = "passing_year")
    private Integer passingYear;

    @Column(name = "gender")
    private String gender;

    /** VERIFIED | SELF */
    @Column(name = "source", nullable = false)
    private String source = "SELF";

    @Column(name = "import_batch_id")
    private String importBatchId;

    @Column(name = "imported_at")
    private LocalDateTime importedAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isVerified() {
        return "VERIFIED".equals(source);
    }
}
