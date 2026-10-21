import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ActivityServiceError } from "./errors";
import { requirePersistedLearnerNotificationMembership } from "./learner-notification-membership-service";
import { markAllOwnNotificationsRead, markOwnNotificationRead, requireStaffNotificationAudience } from "./notification-service";

/** Learner-only acknowledgement. Both recipient AND event college must
 * match the authenticated current membership; readAt is the audit timestamp.
 * Deliberately does not generate a noisy activity event for an inbox click. */
export async function markOwnLearnerNotificationRead(
  context: RequestContext,
  rawId: unknown,
) {
  const id = z.string().uuid().parse(rawId);
  const membership = await requirePersistedLearnerNotificationMembership(context);
  const [owned] = await getDb().select({ id: inAppNotifications.id })
    .from(inAppNotifications)
    .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
    .where(and(
      eq(inAppNotifications.id, id),
      eq(inAppNotifications.userId, context.user.id),
      eq(activityEvents.collegeId, membership.collegeId),
    ))
    .limit(1);
  if (!owned) throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  // Existing service performs an idempotent conditional own-recipient UPDATE.
  return markOwnNotificationRead(context, id);
}

/** Bulk acknowledgement is also scoped to the current learner college.
 * Shared recipients in different colleges cannot be silently acknowledged. */
export async function markAllOwnLearnerNotificationsRead(context: RequestContext) {
  const membership = await requirePersistedLearnerNotificationMembership(context);
  return markAllOwnNotificationsRead(context, { collegeId: membership.collegeId });
}

/** Safe replacement for the legacy not-found-with-ID response. Never reveal an
 * ID that belongs to another recipient or another college. */
export const LEARNER_NOTIFICATION_NOT_FOUND_COPY =
  "Notification not found or no longer available.";

/** Actor-owned archive, not global deletion of an authored announcement.
 * The current persisted learner membership and the event's college must
 * match before any row can be changed. */
export async function archiveOwnLearnerNotification(
  context:RequestContext,rawId:unknown,
){
  const id=z.string().uuid().parse(rawId);
  const membership=await requirePersistedLearnerNotificationMembership(context);
  const [archived]=await getDb().update(inAppNotifications).set({
    deletedAt:new Date(),
  }).where(and(
    eq(inAppNotifications.id,id),
    eq(inAppNotifications.userId,context.user.id),
    isNull(inAppNotifications.deletedAt),
    sql`exists (
      select 1 from activity_events ev
      where ev.id = ${inAppNotifications.eventId}
        and ev.college_id = ${membership.collegeId}::uuid
    )`,
  )).returning({id:inAppNotifications.id});
  if(!archived)throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  return {id:archived.id,message:"Notification deleted successfully"};
}

/** Legacy class/course notices without returning classmates' personal inbox
 * receipts. Scope is resolved through the same persisted college and active
 * staff assignment checks as the composer. */
export async function listStaffNotificationSubjects(
  context:RequestContext,raw:unknown,
){
  const input=z.strictObject({
    classId:z.string().uuid().optional(),
    courseId:z.string().uuid().optional(),
  }).refine(value=>Boolean(value.classId||value.courseId)).parse(raw);
  const {audience}=await requireStaffNotificationAudience(context,{
    title:"Existing notifications",htmlContent:"Read-only notification lookup",
    classId:input.classId,courseId:input.courseId,
  });
  const records=await getDb().select({
    id:activityEvents.id,
    summary:activityEvents.summary,
    subjectType:activityEvents.subjectType,
    subjectId:activityEvents.subjectId,
    createdAt:activityEvents.occurredAt,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId,audience.collegeId),
    eq(activityEvents.organizationId,audience.organizationId),
    input.classId?sql`${activityEvents.metadata} ->> 'classId' = ${input.classId}`:undefined,
    input.courseId?sql`${activityEvents.metadata} ->> 'courseId' = ${input.courseId}`:undefined,
    sql`${activityEvents.metadata} ->> 'deliveryStatus' is not null`,
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(100);
  return {items:records,scope:{
    collegeId:audience.collegeId,classId:audience.classId,courseId:audience.courseId,
  }};
}

/** Deliberately separate the authenticated recipient's archive from a
 * staff-authored announcement delete. Legacy in-app text is preserved. */
export const LEARNER_NOTIFICATION_ARCHIVE_COPY={
 action:"Delete notification",
 success:"Notification deleted successfully",
 unavailable:"Notification not found or no longer available.",
} as const;
