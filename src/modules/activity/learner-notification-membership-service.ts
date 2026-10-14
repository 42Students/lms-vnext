import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerNotificationsAccess } from "./learner-notifications-access";

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
