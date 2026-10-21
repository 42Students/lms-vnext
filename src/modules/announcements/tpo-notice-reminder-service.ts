import "server-only";
import {and,eq,gt,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
export async function remindUnreadTpoNotice(context:RequestContext,rawId:unknown){
 const id=z.string().uuid().parse(rawId),member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId),now=new Date();
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [notice]=await tx.select({
   id:db10Announcements.id,title:db10Announcements.title,
   scheduledAt:db10Announcements.scheduledAt,
   expiresAt:db10Announcements.expiresAt,
  }).from(db10Announcements).where(and(eq(db10Announcements.id,id),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.senderType,"TPO"),
   isNull(db10Announcements.deletedAt))).for("update").limit(1);
  if(!notice)throw new Error("NOTICE_NOT_FOUND");
  if(notice.scheduledAt&&notice.scheduledAt>now ||
    notice.expiresAt&&notice.expiresAt<=now)throw new Error("NOTICE_NOT_ACTIVE");
  const [original]=await tx.select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.subjectType,"announcement"),
    eq(activityEvents.subjectId,id),
    eq(activityEvents.eventType,"placements.tpo_notice.created"),
   )).limit(1);
  if(!original)throw new Error("NOTICE_NOT_DELIVERED");
  const [last]=await tx.select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.subjectType,"announcement"),
    eq(activityEvents.subjectId,id),
    eq(activityEvents.eventType,"placements.tpo_notice.reminder"),
    gt(activityEvents.occurredAt,new Date(now.getTime()-60*60*1000)),
   )).limit(1);
  if(last)throw new Error("NOTICE_REMINDER_RATE_LIMIT");
  const unread=await tx.select({id:inAppNotifications.userId})
   .from(inAppNotifications).where(and(
    eq(inAppNotifications.eventId,original.id),
    isNull(inAppNotifications.readAt),
    isNull(inAppNotifications.deletedAt),
   ));
  if(!unread.length)return {reminded:0};
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"placements.tpo_notice.reminder",
   subjectType:"announcement",subjectId:notice.id,
   summary:"TPO notice reminder sent",metadata:{noticeId:id},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("NOTICE_REMINDER_FAILED");
  // Send to every originally targeted unread user, not just the first 1000.
  const recipients=[...new Set(unread.map(row=>row.id))];
  let reminded=0;
  for(let offset=0;offset<recipients.length;offset+=250){
   const delivered=await deliverInAppNotificationInTransaction(tx,event.id,
    recipients.slice(offset,offset+250),{
     title:"Reminder: "+notice.title.slice(0,225),
     body:"Please read this placement cell notice.",
     actionHref:"/learn/my-placements/announcements?focus="+encodeURIComponent(id),
    });
   reminded+=delivered.delivered;
  }
  return {reminded};
 });
}
