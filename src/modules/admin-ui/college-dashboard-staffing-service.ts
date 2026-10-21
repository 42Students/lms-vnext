import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, courseOfferings, courseSectionDeliveries,
  courses, courseTeachingAssignments, departments, sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** Current-semester, active section deliveries without an active teaching
 * assignment. Course count is distinct from unstaffed section count. */
export async function getCollegeDashboardUnstaffedCourses(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE")
    throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "courses.read", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const rows = await getDb().select({
    deliveryId: courseSectionDeliveries.id,
    offeringId: courseOfferings.id,
    courseId: courses.id,
    courseName: courses.name,
    code: courses.code,
    sectionName: sections.name,
    periodName: academicPeriods.name,
  }).from(courseSectionDeliveries)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
    .innerJoin(academicPeriods, eq(academicPeriods.id, courseOfferings.academicPeriodId))
    .leftJoin(courseTeachingAssignments, and(
      eq(courseTeachingAssignments.deliveryId, courseSectionDeliveries.id),
      isNull(courseTeachingAssignments.endedAt)))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(academicPeriods.collegeId, member.collegeId),
      eq(academicPeriods.status, "ACTIVE"), eq(courseOfferings.status, "ACTIVE"),
      eq(courses.status, "ACTIVE"), eq(sections.status, "ACTIVE"),
      isNull(courseSectionDeliveries.endedAt),
      isNull(courseTeachingAssignments.id)))
    .orderBy(sections.name, courses.name).limit(8);
  const byCourse = new Map<string, {
    courseId: string; name: string; code: string; offeringId: string;
    sections: string[];
  }>();
  for (const row of rows) {
    const existing = byCourse.get(row.courseId);
    if (existing) existing.sections.push(row.sectionName+" · "+row.periodName);
    else byCourse.set(row.courseId, {
      courseId: row.courseId, name: row.courseName, code: row.code,
      offeringId: row.offeringId, sections: [row.sectionName+" · "+row.periodName],
    });
  }
  return [...byCourse.values()];
}

/** Full number of unstaffed section-course deliveries, independent of the
 * eight-row dashboard preview and its grouping by course. */
export async function getCollegeDashboardUnstaffedDeliveriesCount(context: RequestContext) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE")
    throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "courses.read", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const [row] = await getDb().select({ total: count() })
    .from(courseSectionDeliveries)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
    .innerJoin(academicPeriods, eq(academicPeriods.id, courseOfferings.academicPeriodId))
    .leftJoin(courseTeachingAssignments, and(
      eq(courseTeachingAssignments.deliveryId, courseSectionDeliveries.id),
      isNull(courseTeachingAssignments.endedAt)))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(academicPeriods.collegeId, member.collegeId),
      eq(academicPeriods.status, "ACTIVE"), eq(courseOfferings.status, "ACTIVE"),
      eq(courses.status, "ACTIVE"), eq(sections.status, "ACTIVE"),
      isNull(courseSectionDeliveries.endedAt),
      isNull(courseTeachingAssignments.id)));
  return row?.total ?? 0;
}
