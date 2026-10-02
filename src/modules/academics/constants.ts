export const PROGRAM_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;
export type ProgramStatus =
  (typeof PROGRAM_STATUSES)[number];

export const ACADEMIC_PERIOD_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "CLOSED",
] as const;
export type AcademicPeriodStatus =
  (typeof ACADEMIC_PERIOD_STATUSES)[number];

export const COHORT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type CohortStatus =
  (typeof COHORT_STATUSES)[number];

export const SECTION_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;
export type SectionStatus =
  (typeof SECTION_STATUSES)[number];

export const LEARNER_PROGRAM_ENROLLMENT_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "WITHDRAWN",
] as const;
export type LearnerProgramEnrollmentStatus =
  (typeof LEARNER_PROGRAM_ENROLLMENT_STATUSES)[number];

export const SECTION_ENROLLMENT_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "MOVED",
  "WITHDRAWN",
] as const;
export type SectionEnrollmentStatus =
  (typeof SECTION_ENROLLMENT_STATUSES)[number];

export const SECTION_FACULTY_ROLES = [
  "ADVISOR",
  "COORDINATOR",
] as const;
export type SectionFacultyRole =
  (typeof SECTION_FACULTY_ROLES)[number];

export const SCHEDULE_EVENT_STATUSES = [
  "SCHEDULED",
  "CANCELLED",
] as const;
export type ScheduleEventStatus =
  (typeof SCHEDULE_EVENT_STATUSES)[number];
