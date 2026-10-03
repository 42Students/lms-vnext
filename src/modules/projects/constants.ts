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
