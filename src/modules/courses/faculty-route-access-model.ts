import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/** Faculty pages are not an alternate surface for Learner, Mentor or admin roles.
 * The central permission check also rejects disabled users and inactive membership. */
export function canAccessFacultyRoute(context: RequestContext | null | undefined): boolean {
  const membership = context?.membership;
  return Boolean(
    context && membership &&
    hasMembershipRole(context, "FACULTY") &&
    can(context, "courses.read", {
      organizationId: membership.organizationId,
      collegeId: membership.collegeId,
    }),
  );
}
