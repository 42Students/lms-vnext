import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  collegeMemberships,
  colleges,
  inAppNotifications,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  systemRoles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ActivityServiceError } from "./errors";
import { safeNotificationActionHref } from "./notification-action";

type NotificationWriter = Pick<
  ReturnType<typeof getDb>,
  "select" | "insert"
>;

const deliverySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(240),
    body: z
      .string()
      .trim()
      .min(1)
      .max(2000),
    actionHref: z
      .string()
      .trim()
      .startsWith("/")
      .max(1000)
      .refine(
        (href) => safeNotificationActionHref(href) === href,
        "Notification actionHref must be an internal path",
      )
      .nullable()
      .optional(),
  })
  .strict();

export type InAppNotificationDeliveryInput =
  z.input<typeof deliverySchema>;

/**
 * A producer can request a recipient ID, but that alone is not authority to
 * send a tenant-scoped event. Check the persisted, current recipient grants.
 * A single ineligible active recipient rejects the whole batch without writes.
 * Global events (no organization/college) are intentionally unrestricted.
 */
async function assertScopedNotificationRecipients(
  db: NotificationWriter,
  event: { collegeId: string | null; organizationId: string | null },
  activeUserIds: readonly string[],
) {
  if (activeUserIds.length === 0 ||
      (!event.collegeId && !event.organizationId)) return;

  const targetCollege = event.collegeId;
  const targetOrganization = event.organizationId;
  const scopeCondition = targetCollege
    ? eq(colleges.id, targetCollege)
    : eq(colleges.organizationId, targetOrganization!);
  const relationshipScope = targetCollege
    ? eq(placementCompanyRelationships.collegeId, targetCollege)
    : eq(colleges.organizationId, targetOrganization!);

  const [memberships, recruiterGrants, administrators] = await Promise.all([
    db.select({ userId: collegeMemberships.userId })
      .from(collegeMemberships)
      .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
      .where(and(
        inArray(collegeMemberships.userId, [...activeUserIds]),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        scopeCondition,
      )),
    db.select({ userId: placementRecruiterCollegeGrants.recruiterUserId })
      .from(placementRecruiterCollegeGrants)
      .innerJoin(
        placementRecruiterProfiles,
        eq(placementRecruiterProfiles.userId, placementRecruiterCollegeGrants.recruiterUserId),
      )
      .innerJoin(
        placementCompanyRelationships,
        eq(placementCompanyRelationships.id, placementRecruiterCollegeGrants.companyRelationshipId),
      )
      .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
      .where(and(
        inArray(placementRecruiterCollegeGrants.recruiterUserId, [...activeUserIds]),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        relationshipScope,
      )),
    db.select({ userId: systemRoles.userId })
      .from(systemRoles)
      .where(and(
        inArray(systemRoles.userId, [...activeUserIds]),
        eq(systemRoles.role, "SUPER_ADMIN"),
      )),
  ]);

  const eligible = new Set([
    ...memberships.map((row) => row.userId),
    ...recruiterGrants.map((row) => row.userId),
    ...administrators.map((row) => row.userId),
  ]);
  if (activeUserIds.some((id) => !eligible.has(id))) {
    throw new ActivityServiceError("NOTIFICATION_SCOPE_MISMATCH");
  }
}

function sanitizeNotificationRow<T extends { actionHref: string | null }>(row: T) {
  return {
    ...row,
    actionHref: safeNotificationActionHref(row.actionHref),
  };
}

