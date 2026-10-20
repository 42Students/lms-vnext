import { type MembershipRole } from "@/modules/identity/constants";
import { PeopleServiceError } from "./errors";

/**
 * One account type, one purpose: a college membership holds exactly one role
 * (learner, faculty, mentor, TPO or college admin). Roles are never combined or
 * derived from one another, so every account type keeps its own workspace.
 */
export function assertSingleRole(roles: readonly MembershipRole[]): void {
  if (new Set(roles).size > 1) throw new PeopleServiceError("SINGLE_ROLE_ONLY");
}

/** Adding a role is only allowed when the membership holds no other role yet. */
export function assertCanAddRole(
  currentRoles: readonly MembershipRole[],
  role: MembershipRole,
): void {
  if (currentRoles.some((current) => current !== role)) {
    throw new PeopleServiceError("SINGLE_ROLE_ONLY");
  }
}
