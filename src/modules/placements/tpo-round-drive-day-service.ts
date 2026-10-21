import "server-only";

import {
  and,
  eq,
  inArray,
  ne,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementJobRounds,
  placementJobs,
  placementRoundResults,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import {
  getDriveDayRoster,
} from "./drive-day-coordinator-service";
import {
  PlacementsServiceError,
} from "./errors";
import {
  requirePlacementManageScope,
} from "./scope";
import {
  buildTpoRoundDriveDayRoster,
} from "./tpo-round-drive-day-model";
import {
  placementRoundIdSchema,
} from "./validation";

/**
 * TPO-only, read-only projection of one Drive Day round.
 *
 * The round is first resolved inside the active TPO's
 * membership college. Both an unknown round and a round
 * belonging to another college therefore produce the
 * same PLACEMENT_ROUND_NOT_FOUND response.
 *
 * The central placements.manage permission check takes
 * the college ID from the persisted job, not from an
 * untrusted parameter.
 *
 * getDriveDayRoster supplies the established shortlisted
 * applicant population, previous-round progression rules,
 * learner membership checks and attendance states.
 *
 * Only this TPO-authorized projection also reads candidate business-call
 * phone and branch; the LEARNER coordinator roster remains redacted.
 * Raw document/avatar paths, private emails, result comments and
 * candidate messages remain deliberately excluded.
 */
export async function getTpoRoundDriveDay(
  context: RequestContext,
  rawRoundId: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const collegeId = context.membership.collegeId;

  const parsed = placementRoundIdSchema.safeParse(
    rawRoundId,
  );

  if (!parsed.success) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_FOUND",
    );
  }

  const roundId = parsed.data;
  const db = getDb();

  const [scope] = await db
    .select({
      roundId: placementJobRounds.id,
      jobId: placementJobs.id,
      collegeId: placementJobs.collegeId,
    })
    .from(placementJobRounds)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementJobRounds.jobId,
      ),
    )
    .where(
      and(
        eq(placementJobRounds.id, roundId),
        eq(placementJobs.collegeId, collegeId),
      ),
    )
    .limit(1);

  if (!scope) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    scope.collegeId,
  );

  // The existing service independently enforces the
  // same central placement-management scope.
  const roster = await getDriveDayRoster(
    context,
    roundId,
  );

  const applicationIds = roster.students.map(
    (student) => student.applicationId,
  );

  const details =
    applicationIds.length === 0
      ? []
      : await db
          .select({
            applicationId:
              placementApplications.id,
            applicationStatus:
              placementApplications.status,
            resultStatus:
              placementRoundResults.status,
            resultOutcome:
              placementRoundResults.outcome,
            phoneE164:users.phoneE164,
            branchName:sql<string|null>`(select d.name from learner_program_enrollments e
              join cohorts c on c.id=e.cohort_id join programs p on p.id=c.program_id
              join departments d on d.id=p.department_id
              where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
                and d.college_id=${scope.collegeId}
              order by e.admitted_at desc,e.id desc limit 1)`,
            assignedRoom:sql<string|null>`(select slot.room from placement_round_candidate_slots slot
              where slot.application_id=${placementApplications.id}
                and slot.round_id=${roundId}::uuid and slot.job_id=${scope.jobId}::uuid
                and slot.status='BOOKED'
              order by slot.starts_at desc,slot.id desc limit 1)`,
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
          )
          .innerJoin(users,eq(users.id,collegeMemberships.userId))
          .leftJoin(
            placementRoundResults,
            and(
              eq(
                placementRoundResults.applicationId,
                placementApplications.id,
              ),
              eq(
                placementRoundResults.roundId,
                roundId,
              ),
              ne(
                placementRoundResults.status,
                "SUPERSEDED",
              ),
            ),
          )
          .where(
            and(
              inArray(
                placementApplications.id,
                applicationIds,
              ),
              eq(
                placementApplications.jobId,
                scope.jobId,
              ),
              eq(
                placementApplications.status,
                "SUBMITTED",
              ),
              eq(
                collegeMemberships.collegeId,
                scope.collegeId,
              ),
              eq(
                collegeMemberships.status,
                "ACTIVE",
              ),
            ),
          );

  const projected =
    buildTpoRoundDriveDayRoster(
      roster.students.map((student) => ({
        applicationId:
          student.applicationId,
        displayName:
          student.displayName,
        rollNumber:
          student.rollNumber,
        attendance:
          student.attendance,
      })),
      details,
    );

  return {
    round: {
      id: roster.round.id,
      name: roster.round.name,
      kind: roster.round.kind,
      status: roster.round.status,
      scheduledAt:
        roster.round.scheduledAt,
      timezone: roster.round.timezone,
      venue: roster.round.venue,
    },
    job: {
      id: scope.jobId,
      title: roster.round.jobTitle,
    },
    companyName: roster.round.company,
    rows: projected.rows.map(row=>{
      const detail=details.find(item=>item.applicationId===row.applicationId);
      const phone=detail?.phoneE164??null;
      const callHref=phone&&/^\+[1-9]\d{1,14}$/.test(phone)?"tel:"+phone:null;
      return {...row,
        branchName:detail?.branchName??null,
        phoneE164:callHref?phone:null,
        callHref,
        assignedRoom:detail?.assignedRoom??null,
        currentRoom:null as string|null,
        avatarUrl:null as string|null,
      };
    }),
    counts: projected.counts,
  };
}
