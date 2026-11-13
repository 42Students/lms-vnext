import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

import { ROLE } from "@/modules/identity/roles";
/**
 * Learner notifications are not a substitute for the Faculty, Mentor or
 * College Administrator inbox. Authorize the active Learner membership
 * before fetching either the personal feed or audience-scoped announcements.
 */
export function requireLearnerNotificationsAccess(context: RequestContext) {
  const membership = context.membership;
  if (
    !hasActiveMembership(context) ||
    !hasMembershipRole(context, ROLE.LEARNER) ||
    !membership
  ) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership;
}
