import "server-only";
import {and,eq,sql,inArray,isNotNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,learnerProfiles,users} from "@/db/schema";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {markOwnNotificationRead} from "@/modules/activity/notification-service";
const noticeId=z.string().uuid();
export async function getTpoNoticeReadSummary(context:RequestContext,rawId:unknown){
 const id=noticeId.parse(rawId),member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 const [notice]=await getDb().select({id:db10Announcements.id})
  .from(db10Announcements).where(and(eq(db10Announcements.id,id),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.senderType,"TPO"))).limit(1);
 if(!notice)return null;
 const [event]=await getDb().select({id:activityEvents.id})
  .from(activityEvents).where(and(eq(activityEvents.collegeId,college.id),
   eq(activityEvents.subjectType,"announcement"),eq(activityEvents.subjectId,id),
   eq(activityEvents.eventType,"placements.tpo_notice.created"))).limit(1);
 if(!event)return {delivered:0,read:0,unread:[],unreadDetails:[],
  notDelivered:true,unreadStatus:"NOT_DELIVERED" as const};
 const [counts,unread]=await Promise.all([
  getDb().select({delivered:sql<number>`count(*)::integer`,
    read:sql<number>`count(*) filter(where ${inAppNotifications.readAt} is not null)::integer`})
   .from(inAppNotifications).where(eq(inAppNotifications.eventId,event.id)),
  getDb().select({
    name:users.displayName,rollNumber:learnerProfiles.rollNumber,
    branch:sql<string | null>`(select d.name from learner_program_enrollments e
      join programs p on p.id=e.program_id
      join departments d on d.id=p.department_id
      where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
      limit 1)`,
    readAt:inAppNotifications.readAt,
  })
   .from(inAppNotifications)
   .innerJoin(users,eq(users.id,inAppNotifications.userId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.userId,users.id),
     eq(collegeMemberships.collegeId,college.id),
     eq(collegeMemberships.status,"ACTIVE")))
   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
   .where(and(eq(inAppNotifications.eventId,event.id),
    sql`${inAppNotifications.readAt} is null`))
   .limit(500),
 ]);
 return {delivered:Number(counts[0]?.delivered??0),
  read:Number(counts[0]?.read??0),unread:unread.map(item=>item.name),
  unreadDetails:unread.map(item=>({name:item.name??"Name not recorded",
    rollNumber:item.rollNumber,branch:item.branch})),
  notDelivered:Number(counts[0]?.delivered??0)===0,
  unreadStatus:Number(counts[0]?.delivered??0)===0?"NOT_DELIVERED":
    unread.length===0?"ALL_READ":"UNREAD_REMAINING"};
}
/** Only a user's own delivered notification is acknowledged; no arbitrary membership ID. */
export async function markOwnTpoNoticeRead(context:RequestContext,rawId:unknown){
 const id=noticeId.parse(rawId);
 if(!context.membership||context.membership.status!=="ACTIVE")
  throw new AuthorizationError("placements.read");
 const collegeId=context.membership.collegeId;
 const [row]=await getDb().select({notificationId:inAppNotifications.id})
  .from(inAppNotifications)
  .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .innerJoin(db10Announcements,and(eq(db10Announcements.id,activityEvents.subjectId),
   eq(db10Announcements.collegeId,collegeId)))
  .where(and(eq(inAppNotifications.userId,context.user.id),
   eq(activityEvents.collegeId,collegeId),
   eq(activityEvents.subjectType,"announcement"),
   eq(activityEvents.subjectId,id),
   eq(activityEvents.eventType,"placements.tpo_notice.created"),
   eq(db10Announcements.senderType,"TPO"),
   // Only explicitly released receipts may be acknowledged; a scheduled or
   // recalled notification is not equivalent to a legacy read row.
   sql`coalesce(${inAppNotifications.deliveryStatus},'SENT')='SENT'`,
   sql`${inAppNotifications.deletedAt} is null`,
   sql`${db10Announcements.deletedAt} is null`))
  .limit(1);
 if(!row)return {read:false as const};
 await markOwnNotificationRead(context,row.notificationId);
 return {read:true as const};
}
