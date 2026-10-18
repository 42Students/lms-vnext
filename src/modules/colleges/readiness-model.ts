export type CollegeReadinessStatus =
  | "PASS"
  | "FAIL"
  | "UNKNOWN";

export type CollegeReadinessOverall =
  | "READY"
  | "NOT_READY"
  | "INCOMPLETE";

export type CollegeReadinessCheckId =
  | "COLLEGE_ACTIVE"
  | "COLLEGE_ADMIN"
  | "DEPARTMENTS"
  | "PROGRAMS"
  | "COHORTS"
  | "LEARNERS"
  | "FACULTY"
  | "TPO"
  | "PLACEMENT_SEASON"
  | "TENANT_DOMAIN";

export type CollegeReadinessFacts = {
  collegeStatus: "ACTIVE" | "ARCHIVED" | null;
  adminMemberships: number | null;
  departments: number | null;
  programs: number | null;
  cohorts: number | null;
  enrolledLearners: number | null;
  facultyMemberships: number | null;
  tpoMemberships: number | null;
  activePlacementSeasons: number | null;
  verifiedPrimaryDomains: number | null;
};

export type CollegeReadinessCheck = {
  id: CollegeReadinessCheckId;
  label: string;
  status: CollegeReadinessStatus;
  evidence: string;
  remediation: string;
};

export type CollegeReadinessEvaluation = {
  overall: CollegeReadinessOverall;
  counts: {
    total: number;
    passed: number;
    failed: number;
    unknown: number;
  };
  checks: CollegeReadinessCheck[];
};

function presenceCheck(
  id: CollegeReadinessCheckId,
  label: string,
  count: number | null,
  evidenceName: string,
  remediation: string,
): CollegeReadinessCheck {
  // A count is trusted only when it is a nonnegative integer. A broken
  // adapter, overflow or malformed aggregate must never make go-live green.
  if (count === null || !Number.isSafeInteger(count) || count < 0) {
    return {
      id,
      label,
      status: "UNKNOWN",
      evidence:
        "The persisted source could not be verified.",
      remediation:
        "Verify this data source and recheck. Unknown must not be treated as passed.",
    };
  }

  return {
    id,
    label,
    status: count > 0 ? "PASS" : "FAIL",
    evidence: `${count} ${evidenceName}`,
    remediation,
  };
}

/**
 * Pure, deliberately conservative go-live checklist.
 *
 * Zero is a verified failure. Null means no reliable
 * answer was available and MUST NOT be converted to
 * zero or to a passed check.
 *
 * The evaluator makes no assumptions about default
 * attendance policy, registration availability,
 * runtime DNS or unrecorded staff assignments.
 */
export function evaluateCollegeReadiness(
  facts: CollegeReadinessFacts,
): CollegeReadinessEvaluation {
  const collegeCheck: CollegeReadinessCheck = {
    id: "COLLEGE_ACTIVE",
    label: "College is active",
    status:
      facts.collegeStatus === null
        ? "UNKNOWN"
        : facts.collegeStatus === "ACTIVE"
          ? "PASS"
          : "FAIL",
    evidence:
      facts.collegeStatus === null
        ? "College status could not be verified."
        : `Persisted status: ${facts.collegeStatus}`,
    remediation:
      "Ensure the college has an active lifecycle status before go-live.",
  };

  const checks: CollegeReadinessCheck[] = [
    collegeCheck,
    presenceCheck(
      "COLLEGE_ADMIN",
      "College administrator assigned",
      facts.adminMemberships,
      "active College Admin memberships",
      "Assign or reactivate a College Admin membership with an active user.",
    ),
    presenceCheck(
      "DEPARTMENTS",
      "Departments configured",
      facts.departments,
      "non-archived departments",
      "Create at least one active department.",
    ),
    presenceCheck(
      "PROGRAMS",
      "Programs configured",
      facts.programs,
      "active programs in non-archived departments",
      "Create or activate at least one program in an active department.",
    ),
    presenceCheck(
      "COHORTS",
      "Cohorts configured",
      facts.cohorts,
      "non-archived cohorts in active programs",
      "Create a cohort under an active college program.",
    ),
    presenceCheck(
      "LEARNERS",
      "Learners enrolled",
      facts.enrolledLearners,
      "actively enrolled learners",
      "Enroll at least one active learner in an active program and non-archived cohort.",
    ),
    presenceCheck(
      "FACULTY",
      "Faculty available",
      facts.facultyMemberships,
      "active Faculty memberships",
      "Assign or reactivate at least one Faculty membership with an active user.",
    ),
    presenceCheck(
      "TPO",
      "Placement officer assigned",
      facts.tpoMemberships,
      "active TPO memberships",
      "Assign or reactivate a TPO membership with an active user.",
    ),
    presenceCheck(
      "PLACEMENT_SEASON",
      "Active placement season",
      facts.activePlacementSeasons,
      "active placement seasons",
      "Start an active placement season for this college.",
    ),
    presenceCheck(
      "TENANT_DOMAIN",
      "Verified primary login domain",
      facts.verifiedPrimaryDomains,
      "verified primary tenant domains",
      "Configure, verify and select a primary tenant domain. This check does not substitute for an actual login test.",
    ),
  ];

  const passed = checks.filter(
    (check) => check.status === "PASS",
  ).length;
  const failed = checks.filter(
    (check) => check.status === "FAIL",
  ).length;
  const unknown = checks.filter(
    (check) => check.status === "UNKNOWN",
  ).length;

  return {
    overall:
      failed > 0
        ? "NOT_READY"
        : unknown > 0
          ? "INCOMPLETE"
          : "READY",
    counts: {
      total: checks.length,
      passed,
      failed,
      unknown,
    },
    checks,
  };
}
