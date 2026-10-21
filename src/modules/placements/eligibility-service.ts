import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  cohorts,
  colleges,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  placementCandidateAcademicEvidence,
  placementEligibilityOverrides,
  placementJobEligibilityPolicies,
  placementJobs,
  programs,
  sections,
  sectionEnrollments,
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
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  candidateAcademicEvidenceInputSchema,
  placementEligibilityOverrideInputSchema,
  placementEligibilityPolicyInputSchema,
  placementJobIdSchema,
  type CandidateAcademicEvidenceInput,
  type PlacementEligibilityOverrideInput,
  type PlacementEligibilityPolicyInput,
} from "./validation";

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

// Validate persisted academic ownership under the same transaction that writes
// the policy; a client-supplied UUID may belong to another college. SHARE locks
// prevent a concurrent program/department reparent during policy creation.
async function validateEligibilityAcademicScope(
  tx: Tx,
  collegeId: string,
  allowedProgramIds: readonly string[],
  allowedCohortIds: readonly string[],
  allowedSectionIds: readonly string[],
) {
  if (allowedProgramIds.length > 0) {
    const rows = await tx
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
          isNull(departments.archivedAt),
          eq(programs.status, "ACTIVE"),
        ),
      )
      .for("share");
    if (
      rows.length !== new Set(allowedProgramIds).size
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      );
    }
  }
  if (allowedCohortIds.length > 0) {
    const rows = await tx
      .select({ id: cohorts.id })
      .from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(
        departments,
        eq(departments.id, programs.departmentId),
      )
      .where(
        and(
          inArray(cohorts.id, [...allowedCohortIds]),
          eq(departments.collegeId, collegeId),
          isNull(departments.archivedAt),
          eq(programs.status, "ACTIVE"),
        ),
      )
      .for("share");
    if (
      rows.length !== new Set(allowedCohortIds).size
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
      );
    }
  }
  if (allowedSectionIds.length) {
    const rows = await tx.select({ id: sections.id }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(
        inArray(sections.id, [...allowedSectionIds]),
        eq(departments.collegeId, collegeId),
        isNull(departments.archivedAt),
        eq(sections.status, "ACTIVE"),
        eq(programs.status, "ACTIVE"),
      )).for("share");
    if (rows.length !== new Set(allowedSectionIds).size) {
      throw new PlacementsServiceError("PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH");
    }
  }
}

async function lockEligibilityJob(tx: Tx, jobId: string) {
  const [job] = await tx
    .select({
      id: placementJobs.id,
      collegeId: placementJobs.collegeId,
      status: placementJobs.status,
    })
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .for("update")
    .limit(1);
  if (!job) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  return job;
}

async function lockEvidenceMembership(tx: Tx, membershipId: string) {
  const [membership] = await tx
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .where(eq(collegeMemberships.id, membershipId))
    .for("update")
    .limit(1);
  if (!membership || membership.status !== "ACTIVE") {
    throw new PlacementsServiceError("PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND");
  }
  return membership;
}

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
    id:string;
    decision: "INCLUDE" | "EXCLUDE";
    reason: string;
  } | null;
};

/** D4: decimal half-up scaling without binary floating-point multiplication. */
export function scaleHundredths(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Invalid percentage");
  const decimal = String(value);
  const parts = /^(\d+)(?:\.(\d+))?$/.exec(decimal);
  if (!parts) throw new RangeError("Unsupported percentage precision");
  const whole = BigInt(parts[1]!);
  const digits = (parts[2] ?? "").padEnd(3, "0");
  const hundredths = whole * 100n + BigInt(digits.slice(0, 2)) +
    (digits.charCodeAt(2) >= 53 ? 1n : 0n);
  if (hundredths > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Percentage out of range");
  }
  return Number(hundredths);
}

function unscaleHundredths(value: number | null) {
  return value === null ? null : value / 100;
}

