import "server-only";
import { and, count, desc, eq, ilike, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { tpoOwnNotificationQuerySchema, tpoMarkOwnNotificationSchema } from "./tpo-own-notification-model";
import { safePlacementNotificationSubject } from "./tpo-messages-model";

export class TpoOwnNotificationConflict extends Error {
  constructor() { super("TPO_NOTIFICATION_MISSING_OR_STALE"); this.name = "TpoOwnNotificationConflict"; }
}

async function authorized(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO") ||
      context.user.platformStatus !== "ACTIVE") throw new AuthorizationError("placements.manage");
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  return { collegeId, organizationId: college.organizationId,
    userId: context.user.id, actorMembershipId: membership.id };
}

/** Own notification deliveries only; conversation bodies/recipient identifiers are excluded. */
export async function listTpoOwnNotifications(context: RequestContext, raw: unknown = {}) {
  const auth = await authorized(context);
  const query = tpoOwnNotificationQuerySchema.parse(raw);
  const scope = and(
    eq(inAppNotifications.userId, auth.userId),
    eq(activityEvents.collegeId, auth.collegeId),
    eq(activityEvents.module, "PLACEMENTS"),
    query.status === "UNREAD" ? isNull(inAppNotifications.readAt)
      : query.status === "READ" ? isNotNull(inAppNotifications.readAt) : undefined,
    query.q ? ilike(activityEvents.eventType, "%" + query.q + "%") : undefined,
  );
  const db = getDb();
  const [tally, rows] = await Promise.all([
    db.select({ total: count() }).from(inAppNotifications)
      .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId)).where(scope),
    db.select({
      id: inAppNotifications.id,
      eventType: activityEvents.eventType,
      occurredAt: inAppNotifications.createdAt,
      readAt: inAppNotifications.readAt,
    }).from(inAppNotifications)
      .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
      .where(scope)
      .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
      .limit(25).offset((query.page - 1) * 25),
  ]);
  const total = tally[0]?.total ?? 0;
  return { query, total, page: query.page, totalPages: Math.max(1, Math.ceil(total / 25)),
    items: rows.map((row) => ({
      id: row.id, label: safePlacementNotificationSubject(row.eventType),
      recordedAt: row.occurredAt.toISOString(), read: row.readAt !== null,
    })),
  };
}

/** Same-transaction row lock, own-recipient check, and immutable audit. */
export async function confirmTpoOwnNotificationRead(context: RequestContext, raw: unknown) {
  const auth = await authorized(context);
  const input = tpoMarkOwnNotificationSchema.parse(raw);
  return getDb().transaction(async (tx) => {
    const [notification] = await tx.select({
      id: inAppNotifications.id, readAt: inAppNotifications.readAt,
    }).from(inAppNotifications)
      .innerJoin(activityEvents, eq(activityEvents.id, inAppNotifications.eventId))
      .where(and(eq(inAppNotifications.id, input.notificationId),
        eq(inAppNotifications.userId, auth.userId),
        eq(activityEvents.collegeId, auth.collegeId),
        eq(activityEvents.module, "PLACEMENTS")))
      .for("update").limit(1);
    if (!notification || notification.readAt) throw new TpoOwnNotificationConflict();
    const now = new Date();
    const [updated] = await tx.update(inAppNotifications)
      .set({ readAt: now })
      .where(and(eq(inAppNotifications.id, notification.id),
        eq(inAppNotifications.userId, auth.userId), isNull(inAppNotifications.readAt)))
      .returning({ id: inAppNotifications.id, readAt: inAppNotifications.readAt });
    if (!updated) throw new TpoOwnNotificationConflict();
    await tx.insert(activityEvents).values({
      organizationId: auth.organizationId, collegeId: auth.collegeId,
      actorUserId: auth.userId, actorMembershipId: auth.actorMembershipId,
      module: "PLACEMENTS", eventType: "PLACEMENTS_TPO_NOTIFICATION_READ",
      subjectType: "in_app_notification", subjectId: updated.id,
      subjectLabel: "Placement notification", summary: "TPO marked an own placement notification read",
      metadata: { notificationId: updated.id },
      occurredAt: now,
    });
    return { id: updated.id, readAt: updated.readAt?.toISOString() ?? now.toISOString() };
  });
}
