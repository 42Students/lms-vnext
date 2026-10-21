package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * The closed V1 eligibility rule set, stored as JSON on job.eligibility_json. A missing/null
 * field means "not restricted on this criterion" — never a hard reject. Evaluated alongside the
 * legacy target_department_id/target_program_id/target_batch_id/target_class_id columns, which
 * remain the visibility gate (see docs/recruiter-tpo-flows/TPO V1 - Locked.docx §4).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobEligibility {
    /** Department names (Learner.department is a free-text string, e.g. "CSE"). */
    private List<String> branches;
    private List<Integer> programIds;
    private List<Integer> passingYears;
    /**
     * Batches the drive is for (Academic Setup batch ids). Null or empty = every batch in placements. Replaces the season:
     * a drive targets batches (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).
     */
    private List<Long> batchIds;
    private Double minCgpa;
    private Double minPctThroughout;
    // No backlog rules: the LMS has no source for backlogs. Old drives' maxActiveBacklogs / maxPastBacklogs keys are ignored (ignoreUnknown).
    private Double tenthMinPct;
    private Double twelfthMinPct;
    private Double diplomaMinPct;
    private Double ugMinPct;
    /** Only applies to students with a PG. */
    private Double pgMinPct;
    /**
     * True: marks rules count only marks the college verified (a student with unverified or missing marks is not eligible).
     * Otherwise the student's own Education counts too, flagged "not verified", and a missing mark is "Not provided".
     */
    private Boolean verifiedMarksOnly;
    // No education-gap rule: the profile has no gap. Old drives' maxGapYears key is ignored (ignoreUnknown).
    /** For diversity drives only. Never exported to companies. */
    private String gender;
}
