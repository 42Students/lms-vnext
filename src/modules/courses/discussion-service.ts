import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  isNull,
  not,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH } from "./learner-discussion-message-limit-model";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  courseTeachingAssignments,
  membershipRoles,
  courseDiscussionMessages,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearningReadAccess } from "./learning-access";
import { loadCourseSectionDeliveryScope } from "./scope";
import { CoursesServiceError } from "./errors";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import { formatDiscussionReply } from "./learner-discussion-reply-model";
import {facultyDiscussionModerationSchema,facultyDiscussionTokenMatches}
 from "./faculty-discussion-moderation-model";
import {facultyReplyParentTokenMatches} from "./faculty-discussion-reply-model";

const deliveryIdSchema = z.string().uuid();
const messageIdSchema = z.string().uuid();
const createDiscussionMessageSchema = z.object({
  messageText: z.string().trim()
    .min(1, { message: "Message cannot be empty" })
    .max(LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH, {
      message: "Message is too long for this Discussion",
    }),
  replyToMessageId: messageIdSchema.optional(),
  expectedParentUpdatedAt:z.string().datetime({offset:true}).optional(),
  confirmed:z.literal(true).optional(),
}).strict();

/** Legacy classroom error explanations; callers still own status codes. */
export function courseDiscussionErrorMessage(code: string): string {
  switch (code) {
    case "DISCUSSION_MESSAGE_NOT_FOUND": return "Message not found";
    case "DISCUSSION_MODERATION_ACCESS_DENIED": return "Only faculty or admin can pin messages";
    case "DISCUSSION_POST_ACCESS_DENIED": return "You do not have access to post in this classroom";
    case "DISCUSSION_STALE_VERSION": return "This message changed. Reload the discussion and try again.";
    case "LEARNING_ACCESS_DENIED": return "You do not have access to this class or course";
    default: return "Could not load this discussion. Reload the latest messages and try again.";
  }
}

const historySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
  beforeCreatedAt: z.string().datetime({ offset: true }).optional(),
  beforeId: z.string().uuid().optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.beforeCreatedAt) !== Boolean(v.beforeId)) {
    ctx.addIssue({ code: "custom", path: ["beforeId"], message: "Complete cursor required" });
  }
});

async function discussionAccess(
  context: RequestContext,
  deliveryIdInput: string,
  includeHistorical = false,
) {
  const deliveryId =
    deliveryIdSchema.parse(deliveryIdInput);
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
      includeHistorical,
    );
  const mode =
    await requireLearningReadAccess(
      context,
      delivery.offeringId,
      deliveryId,
      { includeHistorical },
    );

  return {
    deliveryId,
    delivery,
    mode,
  };
}

async function loadDiscussionMessage(
  messageIdInput: string,
) {
  const messageId =
    messageIdSchema.parse(messageIdInput);
  const [message] = await getDb()
    .select()
    .from(courseDiscussionMessages)
    .where(and(
      eq(courseDiscussionMessages.id, messageId),
      isNull(courseDiscussionMessages.deletedAt),
    ))
    .limit(1);

  if (!message) {
    throw new CoursesServiceError(
      "DISCUSSION_MESSAGE_NOT_FOUND",
    );
  }

  return message;
}

