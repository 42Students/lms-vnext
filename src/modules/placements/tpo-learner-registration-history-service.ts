import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,membershipRoles,users} from "@/db/schema";
import {placementBatchRegistrations,placementBatchRegistrationEvents} from "@/db/schema/placement-registration";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
import {placementTableExists} from "@/modules/placements/staged-tables";

const uuid=z.string().uuid();
/** The subject must be an active learner enrolled in this TPO's verified college+cohort. */
export async function getTpoLearnerRegistrationHistory(context:RequestContext,batchId:string,rawMembershipId:string){
 const {batch,collegeId}=await getTpoBatch(context,batchId);
 const membershipId=uuid.parse(rawMembershipId);
 const db=getDb();
 const [subject]=await db.select({id:collegeMemberships.id,name:users.displayName})
  .from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.membershipId,membershipId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .limit(1);
 if(!subject)throw new AuthorizationError("placements.manage");
 const ready=await placementTableExists("placement_batch_registration_events");
 if(!ready)return {batch,learnerName:subject.name??"Unnamed learner",ready:false,events:[],truncated:false};
 const fetched=await db.select({
  id:placementBatchRegistrationEvents.id,
  previousChoice:placementBatchRegistrationEvents.previousChoice,
  nextChoice:placementBatchRegistrationEvents.nextChoice,
  source:placementBatchRegistrationEvents.source,
  occurredAt:placementBatchRegistrationEvents.occurredAt,
 }).from(placementBatchRegistrationEvents)
  .innerJoin(placementBatchRegistrations,eq(placementBatchRegistrations.id,placementBatchRegistrationEvents.registrationId))
  .where(and(eq(placementBatchRegistrations.collegeId,collegeId),eq(placementBatchRegistrations.cohortId,batch.id),
   eq(placementBatchRegistrations.membershipId,membershipId)))
  .orderBy(desc(placementBatchRegistrationEvents.occurredAt),desc(placementBatchRegistrationEvents.id))
  .limit(101);
 return {batch,learnerName:subject.name??"Unnamed learner",ready:true,events:fetched.slice(0,100),truncated:fetched.length>100};
}
