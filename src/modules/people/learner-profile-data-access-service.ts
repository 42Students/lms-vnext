import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementJobs,placementCompanyRelationships,placementCompanies} from "@/db/schema";
import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
import {placementCompanyApplicantShares,placementCompanyApplicantShareViews} from "@/db/schema/placement-company-shares";
import {placementTpoShareLinks,placementTpoShareEvents} from "@/db/schema/tpo-collaboration";
import {TPO_SHARE_COLUMNS} from "@/modules/placements/tpo-share-projection";
import type {RequestContext} from "@/modules/identity/context";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";

/**
 * Recorded employer-share access, not fabricated profile-view activity.
 * The authenticated user can review participation across their own historic
 * college memberships; every share is tied to that application's exact job
 * and tenant before any company name or access event is returned.
 */

export const LEARNER_PROFILE_SHARE_PAGE_SIZE=25;
/** Disclosure is keyed to the applicant's *membership* on a shared list.
 * There is no recipient-email column in the current share schema, and the CSV
 * event applies to the whole share rather than one learner row. Do not invent
 * or reveal a recipient address or mislabel aggregate exports as downloads of
 * this learner's profile.
 */
export type LearnerProfileShareDisclosure={
 shareId:string;
 company:string;
 role:string;
 sharedWithEmail:string|null;
 sharedAt:Date;
 downloadedAt:Date|null;
 recipientRecorded:false;
 downloadEventScope:"SHARE_NOT_INDIVIDUAL_ROW";
};

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
 const disclosures:LearnerProfileShareDisclosure[]=shares.map(share=>({
  shareId:share.shareId,
  company:share.companyName,
  role:share.jobTitle,
  sharedWithEmail:null,
  sharedAt:share.sharedAt,
  downloadedAt:events.get(share.shareId+":"+share.collegeId)?.exportedAt??null,
  recipientRecorded:false,
  downloadEventScope:"SHARE_NOT_INDIVIDUAL_ROW",
 }));
 // This is a read-only history. Do not dispatch email or create notifications.
 return {page,pageSize:LEARNER_PROFILE_SHARE_PAGE_SIZE,hasMore,rows,disclosures};
}

/** Backwards-compatible first page for existing learner profile callers. */
export async function getOwnLearnerProfileDataActions(context:RequestContext){
 return (await getOwnLearnerProfileSharePage(context)).rows;
}

/**
 * Potential exposure through the earlier DB09 job-wide recruiter link system.
 *
 * Unlike the explicit applicant-share selection table, DB09 has NO selected
 * learner rows or per-row download record. Association with an applied job
 * cannot establish that this learner appeared in the export at any historical
 * stage. Return an explicitly UNCONFIRMED disclosure, not a fabricated profile
 * view. We preserve the actual recipient, link-wide download and stage/column
 * limitations for the learner's own historically participating memberships.
 */
export async function getOwnLearnerTpoSharePage(
  context:RequestContext,pageInput=1,
){
  await requireOwnLearnerProfileAccess(context);
  const page=Number.isSafeInteger(pageInput)&&pageInput>=1&&pageInput<=10000?pageInput:1;
  const db=getDb();
  const records=await db.selectDistinct({
    shareId:placementTpoShareLinks.id,
    collegeId:placementTpoShareLinks.collegeId,
    recipientEmail:placementTpoShareLinks.recipientEmail,
    companyName:placementCompanies.name,
    jobTitle:placementJobs.title,
    createdAt:placementTpoShareLinks.createdAt,
    expiresAt:placementTpoShareLinks.expiresAt,
    revokedAt:placementTpoShareLinks.revokedAt,
    maxStage:placementTpoShareLinks.maxStage,
    columns:placementTpoShareLinks.columns,
  }).from(placementTpoShareLinks)
  .innerJoin(placementJobs,and(
    eq(placementJobs.id,placementTpoShareLinks.jobId),
    eq(placementJobs.collegeId,placementTpoShareLinks.collegeId),
  ))
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
  ))
  .innerJoin(placementCompanies,
    eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(placementApplications,
    eq(placementApplications.jobId,placementTpoShareLinks.jobId))
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,placementTpoShareLinks.collegeId),
  ))
  .where(eq(collegeMemberships.userId,context.user.id))
  .orderBy(desc(placementTpoShareLinks.createdAt),desc(placementTpoShareLinks.id))
  .limit(LEARNER_PROFILE_SHARE_PAGE_SIZE+1)
  .offset((page-1)*LEARNER_PROFILE_SHARE_PAGE_SIZE);
  const hasMore=records.length>LEARNER_PROFILE_SHARE_PAGE_SIZE;
  const shares=records.slice(0,LEARNER_PROFILE_SHARE_PAGE_SIZE);
  const activity=shares.length?await db.select({
    shareId:placementTpoShareEvents.shareId,
    openedAt:sql<Date|null>`min(${placementTpoShareEvents.createdAt}) filter (where ${placementTpoShareEvents.action} = 'OPENED')`,
    downloadedAt:sql<Date|null>`min(${placementTpoShareEvents.createdAt}) filter (where ${placementTpoShareEvents.action} in ('DOWNLOADED_LIST','DOWNLOADED_ZIP'))`,
  }).from(placementTpoShareEvents)
   .where(inArray(placementTpoShareEvents.shareId,shares.map(share=>share.shareId)))
   .groupBy(placementTpoShareEvents.shareId):[];
  const activityById=new Map(activity.map(row=>[row.shareId,row] as const));
  const allowedFields:ReadonlySet<string>=new Set(TPO_SHARE_COLUMNS);
  const items=shares.map(share=>({
    shareId:share.shareId,
    company:share.companyName,role:share.jobTitle,
    sharedWithEmail:share.recipientEmail,sharedAt:share.createdAt,
    openedAt:activityById.get(share.shareId)?.openedAt??null,
    downloadedAt:activityById.get(share.shareId)?.downloadedAt??null,
    expiresAt:share.expiresAt,revokedAt:share.revokedAt,
    maxStage:share.maxStage,
    requestedColumns:Array.isArray(share.columns)?
      share.columns.filter((column):column is string=>
        typeof column==="string"&&allowedFields.has(column)):null,
    inclusionConfirmed:false as const,
    downloadEventScope:"WHOLE_LINK_NOT_INDIVIDUAL_ROW" as const,
  }));
  return {page,pageSize:LEARNER_PROFILE_SHARE_PAGE_SIZE,hasMore,items};
}
