export const COURSE_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;
export type CourseStatus =
  (typeof COURSE_STATUSES)[number];

export const COURSE_OFFERING_TYPES = [
  "CORE",
  "ELECTIVE",
] as const;
export type CourseOfferingType =
  (typeof COURSE_OFFERING_TYPES)[number];

export const COURSE_OFFERING_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;
export type CourseOfferingStatus =
  (typeof COURSE_OFFERING_STATUSES)[number];

export const COURSE_TEACHING_ROLES = [
  "PRIMARY",
  "CO_TEACHER",
  "TA",
] as const;
export type CourseTeachingRole =
  (typeof COURSE_TEACHING_ROLES)[number];
