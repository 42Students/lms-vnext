import "server-only";

import { randomUUID } from "node:crypto";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  collegeMemberships,
  inAppNotifications,
  membershipRoles,
  users,
} from "@/db/schema";
import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "./service";
import { ACTIVITY_EVENT_TYPES } from "./taxonomy";
import { ActivityServiceError } from "./errors";
import { listOwnNotificationPage } from "./notification-service";
import { resolveTpoInboxQuery,tpoInboxPageHref } from "./tpo-notifications-model";

/**
 * Personal TPO inbox: centrally authorized and verified against the live
 * persisted membership + TPO role, not only a caller-provided context.
 */
export async function requirePersistedTpoInboxMembership(context: RequestContext) {
  const membership = context.membership;
  if (
    !membership ||
    !hasActiveMembership(context) ||
    !hasMembershipRole(context, "TPO") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new AuthorizationError("placements.manage");
  }
  if (!can(context, "placements.manage", { collegeId: membership.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: membership.collegeId });
  const [persisted] = await getDb()
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "TPO"),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membership.id),
        eq(collegeMemberships.collegeId, membership.collegeId),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .limit(1);
  if (!persisted) throw new AuthorizationError("placements.manage");
  return membership;
}

export async function getTpoPersonalInbox(context: RequestContext, rawQuery: unknown) {
  const { query, cursor } = resolveTpoInboxQuery(rawQuery);
  const membership = await requirePersistedTpoInboxMembership(context);
  // The legacy unread badge counts persisted unread across all history.
  const [page, unread] = await Promise.all([
    cursor.invalid
      ? Promise.resolve({ items: [], nextCursor: null })
      : listOwnNotificationPage(context, {
          limit: 50,
          unreadOnly: query.view === "unread",
          collegeId: membership.collegeId,
          ...(cursor.cursor ?? {}),
        }),
    getDb()
      .select({ total: count() })
      .from(inAppNotifications)
      .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
      .where(
        and(
          eq(inAppNotifications.userId, context.user.id),
          eq(activityEvents.collegeId, membership.collegeId),
          isNull(inAppNotifications.readAt),
        ),
      ),
  ]);
  // The bell counter measures all persisted unread receipts for this college;
  // it is intentionally not the number of items in the current 50-row page.
  const nextCursor=page.nextCursor;
  return {query,cursor,page,unreadCount:Number(unread[0]?.total??0),
    unreadCountSource:"PERSISTED_COLLEGE_UNREAD" as const,
    pageSize:50,hasOlder:Boolean(nextCursor),
    olderHref:nextCursor?tpoInboxPageHref(query.view,nextCursor):null,
    recentCutoff:new Date(0),partialRead:false};
}

/** Recipient and persisted current college are both required. Repeats are idempotent. */
export async function markOwnTpoNotificationRead(context: RequestContext, rawId: unknown) {
  const id = z.string().uuid().parse(rawId);
  const membership = await requirePersistedTpoInboxMembership(context);
  return getDb().transaction(async (tx) => {
    const eventIds = tx
      .select({ id: activityEvents.id })
      .from(activityEvents)
      .where(eq(activityEvents.collegeId, membership.collegeId));
    const filter = and(
      eq(inAppNotifications.id, id),
      eq(inAppNotifications.userId, context.user.id),
      inArray(inAppNotifications.eventId, eventIds),
    );
    const [updated] = await tx
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(and(filter, isNull(inAppNotifications.readAt)))
      .returning({ id: inAppNotifications.id, readAt: inAppNotifications.readAt });
    if (!updated) {
      const [current] = await tx
        .select({ id: inAppNotifications.id, readAt: inAppNotifications.readAt })
        .from(inAppNotifications)
        .where(filter)
        .limit(1);
      if (!current) throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
      return current;
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.IDENTITY_TPO_NOTIFICATION_ACKNOWLEDGED,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      subjectType: "in_app_notification",
      subjectId: updated.id,
      summary: "TPO notification acknowledged",
      metadata: { count: 1 },
      groupKey: "tpo:notifications:" + context.user.id,
      dedupeKey: "tpo:notification:" + updated.id + ":read",
    });
    return updated;
  });
}

/** One auditable transactional batch; a repeat is a no-op without new events. */
export async function markAllOwnTpoNotificationsRead(context: RequestContext) {
  const membership = await requirePersistedTpoInboxMembership(context);
  return getDb().transaction(async (tx) => {
    const eventIds = tx
      .select({ id: activityEvents.id })
      .from(activityEvents)
      .where(eq(activityEvents.collegeId, membership.collegeId));
    const changed = await tx
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(inAppNotifications.userId, context.user.id),
          inArray(inAppNotifications.eventId, eventIds),
          isNull(inAppNotifications.readAt),
        ),
      )
      .returning({ id: inAppNotifications.id });
    if (changed.length) {
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.IDENTITY_TPO_NOTIFICATION_ACKNOWLEDGED,
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
        subjectType: "tpo_notification_inbox",
        subjectId: context.user.id,
        summary: "TPO notification inbox acknowledged",
        metadata: { count: changed.length },
        groupKey: "tpo:notifications:" + context.user.id,
        dedupeKey: "tpo:notifications:bulk:" + randomUUID(),
      });
    }
    return { markedRead: changed.length };
  });
}
