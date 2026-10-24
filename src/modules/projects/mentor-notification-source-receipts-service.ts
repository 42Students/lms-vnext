import "server-only";
import {createHash} from "node:crypto";
import {and,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePersistedMentorInboxMembership} from
  "@/modules/activity/mentor-notifications-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {ActivityServiceError} from "@/modules/activity/errors";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembership} from "@/modules/announcements/service";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorProjectAttention} from "./mentor-attention-service";
import {mentorAnnouncementReceiptKey,mentorAttentionReceiptKey}
  from "./mentor-attention-read-model";

const keySchema=z.string().min(8).max(320);
const ACK_SUBJECT="mentor_source_notification_read";
const ACK_EVENT=ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED;
const receiptHash=(key:string)=>createHash("sha256").update(key).digest("hex");

/** Every receipt is attached to the current user and active college. No
 * userId, projectId or college selector comes from a client.
 */
export async function listOwnMentorSourceReceipts(
  context:RequestContext,sourceKeys:readonly string[],
):Promise<Set<string>>{
  const membership=await requirePersistedMentorInboxMembership(context);
  const keys=[...new Set(sourceKeys)].filter(key=>key.length<=320);
  if(!keys.length)return new Set();
  const stored:string[]=[];
  for(let offset=0;offset<keys.length;offset+=200){
    const rows=await getDb().select({subjectId:activityEvents.subjectId})
      .from(activityEvents).where(and(
        eq(activityEvents.actorUserId,context.user.id),
        eq(activityEvents.collegeId,membership.collegeId),
        eq(activityEvents.subjectType,ACK_SUBJECT),
        eq(activityEvents.eventType,ACK_EVENT),
        inArray(activityEvents.subjectId,keys.slice(offset,offset+200)),
      ));
    stored.push(...rows.map(row=>row.subjectId));
  }
  return new Set(stored);
}

async function allowedMentorSourceKeys(context:RequestContext){
  const access=await resolveOptionalModuleAccess(context);
  const [alerts,notices]=await Promise.all([
    access.projects.enabled?listMyMentorProjectAttention(context):Promise.resolve([]),
    announcementsRuntimeEnabled()?
      listVisibleAnnouncementsForMembership(context):Promise.resolve([]),
  ]);
  return [
    ...alerts.map(mentorAttentionReceiptKey),
    ...notices.map(mentorAnnouncementReceiptKey),
  ];
}

/** An explicit acknowledgement of a currently *visible* source item.
 * Revalidates persisted Mentor role and current source visibility on write,
 * then serializes duplicate user writes in PostgreSQL. A changed alert
 * revision receives a different read key and becomes unread again.
 */
export async function markOwnMentorSourceRead(
  context:RequestContext,rawKey:unknown,
){
  const key=keySchema.parse(rawKey);
  const membership=await requirePersistedMentorInboxMembership(context);
  const allowed=await allowedMentorSourceKeys(context);
  if(!allowed.includes(key))throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 31))`);
    const [existing]=await tx.select({id:activityEvents.id})
      .from(activityEvents).where(and(
        eq(activityEvents.actorUserId,context.user.id),
        eq(activityEvents.collegeId,membership.collegeId),
        eq(activityEvents.subjectType,ACK_SUBJECT),
        eq(activityEvents.eventType,ACK_EVENT),
        eq(activityEvents.subjectId,key),
      )).limit(1);
    if(existing)return {markedRead:false};
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACK_EVENT,collegeId:membership.collegeId,
      organizationId:membership.organizationId,
      subjectType:ACK_SUBJECT,subjectId:key,
      summary:"Mentor source notification acknowledged",
      metadata:{source:key.startsWith("announcement:")?"ANNOUNCEMENT":"PROJECT_ATTENTION"},
      groupKey:"mentor:notifications:"+context.user.id,
      dedupeKey:"mentor:source-read:"+context.user.id+":"+receiptHash(key),
    });
    return {markedRead:true};
  });
}

/** Explicit bulk acknowledgment for currently visible source items only.
 * Process a bounded batch of 50 so large portfolios are not silently claimed
 * complete and acknowledgement transactions remain responsive.
 */
export async function markVisibleMentorSourcesRead(context:RequestContext){
  const membership=await requirePersistedMentorInboxMembership(context);
  const allowed=[...new Set(await allowedMentorSourceKeys(context))];
  const prior=await listOwnMentorSourceReceipts(context,allowed);
  const missing=allowed.filter(key=>!prior.has(key));
  const batch=missing.slice(0,50);
  if(!batch.length)return {markedRead:0,remainingLoaded:0,notice:"All loaded source items acknowledged"};
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 31))`);
    let markedRead=0;
    for(const key of batch){
      const [existing]=await tx.select({id:activityEvents.id}).from(activityEvents)
        .where(and(eq(activityEvents.actorUserId,context.user.id),
          eq(activityEvents.collegeId,membership.collegeId),
          eq(activityEvents.subjectType,ACK_SUBJECT),
          eq(activityEvents.eventType,ACK_EVENT),
          eq(activityEvents.subjectId,key),
        )).limit(1);
      if(existing)continue;
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACK_EVENT,collegeId:membership.collegeId,
        organizationId:membership.organizationId,
        subjectType:ACK_SUBJECT,subjectId:key,
        summary:"Mentor source notification acknowledged",
        metadata:{source:key.startsWith("announcement:")?"ANNOUNCEMENT":"PROJECT_ATTENTION"},
        groupKey:"mentor:notifications:"+context.user.id,
        dedupeKey:"mentor:source-read:"+context.user.id+":"+receiptHash(key),
      });
      markedRead++;
    }
    return {markedRead,remainingLoaded:Math.max(0,missing.length-batch.length),
      notice:allowed.length>=100?
        "Read status covers sources visible in the loaded announcement window":
        "Read state saved for verified visible project and college sources"};
  });
}
