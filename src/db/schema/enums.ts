import { pgEnum } from "drizzle-orm/pg-core";

export const organizationStatusEnum = pgEnum("organization_status", [
  "ACTIVE",
  "ARCHIVED",
]);

export const collegeStatusEnum = pgEnum("college_status", [
  "ACTIVE",
  "ARCHIVED",
]);

export const userPlatformStatusEnum = pgEnum("user_platform_status", [
  "ACTIVE",
  "DISABLED",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "ACTIVE",
  "SUSPENDED",
  "ENDED",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "LEARNER",
  "FACULTY",
  "COLLEGE_ADMIN",
  "MENTOR",
  "TPO",
]);

export const systemRoleEnum = pgEnum("system_role", [
  "SUPER_ADMIN",
]);
