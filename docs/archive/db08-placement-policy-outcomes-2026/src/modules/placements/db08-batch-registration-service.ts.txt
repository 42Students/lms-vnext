import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  placementBatches,
  placementRegistrations,
  placementSeasons,
  programs,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  placementBatchInputSchema,
  placementBatchTransitionSchema,
  placementRegistrationInputSchema,
} from "./db08-lifecycle-validation";

/** DB08-B is staged. Do not expose via HTTP before the database migration. */

export async function upsertPlacementBatch(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementBatchInputSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    const [cohort] = await tx
      .select({ id: cohorts.id })
      .from(cohorts)
      .innerJoin(programs, eq(cohorts.programId, programs.id))
      .innerJoin(departments, eq(programs.departmentId, departments.id))
      .where(and(
        eq(cohorts.id, input.cohortId),
        eq(departments.collegeId, input.collegeId),
      ))
      .for("update")
      .limit(1);
    if (!cohort) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_SCOPE_MISMATCH");
    }

    const [previous] = await tx
      .select()
      .from(placementBatches)
      .where(eq(placementBatches.cohortId, input.cohortId))
      .limit(1);

    if (previous && previous.collegeId !== input.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_SCOPE_MISMATCH");
    }
    if (previous?.finishedAt) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_ALREADY_FINISHED");
    }

    const values = {
      cohortId: input.cohortId,
      collegeId: input.collegeId,
      registrationDeadline: input.registrationDeadline === undefined
        ? (previous?.registrationDeadline ?? null)
        : (input.registrationDeadline ? new Date(input.registrationDeadline) : null),
      rulesOverride: input.rulesOverride === undefined
        ? (previous?.rulesOverride ?? null)
        : input.rulesOverride,
    };

    const [row] = await tx
      .insert(placementBatches)
      .values(values)
      .onConflictDoUpdate({
        target: placementBatches.cohortId,
        set: {
          registrationDeadline: values.registrationDeadline,
          rulesOverride: values.rulesOverride,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  });
}

export async function transitionPlacementBatch(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementBatchTransitionSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(placementBatches)
      .where(and(
        eq(placementBatches.cohortId, input.cohortId),
        eq(placementBatches.collegeId, input.collegeId),
      ))
      .for("update")
      .limit(1);
    if (!row) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_NOT_STARTED");
    }
    if (input.action === "INVITE") {
      if (row.finishedAt) {
        throw new PlacementsServiceError("PLACEMENT_BATCH_ALREADY_FINISHED");
      }
      if (row.invitedAt) return row;
      const [updated] = await tx.update(placementBatches)
        .set({ invitedAt: new Date(), updatedAt: new Date() })
        .where(eq(placementBatches.cohortId, input.cohortId))
        .returning();
      return updated;
    }

    if (row.finishedAt) return row;
    if (!row.invitedAt) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_NOT_INVITED");
    }
    const [updated] = await tx.update(placementBatches)
      .set({ finishedAt: new Date(), updatedAt: new Date() })
      .where(eq(placementBatches.cohortId, input.cohortId))
      .returning();
    return updated;
  });
}

export async function getPlacementBatch(
  context: RequestContext,
  collegeId: string,
  cohortId: string,
) {
  await requirePlacementManageScope(context, collegeId);
  const [row] = await getDb().select().from(placementBatches)
    .where(and(
      eq(placementBatches.collegeId, collegeId),
      eq(placementBatches.cohortId, cohortId),
    ))
    .limit(1);
  // A missing record is a meaningful NOT_STARTED state, not a fake row.
  return row ?? null;
}

