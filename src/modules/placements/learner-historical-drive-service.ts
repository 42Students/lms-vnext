import "server-only";
import {and,asc,desc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,placementApplications,placementApplicationStatusHistory,placementCompanies,
 placementCompanyRelationships,placementJobRoleOptions,placementJobRounds,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {placementJobIdSchema} from "./validation";
/** LEARNER-placements-24: an own submitted application survives cancellation
 * or closure. Never surface private internal round results, other candidates,
 * or an un-applied unpublished drive.
 */
export async function getOwnLearnerDriveJourney(context:RequestContext,rawJobId:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 const member=await requireLearnerPlacementAccess(context);
 // A learner can submit to multiple role options within one drive. Keep the
 // legacy top-level application fields for callers while exposing each own
 // role-linked receipt separately, never a staff-only resume artifact.
 const applications=await getDb().select({
  applicationId:placementApplications.id,applicationStatus:placementApplications.status,
  roleOptionId:placementApplications.roleOptionId,roleTitle:placementJobRoleOptions.title,
  receiptRef:placementApplications.publicRef,submittedAt:placementApplications.submittedAt,
  withdrawnAt:placementApplications.withdrawnAt,withdrawalReason:placementApplications.withdrawalReason,
  title:placementJobs.title,jobStatus:placementJobs.status,
  companyName:placementCompanies.name,
 }).from(placementApplications)
  .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,member.collegeId),
    eq(placementApplications.membershipId,member.id)))
  .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
  .limit(30);
 const owned=applications[0];
 if(!owned)return null;
 const [rounds,reasonRows,history]=await Promise.all([
  getDb().select({id:placementJobRounds.id,name:placementJobRounds.name,
   sequence:placementJobRounds.sequence,status:placementJobRounds.status,
   scheduledAt:placementJobRounds.scheduledAt})
   .from(placementJobRounds)
   .where(eq(placementJobRounds.jobId,jobId))
   .orderBy(asc(placementJobRounds.sequence)).limit(30),
  owned.jobStatus==="CANCELLED"?getDb().select({metadata:activityEvents.metadata})
   .from(activityEvents).where(and(eq(activityEvents.collegeId,member.collegeId),
    eq(activityEvents.subjectType,"placement_job"),eq(activityEvents.subjectId,jobId),
    eq(activityEvents.eventType,"PLACEMENTS_TPO_DRIVE_CANCELLED")))
   .orderBy(desc(activityEvents.occurredAt)).limit(1):Promise.resolve([]),
  getDb().select({
   applicationId:placementApplicationStatusHistory.applicationId,
   fromStatus:placementApplicationStatusHistory.fromStatus,
   toStatus:placementApplicationStatusHistory.toStatus,
   reason:placementApplicationStatusHistory.reason,
   createdAt:placementApplicationStatusHistory.createdAt,
  }).from(placementApplicationStatusHistory)
   .where(inArray(placementApplicationStatusHistory.applicationId,
    applications.map(row=>row.applicationId)))
   .orderBy(asc(placementApplicationStatusHistory.createdAt)).limit(100),
 ]);
 const reason=reasonRows[0]?.metadata.reason;
 return {...owned,jobId,
  applications:applications.map(row=>({
   applicationId:row.applicationId,roleOptionId:row.roleOptionId,roleTitle:row.roleTitle,
   status:row.applicationStatus,receiptRef:row.receiptRef,
   submittedAt:row.submittedAt.toISOString(),
   withdrawnAt:row.withdrawnAt?.toISOString()??null,
   withdrawalReason:row.withdrawalReason,
   withdrawalHistory:history.filter(entry=>entry.applicationId===row.applicationId).map(entry=>({
    fromStatus:entry.fromStatus,toStatus:entry.toStatus,reason:entry.reason,
    at:entry.createdAt.toISOString(),
   })),
  })),
  // Private resume snapshots are intentionally not projected; a signed URL
  // must be authorized through its separate learner-evidence endpoint.
  resumeEvidenceAvailable:false,
  reason:typeof reason==="string"&&reason.trim()?reason.trim():null,
  rounds:rounds.map(row=>({...row,scheduledAt:row.scheduledAt?.toISOString()??null}))};
}
