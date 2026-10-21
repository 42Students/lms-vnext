import "server-only";

import { and, asc, count, countDistinct, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";

/**
 * College-only relationship history; a shared canonical company ID is never
 * sufficient authorization to retrieve another college's recruiting history.
 * The bounded history lists at most 100 drives and marks truncated totals.
 */
export async function getCollegeCompanyHistory(
  context: RequestContext,
  rawRelationshipId: string,
) {
  const relationshipId = z.string().uuid().parse(rawRelationshipId);
  const db = getDb();
  const [relationship] = await db
    .select({
      id: placementCompanyRelationships.id,
      collegeId: placementCompanyRelationships.collegeId,
      companyName: placementCompanies.name,
      internalNotes: placementCompanyRelationships.internalNotes,
      contactName: placementCompanyRelationships.contactPersonName,
      contactEmail: placementCompanyRelationships.contactEmail,
      contactPhone: placementCompanyRelationships.contactPhone,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(eq(placementCompanyRelationships.id, relationshipId))
    .limit(1);

  if (!relationship) {
    throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  }
  await requirePlacementManageScope(context, relationship.collegeId);

  const rows = await db
    .select({
      id: placementJobs.id,
      title: placementJobs.title,
      status: placementJobs.status,
      publishedAt: placementJobs.publishedAt,
    })
    .from(placementJobs)
    .where(
      and(
        eq(placementJobs.companyRelationshipId, relationship.id),
        eq(placementJobs.collegeId, relationship.collegeId),
      ),
    )
    .orderBy(asc(placementJobs.title), asc(placementJobs.id))
    .limit(101);

  const jobs = rows.slice(0, 100);
  const jobIds = jobs.map((job) => job.id);
  const [applications, joined] = await Promise.all([
    jobIds.length
      ? db
          .select({
            jobId: placementApplications.jobId,
            total: count(),
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            and(
              eq(collegeMemberships.id, placementApplications.membershipId),
              eq(collegeMemberships.collegeId, relationship.collegeId),
            ),
          )
          .where(inArray(placementApplications.jobId, jobIds))
          .groupBy(placementApplications.jobId)
      : Promise.resolve([]),
    jobIds.length
      ? db
          .select({
            jobId: placementApplications.jobId,
            total: countDistinct(placementApplications.membershipId),
          })
          .from(placementApplications)
          .innerJoin(
            collegeMemberships,
            and(
              eq(collegeMemberships.id, placementApplications.membershipId),
              eq(collegeMemberships.collegeId, relationship.collegeId),
            ),
          )
          .innerJoin(
            placementOffers,
            and(
              eq(placementOffers.applicationId, placementApplications.id),
              eq(placementOffers.status, "ACCEPTED"),
            ),
          )
          .innerJoin(
            placementJoiningOutcomes,
            and(
              eq(placementJoiningOutcomes.offerId, placementOffers.id),
              eq(placementJoiningOutcomes.status, "JOINED"),
            ),
          )
          .where(inArray(placementApplications.jobId, jobIds))
          .groupBy(placementApplications.jobId)
      : Promise.resolve([]),
  ]);

  const applicationCounts = new Map(applications.map((row) => [row.jobId, row.total]));
  const joiningCounts = new Map(joined.map((row) => [row.jobId, row.total]));
  const items = jobs.map((job) => ({
    ...job,
    applicants: applicationCounts.get(job.id) ?? 0,
    hired: joiningCounts.get(job.id) ?? 0,
  }));

  return {
    company: {
      name: relationship.companyName,
      contactName: relationship.contactName,
      contactEmail: relationship.contactEmail,
      contactPhone: relationship.contactPhone,
      // Internal college CRM notes must never be returned from public endpoints.
      internalNotes: relationship.internalNotes,
    },
    items,
    totals: {
      drives: items.length,
      applicants: items.reduce((sum, item) => sum + item.applicants, 0),
      hired: items.reduce((sum, item) => sum + item.hired, 0),
    },
    truncated: rows.length > 100,
  };
}
