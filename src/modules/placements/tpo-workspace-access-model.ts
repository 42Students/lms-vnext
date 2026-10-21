import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/**
 * Who may open the /tpo workspace. Legacy lets a college admin into the placement cell
 * (PORTAL_GUESTS['/tpo'] = [ADMIN, FACULTY]; sidebar row "Placement cell" -> /tpo/home), so
 * access is decided by the central `placements.manage` permission, never by a role string.
 * TPO-personal features (inbox, quick links, persisted-role services) still require the TPO role.
 */
export type TpoWorkspaceAccessDecision =
  | { allowed: true; scope: "TPO" | "COLLEGE_PLACEMENTS" }
  | { allowed: false; status: 401; reason: "SIGN_IN_REQUIRED" }
  | { allowed: false; status: 403; reason: "NO_ACTIVE_MEMBERSHIP" | "PLACEMENTS_ACCESS_DENIED" };

/**
 * Distinguish an unauthenticated caller from a revoked membership or a missing
 * placement permission. Read/write handlers still have to check the requested
 * drive and round in their own college scope before mutating either record.
 */
export function getTpoWorkspaceAccessDecision(
  context: RequestContext | null | undefined,
): TpoWorkspaceAccessDecision {
  if (!context) return { allowed: false, status: 401, reason: "SIGN_IN_REQUIRED" };
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context))
    return { allowed: false, status: 403, reason: "NO_ACTIVE_MEMBERSHIP" };
  if (!can(context, "placements.manage", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  })) return { allowed: false, status: 403, reason: "PLACEMENTS_ACCESS_DENIED" };
  return {
    allowed: true,
    scope: hasMembershipRole(context, "TPO") ? "TPO" : "COLLEGE_PLACEMENTS",
  };
}

export function canOpenTpoWorkspace(context: RequestContext | null | undefined): boolean {
  return getTpoWorkspaceAccessDecision(context).allowed;
}

/** True when the person also holds the TPO role and so has the full TPO tooling. */
export function hasTpoTooling(context: RequestContext | null | undefined): boolean {
  return canOpenTpoWorkspace(context) && hasMembershipRole(context, "TPO");
}
