import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { ROLE } from "@/modules/identity/roles";
import { AuthorizationError, type PlatformPermission } from "@/modules/permissions/policy";

/**
 * The two comparisons every tenant-scoped service makes by hand: "is this row in my college" and "is this row mine".
 * One definition each, so a service never re-derives college or ownership from a different field than its neighbour.
 */
export function sameCollege(context: RequestContext | null | undefined, resource: { collegeId?: string | null }): boolean {
  return Boolean(
    context &&
      hasActiveMembership(context) &&
      context.membership?.collegeId &&
      resource.collegeId &&
      context.membership.collegeId === resource.collegeId,
  );
}

/** Throws AuthorizationError unless the row belongs to the actor's selected college. */
export function requireSameCollege(context: RequestContext | null | undefined, resource: { collegeId?: string | null }, permission: PlatformPermission = "college.read"): void {
  if (!sameCollege(context, resource)) throw new AuthorizationError(permission);
}

/** True when the row is the actor's own: their membership id, or (for account-level rows) their user id. */
export function ownsResource(
  context: RequestContext | null | undefined,
  row: { membershipId?: string | null; userId?: string | null },
): boolean {
  if (!context || context.user.platformStatus !== "ACTIVE") return false;
  if (row.membershipId && context.membership?.id === row.membershipId && hasActiveMembership(context)) return true;
  if (row.userId && context.user.id === row.userId) return true;
  return false;
}

export function requireOwnsResource(
  context: RequestContext | null | undefined,
  row: { membershipId?: string | null; userId?: string | null },
  permission: PlatformPermission = "identity.self.manage",
): void {
  if (!ownsResource(context, row)) throw new AuthorizationError(permission);
}

/**
 * The signed-in actor must hold the LEARNER role in a college membership; returns that membership. Denials name
 * `placements.read`, the capability the learner placement services protect.
 */
export function requireLearnerMembership(context: RequestContext): NonNullable<RequestContext["membership"]> {
  if (!context.membership || !hasMembershipRole(context, ROLE.LEARNER)) throw new AuthorizationError("placements.read");
  return context.membership;
}
