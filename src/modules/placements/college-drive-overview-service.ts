import "server-only";

import { and, count, countDistinct, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementApplicationScreenings,
  placementCompanies, placementCompanyRelationships, placementJobs, placementOffers, placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireCollegePlacementAdmin } from "./college-drive-read-service";
import { collegeDriveIdSchema } from "./college-drive-read-model";

/** Every metric is a separate scoped SQL query, so joins cannot inflate counts. */
export async function getCollegeDriveOverview(context: RequestContext, jobIdInput: unknown) {
  const jobId = collegeDriveIdSchema.parse(jobIdInput);
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const [drive] = await db.select({
    id: placementJobs.id, title: placementJobs.title, description: placementJobs.description,
    status: placementJobs.status, employmentType: placementJobs.employmentType,
    workMode: placementJobs.workMode, openings: placementJobs.openings,
    applicationDeadline: placementJobs.applicationDeadline,
    companyName: placementCompanies.name, seasonName: placementSeasons.name,
  }).from(placementJobs)
    .innerJoin(placementSeasons, and(
      eq(placementSeasons.id, placementJobs.seasonId),
      eq(placementSeasons.collegeId, collegeId),
    ))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
    ))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId))).limit(1);
  if (!drive) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [applications, shortlisted, offers] = await Promise.all([
    db.select({ total: count() }).from(placementApplications)
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, placementApplications.membershipId),
        eq(collegeMemberships.collegeId, collegeId),
      )).where(eq(placementApplications.jobId, jobId)),
    db.select({ total: count() }).from(placementApplicationScreenings)
      .innerJoin(placementApplications, eq(placementApplications.id, placementApplicationScreenings.applicationId))
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, placementApplications.membershipId),
        eq(collegeMemberships.collegeId, collegeId),
      ))
      .where(and(eq(placementApplications.jobId, jobId),
        eq(placementApplications.status, "SUBMITTED"),
        eq(placementApplicationScreenings.status, "SHORTLISTED"))),
    db.select({ total: countDistinct(placementOffers.applicationId) }).from(placementOffers)
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, placementApplications.membershipId),
        eq(collegeMemberships.collegeId, collegeId),
      )).where(eq(placementApplications.jobId, jobId)),
  ]);
  return { drive, counts: {
    applications: applications[0]?.total ?? 0,
    shortlisted: shortlisted[0]?.total ?? 0,
    selected: null as number | null,
    offered: offers[0]?.total ?? 0,
  } };
}
