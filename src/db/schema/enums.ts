import { pgEnum } from "drizzle-orm/pg-core";
import {
  ACADEMIC_PERIOD_STATUSES,
  COHORT_STATUSES,
  LEARNER_PROGRAM_ENROLLMENT_STATUSES,
  PROGRAM_STATUSES,
  SCHEDULE_EVENT_STATUSES,
  SECTION_ENROLLMENT_STATUSES,
  SECTION_FACULTY_ROLES,
  SECTION_STATUSES,
} from "@/modules/academics/constants";
import {
  COURSE_OFFERING_STATUSES,
  COURSE_OFFERING_TYPES,
  COURSE_STATUSES,
  COURSE_TEACHING_ROLES,
} from "@/modules/courses/constants";
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

export const learnerProgramEnrollmentStatusEnum =
  pgEnum(
    "learner_program_enrollment_status",
    LEARNER_PROGRAM_ENROLLMENT_STATUSES,
  );

export const sectionEnrollmentStatusEnum = pgEnum(
  "section_enrollment_status",
  SECTION_ENROLLMENT_STATUSES,
);

export const sectionFacultyRoleEnum = pgEnum(
  "section_faculty_role",
  SECTION_FACULTY_ROLES,
);

export const scheduleEventStatusEnum = pgEnum(
  "schedule_event_status",
  SCHEDULE_EVENT_STATUSES,
);

export const courseStatusEnum = pgEnum(
  "course_status",
  COURSE_STATUSES,
);

export const courseOfferingTypeEnum = pgEnum(
  "course_offering_type",
  COURSE_OFFERING_TYPES,
);

export const courseOfferingStatusEnum = pgEnum(
  "course_offering_status",
  COURSE_OFFERING_STATUSES,
);

export const courseTeachingRoleEnum = pgEnum(
  "course_teaching_role",
  COURSE_TEACHING_ROLES,
);
