package com._42students.lms.access;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

/**
 * Immutable value object representing a learner's fully-resolved position in
 * the organizational hierarchy: Organization → College → Department → Program → Batch → Class.
 *
 * Resolves denormalized fields from the class→program→department→college→organization chain
 * when the learner entity has null values (common for legacy data or onboarding paths that
 * only set classId). Computed once per use and reused throughout the request.
 */
@Getter
@Builder
@ToString
public class ResolvedLearnerScope {

    private final Integer learnerId;
    private final Integer organizationId;
    private final Integer collegeId;
    private final Integer programId;
    private final Integer classId;
    private final Integer batchId;
    private final Integer departmentId;

    public boolean isComplete() {
        return organizationId != null && collegeId != null
                && programId != null && classId != null;
    }

    public boolean hasOrganization() {
        return organizationId != null;
    }
}

