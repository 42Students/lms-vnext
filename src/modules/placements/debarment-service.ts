import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  placementApplications,
  placementJobs,
} from "@/db/schema";
import {
  placementDebarmentDriveEvents,
  placementDebarments,
} from "@/db/schema/placement-debarments";
import { type RequestContext } from "@/modules/identity/context";
import { isDebarmentActive } from "./batch-registration-policy";
import { requirePlacementManageScope } from "./scope";

const uuid = z.string().uuid();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(value => {
    const parsed = new Date(value + "T00:00:00.000Z");
    return !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value;
  }, "Invalid calendar date");
const createInput = z.object({
  collegeId: uuid,
  membershipId: uuid,
  reason: z.string().trim().min(1).max(500),
  untilDate: dateString.nullable().optional(),
  untilDrives: z.number().int().min(1).max(10_000).nullable().optional(),
}).strict();
const liftInput = z.object({
  debarmentId: uuid,
  reason: z.string().trim().min(1).max(500),
}).strict();
const countInput = z.object({
  debarmentId: uuid,
  jobId: uuid,
}).strict();

export class PlacementDebarmentError extends Error {
  constructor(public readonly code:
    | "DB08_DEBARMENT_NOT_FOUND"
    | "DB08_DEBARMENT_MEMBER_INVALID"
    | "DB08_DEBARMENT_NO_APPLICATION"
    | "DB08_DEBARMENT_JOB_COLLEGE_MISMATCH"
    | "DB08_DEBARMENT_INACTIVE"
    | "DB08_DEBARMENT_INVALID_DURATION") {
    super(code);
    this.name = "PlacementDebarmentError";
  }
}

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

/** Explicit legacy default. Replace with per-college timezone before global launch. */
export const DB08_LEGACY_COLLEGE_TIMEZONE = "Asia/Kolkata";
function collegeLocalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DB08_LEGACY_COLLEGE_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

async function lockCollege(tx: Tx, collegeId: string) {
  const [row] = await tx.select({ id: colleges.id })
    .from(colleges).where(eq(colleges.id, collegeId))
    .for("update").limit(1);
  if (!row) throw new PlacementDebarmentError("DB08_DEBARMENT_MEMBER_INVALID");
}

async function requireLearner(tx: Tx, collegeId: string, membershipId: string) {
  const [member] = await tx.select({
    id: collegeMemberships.id,
    status: collegeMemberships.status,
    collegeId: collegeMemberships.collegeId,
  }).from(collegeMemberships).innerJoin(membershipRoles,
    and(eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER")))
    .where(eq(collegeMemberships.id, membershipId)).limit(1);
  if (!member || member.collegeId !== collegeId ||
      member.status !== "ACTIVE") {
    throw new PlacementDebarmentError("DB08_DEBARMENT_MEMBER_INVALID");
  }
}

export async function createPlacementDebarment(
  context: RequestContext,
  raw: unknown,
) {
  const input = createInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const date = input.untilDate ?? null;
  const today = collegeLocalDate();
  if (date !== null && date < today) {
    throw new PlacementDebarmentError("DB08_DEBARMENT_INVALID_DURATION");
  }
  return getDb().transaction(async tx => {
    await lockCollege(tx, input.collegeId);
    await requireLearner(tx, input.collegeId, input.membershipId);
    const [row] = await tx.insert(placementDebarments).values({
      collegeId: input.collegeId,
      membershipId: input.membershipId,
      reason: input.reason,
      untilDate: date,
      untilDrives: input.untilDrives ?? null,
      createdByUserId: context.user.id,
    }).returning();
    // The DB08 SQL AFTER INSERT trigger creates CREATED history, including
    // for new DB writers. Do NOT also insert it here.
    return row;
  });
}

async function loadManagedDebarment(
  context: RequestContext,
  id: string,
) {
  const [current] = await getDb().select().from(placementDebarments)
    .where(eq(placementDebarments.id, id)).limit(1);
  if (!current) throw new PlacementDebarmentError("DB08_DEBARMENT_NOT_FOUND");
  await requirePlacementManageScope(context, current.collegeId);
  return current;
}

export async function liftPlacementDebarment(
  context: RequestContext,
  raw: unknown,
) {
  const input = liftInput.parse(raw);
  const current = await loadManagedDebarment(context, input.debarmentId);
  return getDb().transaction(async tx => {
    await lockCollege(tx, current.collegeId);
    const [locked] = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.id, input.debarmentId),
        eq(placementDebarments.collegeId, current.collegeId),
      )).for("update").limit(1);
    if (!locked) throw new PlacementDebarmentError("DB08_DEBARMENT_NOT_FOUND");
    if (locked.liftedAt) return locked;
    const [updated] = await tx.update(placementDebarments).set({
      liftedAt: new Date(),
      liftedByUserId: context.user.id,
      liftedReason: input.reason,
    }).where(eq(placementDebarments.id, locked.id)).returning();
    // The DB trigger creates an immutable LIFTED action.
    return updated;
  });
}

/**
 * Exactly one count per (debarment, job) with atomic parent row lock.
 * Requires learner's application in this job. The SQL AFTER INSERT trigger
 * updates drives_counted and emits an immutable DRIVE_COUNTED event.
 * This hook must later be wired into actual drive-day transitions.
 */
export async function countDebarredPlacementDrive(
  context: RequestContext,
  raw: unknown,
) {
  const input = countInput.parse(raw);
  const current = await loadManagedDebarment(context, input.debarmentId);
  return getDb().transaction(async tx => {
    await lockCollege(tx, current.collegeId);
    const [debarment] = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.id, input.debarmentId),
        eq(placementDebarments.collegeId, current.collegeId),
      )).for("update").limit(1);
    if (!debarment) throw new PlacementDebarmentError("DB08_DEBARMENT_NOT_FOUND");
    const [existing] = await tx.select({
      id: placementDebarmentDriveEvents.id,
    }).from(placementDebarmentDriveEvents).where(and(
      eq(placementDebarmentDriveEvents.debarmentId, debarment.id),
      eq(placementDebarmentDriveEvents.jobId, input.jobId),
    )).limit(1);
    if (existing) {
      return { counted: false, reason: "ALREADY_COUNTED" as const };
    }
    if (!isDebarmentActive(debarment, collegeLocalDate())) {
      throw new PlacementDebarmentError("DB08_DEBARMENT_INACTIVE");
    }
    const [job] = await tx.select({ collegeId: placementJobs.collegeId })
      .from(placementJobs)
      .where(eq(placementJobs.id, input.jobId)).limit(1);
    if (!job || job.collegeId !== debarment.collegeId) {
      throw new PlacementDebarmentError("DB08_DEBARMENT_JOB_COLLEGE_MISMATCH");
    }
    const [application] = await tx.select({ id: placementApplications.id })
      .from(placementApplications).where(and(
        eq(placementApplications.jobId, input.jobId),
        eq(placementApplications.membershipId, debarment.membershipId),
      )).limit(1);
    if (!application) {
      throw new PlacementDebarmentError("DB08_DEBARMENT_NO_APPLICATION");
    }
    const [inserted] = await tx.insert(placementDebarmentDriveEvents).values({
      debarmentId: debarment.id,
      jobId: input.jobId,
      recordedByUserId: context.user.id,
    }).onConflictDoNothing().returning({
      id: placementDebarmentDriveEvents.id,
    });
    return {
      counted: Boolean(inserted),
      reason: inserted ? "COUNTED" as const : "ALREADY_COUNTED" as const,
    };
  });
}
