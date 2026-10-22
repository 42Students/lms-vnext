import "server-only";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {
  cohortProgressionState, cohorts, courseOfferings, courseSectionDeliveries,
  courseTeachingAssignments, departments, programTermCourses, programTerms, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

/** Courses mapped only to the term being left have their teaching assignments
 * ended at promotion; courses shared with the target term keep them. */
export function splitPromotionTeachingCourses(
  previousCourseIds: readonly string[], targetCourseIds: readonly string[],
) {
  const target = new Set(targetCourseIds);
  const previous = [...new Set(previousCourseIds)];
  return {
    endingCourseIds: previous.filter(id => !target.has(id)),
    retainedCourseIds: previous.filter(id => target.has(id)),
  };
}

/** Read-only forecast of the active teaching assignments that promotion will
 * end and keep (legacy previewed assignmentsToDeactivateCount). Uses the same
 * selection rules as the execute step, without writing anything. */
export async function getPromotionTeachingForecast(
  context: RequestContext, programId: string, cohortId: string, targetTermNumber: number,
) {
  const member = await resolveActingCollege(context, "academics.read");
  return getDb().transaction(async db => {
    await assertPersistedPlatformPermission(db, context, "academics.read", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    });
    const [cohort] = await db.select({
      id: cohorts.id, currentTermNumber: cohortProgressionState.currentTermNumber,
    }).from(cohorts).innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .innerJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
      .where(and(eq(departments.collegeId, member.collegeId),
        eq(programs.id, programId), eq(cohorts.id, cohortId))).limit(1);
    if (!cohort) return { ending: 0, retained: 0 };
    const termCourses = (termNumber: number) => db.select({ courseId: programTermCourses.courseId })
      .from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .where(and(eq(programTerms.programId, programId), eq(programTerms.termNumber, termNumber)));
    const [previousCourses, targetCourses] = await Promise.all([
      termCourses(cohort.currentTermNumber), termCourses(targetTermNumber),
    ]);
    const split = splitPromotionTeachingCourses(
      previousCourses.map(row => row.courseId), targetCourses.map(row => row.courseId));
    const activeAssignments = async (courseIds: readonly string[]) => {
      if (!courseIds.length) return 0;
      const [row] = await db.select({ total: count() }).from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,
          eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(eq(courseOfferings.cohortId, cohortId),
          inArray(courseOfferings.courseId, [...courseIds]),
          eq(courseOfferings.status, "ACTIVE"),
          isNull(courseSectionDeliveries.endedAt),
          isNull(courseTeachingAssignments.endedAt)));
      return row?.total ?? 0;
    };
    const [ending, retained] = await Promise.all([
      activeAssignments(split.endingCourseIds), activeAssignments(split.retainedCourseIds),
    ]);
    return { ending, retained };
  });
}
