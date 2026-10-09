import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  placementDebarmentDriveEvents,
  placementDebarments,
  placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  placementDebarmentActionSchema,
  placementDebarmentDriveSchema,
  placementDebarmentInputSchema,
} from "./db08-lifecycle-validation";

function collegeLocalDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (key: string) =>
    parts.find((part) => part.type === key)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export type PlacementDebarmentState = {
  active: boolean;
  reason: "LIFTED" | "DATE_EXPIRED" | "DRIVES_COMPLETED" | "ACTIVE";
};

/** A date debarment is active THROUGH its end date. */
export function resolvePlacementDebarmentState(
  row: {
    liftedAt: Date | null;
    untilDate: string | null;
    untilDrives: number | null;
    drivesCounted: number;
  },
  now: Date = new Date(),
): PlacementDebarmentState {
  if (row.liftedAt) return { active: false, reason: "LIFTED" };
  if (row.untilDate !== null && row.untilDate < collegeLocalDate(now)) {
    return { active: false, reason: "DATE_EXPIRED" };
  }
  if (row.untilDrives !== null && row.drivesCounted >= row.untilDrives) {
    return { active: false, reason: "DRIVES_COMPLETED" };
  }
  return { active: true, reason: "ACTIVE" };
}

export async function createPlacementDebarment(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementDebarmentInputSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(
        hashtext(${input.collegeId + ":" + input.membershipId}), 7342011)`,
    );
    const [owned] = await tx.select({ id: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .where(and(
        eq(collegeMemberships.id, input.membershipId),
        eq(collegeMemberships.collegeId, input.collegeId),
        eq(membershipRoles.role, "LEARNER"),
      )).limit(1);
    if (!owned) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_SCOPE_MISMATCH");
    }
    const [current] = await tx.select({ id: placementDebarments.id })
      .from(placementDebarments)
      .where(and(
        eq(placementDebarments.collegeId, input.collegeId),
        eq(placementDebarments.membershipId, input.membershipId),
        isNull(placementDebarments.liftedAt),
      )).limit(1);
    if (current) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_EXISTS");
    }
    const [row] = await tx.insert(placementDebarments).values({
      collegeId: input.collegeId,
      membershipId: input.membershipId,
      reason: input.reason,
      untilDate: input.untilDate ?? null,
      untilDrives: input.untilDrives ?? null,
      createdByUserId: context.user.id,
    }).returning();
    return row;
  });
}

export async function liftPlacementDebarment(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementDebarmentActionSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.id, input.debarmentId),
        eq(placementDebarments.collegeId, input.collegeId),
      )).for("update").limit(1);
    if (!row) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_NOT_FOUND");
    }
    if (row.liftedAt) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_ALREADY_LIFTED");
    }
    const [updated] = await tx.update(placementDebarments).set({
      liftedAt: new Date(),
      liftedByUserId: context.user.id,
      liftedReason: input.reason,
    }).where(eq(placementDebarments.id, input.debarmentId)).returning();
    return updated;
  });
}

/**
 * Count one published/closed job drive only once for a learner's debarment.
 * A row lock serializes duplicate retries across workers.
 */
export async function countPlacementDebarmentDrive(
  context: RequestContext,
  rawInput: unknown,
  now: Date = new Date(),
) {
  const input = placementDebarmentDriveSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    const [debarment] = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.id, input.debarmentId),
        eq(placementDebarments.collegeId, input.collegeId),
      )).for("update").limit(1);
    if (!debarment) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_NOT_FOUND");
    }
    const [job] = await tx.select({ id: placementJobs.id, status: placementJobs.status })
      .from(placementJobs)
      .where(and(
        eq(placementJobs.id, input.jobId),
        eq(placementJobs.collegeId, input.collegeId),
      )).limit(1);
    if (!job || !["PUBLISHED", "CLOSED"].includes(job.status)) {
      throw new PlacementsServiceError("PLACEMENT_DEBARMENT_DRIVE_INVALID");
    }
    const [existing] = await tx.select({ id: placementDebarmentDriveEvents.id })
      .from(placementDebarmentDriveEvents)
      .where(and(
        eq(placementDebarmentDriveEvents.debarmentId, input.debarmentId),
        eq(placementDebarmentDriveEvents.jobId, input.jobId),
      )).limit(1);
    if (existing) {
      return { ...debarment, counted: false, replayed: true };
    }

    const state = resolvePlacementDebarmentState(debarment, now);
    if (!state.active || debarment.untilDrives === null) {
      // Date-only/indefinite restrictions don't use a drive counter.
      return { ...debarment, counted: false, replayed: false };
    }

    await tx.insert(placementDebarmentDriveEvents).values({
      debarmentId: input.debarmentId,
      jobId: input.jobId,
      countedByUserId: context.user.id,
    });
    const [updated] = await tx.update(placementDebarments)
      .set({ drivesCounted: debarment.drivesCounted + 1 })
      .where(eq(placementDebarments.id, input.debarmentId))
      .returning();
    return { ...updated, counted: true, replayed: false };
  });
}

export async function getLearnerPlacementDebarment(
  context: RequestContext,
  collegeId: string,
  membershipId: string,
  now: Date = new Date(),
) {
  await requirePlacementManageScope(context, collegeId);
  const rows = await getDb().select().from(placementDebarments)
    .where(and(
      eq(placementDebarments.collegeId, collegeId),
      eq(placementDebarments.membershipId, membershipId),
    ));
  return rows.map((row) => ({
    ...row,
    state: resolvePlacementDebarmentState(row, now),
  }));
}
