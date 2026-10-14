import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { presentOwnLearnerPlacementAlerts } from "./learner-placement-alerts-model";

/**
 * Uses registered activity_events and in_app_notifications only.
 * Personal PLACEMENTS events do not establish an official college notice
 * or a disputable placement sanction; do not present them as such.
 */
export async function getOwnLearnerPlacementAlerts(context: RequestContext) {
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });
  const rows = await getDb().select({
    id: inAppNotifications.id,
    title: inAppNotifications.title,
    body: inAppNotifications.body,
    actionHref: inAppNotifications.actionHref,
    createdAt: inAppNotifications.createdAt,
    readAt: inAppNotifications.readAt,
  }).from(inAppNotifications)
    .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
    .where(and(
      eq(inAppNotifications.userId, context.user.id),
      eq(activityEvents.collegeId, membership.collegeId),
      eq(activityEvents.module, "PLACEMENTS"),
    ))
    .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
    .limit(8);
  return presentOwnLearnerPlacementAlerts(rows);
}
