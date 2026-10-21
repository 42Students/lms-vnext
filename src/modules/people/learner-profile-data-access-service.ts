import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementJobs,placementCompanyRelationships,placementCompanies} from "@/db/schema";
import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
import {placementCompanyApplicantShares,placementCompanyApplicantShareViews} from "@/db/schema/placement-company-shares";
import type {RequestContext} from "@/modules/identity/context";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";

/**
 * Recorded employer-share access, not fabricated profile-view activity.
 * The authenticated user can review participation across their own historic
 * college memberships; every share is tied to that application's exact job
 * and tenant before any company name or access event is returned.
 */
export async function getOwnLearnerProfileDataActions(context:RequestContext){
 await requireOwnLearnerProfileAccess(context);
 const rows=await getDb().select({
  shareId:placementCompanyApplicantShares.id,
  companyName:placementCompanies.name,
  jobTitle:placementJobs.title,
  sharedAt:placementCompanyApplicantShares.createdAt,
  accessAt:placementCompanyApplicantShareViews.occurredAt,
  eventKind:placementCompanyApplicantShareViews.eventKind,
 }).from(placementCompanyShareSelections)
 .innerJoin(placementApplications,eq(placementApplications.id,placementCompanyShareSelections.applicationId))
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
 .innerJoin(placementCompanyApplicantShares,
  eq(placementCompanyApplicantShares.id,placementCompanyShareSelections.shareId))
 .innerJoin(placementJobs,and(
  eq(placementJobs.id,placementApplications.jobId),
  eq(placementJobs.id,placementCompanyApplicantShares.jobId),
  eq(placementJobs.collegeId,placementCompanyApplicantShares.collegeId),
  eq(placementJobs.collegeId,collegeMemberships.collegeId),
 ))
 .innerJoin(placementCompanyRelationships,and(
  eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
  eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
 ))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(placementCompanyApplicantShareViews,and(
  eq(placementCompanyApplicantShareViews.shareId,placementCompanyApplicantShares.id),
  eq(placementCompanyApplicantShareViews.collegeId,placementJobs.collegeId),
 ))
 .where(eq(collegeMemberships.userId,context.user.id))
 .orderBy(desc(sql`coalesce(${placementCompanyApplicantShareViews.occurredAt}, ${placementCompanyApplicantShares.createdAt})`),
   desc(placementCompanyApplicantShares.id))
 .limit(50);
 return rows.map(row=>({
  occurredAt:row.accessAt??row.sharedAt,
  summary:row.eventKind==="CSV"
    ? `A company share containing your application for ${row.jobTitle} at ${row.companyName} was exported. This does not prove your row was read.`
    :row.eventKind==="VIEW"
     ? `A company share containing your application for ${row.jobTitle} at ${row.companyName} was opened. Individual row access is not recorded.`
     :row.eventKind==="LOCKED"
      ? `An access attempt on a company share for ${row.jobTitle} at ${row.companyName} was blocked.`
      :`Your application for ${row.jobTitle} was included in a company shortlist share for ${row.companyName}.`,
  eventType:row.eventKind??"COMPANY_SHARE_CREATED",
 }));
}
