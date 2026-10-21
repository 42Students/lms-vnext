import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { z } from "zod";

/**
 * Legacy JobApplicationRepository.countByJobIds/countHiredByJobIds.
 *
 * College-bound and membership-joined aggregates prevent cross-college counts
 * for an employer's shared organization. A soft-deleted historical row is
 * excluded unless it is the learner's own history reader; withdrawn rows
 * never inflate published job-count chips or hiring reports.
 *
 * Queries group in PostgreSQL rather than fetching every application into
 * JS at the 10k-learners-per-college scale.
 */
export async function countCollegeJobApplications(
  context: RequestContext,
  collegeId: string,
  jobIds: readonly string[],
): Promise<Map<string, { applied: number; hired: number }>> {
  const scopeId = z.string().uuid().parse(collegeId);
  requirePermission(context, "placements.manage", {collegeId: scopeId});
  const ids = [...new Set(jobIds.map(value => z.string().uuid().parse(value)))];
  if (ids.length > 1000) throw new RangeError("Count at most 1,000 jobs at a time");
  const counts = new Map<string,{applied:number;hired:number}>();
  for (const id of ids) counts.set(id,{applied:0,hired:0});
  if (!ids.length) return counts;

  // A single grouped query, not N per-job calls. Unlike the learner's own
  // history page, archived/withdrawn applications are intentionally excluded.
  const rows = await getDb().select({
    jobId: placementApplications.jobId,
    applied: sql<number>`count(*)::int`,
    hired: sql<number>`count(*) filter (
      where ${placementApplications.status} = 'HIRED'
    )::int`,
  }).from(placementApplications)
    .innerJoin(placementJobs, and(
      eq(placementJobs.id, placementApplications.jobId),
      eq(placementJobs.collegeId, scopeId),
    ))
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, placementApplications.membershipId),
      eq(collegeMemberships.collegeId, scopeId),
    ))
    .where(and(
      inArray(placementApplications.jobId, ids),
      or(
        eq(placementApplications.legacyWasDeleted, false),
        isNull(placementApplications.legacyWasDeleted),
      ),
      sql`${placementApplications.status} <> 'WITHDRAWN'`,
    ))
    .groupBy(placementApplications.jobId);
  for (const row of rows) counts.set(row.jobId,{
    applied:row.applied,
    hired:row.hired,
  });
  return counts;
}

/** V1 applicationStatus -> vNext list/status labels. Never confuse a
 * proposed selection with an issued offer: OFFERED is rendered only once
 * there is an actual verified/released offer for this application. */
export function legacyApplicationStatusLabel(
  status: string | null | undefined,
  hasIssuedOffer = false,
): string {
  if (hasIssuedOffer) return "Offered";
  switch (status) {
    case "SUBMITTED":
    case "APPLIED": return "Applied";
    case "SHORTLISTED": return "Shortlisted";
    case "SELECTED": return "Selected";
    case "HIRED": return "Hired";
    case "REJECTED": return "Rejected";
    case "WITHDRAWN": return "Withdrawn";
    default: return "Not available";
  }
}
