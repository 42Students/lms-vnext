import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { listActiveElectiveLearnersForDelivery } from "@/modules/groups/roster-access";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  electiveOfferings,
  electiveSlots,
  learnerProfiles,
  learnerProgramEnrollments,
  lmsGroups,
  membershipRoles,
  sectionEnrollments,
  sections,
  users,
} from "@/db/schema";

export type DeliveryRosterScope = {
  deliveryId: string;
  sectionId: string;
  academicPeriodId: string;
  collegeId: string;
};

/**
 * Exact Course Delivery roster. Caller must authorize the tenant/delivery.
 * Elective-backed deliveries use their active ELECTIVE group exclusively;
 * ordinary deliveries use the active Section roster.
 */
export async function listActiveDeliveryLearners(
  scope: DeliveryRosterScope,
) {
  const db = getDb();
  const [elective] = await db
    .select({
      groupId: electiveOfferings.groupId,
      offeringStatus: electiveOfferings.status,
      offeringDeletedAt: electiveOfferings.deletedAt,
      slotStatus: electiveSlots.status,
      slotDeletedAt: electiveSlots.deletedAt,
      groupStatus: lmsGroups.status,
      groupDeletedAt: lmsGroups.deletedAt,
    })
    .from(electiveOfferings)
    .innerJoin(
      courseSectionDeliveries,
      eq(courseSectionDeliveries.id, electiveOfferings.backedDeliveryId),
    )
    .innerJoin(
      courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId),
    )
    .innerJoin(
      electiveSlots,
      eq(electiveSlots.id, electiveOfferings.slotId),
    )
    .innerJoin(
      lmsGroups,
      eq(lmsGroups.id, electiveOfferings.groupId),
    )
    .where(
      and(
        eq(electiveOfferings.backedDeliveryId, scope.deliveryId),
        eq(courseSectionDeliveries.sectionId, scope.sectionId),
        isNull(courseSectionDeliveries.endedAt),
        eq(courseOfferings.academicPeriodId, scope.academicPeriodId),
        eq(electiveSlots.collegeId, scope.collegeId),
        eq(lmsGroups.collegeId, scope.collegeId),
        eq(lmsGroups.kind, "ELECTIVE"),
      ),
    )
    .limit(1);

  // A backed elective can become invalid because its slot/group is detached
  // or moved to another college. The fully scoped join above then returns no
  // row. Do not treat that as an ordinary Section delivery and reveal the
  // entire Section roster: an existing elective link fails closed.
  if (!elective) {
    const [backedElective] = await db
      .select({ id: electiveOfferings.id })
      .from(electiveOfferings)
      .where(eq(electiveOfferings.backedDeliveryId, scope.deliveryId))
      .limit(1);
    if (backedElective) return [];
  }

  const projection = {
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
    email: users.email,
    phoneE164: users.phoneE164,
    rollNumber: learnerProfiles.rollNumber,
  };

  if (elective) {
    // A disabled or deleted elective is not an ordinary Section delivery.
    // Never fall back to its entire Section roster merely because the
    // elective audience is closed.
    if (
      elective.offeringStatus !== "ACTIVE" || elective.offeringDeletedAt !== null ||
      elective.slotStatus !== "ACTIVE" || elective.slotDeletedAt !== null ||
      elective.groupStatus !== "ACTIVE" || elective.groupDeletedAt !== null
    ) return [];
    return listActiveElectiveLearnersForDelivery(scope.collegeId, scope.deliveryId);
  }

  return db
    .select(projection)
    .from(sectionEnrollments)
    .innerJoin(
      courseSectionDeliveries,
      eq(courseSectionDeliveries.sectionId, sectionEnrollments.sectionId),
    )
    .innerJoin(
      courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId),
    )
    .innerJoin(
      sections,
      eq(sections.id, sectionEnrollments.sectionId),
    )
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        learnerProgramEnrollments.membershipId,
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ),
    )
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .leftJoin(
      learnerProfiles,
      eq(learnerProfiles.membershipId, collegeMemberships.id),
    )
    .where(
      and(
        eq(sectionEnrollments.sectionId, scope.sectionId),
        eq(courseSectionDeliveries.id, scope.deliveryId),
        isNull(courseSectionDeliveries.endedAt),
        eq(courseOfferings.academicPeriodId, scope.academicPeriodId),
        eq(sections.cohortId, courseOfferings.cohortId),
        eq(sections.academicPeriodId, courseOfferings.academicPeriodId),
        eq(sections.status, "ACTIVE"),
        eq(learnerProgramEnrollments.cohortId, courseOfferings.cohortId),
        eq(
          sectionEnrollments.academicPeriodId,
          scope.academicPeriodId,
        ),
        eq(sectionEnrollments.status, "ACTIVE"),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
        eq(collegeMemberships.collegeId, scope.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(users.email),
      asc(collegeMemberships.id),
    );
}
