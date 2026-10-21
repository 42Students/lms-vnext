import "server-only";
import { and, asc, count, desc, eq, min } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissions, courseAssignments, courseOfferings, courseSectionDeliveries,
  courses, departments,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** COL-dashboard-06: aggregate submitted work still waiting for a grade by
 * college-owned course; don't count already graded or unpublished submissions. */
export async function getCollegeDashboardPendingGrades(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE")
    throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "courses.read", {
    organizationId: member.organizationId, collegeId: member.collegeId,
  });
  return getDb().select({
    courseId: courses.id,
    courseName: courses.name,
    courseCode: courses.code,
    pending: count(assignmentSubmissions.id),
    oldest: min(assignmentSubmissions.submittedAt),
  }).from(assignmentSubmissions)
    .innerJoin(courseAssignments,
      eq(courseAssignments.id, assignmentSubmissions.assignmentId))
    .innerJoin(courseSectionDeliveries,
      eq(courseSectionDeliveries.id, assignmentSubmissions.deliveryId))
    .innerJoin(courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(assignmentSubmissions.gradingStatus, "NOT_GRADED")))
    .groupBy(courses.id, courses.name, courses.code)
    .orderBy(desc(count(assignmentSubmissions.id)), asc(min(assignmentSubmissions.submittedAt)))
    .limit(8);
}

/** Independent full backlog count. The UI preview must not masquerade as a
 * complete college-wide total when there are more than eight course groups. */
export async function getCollegeDashboardPendingGradesCount(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE")
    throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "courses.read", {
    organizationId: member.organizationId, collegeId: member.collegeId,
  });
  const [row] = await getDb().select({ total: count() })
    .from(assignmentSubmissions)
    .innerJoin(courseAssignments,
      eq(courseAssignments.id, assignmentSubmissions.assignmentId))
    .innerJoin(courseSectionDeliveries,
      eq(courseSectionDeliveries.id, assignmentSubmissions.deliveryId))
    .innerJoin(courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(and(
      eq(departments.collegeId, member.collegeId),
      eq(assignmentSubmissions.gradingStatus, "NOT_GRADED"),
    ));
  return row?.total ?? 0;
}
