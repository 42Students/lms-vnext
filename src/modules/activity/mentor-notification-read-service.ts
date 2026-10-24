import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { ActivityServiceError } from "./errors";
import { requirePersistedMentorInboxMembership } from "./mentor-notifications-service";
import {mentorVisibleNotificationEventCondition} from "./mentor-personal-project-scope";

/** Recipient + persisted current college are both required for Mentor acknowledgement. */
export async function markOwnMentorNotificationRead(
  context:RequestContext,rawId:unknown,
) {
  const id=z.string().uuid().parse(rawId);
  const membership=await requirePersistedMentorInboxMembership(context);
  return getDb().transaction(async tx=>{
    const eventIds=tx.select({id:activityEvents.id}).from(activityEvents)
      .where(and(eq(activityEvents.collegeId,membership.collegeId),
        mentorVisibleNotificationEventCondition(context)));
    const filter=and(
      eq(inAppNotifications.id,id),
      eq(inAppNotifications.userId,context.user.id),
      inArray(inAppNotifications.eventId,eventIds),
    );
    const [updated]=await tx.update(inAppNotifications)
      .set({readAt:new Date()})
      .where(and(filter,isNull(inAppNotifications.readAt)))
      .returning({id:inAppNotifications.id,readAt:inAppNotifications.readAt});
    if(!updated) {
      const [current]=await tx.select({
        id:inAppNotifications.id,readAt:inAppNotifications.readAt,
      }).from(inAppNotifications).where(filter).limit(1);
      if(!current) throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
      // An already-acknowledged notification is idempotent, without new audit.
      return current;
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED,
      collegeId:membership.collegeId,organizationId:membership.organizationId,
      subjectType:"in_app_notification",subjectId:updated.id,
      summary:"Mentor notification acknowledged",
      metadata:{count:1},
      groupKey:"mentor:notifications:"+context.user.id,
      dedupeKey:"mentor:notification:"+updated.id+":read",
    });
    return updated;
  });
}

/** One auditable, transactional batch; a repeat is a no-op without new events. */
export async function markAllOwnMentorNotificationsRead(context:RequestContext) {
  const membership=await requirePersistedMentorInboxMembership(context);
  return getDb().transaction(async tx=>{
    const eventIds=tx.select({id:activityEvents.id}).from(activityEvents)
      .where(and(eq(activityEvents.collegeId,membership.collegeId),
        mentorVisibleNotificationEventCondition(context)));
    const changed=await tx.update(inAppNotifications)
      .set({readAt:new Date()})
      .where(and(
        eq(inAppNotifications.userId,context.user.id),
        inArray(inAppNotifications.eventId,eventIds),
        isNull(inAppNotifications.readAt),
      ))
      .returning({id:inAppNotifications.id});
    if(changed.length) {
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED,
        collegeId:membership.collegeId,organizationId:membership.organizationId,
        subjectType:"mentor_notification_inbox",subjectId:context.user.id,
        summary:"Mentor notification inbox acknowledged",
        metadata:{count:changed.length},
        groupKey:"mentor:notifications:"+context.user.id,
        dedupeKey:"mentor:notifications:bulk:"+randomUUID(),
      });
    }
    return {markedRead:changed.length};
  });
}
