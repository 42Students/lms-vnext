import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

import { ROLE } from "@/modules/identity/roles";
/** Faculty-only workspace. College administrators use their dedicated
 * college course workspace; courses.manage does not grant Faculty routing. */
export function canAccessFacultyRoute(context: RequestContext | null | undefined): boolean {
 const membership=context?.membership;
 return Boolean(context && membership &&
  hasMembershipRole(context,ROLE.FACULTY) &&
  can(context,"courses.read",{
    organizationId:membership.organizationId,
    collegeId:membership.collegeId,
  }) &&
  (!context.adminScope ||
   (context.adminScope.collegeId===membership.collegeId &&
    context.adminScope.organizationId===membership.organizationId)));
}
