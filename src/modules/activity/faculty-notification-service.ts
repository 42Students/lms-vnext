import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ActivityServiceError } from "./errors";
import { requireFacultyNotificationsAccess } from "./faculty-notifications-access";
import {
  markAllOwnNotificationsRead,
  markOwnNotificationRead,
} from "./notification-service";

/**
 * A human can belong to multiple colleges. The Faculty inbox is one college
 * at a time, not an implicit cross-college staff inbox. Only a persisted event
 * belonging to this membership's college may be acknowledged from Faculty UI.
 */
export async function markOwnFacultyNotificationRead(
  context: RequestContext,
  notificationIdInput: unknown,
) {
  const membership = requireFacultyNotificationsAccess(context);
  const notificationId = z.string().uuid().parse(notificationIdInput);
  const [owned] = await getDb().select({ id: inAppNotifications.id })
    .from(inAppNotifications)
    .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
    .where(and(
      eq(inAppNotifications.id, notificationId),
      eq(inAppNotifications.userId, context.user.id),
      eq(activityEvents.collegeId, membership.collegeId),
    ))
    .limit(1);
  if (!owned) throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  return markOwnNotificationRead(context, notificationId);
}

/** Bulk acknowledgment must not mark notifications from other memberships. */
export async function markAllOwnFacultyNotificationsRead(context: RequestContext) {
  const membership = requireFacultyNotificationsAccess(context);
  return markAllOwnNotificationsRead(context, { collegeId: membership.collegeId });
}
