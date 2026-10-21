import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRounds, placementJobs, placementRoundAttendance, placementDebarments, placementLearnerRequests,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { getTpoRoundDriveDay } from "./tpo-round-drive-day-service";
import { dateInIndia } from "./drive-day-coordinator-service";
import { placementRoundIdSchema } from "./validation";
import { tpoDriveDayCheckInSchema, decideTpoAttendanceTransition } from "./tpo-drive-day-checkin-model";
import { PlacementsServiceError } from "./errors";
import { hasActivePlacementDebarment } from "./placement-debarment-gate";
import { deliverRecordedLearnerPlacementEvent } from "./learner-placement-event-delivery";

export class TpoAttendanceStaleError extends Error {
  constructor() { super("TPO_DRIVE_DAY_ATTENDANCE_STALE"); this.name = "TpoAttendanceStaleError"; }
}

/**
 * TPO-only confirmed attendance/room progression. Missing attendance is WAITING.
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
      status: placementJobRounds.status,
      scheduledAt: placementJobRounds.scheduledAt }).from(placementJobRounds)
      .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
      .where(and(eq(placementJobRounds.id, roundId), eq(placementJobs.collegeId, collegeId)))
      .for("share").limit(1);
    if (!round || round.status !== "SCHEDULED" || !round.scheduledAt ||
        dateInIndia(round.scheduledAt) !== dateInIndia(new Date())) {
      throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
    }
    const [candidate] = await tx.select({
      id: placementApplications.id,
      membershipId: placementApplications.membershipId,
    })
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
    if (input.status === "ABSENT") {
      // TPO-requests-verification-05: pending withdrawal excuses the learner.
      // Escalation is informational; do not mark them absent while undecided.
      const [withdrawal] = await tx.select({id:placementLearnerRequests.id})
        .from(placementLearnerRequests).where(and(
          eq(placementLearnerRequests.applicationId,input.applicationId),
          eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
          eq(placementLearnerRequests.status,"PENDING")))
        .limit(1);
      if(withdrawal)throw new PlacementsServiceError("PLACEMENT_REQUEST_PENDING_WITHDRAWAL");
    }
    if (input.status !== "ABSENT") {
      // P-S1-02: being on the existing shortlist never overrides a later ban.
      const bans = await tx.select().from(placementDebarments).where(and(
        eq(placementDebarments.collegeId, collegeId),
        eq(placementDebarments.membershipId, candidate.membershipId),
      )).for("share");
      if (hasActivePlacementDebarment(bans, new Date())) {
        throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND");
      }
    }
    const [prior] = await tx.select().from(placementRoundAttendance)
      .where(and(eq(placementRoundAttendance.roundId, roundId),
        eq(placementRoundAttendance.applicationId, input.applicationId)))
      .for("update").limit(1);
    const decision = decideTpoAttendanceTransition(
      prior?.status ?? null, input.expectedAttendance, input.status,
    );
    if (decision === "STALE") throw new TpoAttendanceStaleError();
    // A completed interview cannot be rewound; completing an interview
    // requires both a present check-in and an in-progress record.
    const previous=prior?.status??"WAITING";
    if((input.status==="IN_INTERVIEW"&&previous!=="PRESENT"&&previous!=="IN_INTERVIEW")||
       (input.status==="DONE"&&previous!=="IN_INTERVIEW"&&previous!=="DONE")||
       (previous==="DONE"&&input.status!=="DONE")||
       (previous==="IN_INTERVIEW"&&input.status==="ABSENT"))
      throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
    const room=input.room===undefined?prior?.room??null:input.room;
    if(decision==="UNCHANGED"&&prior&&prior.room===room)
      return { attendance: prior, changed: false as const };
    const now = new Date();
    let written: typeof prior | undefined;
    if (prior) {
      [written] = await tx.update(placementRoundAttendance).set({
        status: input.status, room, markedByUserId: actorUserId,
        markedAt: now, updatedAt: now,
      }).where(eq(placementRoundAttendance.id, prior.id)).returning();
    } else {
      [written] = await tx.insert(placementRoundAttendance).values({
        roundId, applicationId: input.applicationId, status: input.status,
        room, markedByUserId: actorUserId, markedAt: now, updatedAt: now,
      }).onConflictDoNothing().returning();
    }
    if (!written) throw new TpoAttendanceStaleError();
    const [attendanceEvent] = await tx.insert(activityEvents).values({
      organizationId: college.organizationId, collegeId,
      actorUserId, actorMembershipId, module: "PLACEMENTS",
      eventType: "PLACEMENTS_DRIVE_DAY_ATTENDANCE_CONFIRMED",
      subjectType: "placement_round_attendance", subjectId: written.id,
      subjectLabel: "Drive Day check-in", summary: "TPO confirmed round attendance",
      metadata: { roundId, applicationId: input.applicationId,
        previousStatus: prior?.status ?? "WAITING", status: input.status,
        previousRoom:prior?.room??null,room },
      occurredAt: now,
    }).returning({id:activityEvents.id});
    // Only the FIRST transition into ABSENT emits a learner message. The
    // activity event, attendance and preference-aware delivery commit together.
    // A later room change or repeated mark must never emit a second absence.
    if (attendanceEvent && input.status === "ABSENT" &&
        prior?.status !== "ABSENT") {
      await deliverRecordedLearnerPlacementEvent(tx, {
        eventId: attendanceEvent.id,
        collegeId,
        membershipId: candidate.membershipId,
        kind: "MARKED_ABSENT",
        subject: roster.round.name + " · " + roster.job.title,
      });
    }
    return { attendance: written, changed: true as const };
  });
}
