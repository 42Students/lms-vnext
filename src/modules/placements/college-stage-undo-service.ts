import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementJobs} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {PlacementsServiceError} from "./errors";

export const collegeStageUndoSchema=z.strictObject({
 applicationId:z.string().uuid(),
 undoEventId:z.string().uuid(),
 expectedStageVersion:z.number().int().positive(),
 confirmed:z.literal(true),
});
export const COLLEGE_STAGE_UNDO_TOO_LATE=
 "Too late to undo: the students have already been told";
const reversible=new Set([
 "SHORTLISTED:ASSESSMENT","ASSESSMENT:INTERVIEW",
 "INTERVIEW:WAITLISTED","WAITLISTED:ASSESSMENT","WAITLISTED:INTERVIEW",
]);

/** Undo ONLY a recorded stage-only transition whose recipient notification
 * remains in the 30-second SCHEDULED outbox hold. The lock serializes with
 * the notification worker. Once the worker claims/delivers, fail closed.
 */
export async function undoCollegeApplicationStage(
 context:RequestContext,rawJobId:unknown,raw:unknown,
){
 const input=collegeStageUndoSchema.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(context);
 const acting=await resolveActingCollege(context,"placements.manage");
 const jobId=collegeDriveIdSchema.parse(rawJobId);
 if(process.env["DB10_NOTIFICATION_OUTBOX_READY"]!=="DB10_VERIFIED")
  throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
 return getDb().transaction(async tx=>{
  const [job]=await tx.select({id:placementJobs.id,status:placementJobs.status})
   .from(placementJobs).where(and(eq(placementJobs.id,jobId),
    eq(placementJobs.collegeId,collegeId))).for("share").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(!["DRAFT","PUBLISHED"].includes(job.status))
   throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  const [application]=await tx.select({id:placementApplications.id})
   .from(placementApplications)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .where(and(eq(placementApplications.id,input.applicationId),
    eq(placementApplications.jobId,jobId),
    eq(placementApplications.status,"SUBMITTED"),
    eq(collegeMemberships.collegeId,collegeId)))
   .for("share",{of:placementApplications}).limit(1);
  if(!application)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [current]=await tx.select().from(placementCollegeApplicationStages)
   .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
    eq(placementCollegeApplicationStages.applicationId,input.applicationId)))
   .for("update").limit(1);
  if(!current||current.version!==input.expectedStageVersion||
     !current.previousStage||
     !reversible.has(current.previousStage+":"+current.stage))
   throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  const [audit]=await tx.select({
   id:activityEvents.id,occurredAt:activityEvents.occurredAt,
   metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
   eq(activityEvents.id,input.undoEventId),
   eq(activityEvents.collegeId,collegeId),
   eq(activityEvents.actorUserId,context.user.id),
   eq(activityEvents.subjectId,input.applicationId),
   eq(activityEvents.eventType,"PLACEMENTS_COLLEGE_APPLICATION_STAGE_MOVED"),
  )).limit(1);
  const meta=audit?.metadata;
  const eventFrom=meta&&typeof meta==="object"&&!Array.isArray(meta)?
   (meta as Record<string,unknown>)["from"]:null;
  const eventTo=meta&&typeof meta==="object"&&!Array.isArray(meta)?
   (meta as Record<string,unknown>)["to"]:null;
  if(!audit||eventFrom!==current.previousStage||eventTo!==current.stage||
   Date.now()-audit.occurredAt.getTime()>30_000||
   audit.occurredAt.getTime()>Date.now()+1000)
   throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  // A separately booked interview makes even a stage-only rollback unsafe.
  const [slot]=await tx.select({id:placementRoundCandidateSlots.id})
   .from(placementRoundCandidateSlots).where(and(
    eq(placementRoundCandidateSlots.applicationId,input.applicationId),
    eq(placementRoundCandidateSlots.jobId,jobId),
    eq(placementRoundCandidateSlots.status,"BOOKED"),
   )).limit(1);
  if(slot)throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  const locked=await tx.execute<{
   id:string;delivery_status:string;scheduled_at:Date;
  }>(sql`
   select id,delivery_status,scheduled_at
   from notification_delivery_outbox
   where event_id=${input.undoEventId}::uuid
    and college_id=${collegeId}::uuid
    and organization_id=${acting.organizationId}::uuid
    and deleted_at is null
   for update
  `);
  const notice=locked.rows[0];
  if(!notice||locked.rows.length!==1||
    notice.delivery_status!=="SCHEDULED"||
    notice.scheduled_at.getTime()<=Date.now())
   throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  const [inbox]=await tx.select({eventId:inAppNotifications.eventId})
   .from(inAppNotifications)
   .where(eq(inAppNotifications.eventId,input.undoEventId)).limit(1);
  if(inbox)throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  const [voided]=await tx.execute<{id:string}>(sql`
   update notification_delivery_outbox
   set deleted_at=clock_timestamp(),updated_at=clock_timestamp()
   where id=${notice.id}::uuid
    and delivery_status='SCHEDULED' and deleted_at is null
    and scheduled_at>clock_timestamp()
   returning id
  `).then(result=>result.rows);
  if(!voided)throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  const previous=current.previousStage;
  const [restored]=await tx.update(placementCollegeApplicationStages).set({
   stage:previous,previousStage:current.stage,
   version:current.version+1,reason:"Undo previous stage change",
   movedByUserId:context.user.id,movedAt:new Date(),updatedAt:new Date(),
  }).where(and(eq(placementCollegeApplicationStages.id,current.id),
   eq(placementCollegeApplicationStages.version,input.expectedStageVersion)))
   .returning({id:placementCollegeApplicationStages.id});
  if(!restored)throw Error(COLLEGE_STAGE_UNDO_TOO_LATE);
  await tx.insert(placementCollegeApplicationStageHistory).values({
   stageId:current.id,fromStage:current.stage,toStage:previous,
   reason:"Undo prior stage move before learner notification",
   actorUserId:context.user.id,
  });
  await tx.insert(activityEvents).values({
   organizationId:acting.organizationId,collegeId,
   actorUserId:context.user.id,
   actorMembershipId:context.membership?.collegeId===collegeId?context.membership.id:null,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_APPLICATION_STAGE_MOVED",
   subjectType:"placement_application",subjectId:input.applicationId,
   summary:"College Admin undid stage change to "+previous,
   metadata:{jobId,from:current.stage,to:previous,undoOfEventId:input.undoEventId,
    notificationCancelled:true},
  });
  return {undone:true,stage:previous,stageVersion:current.version+1};
 });
}
