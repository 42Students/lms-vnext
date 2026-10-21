import "server-only";

import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, lessonContents, membershipRoles, users,
} from "@/db/schema";
import { lessonContentDiscussionsStaged } from "@/db/schema/db05-lesson-discussions.staged";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { requireLearningReadAccess } from "./learning-access";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import { loadCourseSectionDeliveryScope, loadLessonContentScope } from "./scope";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

const identity = z.string().uuid();
const pageInput = z.strictObject({
  deliveryId: identity,
  afterSequence: z.coerce.number().int().min(-1).default(-1),
  afterId: identity.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const writeInput = z.strictObject({
  deliveryId: identity,
  contentText: z.string().trim().min(1, "Enter a comment.").max(5000,
    "Comment must be 5,000 characters or fewer."),
  parentDiscussionId: identity.nullable().optional(),
});

/** Feature gate remains false until DB05 SQL/journal and security tests pass. */
export function lessonContentDiscussionsEnabled(): boolean {
  return process.env.DB05_LESSON_DISCUSSIONS_READY === "DB05_VERIFIED";
}

async function requireContentDiscussionScope(
  context: RequestContext, rawContentId: unknown, rawDeliveryId: unknown,
  includeHistorical: boolean,
) {
  if (!lessonContentDiscussionsEnabled())
    throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
  const contentId = identity.parse(rawContentId);
  const deliveryId = identity.parse(rawDeliveryId);
  const scope = await loadLessonContentScope(contentId, includeHistorical);
  const delivery = await loadCourseSectionDeliveryScope(deliveryId, includeHistorical);
  if (scope.offeringId !== delivery.offeringId ||
      (scope.deliveryId !== null && scope.deliveryId !== deliveryId))
    throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
  const mode = await requireLearningReadAccess(context, scope.offeringId,
    deliveryId, { includeHistorical });
  if (mode === "LEARNER") {
    await requireOwnCourseLearnerRead(context);
    if (!scope.lessonVisibleToStudents || scope.status !== "PUBLISHED")
      throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
  }
  return { contentId, deliveryId, scope, mode };
}

/** Per-lesson feed is NOT the broader section-delivery chat stream. */
export async function listLessonContentDiscussions(
  context: RequestContext, rawContentId: unknown, rawQuery: unknown,
) {
  const page = pageInput.parse(rawQuery);
  const { contentId, mode } = await requireContentDiscussionScope(
    context, rawContentId, page.deliveryId, true);
  const cursor = page.afterId ? sql`(${lessonContentDiscussionsStaged.sequence}, ${lessonContentDiscussionsStaged.id}) > (${page.afterSequence}, ${page.afterId}::uuid)` :
    gt(lessonContentDiscussionsStaged.sequence, page.afterSequence);
  const rows = await getDb().select({
    id: lessonContentDiscussionsStaged.id,
    contentText: lessonContentDiscussionsStaged.contentText,
    parentDiscussionId: lessonContentDiscussionsStaged.parentDiscussionId,
    sequence: lessonContentDiscussionsStaged.sequence,
    createdAt: lessonContentDiscussionsStaged.createdAt,
    authorMembershipId: lessonContentDiscussionsStaged.authorMembershipId,
    authorName: lessonContentDiscussionsStaged.authorProfileNameSnapshot,
  }).from(lessonContentDiscussionsStaged)
    .where(and(
      eq(lessonContentDiscussionsStaged.lessonContentId, contentId),
      isNull(lessonContentDiscussionsStaged.deletedAt),
      cursor,
    ))
    .orderBy(asc(lessonContentDiscussionsStaged.sequence),
      asc(lessonContentDiscussionsStaged.id))
    .limit(page.limit + 1);
  const hasMore = rows.length > page.limit;
  const messages = hasMore ? rows.slice(0, page.limit) : rows;
  return {
    accessMode: mode,
    messages: messages.map(row => ({
      id: row.id, contentText: row.contentText,
      parentDiscussionId: row.parentDiscussionId, sequence: row.sequence,
      createdAt: row.createdAt,
      authorName: row.authorName,
      isMine: row.authorMembershipId === context.membership?.id,
    })),
    nextCursor: hasMore && messages.length > 0 ? {
      afterSequence: messages[messages.length-1]!.sequence,
      afterId: messages[messages.length-1]!.id,
    } : null,
  };
}

export async function createLessonContentDiscussion(
  context: RequestContext, rawContentId: unknown, rawInput: unknown,
) {
  const input = writeInput.parse(rawInput);
  const { contentId, deliveryId, scope, mode } = await requireContentDiscussionScope(
    context, rawContentId, input.deliveryId, false);
  const member = context.membership;
  if (!member || member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE")
    throw new CoursesServiceError("LEARNING_ACCESS_DENIED");

  return getDb().transaction(async tx => {
    // Serialize the sequence against the lesson content, not the entire course.
    const [lockedContent] = await tx.select({id:lessonContents.id})
      .from(lessonContents)
      .where(eq(lessonContents.id,contentId)).for("update").limit(1);
    if (!lockedContent) throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
    const [actor] = await tx.select({id:collegeMemberships.id})
      .from(collegeMemberships)
      .innerJoin(users,and(
        eq(users.id,collegeMemberships.userId),
        eq(users.platformStatus,"ACTIVE"),
      ))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,mode === "LEARNER" ? "LEARNER" :
          mode === "FACULTY" ? "FACULTY" : "COLLEGE_ADMIN"),
      ))
      .where(and(
        eq(collegeMemberships.id,member.id),
        eq(collegeMemberships.userId,context.user.id),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
      )).for("share").limit(1);
    if (!actor) throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
    const parentId = input.parentDiscussionId ?? null;
    if (parentId) {
      const [parent] = await tx.select({id:lessonContentDiscussionsStaged.id})
        .from(lessonContentDiscussionsStaged).where(and(
          eq(lessonContentDiscussionsStaged.id,parentId),
          eq(lessonContentDiscussionsStaged.lessonContentId,contentId),
          isNull(lessonContentDiscussionsStaged.deletedAt),
        )).for("share").limit(1);
      if (!parent) throw new CoursesServiceError("DISCUSSION_MESSAGE_NOT_FOUND");
    }
    const [last] = await tx.select({
      maxSequence:sql<number>`coalesce(max(${lessonContentDiscussionsStaged.sequence}), 0)`,
    }).from(lessonContentDiscussionsStaged)
      .where(eq(lessonContentDiscussionsStaged.lessonContentId,contentId));
    const nextSequence = Number(last?.maxSequence ?? 0) + 1;
    if (!Number.isSafeInteger(nextSequence) || nextSequence > 2147483647)
      throw new CoursesServiceError("CONTENT_ORDER_CONFLICT");
    const [created] = await tx.insert(lessonContentDiscussionsStaged).values({
      collegeId:scope.collegeId,
      lessonContentId:contentId,
      authorMembershipId:member.id,
      contentText:input.contentText,
      sequence:nextSequence,
      parentDiscussionId:parentId,
    }).returning();
    if (!created) throw new CoursesServiceError("CONTENT_ORDER_CONFLICT");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_DISCUSSION_POSTED,
      collegeId:scope.collegeId,
      organizationId:scope.organizationId,
      subjectType:"lesson_content_discussion",
      subjectId:created.id,
      summary:"Lesson discussion comment posted",
      metadata:{contentId,deliveryId,parentDiscussionId:parentId},
      groupKey:"lesson-content-discussion:"+contentId,
      dedupeKey:"lesson-content-discussion:"+created.id+":post",
    });
    return {id:created.id,sequence:created.sequence,createdAt:created.createdAt};
  });
}
