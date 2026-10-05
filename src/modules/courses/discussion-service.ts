import "server-only";

import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
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
) {
  const { deliveryId, mode } =
    await discussionAccess(
      context,
      deliveryIdInput,
      true,
    );

  let canPost = true;
  try {
    await discussionAccess(
      context,
      deliveryIdInput,
      false,
    );
  } catch {
    canPost = false;
  }

  const rows = await getDb()
    .select({
      id: courseDiscussionMessages.id,
      deliveryId:
        courseDiscussionMessages.deliveryId,
      senderMembershipId:
        courseDiscussionMessages.senderMembershipId,
      senderRole:
        courseDiscussionMessages.senderRole,
      senderName: users.displayName,
      messageText:
        courseDiscussionMessages.messageText,
      pinned:
        courseDiscussionMessages.pinned,
      createdAt:
        courseDiscussionMessages.createdAt,
      updatedAt:
        courseDiscussionMessages.updatedAt,
    })
    .from(courseDiscussionMessages)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        courseDiscussionMessages.senderMembershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      eq(
        courseDiscussionMessages.deliveryId,
        deliveryId,
      ),
    )
    .orderBy(
      asc(courseDiscussionMessages.createdAt),
      asc(courseDiscussionMessages.id),
    );

  return {
    accessMode: mode,
    canPost,
    messages: rows.map((row) => ({
      ...row,
      isMine:
        context.membership?.id ===
        row.senderMembershipId,
    })),
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

  const [created] = await getDb()
    .insert(courseDiscussionMessages)
    .values({
      deliveryId,
      senderMembershipId:
        membership.id,
      senderRole,
      messageText: input.messageText,
    })
    .returning();

  return created!;
}

export async function toggleCourseDiscussionPin(
  context: RequestContext,
  messageIdInput: string,
) {
  const message =
    await loadDiscussionMessage(
      messageIdInput,
    );
  const { mode } = await discussionAccess(
    context,
    message.deliveryId,
  );

  if (mode === "LEARNER") {
    throw new CoursesServiceError(
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    );
  }

  const nextPinned = !message.pinned;
  const [updated] = await getDb()
    .update(courseDiscussionMessages)
    .set({
      pinned: nextPinned,
      pinnedByUserId: nextPinned
        ? context.user.id
        : null,
      updatedAt: new Date(),
    })
    .where(
      eq(
        courseDiscussionMessages.id,
        message.id,
      ),
    )
    .returning();

  return updated!;
}

export async function deleteCourseDiscussionMessage(
  context: RequestContext,
  messageIdInput: string,
) {
  const message =
    await loadDiscussionMessage(
      messageIdInput,
    );
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

  await getDb()
    .delete(courseDiscussionMessages)
    .where(
      eq(
        courseDiscussionMessages.id,
        message.id,
      ),
    );

  return { id: message.id };
}
