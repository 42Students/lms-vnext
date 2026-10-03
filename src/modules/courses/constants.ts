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

export const LEARNING_PATH_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type LearningPathStatus =
  (typeof LEARNING_PATH_STATUSES)[number];

export const COURSE_LESSON_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;
export type CourseLessonStatus =
  (typeof COURSE_LESSON_STATUSES)[number];

export const LESSON_CONTENT_TYPES = [
  "RESOURCE",
  "VIDEO",
  "YOUTUBE",
  "LIVE_CLASS",
] as const;
export type LessonContentType =
  (typeof LESSON_CONTENT_TYPES)[number];

export const LESSON_CONTENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type LessonContentStatus =
  (typeof LESSON_CONTENT_STATUSES)[number];
