import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ActivityServiceError } from "./errors";
import { requirePersistedLearnerNotificationMembership } from "./learner-notification-membership-service";
import { markAllOwnNotificationsRead, markOwnNotificationRead } from "./notification-service";

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
