import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users, learnerContentProgress } from "@/db/schema";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "./learner-course-service";
import { courseSectionDeliveryIdSchema } from "./validation";
import {
  buildLearnerCourseAttendanceMonths,
  buildLearnerLessonProgress,
} from "./learner-course-drilldown-model";

/**
 * A signed request context is not enough: recheck the currently active user,
 * membership and LEARNER role in persisted tables before any read. Both
 * endpoints remain limited to the exact current learner membership.
 */
async function requireCurrentLearner(context: RequestContext, permission: "courses.read" | "academics.read") {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "LEARNER") ||
      membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError(permission);
  }
  requirePermission(context, permission, {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });

  const [persisted] = await getDb().select({
    memberId: collegeMemberships.id,
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    userStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membership.id))
    .limit(1);

  if (!persisted || persisted.userId !== context.user.id ||
      persisted.collegeId !== membership.collegeId ||
      persisted.status !== "ACTIVE" || persisted.userStatus !== "ACTIVE") {
    throw new AuthorizationError(permission);
  }
  return membership;
}

export async function getOwnLearnerCourseProgressBreakdown(
  context: RequestContext,
  rawDeliveryId: string,
) {
  const deliveryId = courseSectionDeliveryIdSchema.parse(rawDeliveryId);
  await requireCurrentLearner(context, "courses.read");
  const courses = await listLearnerCourseDeliveries(context, { includeHistorical: true });
  const course = courses.find((row) => row.deliveryId === deliveryId);
  if (!course) return null;

  const workspace = await getLearnerCourseWorkspace(context, deliveryId);
  const lessons=buildLearnerLessonProgress(workspace.lessons);
  // Read attempts only for CONTENT IDs already visible in this authorized
  // delivery. The latest row is authoritative after an admin retake.
  const ids=[...new Set(lessons.flatMap(lesson=>lesson.items
    .filter(item=>item.kind==="CONTENT").map(item=>item.id)))];
  const attempts=ids.length?await getDb().select({
    contentId:learnerContentProgress.lessonContentId,
    attempt:learnerContentProgress.attempt,
  }).from(learnerContentProgress).where(and(
    eq(learnerContentProgress.membershipId,context.membership!.id),
    inArray(learnerContentProgress.lessonContentId,ids),
  )):[];
  const attemptByContent:Record<string,number>={};
  for(const row of attempts)
    attemptByContent[row.contentId]=Math.max(row.attempt,attemptByContent[row.contentId]??1);
  return {
    course: { name: course.courseName, code: course.courseCode, deliveryId },
    learningPathPublished: workspace.learningPath !== null,
    summary: workspace.summary,lessons,attemptByContent,
  };
}

export async function getOwnLearnerCourseAttendanceHistory(
  context: RequestContext,
  rawDeliveryId: string,
) {
  const deliveryId = courseSectionDeliveryIdSchema.parse(rawDeliveryId);
  await requireCurrentLearner(context, "academics.read");
  const workspace = await getLearnerAttendanceWorkspace(context, {
    includeHistorical: true,
  });
  const course = workspace.courses.find((row) => row.deliveryId === deliveryId);
  if (!course) return null;
  const summary = workspace.summaries.find((row) => row.deliveryId === deliveryId);
  const records = workspace.records.filter((row) => row.deliveryId === deliveryId);
  return {
    course,
    thresholdPercent: workspace.policy.eligibilityThresholdPercent,
    overall: summary ?? null,
    months: buildLearnerCourseAttendanceMonths(records),
  };
}
