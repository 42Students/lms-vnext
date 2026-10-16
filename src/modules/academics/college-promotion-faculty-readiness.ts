import "server-only";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, courseOfferings, courseSectionDeliveries, courseTeachingAssignments,
  departments, programTermCourses, programTerms, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

/** Read-only advisory for the target term; the promotion service rechecks
 * saved progression and reports this advisory in the audit result. */
export async function getPromotionFacultyReadiness(
  context: RequestContext, programId: string, cohortId: string, termNumber: number,
) {
  const member = await resolveActingCollege(context, "academics.read");
  const db = getDb();
  const [cohort] = await db.select({ id: cohorts.id })
    .from(cohorts).innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(programs.id, programId), eq(cohorts.id, cohortId))).limit(1);
  if (!cohort) return { incomplete: true, missingCourses: 0, totalCourses: 0 };
  const courses = await db.select({ courseId: programTermCourses.courseId })
    .from(programTermCourses)
    .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
    .where(and(eq(programTerms.programId, programId), eq(programTerms.termNumber, termNumber)));
  if (!courses.length) return { incomplete: true, missingCourses: 0, totalCourses: 0 };
  const active = await db.select({
    courseId: courseOfferings.courseId, total: count(),
  }).from(courseTeachingAssignments)
    .innerJoin(courseSectionDeliveries,
      eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .where(and(eq(courseOfferings.cohortId, cohortId),
      inArray(courseOfferings.courseId, courses.map(item => item.courseId)),
      eq(courseOfferings.status, "ACTIVE"),
      isNull(courseTeachingAssignments.endedAt),
      isNull(courseSectionDeliveries.endedAt)))
    .groupBy(courseOfferings.courseId);
  const staffed = new Set(active.map(item => item.courseId));
  return {
    incomplete: courses.some(row => !staffed.has(row.courseId)),
    missingCourses: courses.filter(row => !staffed.has(row.courseId)).length,
    totalCourses: courses.length,
  };
}
