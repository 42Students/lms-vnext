import "server-only";

import {
  and,
  eq,
} from "drizzle-orm";
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
  parseActivityDateBoundary,
} from "@/modules/activity/date-boundary";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

import {
  getTpoMessagesPage,
  safePlacementNotificationSubject,
  summarizeTpoMessages,
  TPO_MESSAGE_STATUSES,
  type TpoInboxRecord,
} from "./tpo-messages-model";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";
import {getTpoRecruiterThreadSqlPage} from "./tpo-messages-sql-page-service";

export const tpoMessagesQuerySchema = z
  .object({
    status: z
      .enum(TPO_MESSAGE_STATUSES)
      .default("ALL"),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    q: z.string().trim().max(120).default(""),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (
      query.from &&
      query.to &&
      query.from > query.to
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "End date must not precede start date",
      });
    }

    for (const [field, value, boundary] of [
      ["from", query.from, "from"],
      ["to", query.to, "to"],
    ] as const) {
      if (!value) continue;

      try {
        parseActivityDateBoundary(
          value,
          boundary,
        );
      } catch {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Invalid IST calendar date",
        });
      }
    }
  });

export type TpoMessagesQuery =
  z.infer<typeof tpoMessagesQuerySchema>;

/**
 * Honest fallback while recruiter conversation tables
 * remain unregistered.
 *
 * These are persisted in-app notification DELIVERIES, not
 * recruiter messages or external email/SMS outbox records.
 *
 * Scope independently through:
 * 1. PLACEMENTS activity event's college ID;
 * 2. recipient's active college membership;
 * 3. recipient's active TPO role;
 * 4. recipient's active platform status.
 *
 * Notification title/body and activity metadata are omitted
 * because they can contain arbitrary personal information.
 */
async function loadTpoPlacementNotifications(
  collegeId: string,
): Promise<TpoInboxRecord[]> {
  const rows = await getDb()
    .select({
      id: inAppNotifications.id,
      recipientName: users.displayName,
      eventType: activityEvents.eventType,
      occurredAt: inAppNotifications.createdAt,
      readAt: inAppNotifications.readAt,
    })
    .from(inAppNotifications)
    .innerJoin(
      activityEvents,
      eq(
        activityEvents.id,
        inAppNotifications.eventId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, inAppNotifications.userId),
    )
    .innerJoin(
      collegeMemberships,
      and(
        eq(
          collegeMemberships.userId,
          inAppNotifications.userId,
        ),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "TPO"),
      ),
    )
    .where(
      and(
        eq(activityEvents.collegeId, collegeId),
        eq(activityEvents.module, "PLACEMENTS"),
        eq(users.platformStatus, "ACTIVE"),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    source: "PLACEMENT_NOTIFICATIONS" as const,
    participantName:
      row.recipientName?.trim() || "Unnamed TPO recipient",
    subject: safePlacementNotificationSubject(
      row.eventType,
    ),
    status: isNotificationUnread(row.readAt)
      ? "UNREAD"
      : "READ",
    occurredAt: row.occurredAt,
    jobId: null,
    messageCount: null,
    unreadCount: null,
  }));
}

function isNotificationUnread(
  readAt: Date | null,
) {
  return readAt === null;
}

/**
 * Authenticated, tenant-scoped TPO Messages read.
 *
 * The caller cannot choose a college. Source selection is
 * determined by registered PostgreSQL tables, not a client
 * parameter.
 *
 * Where conversation persistence exists, the read uses
 * actual recruiter threads. Otherwise it shows only
 * confirmed in-app notification deliveries to TPO users,
 * with distinct source labeling and no fabricated
 * conversation or outbound-delivery counts.
 */
/** Legacy pulse analogue: read real persisted unread counts and newest item,
 * not a fabricated socket/delivery receipt. Polling clients preserve their
 * active thread and draft state when a refresh fails. No message body leaves
 * this lightweight read; a paged thread view remains separately authorized.
 */
export async function getTpoMessagesPulse(context:RequestContext){
 const inbox=await getTpoMessagesInbox(context,{page:1,pageSize:1,status:"ALL"});
 const newest=inbox.items[0];
 return {source:inbox.source,ready:inbox.recruiterConversationsAvailable,
  total:inbox.summary.total,unread:inbox.summary.unread,
  reply:inbox.summary.reply,lastId:newest?.id??null,
  lastOccurredAt:newest?.occurredAt??null,
  // True unread state comes from SQL or confirmed notification receipts.
  liveTransport:"POLL_PERSISTED" as const};
}
export async function getTpoMessagesInbox(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError("placements.manage");
  }

  const query = tpoMessagesQuerySchema.parse(
    rawQuery,
  );

  const collegeId = context.membership.collegeId;

  await requirePlacementManageScope(
    context,
    collegeId,
  );

  const [threadsAvailable, messagesAvailable] =
    await Promise.all([
      placementTableExists(
        "placement_tpo_message_threads",
      ),
      placementTableExists(
        "placement_tpo_messages",
      ),
    ]);

  const recruiterConversationsAvailable =
    threadsAvailable && messagesAvailable;

  const source = recruiterConversationsAvailable
    ? "RECRUITER_THREADS" as const
    : "PLACEMENT_NOTIFICATIONS" as const;

  const disclosure={
    messageBodiesExposed:false,notificationBodiesExposed:false,
    recipientContactsExposed:false,outboundDeliveryDataAvailable:false,
  };
  if(recruiterConversationsAvailable){
   const result=await getTpoRecruiterThreadSqlPage(collegeId,query);
   return {collegeId,query,source,recruiterConversationsAvailable,
    ...result,disclosure};
  }
  const records=await loadTpoPlacementNotifications(collegeId);

  const from = query.from
    ? parseActivityDateBoundary(
        query.from,
        "from",
      )
    : null;

  const to = query.to
    ? parseActivityDateBoundary(
        query.to,
        "to",
      )
    : null;

  const page = getTpoMessagesPage(
    records,
    {
      ...query,
      from,
      to,
    },
  );

  return {
    collegeId,
    query,
    source,
    recruiterConversationsAvailable,
    summary: summarizeTpoMessages(records),
    ...page,
    disclosure,
  };
}
