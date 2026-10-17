import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,inAppNotifications} from "@/db/schema";
import {placementBatchLifecycles} from "@/db/schema/placement-batches";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {findUnchosenEligibleBatchStudents} from "./batch-participation-service";
import {tpoBatchReminderCopy,tpoBatchReminderDayKey} from "./tpo-batch-notification-model";
import {z} from "zod";

const inputSchema=z.object({confirmed:z.literal(true),
 expectedVersion:z.iso.datetime({offset:true})}).strict();
export class TpoBatchReminderError extends Error{
 constructor(public readonly code:"REMINDER_NOT_AVAILABLE"|"REMINDER_CHANGED"){
  super(code);this.name="TpoBatchReminderError";
 }
}
/** One scoped, audited app reminder per cohort per IST day.
 * Never report email/SMS delivery when no provider receipt exists.
 */
export async function remindTpoBatch(ctx:RequestContext,batchId:string,raw:unknown){
 const input=inputSchema.parse(raw);
 const {batch,collegeId,ready}=await getTpoBatch(ctx,batchId);
 if(!ready)throw new TpoBatchReminderError("REMINDER_NOT_AVAILABLE");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoBatchReminderError("REMINDER_NOT_AVAILABLE");
  const [row]=await tx.select().from(placementBatchLifecycles)
    .where(and(eq(placementBatchLifecycles.collegeId,collegeId),
      eq(placementBatchLifecycles.cohortId,batch.id))).limit(1);
  const now=new Date();
  if(!row?.invitedAt||row.finishedAt||!row.registrationDeadline||
    row.registrationDeadline.getTime()<=now.getTime())
    throw new TpoBatchReminderError("REMINDER_NOT_AVAILABLE");
  if(row.updatedAt.toISOString()!==input.expectedVersion)
    throw new TpoBatchReminderError("REMINDER_CHANGED");
  const dedupeKey="tpo:registration:reminder:"+collegeId+":"+batch.id+":"+tpoBatchReminderDayKey(now);
  const [prior]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(eq(activityEvents.dedupeKey,dedupeKey)).limit(1);
  if(prior)return {reminded:0,alreadySent:true,delivery:"APP_ONLY" as const};
  const recipients=await findUnchosenEligibleBatchStudents(tx,collegeId,batch.id);
  if(!recipients.length)return {reminded:0,alreadySent:false,delivery:"APP_ONLY" as const};
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.id??null,
   module:"PLACEMENTS",eventType:"BATCH_REMINDED",
   subjectType:"COHORT",subjectId:batch.id,
   summary:"TPO sent an in-app reminder to register for placements",
   metadata:{recipients:recipients.length,channels:["IN_APP"]},
   dedupeKey,
  }).onConflictDoNothing().returning({id:activityEvents.id});
  if(!event)return {reminded:0,alreadySent:true,delivery:"APP_ONLY" as const};
  const notice=tpoBatchReminderCopy(batch.name,row.registrationDeadline);
  for(let i=0;i<recipients.length;i+=200){
   await tx.insert(inAppNotifications).values(recipients.slice(i,i+200).map(userId=>({
    userId,eventId:event.id,title:notice.title,body:notice.body,
    actionHref:"/learn/my-placements/placement#registration",
   }))).onConflictDoNothing();
  }
  return {reminded:recipients.length,alreadySent:false,delivery:"APP_ONLY" as const};
 });
}
