import "server-only";

import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  learnerProfiles,
  placementApplications,
  placementApplicationScreenings,
  placementJobRoleOptions,
  placementJobs,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireTpoReadCollege } from "./tpo-surface-access";
import { projectTpoShortlist, tpoShortlistQuerySchema } from "./tpo-shortlist-model";

/**
 * An operational shortlist is a currently SUBMITTED application whose
 * current screening record is SHORTLISTED. Role option and active learner
 * membership must belong to this same persisted job and college. Historical
 * screening changes are not mistaken for current shortlist membership.
 */
export async function getTpoDriveShortlist(
  context: RequestContext,
  rawQuery: unknown,
  options: { exportAll?: boolean } = {},
) {
  const college = await requireTpoReadCollege(context);
  const query = tpoShortlistQuerySchema.parse(rawQuery);
  const db = getDb();
  const [job] = await db.select({
    id: placementJobs.id,
    title: placementJobs.title,
    status: placementJobs.status,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, query.jobId),
    eq(placementJobs.collegeId, college.id),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  const filter = and(
    eq(placementApplications.jobId, job.id),
    eq(placementApplications.status, "SUBMITTED"),
    eq(placementApplicationScreenings.status, "SHORTLISTED"),
    eq(collegeMemberships.collegeId, college.id),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
  );

  // Both the total and the roster use the same persisted scoping joins.
  const base = () => db
    .select({
      applicationId: placementApplications.id,
      membershipId: collegeMemberships.id,
      name: users.displayName,
      rollNumber: learnerProfiles.rollNumber,
      roleTitle: placementJobRoleOptions.title,
      decidedAt: placementApplicationScreenings.decidedAt,
    })
    .from(placementApplications)
    .innerJoin(
      placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id),
    )
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId),
    )
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(placementJobRoleOptions, and(
      eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId, job.id),
    ))
    .leftJoin(learnerProfiles,
      eq(learnerProfiles.membershipId, collegeMemberships.id),
    )
    .where(filter);

  const [totalRow] = await db.select({ total: count() })
    .from(placementApplications)
    .innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id),
    )
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId),
    )
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(placementJobRoleOptions, and(
      eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId, job.id),
    ))
    .where(filter);

  const total = totalRow?.total ?? 0;
  const rows = await base()
    .orderBy(asc(users.displayName), asc(placementApplications.id))
    .limit(options.exportAll ? Math.max(total, 1) : 25)
    .offset(options.exportAll ? 0 : (query.page - 1) * 25);

  return {
    job,
    rows: projectTpoShortlist(rows),
    total,
    page: options.exportAll ? 1 : query.page,
    totalPages: Math.max(1, Math.ceil(total / 25)),
  };
}
