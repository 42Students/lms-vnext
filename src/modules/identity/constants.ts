export const ORGANIZATION_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const COLLEGE_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type CollegeStatus = (typeof COLLEGE_STATUSES)[number];

export const USER_PLATFORM_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type UserPlatformStatus = (typeof USER_PLATFORM_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "ENDED",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBERSHIP_ROLES = [
  "LEARNER",
  "FACULTY",
  "COLLEGE_ADMIN",
  "MENTOR",
  "TPO",
] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const SYSTEM_ROLES = ["SUPER_ADMIN"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
/**
 * Legacy role labels are migration inputs, never a runtime authorization grant.
 * Generic USER, missing and unknown values must not default to LEARNER.
 */
export type LegacyAccountRoleResolution =
  | { kind: "SYSTEM"; role: SystemRole }
  | { kind: "MEMBERSHIP"; role: MembershipRole }
  | { kind: "RECRUITER_PROFILE"; role: "RECRUITER" }
  | { kind: "UNMAPPED" };

export function resolveLegacyAccountRole(
  rawRole: string | null | undefined,
  rawFacultyType?: string | null,
): LegacyAccountRoleResolution {
  const role = rawRole?.trim().toUpperCase();
  const facultyType = rawFacultyType?.trim().toUpperCase();
  if (role === "SUPER_ADMIN") return { kind: "SYSTEM", role: "SUPER_ADMIN" };
  if (role === "ADMIN" || (role === "FACULTY" && facultyType === "ADMIN")) {
    return { kind: "MEMBERSHIP", role: "COLLEGE_ADMIN" };
  }
  if (role === "TPO" || (role === "FACULTY" && facultyType === "TPO")) {
    return { kind: "MEMBERSHIP", role: "TPO" };
  }
  if (role === "MENTOR") return { kind: "MEMBERSHIP", role: "MENTOR" };
  if (role === "FACULTY") return { kind: "MEMBERSHIP", role: "FACULTY" };
  if (role === "LEARNER") return { kind: "MEMBERSHIP", role: "LEARNER" };
  if (role === "RECRUITER") return { kind: "RECRUITER_PROFILE", role: "RECRUITER" };
  return { kind: "UNMAPPED" };
}
