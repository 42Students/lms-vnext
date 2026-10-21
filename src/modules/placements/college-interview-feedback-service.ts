import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementJobs} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";

const uuid=z.string().uuid();
export const interviewFeedbackSchema=z.strictObject({
 expectedVersion:z.number().int().positive(),
 confirmed:z.literal(true),
 rating:z.number().int().min(1).max(5),
 recommendation:z.enum(["SELECT","HOLD","REJECT"]),
 comments:z.string().trim().min(3).max(5000),
});

/** Ratings and reviewer recommendations are historical staff annotations,
 * never a selection-stage decision, a learner-visible round score or an offer.
 * The private comments are kept in audit metadata, not learner notifications.
 */
async function requireScope(context:RequestContext,rawJobId:unknown,rawSlotId:unknown){
 const collegeId=await requireCollegePlacementAdmin(context);
 const jobId=collegeDriveIdSchema.parse(rawJobId),slotId=uuid.parse(rawSlotId);
 const [slot]=await getDb().select({id:slots.id})
  .from(slots).innerJoin(placementJobs,and(eq(placementJobs.id,slots.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .where(and(eq(slots.id,slotId),eq(slots.jobId,jobId))).limit(1);
 if(!slot)throw Error("Interview not found in this college drive.");
 return {collegeId,jobId,slotId};
}
export async function getCollegeInterviewFeedback(context:RequestContext,rawJobId:unknown,rawSlotId:unknown){
 const {slotId}=await requireScope(context,rawJobId,rawSlotId);
 const [row]=await getDb().select({metadata:activityEvents.metadata,
  createdAt:activityEvents.occurredAt,actorId:activityEvents.actorUserId})
  .from(activityEvents).where(and(eq(activityEvents.subjectId,slotId),
   eq(activityEvents.subjectType,"placement_round_candidate_slot"),
   eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK_SUBMITTED")))
  .orderBy(desc(activityEvents.occurredAt)).limit(1);
 if(!row)return {feedback:null};
 const item=row.metadata;
 return {feedback:{rating:Number(item.rating),recommendation:String(item.recommendation),
  comments:String(item.comments),createdAt:row.createdAt.toISOString(),actorId:row.actorId}};
}
export async function recordCollegeInterviewFeedback(context:RequestContext,
 rawJobId:unknown,rawSlotId:unknown,raw:unknown){
 const cmd=interviewFeedbackSchema.parse(raw);
 const scope=await requireScope(context,rawJobId,rawSlotId);
 const acting=await resolveActingCollege(context,"placements.manage");
 if(acting.collegeId!==scope.collegeId)throw Error("Wrong selected college.");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:scope.collegeId,organizationId:acting.organizationId,
  });
  const [slot]=await tx.select({id:slots.id,version:slots.version,status:slots.status,
   applicationId:slots.applicationId})
   .from(slots).where(and(eq(slots.id,scope.slotId),eq(slots.jobId,scope.jobId)))
   .for("update").limit(1);
  if(!slot||slot.status!=="BOOKED"||!slot.applicationId)throw Error("Interview is unavailable.");
  if(slot.version!==cmd.expectedVersion)throw Error("Interview changed; refresh and retry.");
  const [completed,existing]=await Promise.all([
   tx.select({id:activityEvents.id}).from(activityEvents).where(and(
    eq(activityEvents.subjectId,slot.id),eq(activityEvents.subjectType,"placement_round_candidate_slot"),
    eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"))).limit(1),
   tx.select({id:activityEvents.id}).from(activityEvents).where(and(
    eq(activityEvents.subjectId,slot.id),eq(activityEvents.subjectType,"placement_round_candidate_slot"),
    eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK_SUBMITTED"))).limit(1),
  ]);
  if(!completed.length)throw Error("Mark this interview completed before submitting feedback.");
  if(existing.length)throw Error("Feedback was already submitted. Refresh to view it.");
  const [saved]=await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId:scope.collegeId,
   actorUserId:context.user.id,
   actorMembershipId:context.membership?.collegeId===scope.collegeId?context.membership.id:null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK_SUBMITTED",
   subjectType:"placement_round_candidate_slot",subjectId:slot.id,
   summary:"Staff interview feedback submitted",metadata:{
    jobId:scope.jobId,applicationId:slot.applicationId,rating:cmd.rating,
    recommendation:cmd.recommendation,comments:cmd.comments,
    interviewVersion:slot.version,visibility:"STAFF_ONLY",
   },
  }).returning({id:activityEvents.id});
  return {id:saved.id,submitted:true as const};
 });
}