export async function listCourseDiscussionMessages(
  context: RequestContext,
  deliveryIdInput: string,
  rawPage: unknown = {},
) {
  const page = historySchema.parse(rawPage);
  const { deliveryId, mode } = await discussionAccess(context, deliveryIdInput, true);
  if (mode === "LEARNER") await requireOwnCourseLearnerRead(context);
  let canPost = true;
  try {
    await discussionAccess(context, deliveryIdInput, false);
  } catch {
    canPost = false;
  }
  // PostgreSQL timestamps have microsecond precision. A JS Date cursor
  // would truncate them to milliseconds and skip messages at page boundaries.
  // Compare the persisted timestamp plus UUID directly, with a microsecond
  // ISO cursor returned by PostgreSQL.
  const before = page.beforeCreatedAt && page.beforeId
    ? sql`(${courseDiscussionMessages.createdAt}, ${courseDiscussionMessages.id})
        < (${page.beforeCreatedAt}::timestamptz, ${page.beforeId}::uuid)`
    : undefined;
  const fetched = await getDb()
    .select({
      id: courseDiscussionMessages.id,
      deliveryId: courseDiscussionMessages.deliveryId,
      senderMembershipId: courseDiscussionMessages.senderMembershipId,
      senderRole: courseDiscussionMessages.senderRole,
      senderName: users.displayName,
      messageText: courseDiscussionMessages.messageText,
      pinned: courseDiscussionMessages.pinned,
      createdAt: courseDiscussionMessages.createdAt,
      cursorCreatedAt: sql<string>`to_char(${courseDiscussionMessages.createdAt}
        AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      updatedAt: courseDiscussionMessages.updatedAt,
    })
    .from(courseDiscussionMessages)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, courseDiscussionMessages.senderMembershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(courseDiscussionMessages.deliveryId, deliveryId),
      isNull(courseDiscussionMessages.deletedAt),
      before,
    ))
    .orderBy(desc(courseDiscussionMessages.createdAt), desc(courseDiscussionMessages.id))
    .limit(page.limit + 1);
  // Pinning remains visible even after its message is outside the newest page.
  // This uses the same already-authorized Section, and does not load the feed.
  const [highlightedPinned] = await getDb()
    .select({
      id: courseDiscussionMessages.id,
      messageText: courseDiscussionMessages.messageText,
      senderName: users.displayName,
      createdAt: courseDiscussionMessages.createdAt,
      updatedAt: courseDiscussionMessages.updatedAt,
    })
    .from(courseDiscussionMessages)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, courseDiscussionMessages.senderMembershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(courseDiscussionMessages.deliveryId, deliveryId),
      eq(courseDiscussionMessages.pinned, true),
      isNull(courseDiscussionMessages.deletedAt),
    ))
    .orderBy(desc(courseDiscussionMessages.createdAt), desc(courseDiscussionMessages.id))
    .limit(1);

  const hasOlder = fetched.length > page.limit;
  const messages = (hasOlder ? fetched.slice(0, page.limit) : fetched).reverse();
  const oldest = messages[0];
  return {
    accessMode: mode,
    canPost,
    messages: messages.map(({ cursorCreatedAt, ...row }) => ({
      ...row,
      createdAtExact: cursorCreatedAt,
      isMine: context.membership?.id === row.senderMembershipId,
    })),
    highlightedPinned: highlightedPinned ?? null,
    nextCursor: hasOlder && oldest
      ? { beforeCreatedAt: oldest.cursorCreatedAt, beforeId: oldest.id }
      : null,
  };
}

/**
 * A preflight learner read must not survive persisted account/role revocation
 * before the discussion write. Lock the actor under the same transaction as
 * the post/delete; other-caller access checks are handled separately.
 */
async function assertLiveLearnerDiscussionWriter(
  tx:Pick<ReturnType<typeof getDb>,"select">,
  context:RequestContext,
):Promise<void>{
  const member=context.membership;
  if(!member||member.status!=="ACTIVE"||!member.roles.includes("LEARNER")||
     context.user.platformStatus!=="ACTIVE")
    throw new CoursesServiceError("DISCUSSION_POST_ACCESS_DENIED");
  const [active]=await tx.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(users,and(
    eq(users.id,collegeMemberships.userId),
    eq(users.platformStatus,"ACTIVE"),
   ))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER"),
   ))
   .where(and(
    eq(collegeMemberships.id,member.id),
    eq(collegeMemberships.userId,context.user.id),
    eq(collegeMemberships.collegeId,member.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
   )).for("share").limit(1);
  if(!active)throw new CoursesServiceError("DISCUSSION_POST_ACCESS_DENIED");
}

/** Changed-row feed for classroom polling: clients apply active upserts and
 * privacy-safe tombstones by stable UUID, without fetching the entire thread.
 * Use the returned microsecond timestamp and UUID together for lossless paging.
 * Bare 'since' deliberately includes equal-time rows; this may repeat a row
 * but cannot silently skip a same-timestamp update. */
export async function listCourseDiscussionChanges(
  context: RequestContext,
  deliveryIdInput: string,
  rawQuery: unknown,
) {
  const query = z.object({
    since: z.string().datetime({
      offset: true,
      message: "since must be an ISO-8601 timestamp",
    }),
    afterId: messageIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(60),
  }).strict().parse(rawQuery);
  const { deliveryId, mode } =
    await discussionAccess(context, deliveryIdInput, true);
  if (mode === "LEARNER") await requireOwnCourseLearnerRead(context);
  const changedAfter = query.afterId
    ? sql`(${courseDiscussionMessages.updatedAt}, ${courseDiscussionMessages.id}) >
        (${query.since}::timestamptz, ${query.afterId}::uuid)`
    : sql`${courseDiscussionMessages.updatedAt} >= ${query.since}::timestamptz`;
  const fetched = await getDb().select({
    id: courseDiscussionMessages.id,
    deliveryId: courseDiscussionMessages.deliveryId,
    senderMembershipId: courseDiscussionMessages.senderMembershipId,
    senderName: users.displayName,
    messageText: courseDiscussionMessages.messageText,
    pinned: courseDiscussionMessages.pinned,
    deletedAt: courseDiscussionMessages.deletedAt,
    updatedAtExact: sql<string>`to_char(${courseDiscussionMessages.updatedAt}
      AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  }).from(courseDiscussionMessages)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, courseDiscussionMessages.senderMembershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(courseDiscussionMessages.deliveryId, deliveryId),
      changedAfter,
    ))
    .orderBy(asc(courseDiscussionMessages.updatedAt), asc(courseDiscussionMessages.id))
    .limit(query.limit + 1);
  const hasMore = fetched.length > query.limit;
  const rows = hasMore ? fetched.slice(0, query.limit) : fetched;
  const last = rows.at(-1);
  return {
    deliveryId,
    changes: rows.map(row => row.deletedAt
      ? {
          id: row.id,
          deliveryId: row.deliveryId,
          deleted: true as const,
          updatedAtExact: row.updatedAtExact,
        }
      : {
          id: row.id,
          deliveryId: row.deliveryId,
          deleted: false as const,
          senderMembershipId: row.senderMembershipId,
          senderName: row.senderName,
          messageText: row.messageText,
          pinned: row.pinned,
          updatedAtExact: row.updatedAtExact,
          isMine: context.membership?.id === row.senderMembershipId,
        }),
    nextCursor: hasMore && last
      ? { since: last.updatedAtExact, afterId: last.id }
      : null,
  };
}

