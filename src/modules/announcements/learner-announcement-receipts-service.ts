import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema/activity";
import type {RequestContext} from "@/modules/identity/context";
import {requirePersistedLearnerNotificationMembership} from "@/modules/activity/learner-notification-membership-service";

/** An announcement is unread only if a notification was actually delivered
 * to this authenticated learner. Missing or pending deliveries have UNKNOWN
 * read state, never a fabricated New badge or an inferred zero count.
 * Caller must separately read the membership-visible announcement feed.
 */
export async function listOwnLearnerAnnouncementReceipts(
 context:RequestContext,rawIds:readonly string[],
):Promise<Array<{announcementId:string;notificationId:string;readAt:Date|null}>> {
 const membership=await requirePersistedLearnerNotificationMembership(context);
 const ids=z.array(z.uuid()).max(101).parse([...new Set(rawIds)]);
 if(!ids.length)return [];
 const rows=await getDb().select({
  announcementId:activityEvents.subjectId,
  notificationId:inAppNotifications.id,
  readAt:inAppNotifications.readAt,
 }).from(inAppNotifications)
  .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .where(and(
   eq(inAppNotifications.userId,context.user.id),
   eq(activityEvents.collegeId,membership.collegeId),
   eq(activityEvents.subjectType,"announcement"),
   inArray(activityEvents.subjectId,ids),
   isNull(inAppNotifications.deletedAt),
   sql`coalesce(${inAppNotifications.deliveryStatus},'SENT')='SENT'`,
  )).limit(101);
 return rows;
}
