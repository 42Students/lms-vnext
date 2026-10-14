import "server-only";

import {
  and,
  desc,
  eq,
  lt,
  not,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  courseDiscussionMessages,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearningReadAccess } from "./learning-access";
import { loadCourseSectionDeliveryScope } from "./scope";
import { CoursesServiceError } from "./errors";

const deliveryIdSchema = z.string().uuid();
const messageIdSchema = z.string().uuid();
const createDiscussionMessageSchema = z.object({
  messageText: z.string().trim().min(1).max(4000),
}).strict();

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
    .where(
      eq(
        courseDiscussionMessages.id,
        messageId,
      ),
    )
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
  let canPost = true;
  try {
    await discussionAccess(context, deliveryIdInput, false);
  } catch {
    canPost = false;
  }
  const before = page.beforeCreatedAt && page.beforeId
    ? or(
        lt(courseDiscussionMessages.createdAt, new Date(page.beforeCreatedAt)),
        and(
          eq(courseDiscussionMessages.createdAt, new Date(page.beforeCreatedAt)),
          lt(courseDiscussionMessages.id, page.beforeId),
        ),
      )
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
      updatedAt: courseDiscussionMessages.updatedAt,
    })
    .from(courseDiscussionMessages)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, courseDiscussionMessages.senderMembershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(eq(courseDiscussionMessages.deliveryId, deliveryId), before))
    .orderBy(desc(courseDiscussionMessages.createdAt), desc(courseDiscussionMessages.id))
    .limit(page.limit + 1);
  const hasOlder = fetched.length > page.limit;
  const messages = (hasOlder ? fetched.slice(0, page.limit) : fetched).reverse();
  const oldest = messages[0];
  return {
    accessMode: mode,
    canPost,
    messages: messages.map((row) => ({
      ...row,
      isMine: context.membership?.id === row.senderMembershipId,
    })),
    nextCursor: hasOlder && oldest
      ? { beforeCreatedAt: oldest.createdAt.toISOString(), beforeId: oldest.id }
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
    createDiscussionMessageSchema.parse(
      rawInput,
    );
  const senderRole =
    mode === "LEARNER"
      ? "LEARNER"
      : mode === "FACULTY"
        ? "FACULTY"
        : "ADMIN";

  return getDb().transaction(async (tx) => {
    const [created] = await tx.insert(courseDiscussionMessages).values({
      deliveryId,
      senderMembershipId: membership.id,
      senderRole,
      messageText: input.messageText,
    }).returning();
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_POSTED,
      collegeId: membership.collegeId,
      organizationId: membership.organizationId,
      subjectType: "course_discussion_message",
      subjectId: created!.id,
      summary: "Course discussion message posted",
      metadata: { deliveryId, senderRole },
      groupKey: "course-discussion:" + deliveryId,
      dedupeKey: "course-discussion:" + created!.id + ":post",
    });
    return created!;
  });
}

export async function toggleCourseDiscussionPin(
  context: RequestContext,
  messageIdInput: string,
  deliveryIdInput?: string,
) {
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

  // Evaluate both columns against the current persisted value in one
  // UPDATE; two simultaneous moderators must toggle twice, not lose a write.
  return getDb().transaction(async (tx) => {
    const [updated] = await tx.update(courseDiscussionMessages).set({
      pinned: not(courseDiscussionMessages.pinned),
      pinnedByUserId: sql`case when ${courseDiscussionMessages.pinned}
        then null else ${context.user.id}::uuid end`,
      updatedAt: new Date(),
    }).where(and(
      eq(courseDiscussionMessages.id, message.id),
      eq(courseDiscussionMessages.deliveryId, message.deliveryId),
    )).returning();
    if (!updated) throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
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
) {
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

  const canDelete =
    mode !== "LEARNER" ||
    context.membership?.id ===
      message.senderMembershipId;

  if (!canDelete) {
    throw new CoursesServiceError(
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    );
  }

  return getDb().transaction(async (tx) => {
    const [deleted] = await tx.delete(courseDiscussionMessages).where(and(
      eq(courseDiscussionMessages.id, message.id),
      eq(courseDiscussionMessages.deliveryId, message.deliveryId),
    )).returning({ id: courseDiscussionMessages.id });
    if (!deleted) throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
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
