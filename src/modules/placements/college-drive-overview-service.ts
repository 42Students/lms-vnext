import "server-only";

import { and, count, countDistinct, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementApplicationScreenings,
  placementCompanies, placementCompanyRelationships, placementJobs, placementOffers, placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requireCollegePlacementAdmin } from "./college-drive-read-service";
import { placementDriveSelections } from "@/db/schema/placement-drive-selections";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import { collegeDriveIdSchema } from "./college-drive-read-model";

/** SELECTED/VERIFIED/RELEASED all represent persisted selection history,
 * excluding cancelled selections. */
function sqlSelectedStatus(){
 return inArray(placementDriveSelections.status,["SELECTED","VERIFIED","RELEASED"]);
}

/** Every metric is a separate scoped SQL query, so joins cannot inflate counts. */
export async function getCollegeDriveOverview(context: RequestContext, jobIdInput: unknown) {
  const jobId = collegeDriveIdSchema.parse(jobIdInput);
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const [drive] = await db.select({
    id: placementJobs.id, title: placementJobs.title, description: placementJobs.description,
    jobTypeLabel:placementJobs.jobTypeLabel,companyLogoUrl:placementCompanies.logoPublicUrl,
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
  const [applications, shortlisted, offers, selections, withdrawn, external] = await Promise.all([
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
    db.select({total:countDistinct(placementDriveSelections.applicationId)})
      .from(placementDriveSelections)
      .innerJoin(placementApplications,eq(placementApplications.id,placementDriveSelections.applicationId))
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,collegeId)))
      .where(and(eq(placementDriveSelections.jobId,jobId),
        eq(placementApplications.jobId,jobId),
        sqlSelectedStatus())),
    db.select({total:count()}).from(placementApplications)
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,collegeId)))
      .where(and(eq(placementApplications.jobId,jobId),eq(placementApplications.status,"WITHDRAWN"))),
    db.select({total:count()}).from(placementApplications)
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,collegeId)))
      .where(and(eq(placementApplications.jobId,jobId),eq(placementApplications.channel,"EXTERNAL"))),
  ]);
  return { drive: {
    ...drive,
    legacyStatus: drive.status==="DRAFT"?"Draft":
      drive.status!=="PUBLISHED"?"Closed":
      isPlacementApplicationDeadlinePassed(drive.applicationDeadline,new Date())?"Applications closed":"Active",
    legacyJobType: drive.jobTypeLabel?.trim()||drive.employmentType,
    descriptionVisible:Boolean(drive.description.trim()),
    descriptionLines:drive.description.trim()?drive.description.trim().split(/\r?\n/).slice(0,3).join("\n"):null,
    legacyIsDraft:drive.status==="DRAFT",legacyIsActive:drive.status==="PUBLISHED",
  }, counts: {
    applications: applications[0]?.total ?? 0,
    shortlisted: shortlisted[0]?.total ?? 0,
    selected: selections[0]?.total ?? 0,
    offered: offers[0]?.total ?? 0,
    withdrawn: withdrawn[0]?.total ?? 0,
    external: external[0]?.total ?? 0,
  }, notFoundFallback:{title:"Could not load this drive",backHref:"/college/placements/jobs",backLabel:"Back to drives"} };
}
