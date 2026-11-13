import {
  hasActiveMembership,
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

import { ROLE } from "@/modules/identity/roles";
/** The old notification shell used route flags for learner vs faculty.
 * vNext uses persisted college membership role: a Mentor-only actor, a
 * College Admin-only actor, and a Super Admin scoped to a college are NOT
 * automatically Faculty. A user who explicitly has an active Faculty role
 * may enter /teacher/notifications; everyone else must remain within their
 * selected role workspace, with no cross-role inbox data sharing. */
export function facultyNotificationsFallbackPath(context:RequestContext):string{
 if(hasActiveMembership(context)){
  if(hasMembershipRole(context,ROLE.LEARNER))return "/learn/notifications";
  if(hasMembershipRole(context,ROLE.MENTOR))return "/mentor/projects";
  if(hasMembershipRole(context,ROLE.TPO))return "/tpo/notifications";
  if(hasMembershipRole(context,ROLE.COLLEGE_ADMIN))return "/college";
 }
 return "/dashboard";
}

/** A Faculty inbox is not a Learner, TPO or administrator identity switch.
 * Scope both its personal feed and college announcements to an active
 * persisted Faculty membership before loading either dataset. */
export function requireFacultyNotificationsAccess(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, ROLE.FACULTY)) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership;
}
