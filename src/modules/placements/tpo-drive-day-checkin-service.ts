import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRounds, placementJobs, placementRoundAttendance,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { getTpoRoundDriveDay } from "./tpo-round-drive-day-service";
import { placementRoundIdSchema } from "./validation";
import { tpoDriveDayCheckInSchema, decideTpoAttendanceTransition } from "./tpo-drive-day-checkin-model";
import { PlacementsServiceError } from "./errors";

export class TpoAttendanceStaleError extends Error {
  constructor() { super("TPO_DRIVE_DAY_ATTENDANCE_STALE"); this.name = "TpoAttendanceStaleError"; }
}

/**
 * TPO-only confirmed PRESENT/ABSENT check-in. Missing attendance is WAITING.
 * An already-recorded identical state is idempotent and writes no second audit.
 */
export async function confirmTpoDriveDayCheckIn(
  context: RequestContext, rawRoundId: unknown, raw: unknown,
) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
    context.user.platformStatus !== "ACTIVE") throw new AuthorizationError("placements.manage");
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const roundId = placementRoundIdSchema.parse(rawRoundId);
  const input = tpoDriveDayCheckInSchema.parse(raw);
  const college = await requirePlacementManageScope(context, collegeId);

  const roster = await getTpoRoundDriveDay(context, roundId);
  if (!roster.rows.some((row) => row.applicationId === input.applicationId)) {
    throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND");
  }
  const actorMembershipId = member.id, actorUserId = context.user.id;

  return getDb().transaction(async (tx) => {
    const [round] = await tx.select({ id: placementJobRounds.id, jobId: placementJobRounds.jobId,
      status: placementJobRounds.status }).from(placementJobRounds)
      .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
      .where(and(eq(placementJobRounds.id, roundId), eq(placementJobs.collegeId, collegeId)))
      .for("share").limit(1);
    if (!round || round.status === "CANCELLED" || round.status === "COMPLETED") {
      throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_READY");
    }
    const [candidate] = await tx.select({ id: placementApplications.id })
      .from(placementApplications)
      .innerJoin(placementApplicationScreenings,
        eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships,
        eq(collegeMemberships.id, placementApplications.membershipId))
      .where(and(eq(placementApplications.id, input.applicationId),
        eq(placementApplications.jobId, round.jobId),
        eq(placementApplications.status, "SUBMITTED"),
        eq(placementApplicationScreenings.status, "SHORTLISTED"),
        eq(collegeMemberships.collegeId, collegeId), eq(collegeMemberships.status, "ACTIVE")))
      .for("share").limit(1);
    if (!candidate) throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND");
    const [prior] = await tx.select().from(placementRoundAttendance)
      .where(and(eq(placementRoundAttendance.roundId, roundId),
        eq(placementRoundAttendance.applicationId, input.applicationId)))
      .for("update").limit(1);
    const decision = decideTpoAttendanceTransition(
      prior?.status ?? null, input.expectedAttendance, input.status,
    );
    if (decision === "STALE") throw new TpoAttendanceStaleError();
    if (decision === "UNCHANGED" && prior) return { attendance: prior, changed: false as const };
    const now = new Date();
    let written: typeof prior | undefined;
    if (prior) {
      [written] = await tx.update(placementRoundAttendance).set({
        status: input.status, room: null, markedByUserId: actorUserId,
        markedAt: now, updatedAt: now,
      }).where(eq(placementRoundAttendance.id, prior.id)).returning();
    } else {
      [written] = await tx.insert(placementRoundAttendance).values({
        roundId, applicationId: input.applicationId, status: input.status,
        room: null, markedByUserId: actorUserId, markedAt: now, updatedAt: now,
      }).onConflictDoNothing().returning();
    }
    if (!written) throw new TpoAttendanceStaleError();
    await tx.insert(activityEvents).values({
      organizationId: college.organizationId, collegeId,
      actorUserId, actorMembershipId, module: "PLACEMENTS",
      eventType: "PLACEMENTS_DRIVE_DAY_ATTENDANCE_CONFIRMED",
      subjectType: "placement_round_attendance", subjectId: written.id,
      subjectLabel: "Drive Day check-in", summary: "TPO confirmed round attendance",
      metadata: { roundId, applicationId: input.applicationId,
        previousStatus: prior?.status ?? "WAITING", status: input.status },
      occurredAt: now,
    });
    return { attendance: written, changed: true as const };
  });
}