async function loadJob(jobId: string, db: Client | Tx = getDb()) {
  const [job] = await db
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
  db: Client | Tx = getDb(),
) {
  const [membership] = await db
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
    postgraduatePctBasisPoints:scaleHundredths(input.postgraduatePercentage),
    hasPostgraduateQualification:input.hasPostgraduateQualification,
    gapYears: input.gapYears,
    isLateralEntry: input.isLateralEntry,
    passingYear: input.passingYear,
  };
}

function academicEvidenceView(
  row:
    | typeof placementCandidateAcademicEvidence.$inferSelect
    | null
    | undefined,
) {
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
    postgraduatePercentage:unscaleHundredths(row.postgraduatePctBasisPoints),
    hasPostgraduateQualification:row.hasPostgraduateQualification,
  };
}

export async function getOwnAcademicEvidence(
  context: RequestContext,
) {
  const membership = requireSelfLearner(context);
  await requireLearnerPlacementAccess(context);
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

  return academicEvidenceView(row);
}

export async function getManagedAcademicEvidence(
  context: RequestContext,
  membershipId: string,
) {
  const membership = await getDb()
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
    })
    .from(collegeMemberships)
    .where(
      eq(
        collegeMemberships.id,
        membershipId,
      ),
    )
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

  return academicEvidenceView(row);
}

export async function upsertOwnAcademicEvidence(
  context: RequestContext,
  rawInput: CandidateAcademicEvidenceInput,
) {
  const membership = requireSelfLearner(context);
  await requireLearnerPlacementAccess(context);
  const input =
    candidateAcademicEvidenceInputSchema.parse(rawInput);
  const values = evidenceValues(input);
  const db = getDb();

  return db.transaction(async (tx) => {
    await lockEvidenceMembership(tx, membership.id);
    const [current] = await tx
      .select()
      .from(placementCandidateAcademicEvidence)
      .where(
        eq(
          placementCandidateAcademicEvidence.membershipId,
          membership.id,
        ),
      )
      .for("update")
      .limit(1);

    if (current?.source === "VERIFIED") {
      throw new PlacementsServiceError(
        "PLACEMENT_ACADEMIC_EVIDENCE_VERIFIED",
      );
    }

    const [row] = await tx
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
  });
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
  const db = getDb();

  return db.transaction(async (tx) => {
    const lockedMembership = await lockEvidenceMembership(tx, membershipId);
    if (lockedMembership.collegeId !== membership.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND");
    }
    const [row] = await tx
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
  });
}