export async function recordPlacementRegistration(
  context: RequestContext,
  rawInput: unknown,
  now: Date = new Date(),
) {
  const input = placementRegistrationInputSchema.parse(rawInput);
  const self = hasMembershipRole(context, "LEARNER") &&
    context.membership?.id === input.membershipId &&
    context.membership?.collegeId === input.collegeId;

  if (self) {
    requirePermission(context, "placements.read", { collegeId: input.collegeId });
  } else {
    await requirePlacementManageScope(context, input.collegeId);
    if (input.consentVersion != null) {
      // Managers may change the choice but cannot attest to learner consent.
      throw new PlacementsServiceError("PLACEMENT_REGISTRATION_CONSENT_FORBIDDEN");
    }
  }

  return getDb().transaction(async (tx) => {
    // One learner+season registration at a time, including first insertion.
    await tx.execute(
      sql`select pg_advisory_xact_lock(
        hashtext(${input.seasonId + ":" + input.membershipId}), 7342010)`,
    );
    const [member] = await tx.select({ id: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .where(and(
        eq(collegeMemberships.id, input.membershipId),
        eq(collegeMemberships.collegeId, input.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(membershipRoles.role, "LEARNER"),
      )).limit(1);
    if (!member) {
      throw new PlacementsServiceError("PLACEMENT_REGISTRATION_SCOPE_MISMATCH");
    }
    const [season] = await tx.select()
      .from(placementSeasons)
      .where(and(
        eq(placementSeasons.id, input.seasonId),
        eq(placementSeasons.collegeId, input.collegeId),
      )).limit(1);
    if (!season || season.status !== "ACTIVE") {
      throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_ACTIVE");
    }
    const [activeEnrollment] = await tx
      .select({ cohortId: learnerProgramEnrollments.cohortId })
      .from(learnerProgramEnrollments)
      .where(and(
        eq(learnerProgramEnrollments.membershipId, input.membershipId),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      ))
      .limit(1);
    if (!activeEnrollment) {
      throw new PlacementsServiceError("PLACEMENT_REGISTRATION_NOT_ENROLLED");
    }
    const [batch] = await tx.select()
      .from(placementBatches)
      .where(and(
        eq(placementBatches.cohortId, activeEnrollment.cohortId),
        eq(placementBatches.collegeId, input.collegeId),
      )).limit(1);
    if (!batch || batch.finishedAt) {
      throw new PlacementsServiceError("PLACEMENT_BATCH_NOT_STARTED");
    }
    if (batch.registrationDeadline && batch.registrationDeadline.getTime() < now.getTime()) {
      throw new PlacementsServiceError("PLACEMENT_REGISTRATION_DEADLINE_PASSED");
    }

    const [previous] = await tx.select().from(placementRegistrations)
      .where(and(
        eq(placementRegistrations.membershipId, input.membershipId),
        eq(placementRegistrations.seasonId, input.seasonId),
      )).limit(1);

    if (previous && previous.collegeId !== input.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_REGISTRATION_SCOPE_MISMATCH");
    }

    const consentVersion = self
      ? (input.consentVersion ?? previous?.consentVersion ?? null)
      : (previous?.consentVersion ?? null);
    // Repeating the same signed version must not forge a fresh consent time.
    const consentAt = self && input.consentVersion &&
      input.consentVersion !== previous?.consentVersion
      ? now
      : (previous?.consentAt ?? (self && input.consentVersion ? now : null));
    const outcomeLabel = input.outcomeLabel === undefined
      ? (previous?.outcomeLabel ?? null) : input.outcomeLabel;
    const outcomeDetail = input.outcomeDetail === undefined
      ? (previous?.outcomeDetail ?? null) : input.outcomeDetail;
    const source = self ? "SELF" as const : "TPO" as const;

    if (previous &&
      previous.choice === input.choice &&
      previous.consentVersion === consentVersion &&
      ((previous.consentAt === null && consentAt === null) ||
        (previous.consentAt?.getTime() === consentAt?.getTime())) &&
      previous.outcomeLabel === outcomeLabel &&
      previous.outcomeDetail === outcomeDetail
    ) {
      return { ...previous, replayed: true };
    }

    const values = {
      membershipId: input.membershipId,
      collegeId: input.collegeId,
      seasonId: input.seasonId,
      choice: input.choice,
      consentVersion,
      consentAt,
      source,
      outcomeLabel,
      outcomeDetail,
    };
    const [row] = await tx.insert(placementRegistrations)
      .values(values)
      .onConflictDoUpdate({
        target: [
          placementRegistrations.membershipId,
          placementRegistrations.seasonId,
        ],
        set: { ...values, updatedAt: now },
      })
      .returning();
    return { ...row, replayed: false };
  });
}
