import { pgEnum } from "drizzle-orm/pg-core";
import {
  COLLEGE_STATUSES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  ORGANIZATION_STATUSES,
  SYSTEM_ROLES,
  USER_PLATFORM_STATUSES,
} from "@/modules/identity/constants";

export const organizationStatusEnum = pgEnum(
  "organization_status",
  ORGANIZATION_STATUSES,
);

export const collegeStatusEnum = pgEnum("college_status", COLLEGE_STATUSES);

export const userPlatformStatusEnum = pgEnum(
  "user_platform_status",
  USER_PLATFORM_STATUSES,
);

export const membershipStatusEnum = pgEnum(
  "membership_status",
  MEMBERSHIP_STATUSES,
);

export const membershipRoleEnum = pgEnum(
  "membership_role",
  MEMBERSHIP_ROLES,
);

export const systemRoleEnum = pgEnum("system_role", SYSTEM_ROLES);