export async function getJobEligibilityPolicy(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  requirePermission(context, "placements.manage", {
    collegeId: job.collegeId,
  });

  const [policy] = await getDb()
    .select()
    .from(placementJobEligibilityPolicies)
    .where(
      eq(
        placementJobEligibilityPolicies.jobId,
        jobId,
      ),
    )
    .limit(1);

  if (!policy) {
    return {
      jobId,
      allowedProgramIds: [] as string[],
      allowedCohortIds: [] as string[],
      allowedSectionIds: [] as string[],
      minCgpa: null as number | null,
      maxActiveBacklogs: null as number | null,
      maxPastBacklogs: null as number | null,
      minTenthPercentage: null as number | null,
      minTwelfthPercentage: null as number | null,
      minDiplomaPercentage: null as number | null,
      minUndergraduatePercentage:
        null as number | null,
      minPostgraduatePercentage: null as number | null,
      minPctThroughout: null as number | null,
      maxGapYears: null as number | null,
      allowedPassingYears: [] as number[],
      missingEvidencePolicy:
        "ALLOW_WITH_FLAG" as const,
      requireVerifiedEvidence: false,
      updatedAt: null as Date | null,
    };
  }

  return {
    jobId: policy.jobId,
    allowedProgramIds:
      policy.allowedProgramIds,
    allowedCohortIds:
      policy.allowedCohortIds,
    allowedSectionIds: policy.allowedSectionIds,
    minCgpa: unscaleHundredths(
      policy.minCgpaHundredths,
    ),
    maxActiveBacklogs:
      policy.maxActiveBacklogs,
    maxPastBacklogs:
      policy.maxPastBacklogs,
    minTenthPercentage:
      unscaleHundredths(
        policy.minTenthPctBasisPoints,
      ),
    minTwelfthPercentage:
      unscaleHundredths(
        policy.minTwelfthPctBasisPoints,
      ),
    minDiplomaPercentage:
      unscaleHundredths(
        policy.minDiplomaPctBasisPoints,
      ),
    minUndergraduatePercentage:
      unscaleHundredths(
        policy.minUndergraduatePctBasisPoints,
      ),
    minPostgraduatePercentage:unscaleHundredths(policy.minPostgraduatePctBasisPoints),
    minPctThroughout: unscaleHundredths(policy.minPctThroughoutBasisPoints),
    maxGapYears: policy.maxGapYears,
    allowedPassingYears:
      policy.allowedPassingYears,
    missingEvidencePolicy:
      policy.missingEvidencePolicy,
    requireVerifiedEvidence: policy.requireVerifiedEvidence,
    updatedAt: policy.updatedAt,
  };
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
  const values = {
    allowedProgramIds: input.allowedProgramIds,
    allowedCohortIds: input.allowedCohortIds,
    allowedSectionIds: input.allowedSectionIds,
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
    minPostgraduatePctBasisPoints:scaleHundredths(input.minPostgraduatePercentage),
    minPctThroughoutBasisPoints: scaleHundredths(input.minPctThroughout),
    maxGapYears: input.maxGapYears,
    allowedPassingYears: input.allowedPassingYears,
    missingEvidencePolicy:
      input.missingEvidencePolicy,
    requireVerifiedEvidence: input.requireVerifiedEvidence,
    updatedByUserId: context.user.id,
  };
  const db = getDb();
  return db.transaction(async (tx) => {
    const liveJob = await lockEligibilityJob(tx, jobId);
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:liveJob.collegeId,
    });
    if (
      liveJob.collegeId !== job.collegeId ||
      liveJob.status !== "DRAFT"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_POLICY_LOCKED",
      );
    }
    await validateEligibilityAcademicScope(
      tx,
      liveJob.collegeId,
      input.allowedProgramIds,
      input.allowedCohortIds,
      input.allowedSectionIds,
    );
    const [row] = await tx
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
  });
}

async function recordEligibilityOverrideAudit(
 tx:Tx,context:RequestContext,collegeId:string,jobId:string,membershipId:string,
 overrideId:string,action:"SET"|"CLEARED",reason:string,
){
 const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
  .where(eq(colleges.id,collegeId)).limit(1);
 if(!college)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 await tx.insert(activityEvents).values({
  organizationId:college.organizationId,collegeId,
  actorUserId:context.user.id,
  actorMembershipId:context.membership?.collegeId===collegeId?context.membership.id:null,
  module:"PLACEMENTS",eventType:action==="SET"?"PLACEMENT_OVERRIDE_SET":"PLACEMENT_OVERRIDE_CLEARED",
  subjectType:"placement_eligibility_override",subjectId:overrideId,
  summary:action==="SET"?"Drive eligibility override saved":"Drive eligibility override cleared",
  metadata:{jobId,membershipId,reason},
 });
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
    const liveJob = await lockEligibilityJob(tx, jobId);
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:liveJob.collegeId,
    });
    if (liveJob.collegeId !== job.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    }
    if(input.expectedOverrideId!==undefined){
      const [current]=await tx.select({id:placementEligibilityOverrides.id})
        .from(placementEligibilityOverrides)
        .where(and(
          eq(placementEligibilityOverrides.jobId,jobId),
          eq(placementEligibilityOverrides.membershipId,membershipId),
          isNull(placementEligibilityOverrides.revokedAt),
        )).for("update").limit(1);
      if((current?.id??null)!==input.expectedOverrideId)
        throw new PlacementsServiceError("PLACEMENT_ELIGIBILITY_OVERRIDE_STALE");
    }
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
    await recordEligibilityOverrideAudit(tx,context,liveJob.collegeId,jobId,membershipId,
      row.id,"SET",input.reason);
    return row;
  });
}

