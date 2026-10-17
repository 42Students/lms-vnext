import "server-only";

import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  activityEvents,
  collegeMemberships,
  inAppNotifications,
  membershipRoles,
  placementJobs,
  users,
} from "@/db/schema";
import {
  placementTpoMessageThreads,
  placementTpoMessages,
} from "@/db/schema/tpo-collaboration";

import {
  parseActivityDateBoundary,
} from "@/modules/activity/date-boundary";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

import {
  deriveRecruiterThreadStatus,
  getTpoMessagesPage,
  safePlacementNotificationSubject,
  summarizeTpoMessages,
  TPO_MESSAGE_STATUSES,
  type TpoInboxRecord,
} from "./tpo-messages-model";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

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
 * Read actual recruiter conversation metadata only.
 *
 * Every conversation is owned by a specific college.
 * Job metadata is left-joined with an additional college
 * predicate, so even an inconsistent cross-tenant job FK
 * cannot disclose another college's job title.
 *
 * Message bodies, contact identifiers and recipient addresses
 * are neither selected nor returned.
 */
async function loadRecruiterThreads(
  collegeId: string,
  searchText: string,
): Promise<TpoInboxRecord[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: placementTpoMessageThreads.id,
      recruiterName: users.displayName,
      jobId: placementJobs.id,
      jobTitle: placementJobs.title,
      createdAt:
        placementTpoMessageThreads.createdAt,
      lastMessageAt: sql<Date | null>`
        max(${placementTpoMessages.createdAt})
      `,
      lastPreview:sql<string|null>`(select left(m.body,160) from placement_tpo_messages m
         where m.thread_id=placement_tpo_message_threads.id
         order by m.created_at desc,m.id desc limit 1)`,
      searchSnippet: sql<string|null>`(
        select left(search_message.body,160)
        from placement_tpo_messages search_message
        where search_message.thread_id = placement_tpo_message_threads.id
          and position(lower(${searchText}) in lower(search_message.body)) > 0
        order by search_message.created_at desc, search_message.id desc
        limit 1
      )`,
      bodySearchMatch: sql<boolean>`exists (
        select 1 from placement_tpo_messages search_message
        where search_message.thread_id = placement_tpo_message_threads.id
          and position(lower(${searchText}) in lower(search_message.body)) > 0
      )`,
      accessEnded: sql<boolean>`not exists (
        select 1 from placement_recruiter_college_grants grant_row
        inner join placement_company_relationships relation
          on relation.id = grant_row.company_relationship_id
        inner join placement_recruiter_profiles recruiter_profile
          on recruiter_profile.user_id = grant_row.recruiter_user_id
          and recruiter_profile.company_id = relation.company_id
        where relation.college_id = ${collegeId}::uuid
          and relation.status = 'ACTIVE'
          and recruiter_profile.status = 'ACTIVE'
          and grant_row.recruiter_user_id = placement_tpo_message_threads.recruiter_user_id
          and grant_row.status = 'ACTIVE'
          and grant_row.verification_status = 'VERIFIED'
          and grant_row.valid_until > now()
      )`,
      companyName: sql<string|null>`(
        select lead.company_name from placement_tpo_leads lead
        where lead.college_id = ${collegeId}::uuid
          and lead.recruiter_user_id = placement_tpo_message_threads.recruiter_user_id
        order by lead.updated_at desc, lead.id desc limit 1
      )`,
      lastSender:sql<string|null>`(select m.sender_type from placement_tpo_messages m
         where m.thread_id=placement_tpo_message_threads.id
         order by m.created_at desc,m.id desc limit 1)`,
      messageCount: sql<number>`
        count(${placementTpoMessages.id})::integer
      `,
      unreadRecruiterMessages: sql<number>`
        count(${placementTpoMessages.id})
        filter (
          where
            ${placementTpoMessages.senderType} = 'RECRUITER'
            and ${placementTpoMessages.readAt} is null
        )::integer
      `,
    })
    .from(placementTpoMessageThreads)
    .innerJoin(
      users,
      eq(
        users.id,
        placementTpoMessageThreads.recruiterUserId,
      ),
    )
    .leftJoin(
      placementJobs,
      and(
        eq(
          placementJobs.id,
          placementTpoMessageThreads.jobId,
        ),
        eq(placementJobs.collegeId, collegeId),
      ),
    )
    .leftJoin(
      placementTpoMessages,
      eq(
        placementTpoMessages.threadId,
        placementTpoMessageThreads.id,
      ),
    )
    .where(
      eq(placementTpoMessageThreads.collegeId, collegeId),
    )
    .groupBy(
      placementTpoMessageThreads.id,
      users.displayName,
      placementJobs.id,
      placementJobs.title,
    );

  return rows.map((row) => {
    const messageCount = Number(row.messageCount);
    const unreadRecruiterMessages = Number(
      row.unreadRecruiterMessages,
    );

    return {
      id: row.id,
      source: "RECRUITER_THREADS" as const,
      participantName:
        row.recruiterName?.trim() || "Unnamed recruiter",
      subject:
        row.jobTitle || "General recruiter conversation",
      status: deriveRecruiterThreadStatus({
        messageCount,
        unreadRecruiterMessages,
      }),
      occurredAt:
        row.lastMessageAt ?? row.createdAt,
      jobId: row.jobId,
      messageCount,
      unreadCount: unreadRecruiterMessages,
      lastPreview:row.lastPreview,
      waitingForYou:row.lastSender==="RECRUITER",
      companyName:row.companyName,
      bodySearchMatch:row.bodySearchMatch,
      searchSnippet:row.searchSnippet,
      accessEnded:row.accessEnded,
    };
  });
}

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

  const records = recruiterConversationsAvailable
    ? await loadRecruiterThreads(collegeId, query.q.trim().length >= 2 ? query.q.trim() : "")
    : await loadTpoPlacementNotifications(collegeId);

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
    disclosure: {
      messageBodiesExposed: false,
      notificationBodiesExposed: false,
      recipientContactsExposed: false,
      outboundDeliveryDataAvailable: false,
    },
  };
}
