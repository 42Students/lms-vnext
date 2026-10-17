import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  activityEvents,
  inAppNotifications,
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
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";

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
    | "DB08_DEBARMENT_INVALID_DURATION"
    | "DB08_DEBARMENT_ALREADY_ACTIVE") {
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

/**
 * P-S1-02: internal learner self-apply/read gate. Do not expose a debarment
 * reason or count in a learner response.
 */
export async function isPlacementLearnerDebarred(
  collegeId: string,
  membershipId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await getDb().select({
    liftedAt: placementDebarments.liftedAt,
    untilDate: placementDebarments.untilDate,
    untilDrives: placementDebarments.untilDrives,
    drivesCounted: placementDebarments.drivesCounted,
  }).from(placementDebarments).where(and(
    eq(placementDebarments.collegeId, collegeId),
    eq(placementDebarments.membershipId, membershipId),
  ));
  return rows.some((row) => isDebarmentActive(row, collegeLocalDate(now)));
}

async function lockCollege(tx: Tx, collegeId: string) {
  const [row] = await tx.select({ id: colleges.id, organizationId:colleges.organizationId })
    .from(colleges).where(eq(colleges.id, collegeId))
    .for("update").limit(1);
  if (!row) throw new PlacementDebarmentError("DB08_DEBARMENT_MEMBER_INVALID");
  return row;
}

async function requireLearner(tx: Tx, collegeId: string, membershipId: string) {
  const [member] = await tx.select({
    id: collegeMemberships.id,
    userId:collegeMemberships.userId,
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
  return member;
}

/** Learner notice and staff action are committed with the restriction, never
 * as best-effort follow-up work. No private staff reason is sent to learners. */
async function recordDebarmentNotice(tx:Tx,scope:{id:string;organizationId:string},
  userId:string,actorId:string,debarmentId:string,action:"DEBARRED"|"DEBARMENT_LIFTED"){
 const [event]=await tx.insert(activityEvents).values({
  organizationId:scope.organizationId,collegeId:scope.id,actorUserId:actorId,
  module:"PLACEMENTS",eventType:action,subjectType:"placement_debarment",
  subjectId:debarmentId,subjectLabel:"Placement eligibility",
  summary:action==="DEBARRED"?"Learner placement restriction started":"Learner placement restriction lifted",
  metadata:{debarmentId,action},
 }).returning({id:activityEvents.id});
 if(!event)throw new PlacementDebarmentError("DB08_DEBARMENT_NOT_FOUND");
 await tx.insert(inAppNotifications).values({
  userId,eventId:event.id,title:action==="DEBARRED"?"Placement participation restricted":"Placement restriction lifted",
  body:action==="DEBARRED"
    ?"A placement restriction is active. Open your placement eligibility page to see its duration or ask the placement cell to review it."
    :"Your placement restriction was lifted. You may check current placement opportunities.",
  actionHref:"/learn/my-placements",
 }).onConflictDoNothing();
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
    const college=await lockCollege(tx, input.collegeId);
    const learner=await requireLearner(tx, input.collegeId, input.membershipId);
    const existing=await tx.select({
      liftedAt:placementDebarments.liftedAt,untilDate:placementDebarments.untilDate,
      untilDrives:placementDebarments.untilDrives,drivesCounted:placementDebarments.drivesCounted,
    }).from(placementDebarments).where(and(
      eq(placementDebarments.collegeId,input.collegeId),
      eq(placementDebarments.membershipId,input.membershipId),
    )).for("update");
    if(existing.some(value=>isDebarmentActive(value,collegeLocalDate())))
      throw new PlacementDebarmentError("DB08_DEBARMENT_ALREADY_ACTIVE");
    const [row] = await tx.insert(placementDebarments).values({
      collegeId: input.collegeId,
      membershipId: input.membershipId,
      reason: input.reason,
      untilDate: date,
      untilDrives: input.untilDrives ?? null,
      createdByUserId: context.user.id,
    }).returning();
    // The DB08 trigger independently preserves immutable CREATED history.
    await recordDebarmentNotice(tx,college,learner.userId,context.user.id,row.id,"DEBARRED");
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
    const college=await lockCollege(tx, current.collegeId);
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
    // The DB trigger creates immutable LIFTED history. A repeated lift is a no-op.
    const [learner]=await tx.select({userId:collegeMemberships.userId})
      .from(collegeMemberships).where(and(
        eq(collegeMemberships.id,locked.membershipId),
        eq(collegeMemberships.collegeId,locked.collegeId),
      )).limit(1);
    if(!learner)throw new PlacementDebarmentError("DB08_DEBARMENT_MEMBER_INVALID");
    await recordDebarmentNotice(tx,college,learner.userId,context.user.id,updated.id,"DEBARMENT_LIFTED");
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

/** Tenant-authorized TPO-only history for the learner's timed/drive-based bans. */
export async function listTpoMemberDebarments(context:RequestContext,rawMembershipId:unknown){
 const collegeId=await requireTpoBatchActor(context);
 const membershipId=uuid.parse(rawMembershipId);
 const records=await getDb().select({
  id:placementDebarments.id,reason:placementDebarments.reason,
  untilDate:placementDebarments.untilDate,untilDrives:placementDebarments.untilDrives,
  drivesCounted:placementDebarments.drivesCounted,
  createdAt:placementDebarments.createdAt,liftedAt:placementDebarments.liftedAt,
  liftedReason:placementDebarments.liftedReason,
 }).from(placementDebarments).where(and(
  eq(placementDebarments.collegeId,collegeId),
  eq(placementDebarments.membershipId,membershipId),
 )).orderBy(desc(placementDebarments.createdAt)).limit(500);
 return records.map(row=>({
  ...row,
  createdAt:row.createdAt.toISOString(),
  liftedAt:row.liftedAt?.toISOString()??null,
  active:isDebarmentActive(row,collegeLocalDate()),
 }));
}
