import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  placementCandidateAcademicEvidence,
  placementEligibilityOverrides,
  placementJobEligibilityPolicies,
  placementJobs,
  programs,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import {
  candidateAcademicEvidenceInputSchema,
  placementEligibilityOverrideInputSchema,
  placementEligibilityPolicyInputSchema,
  placementJobIdSchema,
  type CandidateAcademicEvidenceInput,
  type PlacementEligibilityOverrideInput,
  type PlacementEligibilityPolicyInput,
} from "./validation";

type CheckStatus = "PASS" | "FAIL" | "MISSING";

export type PlacementEligibilityCheck = {
  criterion: string;
  status: CheckStatus;
  actual: string | number | null;
  required: string | number;
  detail: string;
};

export type PlacementEligibilityResult = {
  status:
    | "ELIGIBLE"
    | "ELIGIBLE_WITH_MISSING_EVIDENCE"
    | "NEEDS_DATA"
    | "INELIGIBLE";
  checks: PlacementEligibilityCheck[];
  override: {
    decision: "INCLUDE" | "EXCLUDE";
    reason: string;
  } | null;
};

function scaleHundredths(value: number | null) {
  return value === null ? null : Math.round(value * 100);
}

function unscaleHundredths(value: number | null) {
  return value === null ? null : value / 100;
}

async function loadJob(jobId: string) {
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  return job;
}

async function loadLearnerMembership(
  collegeId: string,
  membershipId: string,
) {
  const [membership] = await getDb()
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "LEARNER"),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new PlacementsServiceError(
      "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    );
  }
  return membership;
}

function requireSelfLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

function evidenceValues(
  input: ReturnType<
    typeof candidateAcademicEvidenceInputSchema.parse
  >,
) {
  return {
    cgpaHundredths: scaleHundredths(input.cgpa),
    activeBacklogs: input.activeBacklogs,
    pastBacklogs: input.pastBacklogs,
    tenthPctBasisPoints: scaleHundredths(
      input.tenthPercentage,
    ),
    twelfthPctBasisPoints: scaleHundredths(
      input.twelfthPercentage,
    ),
    diplomaPctBasisPoints: scaleHundredths(
      input.diplomaPercentage,
    ),
    undergraduatePctBasisPoints: scaleHundredths(
      input.undergraduatePercentage,
    ),
    gapYears: input.gapYears,
    isLateralEntry: input.isLateralEntry,
    passingYear: input.passingYear,
  };
}

