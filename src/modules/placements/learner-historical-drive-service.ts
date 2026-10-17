import "server-only";
import {and,asc,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,placementApplications,placementCompanies,
 placementCompanyRelationships,placementJobRounds,placementJobs} from "@/db/schema";
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
 const [owned]=await getDb().select({
  applicationId:placementApplications.id,applicationStatus:placementApplications.status,
  title:placementJobs.title,jobStatus:placementJobs.status,
  companyName:placementCompanies.name,
 }).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,member.collegeId),
    eq(placementApplications.membershipId,member.id)))
  .limit(1);
 if(!owned)return null;
 const [rounds,reasonRows]=await Promise.all([
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
 ]);
 const reason=reasonRows[0]?.metadata.reason;
 return {...owned,jobId,
  reason:typeof reason==="string"&&reason.trim()?reason.trim():null,
  rounds:rounds.map(row=>({...row,scheduledAt:row.scheduledAt?.toISOString()??null}))};
}
