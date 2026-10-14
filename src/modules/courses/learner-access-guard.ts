import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

/**
 * Courses read contract for own learner surfaces: trust the signed-in request
 * for routing, then verify the persisted actor, college, active status and role.
 */
export async function requireOwnCourseLearnerRead(context: RequestContext) {
  const membership=context.membership;
  if (!membership || membership.status!=="ACTIVE" ||
      context.user.platformStatus!=="ACTIVE" ||
      !membership.roles.includes("LEARNER")) {
    throw new AuthorizationError("courses.read");
  }
  const membershipId=z.string().uuid().parse(membership.id);
  requirePermission(context,"courses.read",{
    collegeId:membership.collegeId, organizationId:membership.organizationId,
  });
  const [owner]=await getDb().select({
    userId:collegeMemberships.userId, collegeId:collegeMemberships.collegeId,
    status:collegeMemberships.status, userStatus:users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    ))
    .where(eq(collegeMemberships.id,membershipId))
    .limit(1);
  if(!owner || owner.userId!==context.user.id ||
      owner.collegeId!==membership.collegeId ||
      owner.status!=="ACTIVE" || owner.userStatus!=="ACTIVE") {
    throw new AuthorizationError("courses.read");
  }
  return membership;
}