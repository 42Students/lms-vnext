import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/** Faculty pages are not an alternate surface for Learner, Mentor or admin roles.
 * The central permission check also rejects disabled users and inactive membership. */
export function canAccessFacultyRoute(context: RequestContext | null | undefined): boolean {
  const membership = context?.membership;
  return Boolean(
    context && membership &&
    (
      (hasMembershipRole(context, "FACULTY") &&
        can(context, "courses.read", {
          organizationId: membership.organizationId,
          collegeId: membership.collegeId,
        })) ||
      // A former legacy faculty ADMIN must now hold an explicit, active
      // COLLEGE_ADMIN tenant role. This grants the admin course workspace
      // entitlement, never a facultyType-based or cross-college bypass.
      (hasMembershipRole(context, "COLLEGE_ADMIN") &&
        can(context, "courses.manage", {
          organizationId: membership.organizationId,
          collegeId: membership.collegeId,
        }))
    ),
  );
}