export async function revokeEligibilityOverride(
  context: RequestContext,
  jobIdInput: string,
  membershipId: string,
  options:{expectedOverrideId?:string;reason?:string}={},
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  requirePermission(context, "placements.manage", {
    collegeId: job.collegeId,
  });
  const db = getDb();

  return db.transaction(async (tx) => {
    const liveJob = await lockEligibilityJob(tx, jobId);
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:liveJob.collegeId,
    });
    if (liveJob.collegeId !== job.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    }
    const [row] = await tx
      .update(placementEligibilityOverrides)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(placementEligibilityOverrides.jobId, jobId),
          eq(placementEligibilityOverrides.membershipId, membershipId),
          isNull(placementEligibilityOverrides.revokedAt),
          // An undo must not revoke another staff member's later override.
          options.expectedOverrideId?eq(placementEligibilityOverrides.id,options.expectedOverrideId):undefined,
        ),
      )
      .returning();

    if (!row) {
      // Legacy remove-when-already-clear is idempotent. Explicit optimistic
      // undo, however, may never silently clear a different staff override.
      if (options.expectedOverrideId) {
        throw new PlacementsServiceError("PLACEMENT_ELIGIBILITY_OVERRIDE_STALE");
      }
      return null;
    }
    await recordEligibilityOverrideAudit(tx,context,liveJob.collegeId,jobId,membershipId,
      row.id,"CLEARED",options.reason??"Placement eligibility override cleared");
    return row;
  });
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
      detail: "Not provided",
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

/**
 * P-S1-03: Job audiences are a hard cohort/program boundary, not a score.
 * An individual eligibility override must not reveal an untargeted drive.
 */
export function isPlacementJobTargetCohort(
  policy: {
    allowedProgramIds: readonly string[];
    allowedCohortIds: readonly string[];
  } | null | undefined,
  enrollment: { programId: string; cohortId: string },
): boolean {
  if (!policy) return true;
  return (
    (policy.allowedProgramIds.length === 0 ||
      policy.allowedProgramIds.includes(enrollment.programId)) &&
    (policy.allowedCohortIds.length === 0 ||
      policy.allowedCohortIds.includes(enrollment.cohortId))
  );
}

/** D3: one normalised gate for optimistic and transaction-bound checks. */
export function placementApplyEligibilityDenial(status: PlacementEligibilityResult["status"]):
  "PLACEMENT_APPLICATION_INELIGIBLE" | "PLACEMENT_APPLICATION_NEEDS_DATA" | null {
  if (status === "INELIGIBLE") return "PLACEMENT_APPLICATION_INELIGIBLE";
  if (status === "NEEDS_DATA") return "PLACEMENT_APPLICATION_NEEDS_DATA";
  return null;
}

/**
 * P-S2-03: legacy recognizes lateral entry from the explicit flag OR
 * diploma marks with no 12th marks; never treat a blank diploma as lateral.
 */
export function derivePlacementLateralEntry(evidence: {
  isLateralEntry: boolean | null;
  diplomaPctBasisPoints: number | null;
  twelfthPctBasisPoints: number | null;
} | null | undefined): boolean {
  return evidence?.isLateralEntry === true ||
    (evidence?.diplomaPctBasisPoints != null &&
      evidence?.twelfthPctBasisPoints == null);
}

/**
 * P-S2-02: lowest completed school/college percentage in basis points.
 * Return null unless all required stages are provided; missing is not 0%.
 * A lateral entrant uses diploma as their secondary qualification.
 */
export function placementPercentageThroughout(input: {
  tenthPctBasisPoints: number | null;
  twelfthPctBasisPoints: number | null;
  diplomaPctBasisPoints: number | null;
  undergraduatePctBasisPoints: number | null;
  isLateralEntry: boolean | null;
}): number | null {
  const secondary = derivePlacementLateralEntry(input)
    ? input.diplomaPctBasisPoints : input.twelfthPctBasisPoints;
  const required = [
    input.tenthPctBasisPoints, secondary, input.undergraduatePctBasisPoints,
  ];
  return required.every((value): value is number =>
    value !== null && Number.isFinite(value) && value >= 0)
    ? Math.min(...(required as number[])) : null;
}