export async function createCourseDiscussionMessage(
  context: RequestContext,
  deliveryIdInput: string,
  rawInput: unknown,
) {
  const { deliveryId, mode } =
    await discussionAccess(
      context,
      deliveryIdInput,
    );
  const membership = context.membership;

  if (
    !membership ||
    membership.status !== "ACTIVE"
  ) {
    throw new CoursesServiceError(
      "DISCUSSION_POST_ACCESS_DENIED",
    );
  }

  const input =
    createDiscussionMessageSchema.parse(rawInput);
  if (mode === "LEARNER") await requireOwnCourseLearnerRead(context);
  const senderRole =
    mode === "LEARNER"
      ? "LEARNER"
      : mode === "FACULTY"
        ? "FACULTY"
        : "ADMIN";

  return getDb().transaction(async (tx) => {
    if(mode==="LEARNER")await assertLiveLearnerDiscussionWriter(tx,context);
    // Recheck the persisted teaching scope before the write, not only on read.
    if(mode==="FACULTY")await assertLiveFacultyDiscussionModerator(tx,context,deliveryId);
    const [parent]=input.replyToMessageId
      ? await tx.select().from(courseDiscussionMessages)
        .where(and(eq(courseDiscussionMessages.id,input.replyToMessageId),
          eq(courseDiscussionMessages.deliveryId,deliveryId),
          isNull(courseDiscussionMessages.deletedAt))).for("share").limit(1)
      : [null];
    if(input.replyToMessageId&&!parent)
      throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
    if(mode==="FACULTY"&&parent&&(!input.confirmed||!input.expectedParentUpdatedAt||
       !facultyReplyParentTokenMatches(parent.updatedAt,input.expectedParentUpdatedAt)))
      throw new CoursesServiceError("DISCUSSION_STALE_VERSION");
    const messageText=formatDiscussionReply(input.messageText,parent?.id??null);
    const [created] = await tx.insert(courseDiscussionMessages).values({
      deliveryId,
      senderMembershipId: membership.id,
      senderRole,
      messageText,
    }).returning();
    await recordActivityEventInTransaction(tx, context, {
      eventType: mode==="FACULTY"&&parent?
        ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_REPLIED:
        ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_POSTED,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      subjectType: "course_discussion_message",
      subjectId: created!.id,
      summary: "Course discussion message posted",
      metadata: { deliveryId, senderRole, ...(parent?{replyToMessageId:parent.id}:{}) },
      groupKey: "course-discussion:" + deliveryId,
      dedupeKey: "course-discussion:" + created!.id + ":post",
    });
    return created!;
  });
}

