import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,placementJobRoundEvents,placementJobRounds,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementRoundIdSchema} from "./validation";
import {requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {tpoInterviewRescheduleSchema,parseIstRoundLocalTime,
  validInterviewWindow} from "./tpo-interview-reschedule-model";
import {requireAvailableRoundVenue} from "./round-venue-booking-service";
export async function rescheduleTpoInterview(context:RequestContext,rawRoundId:unknown,raw:unknown){
 const collegeId=await requireTpoJobCollege(context),roundId=placementRoundIdSchema.parse(rawRoundId);
 const input=tpoInterviewRescheduleSchema.parse(raw);
 const at=parseIstRoundLocalTime(input.localDateTime),now=new Date();
 if(!validInterviewWindow(at,now,null))throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [record]=await tx.select({round:placementJobRounds,job:placementJobs})
   .from(placementJobRounds)
   .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
   .where(and(eq(placementJobRounds.id,roundId),eq(placementJobs.collegeId,collegeId)))
   .for("update").limit(1);
  if(!record)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  const {round,job}=record;
  if(job.status!=="PUBLISHED"||round.kind!=="INTERVIEW"||round.status!=="SCHEDULED")
   throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_EDITABLE");
  if(round.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  if(input.mode==="ON_CAMPUS"){
   await requireAvailableRoundVenue(tx,{collegeId,roundId,venue:input.venue??"",
    start:at,durationMinutes:round.durationMinutes});
  }
  const [updated]=await tx.update(placementJobRounds).set({
   scheduledAt:at,timezone:"Asia/Kolkata",mode:input.mode,
   venue:input.mode==="ON_CAMPUS"?input.venue??null:null,
   meetingUrl:input.mode==="VIRTUAL"?input.meetingUrl??null:null,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobRounds.updatedAt}) + interval '1 millisecond')`,
  }).where(and(eq(placementJobRounds.id,roundId),
   eq(placementJobRounds.status,"SCHEDULED"),
   sql`date_trunc('milliseconds',${placementJobRounds.updatedAt})=${input.expectedUpdatedAt}::timestamptz`
  )).returning();
  if(!updated)throw new PlacementsServiceError("PLACEMENT_ROUND_STALE");
  await tx.insert(placementJobRoundEvents).values({
   roundId,eventType:"RESCHEDULED",actorUserId:context.user.id,
   metadata:{reason:input.reason,fromAt:round.scheduledAt?.toISOString()??null,
    toAt:at.toISOString(),mode:input.mode,venue:updated.venue,meetingUrl:updated.meetingUrl},
  });
  const member=context.membership!;
  await tx.insert(activityEvents).values({
   organizationId:member.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:member.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_TPO_INTERVIEW_RESCHEDULED",subjectType:"placement_round",subjectId:roundId,
   subjectLabel:round.name,summary:"TPO rescheduled interview round "+round.name,
   metadata:{reason:input.reason,jobId:job.id,fromAt:round.scheduledAt?.toISOString()??null,
    toAt:at.toISOString(),mode:input.mode,venue:updated.venue},
   occurredAt:new Date(),
  });
  return {id:updated.id,scheduledAt:updated.scheduledAt?.toISOString()??null,
   updatedAt:updated.updatedAt.toISOString()};
 });
}