export async function getOwnAcademicEvidence(
  context: RequestContext,
) {
  const membership = requireSelfLearner(context);
  const [row] = await getDb()
    .select()
    .from(placementCandidateAcademicEvidence)
    .where(
      eq(
        placementCandidateAcademicEvidence.membershipId,
        membership.id,
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    cgpa: unscaleHundredths(row.cgpaHundredths),
    tenthPercentage: unscaleHundredths(
      row.tenthPctBasisPoints,
    ),
    twelfthPercentage: unscaleHundredths(
      row.twelfthPctBasisPoints,
    ),
    diplomaPercentage: unscaleHundredths(
      row.diplomaPctBasisPoints,
    ),
    undergraduatePercentage: unscaleHundredths(
      row.undergraduatePctBasisPoints,
    ),
  };
}

export async function upsertOwnAcademicEvidence(
  context: RequestContext,
  rawInput: CandidateAcademicEvidenceInput,
) {
  const membership = requireSelfLearner(context);
  const input =
    candidateAcademicEvidenceInputSchema.parse(rawInput);
  const [current] = await getDb()
    .select()
    .from(placementCandidateAcademicEvidence)
    .where(
      eq(
        placementCandidateAcademicEvidence.membershipId,
        membership.id,
      ),
    )
    .limit(1);

  if (current?.source === "VERIFIED") {
    throw new PlacementsServiceError(
      "PLACEMENT_ACADEMIC_EVIDENCE_VERIFIED",
    );
  }

  const values = evidenceValues(input);
  const [row] = await getDb()
    .insert(placementCandidateAcademicEvidence)
    .values({
      membershipId: membership.id,
      ...values,
      source: "SELF",
    })
    .onConflictDoUpdate({
      target:
        placementCandidateAcademicEvidence.membershipId,
      set: {
        ...values,
        source: "SELF",
        verifiedByUserId: null,
        verifiedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function upsertVerifiedAcademicEvidence(
  context: RequestContext,
  membershipId: string,
  rawInput: CandidateAcademicEvidenceInput,
) {
  const membership = await getDb()
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
    })
    .from(collegeMemberships)
    .where(eq(collegeMemberships.id, membershipId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!membership) {
    throw new PlacementsServiceError(
      "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
    );
  }
  requirePermission(context, "placements.manage", {
    collegeId: membership.collegeId,
  });
  await loadLearnerMembership(
    membership.collegeId,
    membership.id,
  );

  const input =
    candidateAcademicEvidenceInputSchema.parse(rawInput);
  const values = evidenceValues(input);
  const now = new Date();
  const [row] = await getDb()
    .insert(placementCandidateAcademicEvidence)
    .values({
      membershipId,
      ...values,
      source: "VERIFIED",
      verifiedByUserId: context.user.id,
      verifiedAt: now,
    })
    .onConflictDoUpdate({
      target:
        placementCandidateAcademicEvidence.membershipId,
      set: {
        ...values,
        source: "VERIFIED",
        verifiedByUserId: context.user.id,
        verifiedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return row;
}

async function validateEligibilityAcademicScope(
  collegeId: string,
  allowedProgramIds: readonly string[],
  allowedCohortIds: readonly string[],
) {
  const db = getDb();

  if (allowedProgramIds.length > 0) {
    const rows = await db
      .select({ id: programs.id })
      .from(programs)
      .innerJoin(
        departments,
        eq(departments.id, programs.departmentId),
      )
      .where(
        and(
          inArray(programs.id, [...allowedProgramIds]),
          eq(departments.collegeId, collegeId),
        ),
      );
    if (rows.length !== allowedProgramIds.length) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      );
    }
  }

  if (allowedCohortIds.length > 0) {
    const rows = await db
      .select({ id: cohorts.id })
      .from(cohorts)
      .innerJoin(
        programs,
        eq(programs.id, cohorts.programId),
      )
      .innerJoin(
        departments,
        eq(departments.id, programs.departmentId),
      )
      .where(
        and(
          inArray(cohorts.id, [...allowedCohortIds]),
          eq(departments.collegeId, collegeId),
        ),
      );
    if (rows.length !== allowedCohortIds.length) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      );
    }
  }
}

export async function upsertJobEligibilityPolicy(
  context: RequestContext,
  jobIdInput: string,
  rawInput: PlacementEligibilityPolicyInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  requirePermission(context, "placements.manage", {
    collegeId: job.collegeId,
  });

  if (job.status !== "DRAFT") {
    throw new PlacementsServiceError(
      "PLACEMENT_ELIGIBILITY_POLICY_LOCKED",
    );
  }

  const input =
    placementEligibilityPolicyInputSchema.parse(
      rawInput,
    );
  await validateEligibilityAcademicScope(
    job.collegeId,
    input.allowedProgramIds,
    input.allowedCohortIds,
  );
  const values = {
    allowedProgramIds: input.allowedProgramIds,
    allowedCohortIds: input.allowedCohortIds,
    minCgpaHundredths: scaleHundredths(
      input.minCgpa,
    ),
    maxActiveBacklogs: input.maxActiveBacklogs,
    maxPastBacklogs: input.maxPastBacklogs,
    minTenthPctBasisPoints: scaleHundredths(
      input.minTenthPercentage,
    ),
    minTwelfthPctBasisPoints: scaleHundredths(
      input.minTwelfthPercentage,
    ),
    minDiplomaPctBasisPoints: scaleHundredths(
      input.minDiplomaPercentage,
    ),
    minUndergraduatePctBasisPoints:
      scaleHundredths(
        input.minUndergraduatePercentage,
      ),
    maxGapYears: input.maxGapYears,
    allowedPassingYears: input.allowedPassingYears,
    missingEvidencePolicy:
      input.missingEvidencePolicy,
    updatedByUserId: context.user.id,
  };
  const [row] = await getDb()
    .insert(placementJobEligibilityPolicies)
    .values({ jobId, ...values })
    .onConflictDoUpdate({
      target: placementJobEligibilityPolicies.jobId,
      set: {
        ...values,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function setEligibilityOverride(
  context: RequestContext,
  jobIdInput: string,
  membershipId: string,
  rawInput: PlacementEligibilityOverrideInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  requirePermission(context, "placements.manage", {
    collegeId: job.collegeId,
  });
  await loadLearnerMembership(
    job.collegeId,
    membershipId,
  );
  const input =
    placementEligibilityOverrideInputSchema.parse(
      rawInput,
    );
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx
      .update(placementEligibilityOverrides)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(
            placementEligibilityOverrides.jobId,
            jobId,
          ),
          eq(
            placementEligibilityOverrides.membershipId,
            membershipId,
          ),
          isNull(
            placementEligibilityOverrides.revokedAt,
          ),
        ),
      );

    const [row] = await tx
      .insert(placementEligibilityOverrides)
      .values({
        jobId,
        membershipId,
        decision: input.decision,
        reason: input.reason,
        createdByUserId: context.user.id,
      })
      .returning();
    return row;
  });
}

export async function revokeEligibilityOverride(
  context: RequestContext,
  jobIdInput: string,
  membershipId: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  requirePermission(context, "placements.manage", {
    collegeId: job.collegeId,
  });

  const [row] = await getDb()
    .update(placementEligibilityOverrides)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(placementEligibilityOverrides.jobId, jobId),
        eq(
          placementEligibilityOverrides.membershipId,
          membershipId,
        ),
        isNull(placementEligibilityOverrides.revokedAt),
      ),
    )
    .returning();

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_ELIGIBILITY_OVERRIDE_NOT_FOUND",
    );
  }
  return row;
}

