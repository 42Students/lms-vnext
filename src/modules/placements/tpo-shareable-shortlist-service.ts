import "server-only";

import { and, asc, count, eq, ilike, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobs, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireTpoReadCollege } from "./tpo-surface-access";
import {escapeLiteralApplicantSearch,clampCompanySharePage} from "./company-share/public-filter-model";
import {requirePersistedTpoMembership} from "./tpo-persisted-actor-service";
import {
  projectRecruiterVisibleShortlist, tpoShareableShortlistQuerySchema,
} from "./tpo-shareable-shortlist-model";

/**
 * TPO-only preview. Field set is deliberately no larger than
 * recruiter-workspace-service's candidate {applicationId,displayName,email}.
 * Does not expose scores, resumes, phone numbers, internal comments or
 * unregistered share tokens, and does not send anything.
 */
export async function getTpoShareableShortlist(
  context: RequestContext,
  rawQuery: unknown,
  options: { exportAll?: boolean } = {},
) {
  const college = await requireTpoReadCollege(context);
  await requirePersistedTpoMembership(context,college.id);
  const query = tpoShareableShortlistQuerySchema.parse(rawQuery);
  const db = getDb();
  const [job] = await db.select({
    id: placementJobs.id, title: placementJobs.title,
    companyRelationshipId:placementJobs.companyRelationshipId,
    collegeId:placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, query.jobId),
    eq(placementJobs.collegeId, college.id),
    inArray(placementJobs.status, ["PUBLISHED", "CLOSED"]),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");

  const filter = and(
    eq(placementApplications.jobId, job.id),
    eq(placementApplications.status, "SUBMITTED"),
    eq(placementApplicationScreenings.status, "SHORTLISTED"),
    eq(collegeMemberships.collegeId, college.id),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    query.q ? ilike(users.displayName, "%" + escapeLiteralApplicantSearch(query.q) + "%") : undefined,
  );
  const base = () => db.select({
    applicationId: placementApplications.id,
    displayName: users.displayName,
    email: users.email,
  }).from(placementApplications)
    .innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(filter);
  const [counter] = await db.select({ total: count() })
    .from(placementApplications)
    .innerJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, placementApplications.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(filter);
  const total = counter?.total ?? 0;
  const pagination=clampCompanySharePage(query.page,total);
  const exportAll = options.exportAll === true;
  const records = await base()
    .orderBy(asc(users.displayName), asc(placementApplications.id))
    .limit(exportAll ? 500 : 25)
    .offset(exportAll ? 0 : (pagination.page - 1) * 25);
  return {
    job, total,
    rows: projectRecruiterVisibleShortlist(records),
    page: exportAll ? 1 : pagination.page,
    totalPages: pagination.totalPages,
    truncated: exportAll && total > 500,
  };
}
