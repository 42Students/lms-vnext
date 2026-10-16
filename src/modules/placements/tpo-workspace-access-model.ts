import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/**
 * Who may open the /tpo workspace. Legacy lets a college admin into the placement cell
 * (PORTAL_GUESTS['/tpo'] = [ADMIN, FACULTY]; sidebar row "Placement cell" -> /tpo/home), so
 * access is decided by the central `placements.manage` permission, never by a role string.
 * TPO-personal features (inbox, quick links, persisted-role services) still require the TPO role.
 */
export function canOpenTpoWorkspace(context: RequestContext | null | undefined): boolean {
  const membership = context?.membership;
  if (!context || !membership || !hasActiveMembership(context)) return false;
  return can(context, "placements.manage", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });
}

/** True when the person also holds the TPO role and so has the full TPO tooling. */
export function hasTpoTooling(context: RequestContext | null | undefined): boolean {
  return canOpenTpoWorkspace(context) && hasMembershipRole(context, "TPO");
}
