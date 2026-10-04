import {
  and,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  inAppNotifications,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { ActivityServiceError } from "./errors";

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
      .nullable()
      .optional(),
  })
  .strict();

export type InAppNotificationDeliveryInput =
  z.input<typeof deliverySchema>;

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
    };
  }

  const [[event], recipients] =
    await Promise.all([
      db
        .select({
          id: activityEvents.id,
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

  if (active.length > 0) {
    await db
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
      .onConflictDoNothing();
  }

  return {
    delivered: active.length,
    skippedInactive:
      recipients.length -
      active.length,
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

  return getDb()
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
}

export async function countOwnUnreadNotifications(
  context: RequestContext,
) {
  const rows =
    await listOwnNotifications(
      context,
      {
        unreadOnly: true,
        limit: 100,
      },
    );
  return rows.length;
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
    return current;
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

  return updated ?? current;
}
