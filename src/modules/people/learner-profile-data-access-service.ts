import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
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

export const LEARNER_PROFILE_SHARE_PAGE_SIZE=25;

/** Page share records (not raw activity rows) so one heavily accessed link
 * cannot crowd other shares out of the learner's history. Access events are
 * aggregated for the 25 authorized shares in one indexed query.
 */
export async function getOwnLearnerProfileSharePage(
 context:RequestContext,pageInput=1,
){
 await requireOwnLearnerProfileAccess(context);
 const page=Number.isSafeInteger(pageInput)&&pageInput>=1&&pageInput<=10000?pageInput:1;
 const db=getDb();
 const all=await db.selectDistinct({
  shareId:placementCompanyApplicantShares.id,
  collegeId:placementCompanyApplicantShares.collegeId,
  companyName:placementCompanies.name,
  jobTitle:placementJobs.title,
  sharedAt:placementCompanyApplicantShares.createdAt,
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
 .where(eq(collegeMemberships.userId,context.user.id))
 .orderBy(desc(placementCompanyApplicantShares.createdAt),
  desc(placementCompanyApplicantShares.id))
 .limit(LEARNER_PROFILE_SHARE_PAGE_SIZE+1)
 .offset((page-1)*LEARNER_PROFILE_SHARE_PAGE_SIZE);
 const hasMore=all.length>LEARNER_PROFILE_SHARE_PAGE_SIZE;
 const shares=all.slice(0,LEARNER_PROFILE_SHARE_PAGE_SIZE);
 const access=shares.length?await db.select({
   shareId:placementCompanyApplicantShareViews.shareId,
   collegeId:placementCompanyApplicantShareViews.collegeId,
   openedAt:sql<Date|null>`min(${placementCompanyApplicantShareViews.occurredAt}) filter (where ${placementCompanyApplicantShareViews.eventKind} = 'VIEW')`,
   exportedAt:sql<Date|null>`min(${placementCompanyApplicantShareViews.occurredAt}) filter (where ${placementCompanyApplicantShareViews.eventKind} = 'CSV')`,
   blockedAt:sql<Date|null>`min(${placementCompanyApplicantShareViews.occurredAt}) filter (where ${placementCompanyApplicantShareViews.eventKind} = 'LOCKED')`,
  }).from(placementCompanyApplicantShareViews)
  .where(inArray(placementCompanyApplicantShareViews.shareId,shares.map(row=>row.shareId)))
  .groupBy(placementCompanyApplicantShareViews.shareId,placementCompanyApplicantShareViews.collegeId):[];
 const events=new Map(access.map(row=>[row.shareId+":"+row.collegeId,row] as const));
 const rows=shares.flatMap(share=>{
  const record=events.get(share.shareId+":"+share.collegeId);
  const label=share.jobTitle+" at "+share.companyName;
  const activity=[
   record?.openedAt?{occurredAt:record.openedAt,
    summary:"A company share containing your application for "+label+" was opened. Individual row access is not recorded.",
    eventType:"VIEW"}:null,
   record?.exportedAt?{occurredAt:record.exportedAt,
    summary:"A company share containing your application for "+label+" was exported. This does not prove your row was read.",
    eventType:"CSV"}:null,
   record?.blockedAt?{occurredAt:record.blockedAt,
    summary:"An access attempt on a company share for "+label+" was blocked.",
    eventType:"LOCKED"}:null,
  ].filter((entry):entry is {occurredAt:Date;summary:string;eventType:string}=>entry!==null)
    .sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime()||
      a.eventType.localeCompare(b.eventType));
  return [...activity,{
   occurredAt:share.sharedAt,
   summary:"Your application for "+share.jobTitle+
    " was included in a company shortlist share for "+share.companyName+".",
   eventType:"COMPANY_SHARE_CREATED",
  }];
 });
 // This is a read-only history. Do not dispatch email or create notifications.
 return {page,pageSize:LEARNER_PROFILE_SHARE_PAGE_SIZE,hasMore,rows};
}

/** Backwards-compatible first page for existing learner profile callers. */
export async function getOwnLearnerProfileDataActions(context:RequestContext){
 return (await getOwnLearnerProfileSharePage(context)).rows;
}
