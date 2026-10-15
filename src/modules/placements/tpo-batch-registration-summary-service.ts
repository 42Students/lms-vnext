import "server-only";
import { and,countDistinct,eq } from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProgramEnrollments,membershipRoles,users} from "@/db/schema";
import {placementBatchRegistrations} from "@/db/schema/placement-registration";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {summarizeTpoBatchRegistrations,tpoRegistrationChoiceSchema} from "./tpo-batch-registration-summary-model";
/** Active college learners in this cohort only; never count transferred or inactive registrations. */
export async function getTpoBatchRegistrationSummary(context:RequestContext,batchId:string){
 const {batch,collegeId}=await getTpoBatch(context,batchId);
 const db=getDb();
 const [total]=await db.select({n:countDistinct(learnerProgramEnrollments.membershipId)})
  .from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE")));
 const available=await placementTableExists("placement_batch_registrations");
 if(!available)return {batch,...summarizeTpoBatchRegistrations(total?.n??0,[],false)};
 const groups=await db.select({choice:placementBatchRegistrations.choice,
   n:countDistinct(placementBatchRegistrations.membershipId)})
  .from(placementBatchRegistrations)
  .innerJoin(learnerProgramEnrollments,and(
    eq(learnerProgramEnrollments.membershipId,placementBatchRegistrations.membershipId),
    eq(learnerProgramEnrollments.cohortId,batch.id),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,placementBatchRegistrations.membershipId),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(placementBatchRegistrations.collegeId,collegeId),
    eq(placementBatchRegistrations.cohortId,batch.id)))
  .groupBy(placementBatchRegistrations.choice);
 const counts=groups.flatMap(g=>{
  const valid=tpoRegistrationChoiceSchema.safeParse(g.choice);
  return valid.success?[{choice:valid.data,count:g.n}]:[];
 });
 return {batch,...summarizeTpoBatchRegistrations(total?.n??0,counts,true)};
}
