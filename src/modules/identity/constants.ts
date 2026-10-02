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
