import "server-only";

import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
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
export async function getOwnLearnerPlacementAlerts(context: RequestContext,raw:unknown={}) {
  const input=z.strictObject({unreadOnly:z.boolean().default(false),limit:z.number().int().min(1).max(50).default(8)}).parse(raw);
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
      // Announcements also generate bell events; their independent receipt
      // feed is the sole source of notice read state, even with no action href.
      ne(activityEvents.subjectType,"announcement"),
   ne(activityEvents.eventType,"PLACEMENT_ANNOUNCEMENT"),
      // Legacy updates intentionally omit the announcement bell event, even
      // when an imported event used another subjectType or action URL.
      ne(activityEvents.eventType,"PLACEMENT_ANNOUNCEMENT"),
      isNull(inAppNotifications.deletedAt),
      sql`coalesce(${inAppNotifications.deliveryStatus},'SENT')='SENT'`,
      or(isNull(inAppNotifications.scheduledAt),sql`${inAppNotifications.deliveredAt} is not null`),
      // College announcement entries appear in the official Notices feed.
      // Do not repeat their bell notifications as personal placement updates.
      or(isNull(inAppNotifications.actionHref),
        sql`${inAppNotifications.actionHref} NOT LIKE '/learn/my-placements/announcements%'`),
      ...(input.unreadOnly ? [isNull(inAppNotifications.readAt)] : []),
    ))
    .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
    .limit(input.limit);
  return presentOwnLearnerPlacementAlerts(rows);
}

/** Personal PLACEMENTS notifications only; never conflate with official college notices.
 * The official notice feed counts its own membership-scoped receipt rows;
 * these inbox rows intentionally omit announcement targets and never invent
 * "unread=0" for a missing college notice receipt source.
 * Keep the newest-first DB order from the legacy notice API unchanged. */
export async function getUnreadOwnLearnerPlacementAlertCount(context:RequestContext):Promise<number>{
 const membership=await requireLearnerPlacementAccess(context);
 requirePermission(context,"placements.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
 const [result]=await getDb().select({count:sql<number>`count(*)::int`})
  .from(inAppNotifications)
  .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
  .where(and(
   eq(inAppNotifications.userId,context.user.id),
   eq(activityEvents.collegeId,membership.collegeId),
   eq(activityEvents.module,"PLACEMENTS"),
   ne(activityEvents.subjectType,"announcement"),
   isNull(inAppNotifications.deletedAt),
   sql`coalesce(${inAppNotifications.deliveryStatus},'SENT')='SENT'`,
   or(isNull(inAppNotifications.scheduledAt),sql`${inAppNotifications.deliveredAt} is not null`),
   or(isNull(inAppNotifications.actionHref),
     sql`${inAppNotifications.actionHref} NOT LIKE '/learn/my-placements/announcements%'`),
   isNull(inAppNotifications.readAt),
  ));
 return result?.count??0;
}
