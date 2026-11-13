import {
  hasActiveRecruiter,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "./context";
import {canOpenTpoWorkspace} from "@/modules/placements/tpo-workspace-access-model";
import {canAccessFacultyRoute} from "@/modules/courses/faculty-route-access-model";

import { ROLE } from "@/modules/identity/roles";
/**
 * #61/#101: canonical SERVER-side role portal boundary for both standard and
 * legacy alias page families. Not an API authorization shortcut: concrete
 * services must still validate active membership, tenant and resource scope.
 *
 * All route families below also have a parent Next.js layout (including
 * /college-admin and /superadmin aliases), so a nested or dynamic page cannot
 * bypass these role checks merely because its own page omits a guard.
 */
/** Staff audit pages are shared by platform and college administrators.
 * Both /activity and /activity/[eventId] use this same server-side decision.
 */
export function canAccessStaffActivity(context:RequestContext|null|undefined):boolean {
  return isSuperAdmin(context)||hasMembershipRole(context,ROLE.COLLEGE_ADMIN);
}

export const ROLE_PORTAL_FAMILIES = [
  "admin", "superadmin", "college", "college-admin",
  "tpo", "teacher", "teach", "mentor", "learn", "hr", "recruiter",
] as const;
export type RolePortalFamily = (typeof ROLE_PORTAL_FAMILIES)[number];

export function canAccessRolePortal(
  context: RequestContext | null | undefined,
  portal: RolePortalFamily,
): boolean {
  switch (portal) {
    case "admin":
    case "superadmin":
      return isSuperAdmin(context);
    case "college":
    case "college-admin":
      return hasMembershipRole(context, ROLE.COLLEGE_ADMIN);
    case "tpo":
      // The College Admin has a deliberately narrow Placement-cell shortcut.
      // Concrete TPO-only services must separately require the TPO role.
      return canOpenTpoWorkspace(context);
    case "teacher":
    case "teach":
      return canAccessFacultyRoute(context);
    case "mentor":
      return hasMembershipRole(context, ROLE.MENTOR);
    case "learn":
      return hasMembershipRole(context, ROLE.LEARNER);
    case "hr":
    case "recruiter":
      return hasActiveRecruiter(context);
  }
}
