import type { RequestContext } from "@/modules/identity/context";

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
  if (tenant.kind === "platform") return true;
  if (tenant.kind === "unknown" || tenant.kind === "unavailable") return false;

  if (context.membership?.collegeId === tenant.collegeId) return true;

  return Boolean(
    context.recruiter?.grants.some(
      (grant) => grant.collegeId === tenant.collegeId,
    ),
  );
}