async function writeInAppNotification(
  db: NotificationWriter,
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  const parsedEventId = z
    .string()
    .uuid()
    .parse(eventId);
  const userIds = [
    ...new Set(
      userIdsInput.map((id) =>
        z.string().uuid().parse(id),
      ),
    ),
  ];
  const input =
    deliverySchema.parse(rawInput);

  if (userIds.length === 0) {
    return {
      delivered: 0,
      skippedInactive: 0,
      skippedDuplicate: 0,
    };
  }

  const [[event], recipients] =
    await Promise.all([
      db
        .select({
          id: activityEvents.id,
          collegeId: activityEvents.collegeId,
          organizationId: activityEvents.organizationId,
        })
        .from(activityEvents)
        .where(
          eq(
            activityEvents.id,
            parsedEventId,
          ),
        )
        .limit(1),
      db
        .select({
          id: users.id,
          platformStatus:
            users.platformStatus,
        })
        .from(users)
        .where(
          inArray(users.id, userIds),
        ),
    ]);

  if (!event) {
    throw new ActivityServiceError(
      "ACTIVITY_EVENT_NOT_FOUND",
    );
  }
  if (recipients.length !== userIds.length) {
    throw new ActivityServiceError(
      "NOTIFICATION_RECIPIENT_NOT_FOUND",
    );
  }

  const active = recipients
    .filter(
      (user) =>
        user.platformStatus === "ACTIVE",
    )
    .map((user) => user.id);

  // Re-check persisted scopes in the same transaction when called from a
  // transactional domain producer. Never assume caller-selected IDs are safe.
  await assertScopedNotificationRecipients(db, event, active);

  let delivered = 0;
  if (active.length > 0) {
    const inserted = await db
      .insert(inAppNotifications)
      .values(
        active.map((userId) => ({
          userId,
          eventId: parsedEventId,
          title: input.title,
          body: input.body,
          actionHref:
            input.actionHref ?? null,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: inAppNotifications.id });
    delivered = inserted.length;
  }

  return {
    delivered,
    skippedInactive:
      recipients.length -
      active.length,
    skippedDuplicate: active.length - delivered,
  };
}

export async function deliverInAppNotification(
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  return writeInAppNotification(
    getDb(),
    eventId,
    userIdsInput,
    rawInput,
  );
}

export async function deliverInAppNotificationInTransaction(
  tx: NotificationWriter,
  eventId: string,
  userIdsInput: readonly string[],
  rawInput: InAppNotificationDeliveryInput,
) {
  return writeInAppNotification(
    tx,
    eventId,
    userIdsInput,
    rawInput,
  );
}

export async function listOwnNotifications(
  context: RequestContext,
  options: {
    unreadOnly?: boolean;
    limit?: number;
  } = {},
) {
  const limit = z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(40)
    .parse(options.limit);
  const conditions = [
    eq(
      inAppNotifications.userId,
      context.user.id,
    ),
  ];
  if (options.unreadOnly) {
    conditions.push(
      isNull(
        inAppNotifications.readAt,
      ),
    );
  }

  const rows = await getDb()
    .select({
      notification:
        inAppNotifications,
      event: {
        id: activityEvents.id,
        module: activityEvents.module,
        eventType:
          activityEvents.eventType,
        importance:
          activityEvents.importance,
        occurredAt:
          activityEvents.occurredAt,
      },
    })
    .from(inAppNotifications)
    .innerJoin(
      activityEvents,
      eq(
        activityEvents.id,
        inAppNotifications.eventId,
      ),
    )
    .where(and(...conditions))
    .orderBy(
      desc(
        inAppNotifications.createdAt,
      ),
      desc(inAppNotifications.id),
    )
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    notification: sanitizeNotificationRow(row.notification),
  }));
}

export async function countOwnUnreadNotifications(
  context: RequestContext,
) {
  const [row] = await getDb()
    .select({ total: count() })
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.userId, context.user.id),
        isNull(inAppNotifications.readAt),
      ),
    );
  return row?.total ?? 0;
}

export async function markOwnNotificationRead(
  context: RequestContext,
  notificationIdInput: string,
) {
  const notificationId = z
    .string()
    .uuid()
    .parse(notificationIdInput);

  const [current] = await getDb()
    .select()
    .from(inAppNotifications)
    .where(
      and(
        eq(
          inAppNotifications.id,
          notificationId,
        ),
        eq(
          inAppNotifications.userId,
          context.user.id,
        ),
      ),
    )
    .limit(1);

  if (!current) {
    throw new ActivityServiceError(
      "NOTIFICATION_NOT_FOUND",
    );
  }
  if (current.readAt) {
    return sanitizeNotificationRow(current);
  }

  const [updated] = await getDb()
    .update(inAppNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(
          inAppNotifications.id,
          current.id,
        ),
        eq(
          inAppNotifications.userId,
          context.user.id,
        ),
        isNull(
          inAppNotifications.readAt,
        ),
      ),
    )
    .returning();

  if (updated) {
    return sanitizeNotificationRow(updated);
  }

  // Concurrent readers can observe unread before another request wins
  // the conditional update. Return the committed row, not stale readAt=null.
  const [latest] = await getDb()
    .select()
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.id, notificationId),
        eq(inAppNotifications.userId, context.user.id),
      ),
    )
    .limit(1);
  if (!latest) {
    throw new ActivityServiceError("NOTIFICATION_NOT_FOUND");
  }
  return sanitizeNotificationRow(latest);
}

/**
 * Atomically acknowledge the entire unread inbox, including notifications
 * beyond the first page of the UI. Never accept a client-supplied recipient ID.
 * Concurrent calls are idempotent: each row is acknowledged at most once.
 */
export async function markAllOwnNotificationsRead(context: RequestContext) {
  const rows = await getDb()
    .update(inAppNotifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(inAppNotifications.userId, context.user.id),
      isNull(inAppNotifications.readAt),
    ))
    .returning({ id: inAppNotifications.id });

  return rows.length;
}
