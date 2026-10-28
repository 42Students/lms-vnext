import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, courseOfferings, courseSectionDeliveries, courses,
  departments, electiveOfferings, electiveSlots, lmsGroupMembers,
  lmsGroups, membershipRoles, sections, users,
} from "@/db/schema";

/**
 * A backed delivery's roster is EXCLUSIVELY the ACTIVE elective group.
 * Never infer access from the host section or mutate the learner's home section.
 *
 * We keep both the course listing and the exact-delivery authorization on this
 * shared predicate so the navigation and API cannot disagree about eligibility.
 */
function activeRosterQuery(membershipId: string, collegeId: string, deliveryId?: string) {
  const conditions = [
    eq(lmsGroupMembers.membershipId, membershipId),
    eq(lmsGroupMembers.state, "ACTIVE"),
    eq(lmsGroupMembers.memberType, "LEARNER"),
    eq(collegeMemberships.id, membershipId),
    eq(collegeMemberships.collegeId, collegeId),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    eq(membershipRoles.role, "LEARNER"),
    eq(lmsGroups.kind, "ELECTIVE"),
    eq(lmsGroups.ownerScope, "COLLEGE"),
    eq(lmsGroups.collegeId, collegeId),
    eq(lmsGroups.status, "ACTIVE"),
    isNull(lmsGroups.deletedAt),
    eq(electiveSlots.collegeId, collegeId),
    eq(electiveSlots.status, "ACTIVE"),
    isNull(electiveSlots.deletedAt),
    eq(electiveOfferings.status, "ACTIVE"),
    isNull(electiveOfferings.deletedAt),
    eq(courseOfferings.courseId, electiveOfferings.courseId),
    eq(courseOfferings.status, "ACTIVE"),
    eq(cohorts.programId, electiveSlots.programId),
    eq(courses.status, "ACTIVE"),
    eq(courses.enabled, true),
    isNull(courses.deletedAt),
    eq(departments.collegeId, collegeId),
    isNull(courseSectionDeliveries.endedAt),
    eq(sections.status, "ACTIVE"),
    eq(sections.cohortId, courseOfferings.cohortId),
    eq(sections.academicPeriodId, courseOfferings.academicPeriodId),
    // Runtime legacy eligibility is program-scoped: an ACTIVE group membership
    // is not sufficient after a learner moves to another program.
    sql<boolean>`exists (
      select 1 from learner_program_enrollments lpe
      join section_enrollments se on se.learner_enrollment_id = lpe.id
      join sections home on home.id = se.section_id
      join programs p on p.id = lpe.program_id
      join departments pd on pd.id = p.department_id
      where lpe.membership_id = ${membershipId}
        and lpe.status = 'ACTIVE' and se.status = 'ACTIVE'
        and home.status = 'ACTIVE' and home.cohort_id = lpe.cohort_id
        and home.academic_period_id = se.academic_period_id
        and (${electiveSlots.academicPeriodId} is null
             or se.academic_period_id = ${electiveSlots.academicPeriodId})
        and pd.college_id = ${collegeId}
        and lpe.program_id = ${electiveSlots.programId}
    )`,
  ];
  if (deliveryId) conditions.push(eq(electiveOfferings.backedDeliveryId, deliveryId));
  return getDb()
    .select({ deliveryId: electiveOfferings.backedDeliveryId })
    .from(electiveOfferings)
    .innerJoin(electiveSlots, eq(electiveSlots.id, electiveOfferings.slotId))
    .innerJoin(lmsGroups, eq(lmsGroups.id, electiveOfferings.groupId))
    .innerJoin(lmsGroupMembers, eq(lmsGroupMembers.groupId, lmsGroups.id))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, lmsGroupMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
    .innerJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, electiveOfferings.backedDeliveryId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(and(...conditions));
}

/** Used by learner navigation; returns only actual ACTIVE roster deliveries. */
export async function listActiveElectiveDeliveryIds(membershipId: string, collegeId: string) {
  const rows = await activeRosterQuery(membershipId, collegeId);
  return [...new Set(rows.flatMap(row => row.deliveryId ? [row.deliveryId] : []))];
}

/** Used by content/quiz/assessment APIs; one verified delivery and learner. */
export async function hasActiveElectiveDeliveryAccess(
  membershipId: string, collegeId: string, deliveryId: string,
) {
  const [row] = await activeRosterQuery(membershipId, collegeId, deliveryId).limit(1);
  return Boolean(row);
}

/**
 * Any linked elective delivery is group-owned, even if it is archived.
 * In that case access is denied (not silently granted through the host section).
 */
export async function isElectiveBackedDelivery(deliveryId: string) {
  const [row] = await getDb()
    .select({ id: electiveOfferings.id })
    .from(electiveOfferings)
    .where(eq(electiveOfferings.backedDeliveryId, deliveryId))
    .limit(1);
  return Boolean(row);
}

export async function listBoundElectiveDeliveryIds(deliveryIds: string[]) {
  if (deliveryIds.length === 0) return [];
  const rows = await getDb()
    .select({ deliveryId: electiveOfferings.backedDeliveryId })
    .from(electiveOfferings)
    .where(inArray(electiveOfferings.backedDeliveryId, deliveryIds));
  return rows.flatMap(row => row.deliveryId ? [row.deliveryId] : []);
}
