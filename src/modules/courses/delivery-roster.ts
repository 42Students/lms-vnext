import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  electiveOfferings,
  electiveSlots,
  learnerProfiles,
  learnerProgramEnrollments,
  lmsGroupMembers,
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
    .select({ groupId: electiveOfferings.groupId })
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
        eq(electiveOfferings.status, "ACTIVE"),
        isNull(electiveOfferings.deletedAt),
        eq(electiveSlots.collegeId, scope.collegeId),
        eq(electiveSlots.status, "ACTIVE"),
        isNull(electiveSlots.deletedAt),
        eq(lmsGroups.collegeId, scope.collegeId),
        eq(lmsGroups.kind, "ELECTIVE"),
        eq(lmsGroups.status, "ACTIVE"),
        isNull(lmsGroups.deletedAt),
      ),
    )
    .limit(1);

  const projection = {
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
    email: users.email,
    phoneE164: users.phoneE164,
    rollNumber: learnerProfiles.rollNumber,
  };

  if (elective) {
    return db
      .select(projection)
      .from(lmsGroupMembers)
      .innerJoin(
        collegeMemberships,
        eq(collegeMemberships.id, lmsGroupMembers.membershipId),
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
          eq(lmsGroupMembers.groupId, elective.groupId),
          eq(lmsGroupMembers.memberType, "LEARNER"),
          eq(lmsGroupMembers.state, "ACTIVE"),
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
