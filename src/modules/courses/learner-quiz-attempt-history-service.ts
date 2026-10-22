import "server-only";

import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseLearningPaths, courseLessons, courseQuizzes, courseSectionDeliveries,
  quizAttempts,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import { listLearnerCourseDeliveries } from "./learner-course-service";
import { learnerQuizResultsReleased } from "./learner-quiz-result-release-policy";

/** Legacy all-quiz my-submissions, using canonical UUIDs and currently or
 * historically roster-authorized course deliveries, never supplied learner IDs.
 * Only summary fields are returned; unreleased grades stay hidden. */
export async function listOwnQuizAttemptHistory(
  context: RequestContext, { page, size }: { page: number; size: number },
) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 ||
      !Number.isSafeInteger(size) || size < 1 || size > 100) {
    throw new RangeError("Invalid quiz attempt history page");
  }
  const membership = await requireOwnCourseLearnerRead(context);
  const deliveries = await listLearnerCourseDeliveries(context, { includeHistorical: true });
  const deliveryIds = [...new Set(deliveries.map(row => row.deliveryId))];
  if (!deliveryIds.length) return { attempts: [], page, pageSize: size, hasMore: false };
  const rows = await getDb().select({
    id: quizAttempts.id,
    quizId: quizAttempts.quizId,
    deliveryId: quizAttempts.deliveryId,
    title: courseQuizzes.title,
    attemptNumber: quizAttempts.attemptNumber,
    submittedAt: quizAttempts.submittedAt,
    score: quizAttempts.score,
    maxScore: quizAttempts.maxScore,
    quizStatus: courseQuizzes.status,
    resultsPublished: courseQuizzes.resultsPublished,
    dueAt: courseQuizzes.dueAt,
  }).from(quizAttempts)
    .innerJoin(courseQuizzes, eq(courseQuizzes.id, quizAttempts.quizId))
    .innerJoin(courseLessons, eq(courseLessons.id, courseQuizzes.lessonId))
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(courseSectionDeliveries, and(
      eq(courseSectionDeliveries.id, quizAttempts.deliveryId),
      eq(courseSectionDeliveries.offeringId, courseLearningPaths.offeringId),
    ))
    .where(and(
      eq(quizAttempts.membershipId, membership.id),
      inArray(quizAttempts.deliveryId, deliveryIds),
      or(isNull(courseQuizzes.deliveryId),
        eq(courseQuizzes.deliveryId, quizAttempts.deliveryId)),
      isNull(quizAttempts.deletedAt),
      or(eq(quizAttempts.legacyDeleted, false), isNull(quizAttempts.legacyDeleted)),
    ))
    .orderBy(desc(quizAttempts.submittedAt), desc(quizAttempts.id))
    .limit(size + 1).offset((page - 1) * size);
  const nowMs = Date.now();
  return {
    attempts: rows.slice(0, size).map(row => {
      const released = learnerQuizResultsReleased({
        status: row.quizStatus, resultsPublished: row.resultsPublished, dueAt: row.dueAt,
      }, nowMs);
      return {
        id: row.id, quizId: row.quizId, deliveryId: row.deliveryId,
        title: row.title, attemptNumber: row.attemptNumber,
        submittedAt: row.submittedAt,
        resultsVisible: released,
        score: released ? row.score : null,
        maxScore: released ? row.maxScore : null,
      };
    }),
    page, pageSize: size, hasMore: rows.length > size,
  };
}
