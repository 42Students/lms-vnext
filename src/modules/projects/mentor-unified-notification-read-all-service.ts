import "server-only";
import {createHash,randomUUID} from "node:crypto";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePersistedMentorInboxMembership} from
  "@/modules/activity/mentor-notifications-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {ActivityServiceError} from "@/modules/activity/errors";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembershipPage} from
  "@/modules/announcements/service";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorProjectAttention} from "./mentor-attention-service";
import {mentorAnnouncementReceiptKey,mentorAttentionReceiptKey}
  from "./mentor-attention-read-model";

const eventType=ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED;
const hash=(key:string)=>createHash("sha256").update(key).digest("hex");

/** Resolve ALL currently visible notice pages before applying any writes.
 * The same verified audience policy is used for each page, including complex
 * class and TPO-recipient visibility. Reject unreasonably large feeds instead
 * of falsely claiming to mark an incomplete source read.
 */
async function allVisibleKeys(context:RequestContext){
 const access=await resolveOptionalModuleAccess(context);
 const alerts=access.projects.enabled?await listMyMentorProjectAttention(context):[];
 const keys=alerts.map(mentorAttentionReceiptKey);
 if(announcementsRuntimeEnabled()){
   const now=new Date();
   let cursor:Awaited<ReturnType<typeof listVisibleAnnouncementsForMembershipPage>>["nextCursor"]=null;
   for(let pageIndex=0;pageIndex<100;pageIndex++){
     const page=await listVisibleAnnouncementsForMembershipPage(
       context,now,cursor??undefined);
     keys.push(...page.items.map(mentorAnnouncementReceiptKey));
     if(!page.nextCursor)return [...new Set(keys)];
     cursor=page.nextCursor;
   }
   throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
 }
 return [...new Set(keys)];
}

/** One serializable-in-practice per-user transaction for all three sources:
 * all personal inbox receipts, all *currently visible* project attentions and
 * every paginated college announcement. Concurrent requests use a user-bound
 * advisory lock. Replaying is idempotent and never changes another user.
 * A new source revision becomes a new unread item after this snapshot.
 */
export async function markAllMentorUnifiedNotificationsRead(context:RequestContext){
 const membership=await requirePersistedMentorInboxMembership(context);
 const keys=await allVisibleKeys(context);
 if(keys.some(key=>key.length>320)||keys.length>10000)
   throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
 return getDb().transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 31))`);
   const eventIds=tx.select({id:activityEvents.id}).from(activityEvents)
     .where(eq(activityEvents.collegeId,membership.collegeId));
   const personal=await tx.update(inAppNotifications).set({readAt:new Date()})
     .where(and(eq(inAppNotifications.userId,context.user.id),
       inArray(inAppNotifications.eventId,eventIds),
       isNull(inAppNotifications.readAt),isNull(inAppNotifications.deletedAt)))
     .returning({id:inAppNotifications.id});
   let sources=0;
   for(let i=0;i<keys.length;i+=150){
     const batch=keys.slice(i,i+150);
     const added=await tx.insert(activityEvents).values(batch.map(key=>({
       organizationId:membership.organizationId,collegeId:membership.collegeId,
       actorUserId:context.user.id,actorMembershipId:membership.id,
       module:"IDENTITY",eventType,importance:"NORMAL",
       subjectType:"mentor_source_notification_read",subjectId:key,
       summary:"Mentor source notification acknowledged",
       metadata:{source:key.startsWith("announcement:")?"ANNOUNCEMENT":"PROJECT_ATTENTION"},
       groupKey:"mentor:notifications:"+context.user.id,
       dedupeKey:"mentor:source-read:"+context.user.id+":"+hash(key),
     }))).onConflictDoNothing().returning({id:activityEvents.id});
     sources+=added.length;
   }
   if(personal.length>0){
     await recordActivityEventInTransaction(tx,context,{
       eventType,collegeId:membership.collegeId,
       organizationId:membership.organizationId,
       subjectType:"mentor_notification_inbox",subjectId:context.user.id,
       summary:"Mentor personal notification inbox acknowledged",
       metadata:{count:personal.length},
       groupKey:"mentor:notifications:"+context.user.id,
       dedupeKey:"mentor:notifications:bulk:"+randomUUID(),
     });
   }
   return {markedPersonal:personal.length,markedSources:sources,
     examinedSources:keys.length,completeForCurrentVisibleSources:true};
 });
}