/**
 * P-S2-01: SOURCE=SELF is never acceptable as verified evidence. This
 * the verified-only flag is persisted in migration 0089.
 */
export function evaluatePlacementEvidenceVerification(
  source: "SELF" | "VERIFIED" | null,
  requireVerifiedEvidence: boolean,
): "PASS" | "MISSING" {
  return !requireVerifiedEvidence || source === "VERIFIED" ? "PASS" : "MISSING";
}

/**
 * P-S2-04: all enrollment and allowed-section IDs are UUIDs scoped by the
 * caller's college before invoking this pure comparison. Empty targeting
 * permits any section; targeted jobs fail closed for no active enrollment.
 */
export function isPlacementJobTargetSection(
  allowedSectionIds: readonly string[],
  activeSectionIds: readonly string[],
): boolean {
  return allowedSectionIds.length === 0 ||
    activeSectionIds.some((id) => allowedSectionIds.includes(id));
}

/** D16: ambiguous active enrollments are never authorized by row order. */
export function hasAmbiguousActivePlacementEnrollment(
  enrollments: readonly { cohortId: string; programId: string }[],
): boolean {
  return enrollments.length > 1;
}

export async function evaluatePlacementEligibility(
  context: RequestContext,
  jobIdInput: string,
  membershipIdInput?: string,
  db: Client | Tx = getDb(),
): Promise<PlacementEligibilityResult> {
  return evaluatePlacementEligibilityInternal(context, jobIdInput, membershipIdInput, db);
}

/** Bulk previews reuse a job-scoped override read while retaining the
 * normal active membership, audience and verified-evidence guards. */
