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
/** Legacy Interview stores booking/learner response/outcome in one status.
 * In vNext these are distinct persisted facts; the projection never changes
 * booking state as a side effect of learner confirmation. */
export function projectLegacyInterviewLifecycle(status:unknown){
 switch(status){
  case "SCHEDULED":
   return {slotStatus:"BOOKED",learnerConfirmed:false,rescheduleRequested:false,outcome:null} as const;
  case "CONFIRMED":
   return {slotStatus:"BOOKED",learnerConfirmed:true,rescheduleRequested:false,outcome:null} as const;
  case "RESCHEDULE_REQUESTED":
   return {slotStatus:"BOOKED",learnerConfirmed:false,rescheduleRequested:true,outcome:null} as const;
  case "COMPLETED":
   return {slotStatus:"BOOKED",learnerConfirmed:false,rescheduleRequested:false,outcome:"COMPLETED"} as const;
  case "NO_SHOW":
   return {slotStatus:"BOOKED",learnerConfirmed:false,rescheduleRequested:false,outcome:"NO_SHOW"} as const;
  case "CANCELLED":
   return {slotStatus:"CANCELLED",learnerConfirmed:false,rescheduleRequested:false,outcome:null} as const;
  default:
   return null;
 }
}

/** Read-only operation crosswalk; each operation remains authorized by its
 * own endpoint, after scoped reads and transactionally recorded activity.
 * A learner acknowledgment is idempotent; staff mutations require CAS and
 * a fresh appointment state; downstream notices should be after-commit. */
export const legacyInterviewOperationCrosswalk = {
 schedule: {service:"college-interview-action-service",action:"SCHEDULE",retry:"Fresh scoped create"},
 update: {service:"college-interview-action-service",action:"EDIT",retry:"Compare stored version"},
 cancel: {service:"college-interview-action-service",action:"CANCEL",retry:"Idempotent cancelled state"},
 complete: {service:"college-interview-action-service",action:"COMPLETE",retry:"No duplicate outcome"},
 feedback: {service:"interview-feedback/service",action:"REVIEW",retry:"Permission and round outcome recheck"},
 learnerConfirm: {service:"learner-round-confirmation-service",action:"ACKNOWLEDGE",retry:"alreadyConfirmed=true"},
 learnerReschedule: {service:"learner-placement-request-service",action:"RESCHEDULE_REQUEST",retry:"One live scoped request"},
 learnerCancel: {service:"learner-placement-request-service",action:"CANCELLATION_REQUEST",retry:"One live scoped request"},
} as const;

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
