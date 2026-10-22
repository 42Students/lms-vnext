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

/** Historical TO_DO maps to canonical TODO while retaining display copy. */
export const LEGACY_PROJECT_TASK_STATUS_ALIASES = { TO_DO: "TODO" } as const;
export type ProjectTaskStatus = (typeof PROJECT_TASK_STATUSES)[number];
export const PROJECT_TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  TODO: "To do", IN_PROGRESS: "In progress", BLOCKED: "Blocked",
  IN_REVIEW: "In review", DONE: "Done",
};
export function normalizeProjectTaskStatus(input: string): ProjectTaskStatus | null {
  const value = input.trim().toUpperCase();
  const canonical = value === "TO_DO" ? "TODO" : value;
  return (PROJECT_TASK_STATUSES as readonly string[]).includes(canonical)
    ? canonical as ProjectTaskStatus : null;
}
export const DEFAULT_LEGACY_PROJECT_TASK_TYPE = "STORY" as const;

export const PROJECT_MEMBER_ROLES = [
  "LEARNER",
  "MENTOR",
] as const;
export type ProjectMemberRole =
  (typeof PROJECT_MEMBER_ROLES)[number];

export const PROJECT_TASK_SUBMISSION_STATUSES = [
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

export const PROJECT_TASK_REVIEW_DECISIONS = [
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

export const PROJECT_SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

export const PROJECT_SUBMISSION_REVIEW_DECISIONS = [
  "CHANGES_REQUESTED",
  "APPROVED",
] as const;

export const PROJECT_MEETING_STATUSES = [
  "REQUESTED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PROJECT_MEETING_TYPES = [
  "GENERAL",
  "PLANNING",
  "STANDUP",
  "REVIEW",
  "RETRO",
] as const;
