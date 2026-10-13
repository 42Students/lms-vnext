import "server-only";

import {
  and,
  eq,
  inArray,
  ne,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementJobRounds,
  placementJobs,
  placementRoundResults,
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
 * This service returns only names, roll numbers, application
 * statuses and current result states. Email, phone numbers,
 * internal result comments and candidate messages are
 * deliberately excluded from its return value.
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
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
          )
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
    rows: projected.rows,
    counts: projected.counts,
  };
}
