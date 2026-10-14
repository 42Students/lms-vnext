import { z } from "zod";

export const learnerProjectActivityCategorySchema = z.enum([
  "ALL", "SPRINT", "TASK", "TEAM", "RESOURCE", "SUBMISSION", "PROJECT",
]);
export type LearnerProjectActivityCategory = z.infer<typeof learnerProjectActivityCategorySchema>;
export const learnerProjectActivityCategories = [
  { value: "ALL", label: "All activity" },
  { value: "SPRINT", label: "Sprint changes" },
  { value: "TASK", label: "Task changes" },
  { value: "TEAM", label: "Team & meetings" },
  { value: "RESOURCE", label: "Resources shared" },
  { value: "SUBMISSION", label: "Submission updates" },
  { value: "PROJECT", label: "Project details" },
] as const;

export function learnerProjectActivityCategory(eventType: string): LearnerProjectActivityCategory | "OTHER" {
  if (eventType.startsWith("projects.delivery.") || eventType.startsWith("projects.submission.")) return "SUBMISSION";
  if (eventType.startsWith("projects.sprint.")) return "SPRINT";
  if (eventType.startsWith("projects.task.")) return "TASK";
  if (["projects.team.", "projects.member.", "projects.mentor.", "projects.meeting."].some(prefix => eventType.startsWith(prefix))) return "TEAM";
  if (eventType.startsWith("projects.resource.")) return "RESOURCE";
  if (eventType.startsWith("projects.project.") || eventType.startsWith("projects.readiness.")) return "PROJECT";
  return "OTHER";
}

/** Filters only an already-authorized Project feed; never accepts a project/actor selector. */
export function filterLearnerProjectActivity<T extends { eventType: string }>(
  events: readonly T[], categoryInput: unknown,
): T[] {
  const category = learnerProjectActivityCategorySchema.safeParse(categoryInput).data ?? "ALL";
  return events.filter(event => category === "ALL" || learnerProjectActivityCategory(event.eventType) === category);
}
