import "server-only";
import {and,eq,gt,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementApplications,placementJobRounds,placementJobs} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {learnerRoundConfirmationReady} from "./learner-round-confirmation-readiness";
const inputSchema=z.strictObject({
 applicationId:z.uuid(),roundId:z.uuid(),confirmed:z.literal(true),
});
/** LEARNER-placements-35: the persisted learner is derived only from session.
 * A booked upcoming round is mandatory; the acknowledgment is idempotent.
 */
export async function confirmOwnPlacementRound(context:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 const member=await requireLearnerPlacementAccess(context);
 if(!await learnerRoundConfirmationReady())throw new AuthorizationError("placements.read");
 return getDb().transaction(async tx=>{
  const [slot]=await tx.select({
    id:placementRoundCandidateSlots.id,version:placementRoundCandidateSlots.version,
    learnerConfirmedAt:placementRoundCandidateSlots.learnerConfirmedAt,
    applicationId:placementRoundCandidateSlots.applicationId,
  }).from(placementRoundCandidateSlots)
   .innerJoin(placementApplications,eq(placementApplications.id,placementRoundCandidateSlots.applicationId))
   .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundCandidateSlots.roundId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementRoundCandidateSlots.applicationId,input.applicationId),
    eq(placementRoundCandidateSlots.roundId,input.roundId),
    eq(placementRoundCandidateSlots.status,"BOOKED"),
    gt(placementRoundCandidateSlots.startsAt,new Date()),
    eq(placementApplications.membershipId,member.id),
    eq(placementApplications.status,"SUBMITTED"),
    eq(placementJobs.collegeId,member.collegeId),
    eq(placementJobs.status,"PUBLISHED"),
    eq(placementJobRounds.jobId,placementJobs.id),
    eq(placementJobRounds.status,"SCHEDULED")))
   .for("update",{of:placementRoundCandidateSlots}).limit(1);
  if(!slot)throw new AuthorizationError("placements.read");
  if(slot.learnerConfirmedAt)return {confirmed:true,alreadyConfirmed:true};
  const [saved]=await tx.update(placementRoundCandidateSlots).set({
   learnerConfirmedAt:new Date(),updatedAt:new Date(),version:slot.version+1,
  }).where(and(eq(placementRoundCandidateSlots.id,slot.id),
   eq(placementRoundCandidateSlots.version,slot.version),
   isNull(placementRoundCandidateSlots.learnerConfirmedAt))).returning({id:placementRoundCandidateSlots.id});
  if(!saved)throw new AuthorizationError("placements.read");
  await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_LEARNER_ROUND_ATTENDANCE_CONFIRMED,
    collegeId:member.collegeId,organizationId:member.organizationId,
    subjectType:"placement_round",subjectId:input.roundId,
    summary:"Learner confirmed booked round attendance",
    metadata:{applicationId:input.applicationId,slotId:slot.id},
  });
  return {confirmed:true,alreadyConfirmed:false};
 });
}
