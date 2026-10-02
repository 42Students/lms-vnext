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
