import "server-only";
import { and, countDistinct, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, cohorts, departments, learnerProgramEnrollments, placementApplications,
  placementBatchRegistrations, placementJobs, placementOffers, placementJoiningOutcomes,
  profileVerifications, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";

export type BatchJourneyCounts={invited:number|null;registered:number;verified:number;placed:number};

/** Unambiguous persisted evidence only: PLACEMENTS consent, verified profile,
 * and accepted offer or joined outcome. No guessed invitation counts. */
export async function listTpoBatchJourneyCounts(context:RequestContext,batchIds:readonly string[]) {
 const collegeId=await requireTpoBatchActor(context);
 const ids=[...new Set(batchIds)];
 const result=new Map<string,BatchJourneyCounts>();
 if(!ids.length)return result;
 const db=getDb();
 const cohortsOfCollege=await db.select({id:cohorts.id}).from(cohorts)
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(inArray(cohorts.id,ids));
 if(cohortsOfCollege.length!==ids.length)throw new Error("BATCH_NOT_FOUND");
 // Invite is an audited one-time cohort transition. The event records the
 // actual number of APP recipients; it is NOT a count of emails delivered
 // or a projection of currently eligible students. Imported cohorts without
 // that historical evidence show an unknown invitation count.
 const inviteEvents=await db.select({
  cohortId:activityEvents.subjectId,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.collegeId,collegeId),
  eq(activityEvents.eventType,"BATCH_INVITED"),
  eq(activityEvents.subjectType,"COHORT"),
  inArray(activityEvents.subjectId,ids),
 )).orderBy(desc(activityEvents.createdAt)).limit(500);
 const invited=new Map<string,number>();
 for(const event of inviteEvents){
  const count=event.metadata?.appRecipients;
  if(!invited.has(event.cohortId)&&typeof count==="number"&&
   Number.isSafeInteger(count)&&count>=0)
   invited.set(event.cohortId,count);
 }

 const [registrations,verifications,offers]=await Promise.all([
  placementTableExists("placement_batch_registrations").then(ready=>ready?
   db.select({id:placementBatchRegistrations.cohortId,total:countDistinct(placementBatchRegistrations.membershipId)})
   .from(placementBatchRegistrations)
   .innerJoin(learnerProgramEnrollments,and(
     eq(learnerProgramEnrollments.cohortId,placementBatchRegistrations.cohortId),
     eq(learnerProgramEnrollments.membershipId,placementBatchRegistrations.membershipId),
     eq(learnerProgramEnrollments.status,"ACTIVE")))
   .where(and(eq(placementBatchRegistrations.collegeId,collegeId),
     inArray(placementBatchRegistrations.cohortId,ids),
     eq(placementBatchRegistrations.choice,"PLACEMENTS")))
   .groupBy(placementBatchRegistrations.cohortId):Promise.resolve([])),
  db.select({id:learnerProgramEnrollments.cohortId,total:countDistinct(learnerProgramEnrollments.membershipId)})
   .from(learnerProgramEnrollments)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
     eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(profileVerifications,and(
     eq(profileVerifications.learnerMembershipId,learnerProgramEnrollments.membershipId),
     eq(profileVerifications.section,"IDENTITY"),eq(profileVerifications.status,"VERIFIED")))
   .where(and(eq(learnerProgramEnrollments.status,"ACTIVE"),inArray(learnerProgramEnrollments.cohortId,ids)))
   .groupBy(learnerProgramEnrollments.cohortId),
  db.select({id:learnerProgramEnrollments.cohortId,total:countDistinct(learnerProgramEnrollments.membershipId)})
   .from(learnerProgramEnrollments)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
     eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(placementApplications,eq(placementApplications.membershipId,learnerProgramEnrollments.membershipId))
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,collegeId)))
   .innerJoin(placementOffers,eq(placementOffers.applicationId,placementApplications.id))
   .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
   .where(and(eq(learnerProgramEnrollments.status,"ACTIVE"),inArray(learnerProgramEnrollments.cohortId,ids),
     or(eq(placementOffers.status,"ACCEPTED"),eq(placementJoiningOutcomes.status,"JOINED"))))
   .groupBy(learnerProgramEnrollments.cohortId),
 ]);
 for(const id of ids)result.set(id,{
  invited:invited.get(id)??null,
  registered:registrations.find(item=>item.id===id)?.total??0,
  verified:verifications.find(item=>item.id===id)?.total??0,
  placed:offers.find(item=>item.id===id)?.total??0,
 });
 return result;
}
