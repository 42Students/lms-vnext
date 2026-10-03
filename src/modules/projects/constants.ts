export const PROJECT_TEMPLATE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type ProjectTemplateStatus =
  (typeof PROJECT_TEMPLATE_STATUSES)[number];

export const PROJECT_TASK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;
export type ProjectTaskPriority =
  (typeof PROJECT_TASK_PRIORITIES)[number];

export const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type ProjectStatus =
  (typeof PROJECT_STATUSES)[number];

export const PROJECT_RELEASE_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "SHIPPED",
] as const;

export const PROJECT_SPRINT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
] as const;

export const PROJECT_TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "IN_REVIEW",
  "DONE",
] as const;

export const PROJECT_MEMBER_ROLES = [
  "LEARNER",
  "MENTOR",
] as const;
export type ProjectMemberRole =
  (typeof PROJECT_MEMBER_ROLES)[number];
