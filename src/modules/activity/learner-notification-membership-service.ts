import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users, sectionEnrollments, learnerProgramEnrollments, sections, cohorts, programs, departments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerNotificationsAccess } from "./learner-notifications-access";

/** No section/class enrollment is required for membership-scoped notices.
 * A learner without current classes still receives authorized college and
 * batch announcements; only class-specific feeds may be empty.
 */
export const LEARNER_NO_CURRENT_CLASS_NOTICES_HINT =
  "No current classes. College announcements and personal notifications are still available.";

/** Trust neither a stale JWT role nor a caller-chosen college. The current
 * persisted membership must belong to this signed-in active learner. */
export async function requirePersistedLearnerNotificationMembership(
  context: RequestContext,
) {
  const membership = requireLearnerNotificationsAccess(context);
  requirePermission(context, "academics.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });
  const [row] = await getDb().select({
    collegeId: collegeMemberships.collegeId,
    userId: collegeMemberships.userId,
    membershipStatus: collegeMemberships.status,
    platformStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membership.id))
    .limit(1);
  if (!row || row.userId !== context.user.id ||
      row.collegeId !== membership.collegeId ||
      row.membershipStatus !== "ACTIVE" ||
      row.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("academics.read");
  }
  return membership;
}

/** Legacy /class/:id notice targeting translates to an active persisted
 * learner section enrollment. A college-wide notice does not require one. */
export async function canOwnLearnerReceiveClassNotice(
 context:RequestContext,rawSectionId:unknown,
):Promise<boolean>{
 const sectionId=z.string().uuid().parse(rawSectionId);
 const member=await requirePersistedLearnerNotificationMembership(context);
 const [row]=await getDb().select({id:sectionEnrollments.id})
  .from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,
    eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
  .innerJoin(sections,eq(sections.id,sectionEnrollments.sectionId))
  .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(
    eq(sectionEnrollments.sectionId,sectionId),
    eq(sectionEnrollments.status,"ACTIVE"),
    isNull(sectionEnrollments.endedAt),
    eq(learnerProgramEnrollments.membershipId,member.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(sections.status,"ACTIVE"),
    eq(departments.collegeId,member.collegeId),
  )).limit(1);
 return Boolean(row);
}
/** Wrong-role readers receive a scoped permission failure and may navigate
 * to their own workspace; they must not fall back to a learner's inbox. */
export const LEARNER_NOTIFICATIONS_WRONG_ROLE_DESTINATION="/dashboard";
