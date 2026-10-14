import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

/** A Faculty inbox is not a Learner, TPO or administrator identity switch.
 * Scope both its personal feed and college announcements to an active
 * persisted Faculty membership before loading either dataset. */
export function requireFacultyNotificationsAccess(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, "FACULTY")) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership;
}
