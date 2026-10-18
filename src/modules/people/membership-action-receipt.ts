import {
  MEMBERSHIP_ROLES,
  type MembershipRole,
  type MembershipStatus,
} from "@/modules/identity/constants";

/** A 2xx HTTP response is not proof a role write committed for this membership.
 * Reject malformed, duplicated and contradictory receipts before updating UI. */
export function verifiedMembershipRoleReceipt(
  raw: unknown, role: MembershipRole, removing: boolean,
): MembershipRole[] | null {
  if (!raw || typeof raw !== "object" || !("roles" in raw)) return null;
  const roles = (raw as {roles: unknown}).roles;
  if (!Array.isArray(roles) || roles.length === 0 ||
    !roles.every((row): row is MembershipRole =>
      typeof row === "string" && MEMBERSHIP_ROLES.some(allowed => allowed === row),
    ) || new Set(roles).size !== roles.length) return null;
  if (roles.includes(role) === removing) return null;
  return roles;
}

/** Require the exact server-confirmed state for a lifecycle transition.
 * Ended memberships must never be shown as reactivated on a partial response. */
export function verifiedMembershipLifecycleReceipt(
  raw: unknown, action: "SUSPEND" | "REACTIVATE" | "END",
): MembershipStatus | null {
  if (!raw || typeof raw !== "object" || !("person" in raw)) return null;
  const person = (raw as {person:unknown}).person;
  if (!person || typeof person !== "object" || !("membership" in person)) return null;
  const member = (person as {membership:unknown}).membership;
  if (!member || typeof member !== "object" || !("status" in member)) return null;
  const status = (member as {status:unknown}).status;
  const expected: MembershipStatus =
    action === "SUSPEND" ? "SUSPENDED" : action === "END" ? "ENDED" : "ACTIVE";
  return status === expected ? expected : null;
}
