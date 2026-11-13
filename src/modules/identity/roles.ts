import { MEMBERSHIP_ROLES, SYSTEM_ROLES, type MembershipRole, type SystemRole } from "./constants";

/**
 * The one spelling of every role name. Code says `ROLE.TPO`, never the string "TPO", so a role is renamed here and the
 * compiler finds every use. Pure data: safe to import from client components.
 */
export const ROLE = Object.freeze({
  LEARNER: "LEARNER",
  FACULTY: "FACULTY",
  COLLEGE_ADMIN: "COLLEGE_ADMIN",
  MENTOR: "MENTOR",
  TPO: "TPO",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const satisfies Record<MembershipRole | SystemRole, MembershipRole | SystemRole>);

export type RoleName = keyof typeof ROLE;

export function isMembershipRoleName(value: unknown): value is MembershipRole {
  return typeof value === "string" && (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

export function isSystemRoleName(value: unknown): value is SystemRole {
  return typeof value === "string" && (SYSTEM_ROLES as readonly string[]).includes(value);
}