async function evaluatePlacementEligibilityInternal(
  context: RequestContext,
  jobIdInput: string,
  membershipIdInput?: string,
  db: Client | Tx = getDb(),
  preloaded?: {override: typeof placementEligibilityOverrides.$inferSelect | null},
): Promise<PlacementEligibilityResult> {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId, db);
  let membershipId: string;

  if (membershipIdInput) {
    requirePermission(context, "placements.manage", {
      collegeId: job.collegeId,
    });
    membershipId = membershipIdInput;
  } else {
    const membership = requireSelfLearner(context);
    await requireLearnerPlacementAccess(context);
    if (membership.collegeId !== job.collegeId) {
      throw new AuthorizationError("placements.read");
    }
    membershipId = membership.id;
  }
  await loadLearnerMembership(
    job.collegeId,
    membershipId,
    db,
  );
  const [[override], [policy], [evidence], enrollments] =
    await Promise.all([
      preloaded ? Promise.resolve(preloaded.override ? [preloaded.override] : [])
        : db
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
        .limit(2),
    ]);

  // Legacy-to-vNext column crosswalk:
  // Legacy JSON CGPA/backlogs/10th/12th/diploma/UG/PG/gap/passing-year
  // → nullable placement_job_eligibility_policies thresholds; null marks
  // → Not provided, never a synthetic zero or failure.
  // LearnerAcademicRecord and marks → candidateAcademicEvidence (SELF
  // versus VERIFIED); TPO override → placementEligibilityOverrides.
  // Legacy program/batch targeting → active program/cohort/section scopes;
  // talk/exam blocks and college batch rules remain independent scheduling
  // and placement-policy gates, not academic marks or overrideable scores.
  // INCLUDE/EXCLUDE supersedes grades but not authorization, audience or
  // verified-only evidence. Gender/degree/specialization are not visibility
  // conditions in the normalized policy; do not hide jobs using score checks.
  const overrideDetail = override ? {
    id: override.id,
    decision: override.decision as "INCLUDE" | "EXCLUDE",
    reason: override.reason,
  } : null;
  // Legacy ↔ vNext eligibility crosswalk:
  // - JobEligibility JSON scores → placement_job_eligibility_policies columns.
  // - LearnerAcademicRecord/marks → placement_candidate_academic_evidence
  //   (missing and verified-only are separate states, not implicit failures).
  // - TPO per-student override → placement_eligibility_overrides.
  // - Legacy job program/batch visibility → college-scoped program/cohort/
  //   section memberships, checked BEFORE manual scoring exceptions.
  // - Examination/calendar blocks are independent learner-round scheduling
  //   constraints; do not synthesize academic evidence or bypass those guards.
  // These stricter audience and verified-evidence gates are deliberate, never
  // converted into an unrestricted INCLUDE override.
  // D16: two active enrollments are ambiguous. Never arbitrarily choose the
  // first one or allow an INCLUDE override to authorize the wrong cohort.
  if (hasAmbiguousActivePlacementEnrollment(enrollments)) {
    return {
      status: "INELIGIBLE",
      checks: [{
        criterion: "Cohort", status: "FAIL", actual: null,
        required: "Eligible cohort",
        detail: "Active academic cohort not found",
      }],
      override: overrideDetail,
    };
  }
  const [enrollment] = enrollments;

  // An INCLUDE override must not grant access where we cannot establish the
  // learner's active program, cohort or section at all. This is an audience
  // authorization boundary, not a missing-mark academic scoring criterion.
  if (!enrollment && policy && (
    policy.allowedProgramIds.length > 0 ||
    policy.allowedCohortIds.length > 0 ||
    policy.allowedSectionIds.length > 0
  )) {
    return {
      status: "INELIGIBLE",
      checks: [{
        criterion: "Cohort",
        status: "FAIL",
        actual: null,
        required: "An active eligible academic cohort",
        detail: "Active academic enrollment not found (non-overridable audience restriction)",
      }],
      override: overrideDetail,
    };
  }

  if (policy && enrollment && !isPlacementJobTargetCohort(policy, enrollment)) {
    // Reuse the existing legacy-facing Program/Cohort check vocabulary.
    const wrongProgram = policy.allowedProgramIds.length > 0 &&
      !policy.allowedProgramIds.includes(enrollment.programId);
    return {
      status: "INELIGIBLE",
      checks: [{
        criterion: wrongProgram ? "Program" : "Cohort",
        status: "FAIL",
        actual: wrongProgram ? enrollment.programId : enrollment.cohortId,
        required: wrongProgram
          ? "One of the eligible programs"
          : "One of the eligible cohorts",
        detail: wrongProgram
          ? "Program is not eligible (non-overridable audience restriction)"
          : "Cohort is not eligible (non-overridable audience restriction)",
      }],
      override: overrideDetail,
    };
  }

  // P-S2-04: the real migrated section whitelist is an authorization gate,
  // not an optional evidence warning. INCLUDE cannot override it.
  if (policy?.allowedSectionIds.length) {
    const activeSections = enrollment ? await db.select({id: sections.id})
      .from(sectionEnrollments)
      .innerJoin(sections, eq(sections.id, sectionEnrollments.sectionId))
      .where(and(
        eq(sectionEnrollments.learnerEnrollmentId, enrollment.id),
        eq(sectionEnrollments.status, "ACTIVE"),
        eq(sections.status, "ACTIVE"),
        eq(sections.cohortId, enrollment.cohortId),
      )) : [];
    if (!isPlacementJobTargetSection(policy.allowedSectionIds,
      activeSections.map(row => row.id))) {
      return { status: "INELIGIBLE", checks: [{
        criterion: "Cohort", status: "FAIL", actual: null,
        required: "Eligible cohort",
        detail: "Cohort is not eligible (non-overridable section restriction)",
      }], override: overrideDetail };
    }
  }

  // P-S2-01: SELF academic evidence must never satisfy a verified-only
  // job. Evaluate this before per-learner INCLUDE overrides.
  if (policy?.requireVerifiedEvidence &&
      evaluatePlacementEvidenceVerification((evidence?.source as "SELF" | "VERIFIED" | null | undefined) ?? null, true) !== "PASS") {
    return { status: "NEEDS_DATA", checks: [{
      criterion: "Verified academic evidence",
      status: "MISSING",
      actual: evidence?.source==="SELF"?"Self provided":"Not provided",
      required: "College-verified academic evidence",
      detail: "Not provided or not verified. Manual INCLUDE cannot bypass this requirement.",
    }], override: overrideDetail };
  }

  if (override) {
    return {
      status:
        override.decision === "INCLUDE"
          ? "ELIGIBLE"
          : "INELIGIBLE",
      checks: [{
        criterion: "Eligibility override",
        status: override.decision==="INCLUDE"?"PASS":"FAIL",
        actual: override.decision==="INCLUDE"?"Added by college":"Excluded by college",
        required: "College placement team decision",
        detail: override.reason,
      }],
      override: {
        id: override.id,
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

  const lateral = derivePlacementLateralEntry(evidence ?? null);
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
  if(policy.minPostgraduatePctBasisPoints!==null){
    // The PG condition is not applicable to a verified non-PG learner.
    // Unknown qualification is MISSING, not a silent pass.
    if(evidence?.hasPostgraduateQualification===false){
      // No check for people who do not hold a postgraduate qualification.
    }else if(evidence?.hasPostgraduateQualification===true){
      // A legacy PG percentage without verified qualification does not
      // establish that the qualification exists. Unknown stays MISSING.
      numericCheck(checks,"Postgraduate percentage",
        evidence.postgraduatePctBasisPoints,
        policy.minPostgraduatePctBasisPoints,"MIN",100);
    }else checks.push({
      criterion:"Postgraduate qualification",
      status:"MISSING",actual:null,required:"PG qualification",
      detail:"Postgraduate qualification has not been verified",
    });
  }
  if (policy.minPctThroughoutBasisPoints !== null) {
    numericCheck(
      checks, "Percentage throughout",
      placementPercentageThroughout({
        tenthPctBasisPoints: evidence?.tenthPctBasisPoints ?? null,
        twelfthPctBasisPoints: evidence?.twelfthPctBasisPoints ?? null,
        diplomaPctBasisPoints: evidence?.diplomaPctBasisPoints ?? null,
        undergraduatePctBasisPoints: evidence?.undergraduatePctBasisPoints ?? null,
        isLateralEntry: evidence?.isLateralEntry ?? null,
      }),
      policy.minPctThroughoutBasisPoints, "MIN", 100,
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
        detail: "Not provided",
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

/** Preload all active overrides in one scoped query before a college-scale
 * preview. Grade/evidence queries remain membership-scoped, in 50-row waves
 * to avoid overwhelming the database pool. */
export async function evaluatePlacementEligibilityBatch(
  context: RequestContext,
  jobIdInput: string,
  membershipIds: readonly string[],
  db: Client | Tx = getDb(),
): Promise<Map<string, PlacementEligibilityResult>> {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId, db);
  requirePermission(context, "placements.manage", {collegeId: job.collegeId});
  const ids = [...new Set(membershipIds)];
  if (ids.length > 1000) throw new RangeError("Eligibility preview is limited to 1,000 learners");
  const result = new Map<string, PlacementEligibilityResult>();
  if (!ids.length) return result;
  const rows = await db.select().from(placementEligibilityOverrides).where(and(
    eq(placementEligibilityOverrides.jobId, jobId),
    inArray(placementEligibilityOverrides.membershipId, ids),
    isNull(placementEligibilityOverrides.revokedAt),
  ));
  const byMember = new Map(rows.map(row => [row.membershipId, row]));
  for (let offset = 0; offset < ids.length; offset += 50) {
    const group = await Promise.all(ids.slice(offset, offset + 50).map(
      async id => [id, await evaluatePlacementEligibilityInternal(
        context, jobId, id, db, {override: byMember.get(id) ?? null},
      )] as const,
    ));
    for (const [id, eligibility] of group) result.set(id, eligibility);
  }
  return result;
}
