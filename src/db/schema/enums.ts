import { pgEnum } from "drizzle-orm/pg-core";
import {
  ACADEMIC_PERIOD_STATUSES,
  COHORT_STATUSES,
  PROGRAM_STATUSES,
  SECTION_STATUSES,
} from "@/modules/academics/constants";
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

export const programStatusEnum = pgEnum(
  "program_status",
  PROGRAM_STATUSES,
);

export const academicPeriodStatusEnum = pgEnum(
  "academic_period_status",
  ACADEMIC_PERIOD_STATUSES,
);

export const cohortStatusEnum = pgEnum(
  "cohort_status",
  COHORT_STATUSES,
);

export const sectionStatusEnum = pgEnum(
  "section_status",
  SECTION_STATUSES,
);