/** A prior read grant must not survive revocation before a moderation write. */
async function assertLiveFacultyDiscussionModerator(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  context: RequestContext,
  deliveryId: string,
) {
  const membership = context.membership;
  if (!membership) throw new CoursesServiceError("DISCUSSION_MODERATION_ACCESS_DENIED");
  const [row] = await tx.select({id:courseTeachingAssignments.id})
    .from(courseTeachingAssignments)
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"FACULTY"),
    ))
    .innerJoin(users,and(
      eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(courseTeachingAssignments.membershipId,membership.id),
      eq(courseTeachingAssignments.deliveryId,deliveryId),
      isNull(courseTeachingAssignments.endedAt),
    )).for("share").limit(1);
  if (!row) throw new CoursesServiceError("DISCUSSION_MODERATION_ACCESS_DENIED");
}

export async function toggleCourseDiscussionPin(
  context: RequestContext,
  messageIdInput: string,
  deliveryIdInput?: string,
  rawExpected?: unknown,
) {
  const concurrency=rawExpected===undefined?null:facultyDiscussionModerationSchema.parse(rawExpected);
  const requestedDeliveryId = deliveryIdInput === undefined
    ? null
    : deliveryIdSchema.parse(deliveryIdInput);
  const message = await loadDiscussionMessage(messageIdInput);
  // A URL scoped to Section B must never mutate a message in Section A.
  // The check is inside the service, not a full-feed preflight in the route.
  if (requestedDeliveryId !== null && message.deliveryId !== requestedDeliveryId) {
    throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
  }
  const { mode } = await discussionAccess(
    context,
    message.deliveryId,
  );

  if (mode === "LEARNER") {
    throw new CoursesServiceError(
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    );
  }

  if(concurrency&&!facultyDiscussionTokenMatches(message.updatedAt,concurrency.expectedUpdatedAt))
    throw new CoursesServiceError("DISCUSSION_STALE_VERSION");
  // Atomic toggle with millisecond-normalized CAS for route writes.
  return getDb().transaction(async (tx) => {
    if (mode === "FACULTY") await assertLiveFacultyDiscussionModerator(tx,context,message.deliveryId);
    const [updated] = await tx.update(courseDiscussionMessages).set({
      pinned: not(courseDiscussionMessages.pinned),
      pinnedByUserId: sql`case when ${courseDiscussionMessages.pinned}
        then null else ${context.user.id}::uuid end`,
      updatedAt: new Date(Math.max(Date.now(),message.updatedAt.getTime()+1)),
    }).where(and(
      eq(courseDiscussionMessages.id, message.id),
      eq(courseDiscussionMessages.deliveryId, message.deliveryId),
      isNull(courseDiscussionMessages.deletedAt),
      concurrency?sql`date_trunc('milliseconds', ${courseDiscussionMessages.updatedAt}) =
        ${new Date(concurrency.expectedUpdatedAt).toISOString()}::timestamptz`:undefined,
    )).returning();
    if (!updated) throw new CoursesServiceError("DISCUSSION_STALE_VERSION");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_PIN_CHANGED,
      collegeId: context.membership!.collegeId,
      organizationId: context.membership!.organizationId,
      subjectType: "course_discussion_message",
      subjectId: updated.id,
      summary: updated.pinned ? "Course discussion pinned" : "Course discussion unpinned",
      metadata: { deliveryId: message.deliveryId, pinned: updated.pinned },
      groupKey: "course-discussion:" + message.deliveryId,
    });
    return updated;
  });
}