function numericCheck(
  checks: PlacementEligibilityCheck[],
  criterion: string,
  actual: number | null,
  required: number,
  operator: "MIN" | "MAX",
  displayScale = 1,
) {
  if (actual === null) {
    checks.push({
      criterion,
      status: "MISSING",
      actual: null,
      required: required / displayScale,
      detail: "Evidence not provided",
    });
    return;
  }
  const pass =
    operator === "MIN"
      ? actual >= required
      : actual <= required;
  checks.push({
    criterion,
    status: pass ? "PASS" : "FAIL",
    actual: actual / displayScale,
    required: required / displayScale,
    detail: pass ? "Requirement met" : "Requirement not met",
  });
}

export async function evaluatePlacementEligibility(
  context: RequestContext,
  jobIdInput: string,
  membershipIdInput?: string,
): Promise<PlacementEligibilityResult> {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  let membershipId: string;

  if (membershipIdInput) {
    requirePermission(context, "placements.manage", {
      collegeId: job.collegeId,
    });
    membershipId = membershipIdInput;
  } else {
    const membership = requireSelfLearner(context);
    if (membership.collegeId !== job.collegeId) {
      throw new AuthorizationError("placements.read");
    }
    membershipId = membership.id;
  }
  await loadLearnerMembership(
    job.collegeId,
    membershipId,
  );

  const db = getDb();
  const [[override], [policy], [evidence], [enrollment]] =
    await Promise.all([
      db
        .select()
        .from(placementEligibilityOverrides)
        .where(
          and(
            eq(
              placementEligibilityOverrides.jobId,
              jobId,
            ),
            eq(
              placementEligibilityOverrides.membershipId,
              membershipId,
            ),
            isNull(
              placementEligibilityOverrides.revokedAt,
            ),
          ),
        )
        .limit(1),
      db
        .select()
        .from(placementJobEligibilityPolicies)
        .where(
          eq(
            placementJobEligibilityPolicies.jobId,
            jobId,
          ),
        )
        .limit(1),
      db
        .select()
        .from(placementCandidateAcademicEvidence)
        .where(
          eq(
            placementCandidateAcademicEvidence.membershipId,
            membershipId,
          ),
        )
        .limit(1),
      db
        .select()
        .from(learnerProgramEnrollments)
        .where(
          and(
            eq(
              learnerProgramEnrollments.membershipId,
              membershipId,
            ),
            eq(
              learnerProgramEnrollments.status,
              "ACTIVE",
            ),
          ),
        )
        .limit(1),
    ]);

  if (override) {
    return {
      status:
        override.decision === "INCLUDE"
          ? "ELIGIBLE"
          : "INELIGIBLE",
      checks: [],
      override: {
        decision:
          override.decision as "INCLUDE" | "EXCLUDE",
        reason: override.reason,
      },
    };
  }

  if (!policy) {
    return {
      status: "ELIGIBLE",
      checks: [],
      override: null,
    };
  }

  const checks: PlacementEligibilityCheck[] = [];
  if (policy.allowedProgramIds.length > 0) {
    if (!enrollment) {
      checks.push({
        criterion: "Program",
        status: "MISSING",
        actual: null,
        required: "Eligible program",
        detail: "Active academic program not found",
      });
    } else {
      const pass =
        policy.allowedProgramIds.includes(
          enrollment.programId,
        );
      checks.push({
        criterion: "Program",
        status: pass ? "PASS" : "FAIL",
        actual: enrollment.programId,
        required: "One of the eligible programs",
        detail: pass
          ? "Program is eligible"
          : "Program is not eligible",
      });
    }
  }

  if (policy.allowedCohortIds.length > 0) {
    if (!enrollment) {
      checks.push({
        criterion: "Cohort",
        status: "MISSING",
        actual: null,
        required: "Eligible cohort",
        detail: "Active academic cohort not found",
      });
    } else {
      const pass =
        policy.allowedCohortIds.includes(
          enrollment.cohortId,
        );
      checks.push({
        criterion: "Cohort",
        status: pass ? "PASS" : "FAIL",
        actual: enrollment.cohortId,
        required: "One of the eligible cohorts",
        detail: pass
          ? "Cohort is eligible"
          : "Cohort is not eligible",
      });
    }
  }

  if (policy.minCgpaHundredths !== null) {
    numericCheck(
      checks,
      "CGPA",
      evidence?.cgpaHundredths ?? null,
      policy.minCgpaHundredths,
      "MIN",
      100,
    );
  }
  if (policy.maxActiveBacklogs !== null) {
    numericCheck(
      checks,
      "Active backlogs",
      evidence?.activeBacklogs ?? null,
      policy.maxActiveBacklogs,
      "MAX",
    );
  }
  if (policy.maxPastBacklogs !== null) {
    numericCheck(
      checks,
      "Past backlogs",
      evidence?.pastBacklogs ?? null,
      policy.maxPastBacklogs,
      "MAX",
    );
  }
  if (policy.minTenthPctBasisPoints !== null) {
    numericCheck(
      checks,
      "10th percentage",
      evidence?.tenthPctBasisPoints ?? null,
      policy.minTenthPctBasisPoints,
      "MIN",
      100,
    );
  }

  const lateral =
    evidence?.isLateralEntry === true;
  const secondaryMinimum = lateral
    ? policy.minDiplomaPctBasisPoints
    : policy.minTwelfthPctBasisPoints;
  if (secondaryMinimum !== null) {
    numericCheck(
      checks,
      lateral
        ? "Diploma percentage"
        : "12th percentage",
      lateral
        ? evidence?.diplomaPctBasisPoints ?? null
        : evidence?.twelfthPctBasisPoints ?? null,
      secondaryMinimum,
      "MIN",
      100,
    );
  }

  if (
    policy.minUndergraduatePctBasisPoints !== null
  ) {
    numericCheck(
      checks,
      "Undergraduate percentage",
      evidence?.undergraduatePctBasisPoints ?? null,
      policy.minUndergraduatePctBasisPoints,
      "MIN",
      100,
    );
  }
  if (policy.maxGapYears !== null) {
    numericCheck(
      checks,
      "Education gap",
      evidence?.gapYears ?? null,
      policy.maxGapYears,
      "MAX",
    );
  }
  if (policy.allowedPassingYears.length > 0) {
    const actual = evidence?.passingYear ?? null;
    if (actual === null) {
      checks.push({
        criterion: "Passing year",
        status: "MISSING",
        actual: null,
        required: policy.allowedPassingYears.join(", "),
        detail: "Passing year not provided",
      });
    } else {
      const pass =
        policy.allowedPassingYears.includes(actual);
      checks.push({
        criterion: "Passing year",
        status: pass ? "PASS" : "FAIL",
        actual,
        required: policy.allowedPassingYears.join(", "),
        detail: pass
          ? "Passing year is eligible"
          : "Passing year is not eligible",
      });
    }
  }

  if (checks.some((check) => check.status === "FAIL")) {
    return {
      status: "INELIGIBLE",
      checks,
      override: null,
    };
  }

  if (
    checks.some((check) => check.status === "MISSING")
  ) {
    return {
      status:
        policy.missingEvidencePolicy ===
        "REQUIRE_COMPLETE"
          ? "NEEDS_DATA"
          : "ELIGIBLE_WITH_MISSING_EVIDENCE",
      checks,
      override: null,
    };
  }

  return {
    status: "ELIGIBLE",
    checks,
    override: null,
  };
}
