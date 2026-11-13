import { hasActiveMembership, hasActiveRecruiter, type RequestContext } from "@/modules/identity/context";

/**
 * A college host shows exactly one college. After sign-in the request must
 * still belong to that college, whatever cookies the caller presents:
 *
 * - platform host      -> any signed-in person
 * - verified college   -> only an active member of THAT college, or a
 *                         recruiter holding a grant at THAT college
 * - unknown host       -> nobody (fail closed)
 *
 * Kept pure (no I/O) so the rule is unit tested directly.
 */
export type TenantForAccess =
  | { kind: "platform" }
  | { kind: "college"; collegeId: string }
  | { kind: "unknown" }
  | { kind: "unavailable" };

export function isTenantAccessAllowed(
  context: RequestContext,
  tenant: TenantForAccess,
) {
  // A stale session or suspended college membership must never be enough
  // to enter a tenant just because its cached college UUID still matches.
  if (context.user.platformStatus !== "ACTIVE") return false;
  if (tenant.kind === "platform") return true;
  if (tenant.kind === "unknown" || tenant.kind === "unavailable") return false;

  // A selected membership is one tenant workspace, not an additive claim.
  // A separate recruiter grant in another college must not make that
  // membership's role usable from the other college's host. The recruiter
  // can instead use an unselected recruiter workspace on its own host.
  if (context.membership) {
    return hasActiveMembership(context) &&
      context.membership.collegeId === tenant.collegeId;
  }

  return Boolean(
    hasActiveRecruiter(context) &&
    context.recruiter?.userId === context.user.id &&
    context.recruiter?.grants.some(
      (grant) => grant.collegeId === tenant.collegeId,
    ),
  );
}

/**
 * After host authorization, expose only recruiter grants for that host.
 * Merely allowing a membership request on College A must not expose
 * unrelated College B recruiting capabilities in the same request context.
 * The platform host keeps the full verified grant list for account choice.
 */
export function scopeContextToTenant(
  context: RequestContext,
  tenant: TenantForAccess,
): RequestContext {
  if (tenant.kind !== "college" || !context.recruiter) return context;
  const grants = context.recruiter.grants.filter(
    grant => grant.collegeId === tenant.collegeId,
  );
  return {
    ...context,
    recruiter: grants.length > 0
      ? { ...context.recruiter, grants }
      : null,
  };
}
