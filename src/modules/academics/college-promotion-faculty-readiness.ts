import "server-only";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  cohorts, courseOfferings, courseSectionDeliveries, courseTeachingAssignments,
  departments, programTermCourses, programTerms, programs,
  collegeMemberships, membershipRoles, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

/** Unstaffed or unmapped courses fail closed. Duplicated teaching assignments
 * cannot inflate the number of unique courses ready for promotion. */
export function summarizePromotionFacultyReadiness(
  courseIds: readonly string[], staffedCourseIds: readonly string[],
) {
  const staffed = new Set(staffedCourseIds);
  const missingCourses = courseIds.filter(id => !staffed.has(id)).length;
  return {incomplete: courseIds.length === 0 || missingCourses > 0,
    missingCourses,totalCourses:courseIds.length};
}

/** Read-only advisory for the target term; the promotion service rechecks
 * saved progression and reports this advisory in the audit result. */
export async function getPromotionFacultyReadiness(
  context: RequestContext, programId: string, cohortId: string, termNumber: number,
) {
  const member = await resolveActingCollege(context, "academics.read");
  // A captured College Admin/Super Admin session can survive a role revocation.
  // Hold persisted actor locks while reading the cohort, target mapping and
  // faculty assignment facts; none can be disclosed after the guard rejects.
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"academics.read",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    });
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
    // A terminated/suspended faculty membership, disabled account, or removed
    // FACULTY role does not make a new term ready to teach. Only current
    // eligible people may count as staffed; otherwise promotion readiness
    // incorrectly reports green after offboarding.
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, courseTeachingAssignments.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "FACULTY")))
    .where(and(eq(courseOfferings.cohortId, cohortId),
      eq(collegeMemberships.collegeId,member.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
      inArray(courseOfferings.courseId, courses.map(item => item.courseId)),
      eq(courseOfferings.status, "ACTIVE"),
      isNull(courseTeachingAssignments.endedAt),
      isNull(courseSectionDeliveries.endedAt)))
    .groupBy(courseOfferings.courseId);
  return summarizePromotionFacultyReadiness(
    courses.map(row => row.courseId), active.map(item => item.courseId),
  );
  });
}