export async function deleteCourseDiscussionMessage(
  context: RequestContext,
  messageIdInput: string,
  deliveryIdInput?: string,
  rawExpected?: unknown,
) {
  const concurrency=rawExpected===undefined?null:facultyDiscussionModerationSchema.parse(rawExpected);
  const requestedDeliveryId = deliveryIdInput === undefined
    ? null
    : deliveryIdSchema.parse(deliveryIdInput);
  const message = await loadDiscussionMessage(messageIdInput);
  if (requestedDeliveryId !== null && message.deliveryId !== requestedDeliveryId) {
    throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
  }
  const { mode } = await discussionAccess(
    context,
    message.deliveryId,
  );

  if (mode === "LEARNER") await requireOwnCourseLearnerRead(context);
  // The legacy author can delete their own post even while it is pinned;
  // the tombstone also releases the pinned slot atomically.
  const canDelete =
    mode !== "LEARNER" ||
    context.membership?.id === message.senderMembershipId;

  if (!canDelete) {
    throw new CoursesServiceError(
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    );
  }

  if(concurrency&&!facultyDiscussionTokenMatches(message.updatedAt,concurrency.expectedUpdatedAt))
    throw new CoursesServiceError("DISCUSSION_STALE_VERSION");
  return getDb().transaction(async (tx) => {
    if(mode==="LEARNER")await assertLiveLearnerDiscussionWriter(tx,context);
    if (mode === "FACULTY") await assertLiveFacultyDiscussionModerator(tx,context,message.deliveryId);
    // Retain the stable ID and moderation evidence for delta subscribers.
    // Normal history hides deleted rows; delta reads return only the redacted
    // tombstone, never the retained body, sender identity or attribution.
    const [deleted] = await tx.update(courseDiscussionMessages).set({
      deletedAt: sql`greatest(now(), ${courseDiscussionMessages.createdAt})`,
      pinned: false,
      pinnedByUserId: null,
      updatedAt: sql`greatest(now(), ${courseDiscussionMessages.createdAt},
        ${courseDiscussionMessages.updatedAt} + interval '1 millisecond')`,
    }).where(and(
      eq(courseDiscussionMessages.id, message.id),
      eq(courseDiscussionMessages.deliveryId, message.deliveryId),
      isNull(courseDiscussionMessages.deletedAt),
      mode === "LEARNER"
        ? eq(courseDiscussionMessages.senderMembershipId, context.membership!.id)
        : undefined,
      concurrency?sql`date_trunc('milliseconds', ${courseDiscussionMessages.updatedAt}) =
        ${new Date(concurrency.expectedUpdatedAt).toISOString()}::timestamptz`:undefined,
    )).returning({ id: courseDiscussionMessages.id });
    if (!deleted) throw new CoursesServiceError("DISCUSSION_STALE_VERSION");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_DELETED,
      collegeId: context.membership!.collegeId,
      organizationId: context.membership!.organizationId,
      subjectType: "course_discussion_message",
      subjectId: deleted.id,
      summary: "Course discussion message deleted",
      metadata: { deliveryId: message.deliveryId },
      groupKey: "course-discussion:" + message.deliveryId,
    });
    return deleted;
  });
}
