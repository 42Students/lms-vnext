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

export const learnerProjectActivityFilterSchema = z.object({
  category: learnerProjectActivityCategorySchema.default("ALL"),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  beforeTime: z.iso.datetime().optional(),
  beforeId: z.string().uuid().optional(),
  sourceTab:z.string().trim().max(80).optional(),
  search:z.string().trim().max(100).optional(),
}).strict().refine(value => Boolean(value.beforeTime) === Boolean(value.beforeId), {
  message: "Activity cursor requires both timestamp and event ID", path: ["beforeId"],
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  message: "Start date must be on or before end date", path: ["to"],
});
export type LearnerProjectActivityFilters = z.infer<typeof learnerProjectActivityFilterSchema>;

export function parseLearnerProjectActivityFilters(input: {
  category?: unknown; from?: unknown; to?: unknown; beforeTime?: unknown; beforeId?: unknown;
  sourceTab?:unknown;search?:unknown;
}) {
  return learnerProjectActivityFilterSchema.safeParse({
    category: input.category === "" ? undefined : input.category,
    from: input.from === "" ? undefined : input.from,
    to: input.to === "" ? undefined : input.to,
    beforeTime: input.beforeTime, beforeId: input.beforeId,
    sourceTab:input.sourceTab,search:input.search,
  });
}

/** Inclusive IST date range, expressed as a UTC half-open interval for persisted instants. */
export function learnerProjectActivityDateBounds(filters: LearnerProjectActivityFilters) {
  return {
    from: filters.from ? new Date(filters.from + "T00:00:00+05:30") : undefined,
    until: filters.to ? new Date(Date.parse(filters.to + "T00:00:00+05:30") + 86_400_000) : undefined,
  };
}

export function learnerProjectActivityPrefixes(category: LearnerProjectActivityCategory): readonly string[] {
  switch (category) {
    case "SPRINT": return ["projects.sprint."];
    case "TASK": return ["projects.task."];
    case "TEAM": return ["projects.team.", "projects.member.", "projects.mentor.", "projects.meeting."];
    case "RESOURCE": return ["projects.resource."];
    case "SUBMISSION": return ["projects.delivery.", "projects.submission."];
    case "PROJECT": return ["projects.project.", "projects.readiness."];
    default: return [];
  }
}

export function learnerProjectActivityPageHref(
  projectId: string, filters: LearnerProjectActivityFilters,
  cursor?: { time: string; id: string },
) {
  const next = learnerProjectActivityFilterSchema.parse({ ...filters,
    beforeTime: cursor?.time, beforeId: cursor?.id });
  const params = new URLSearchParams({ tab: "activity" });
  if (next.category !== "ALL") params.set("activityCategory", next.category);
  if (next.from) params.set("activityFrom", next.from);
  if (next.to) params.set("activityTo", next.to);
  if (next.beforeTime) params.set("activityBeforeTime", next.beforeTime);
  if (next.beforeId) params.set("activityBeforeId", next.beforeId);
  if (next.sourceTab) params.set("activitySourceTab", next.sourceTab);
  if (next.search) params.set("activitySearch", next.search);
  return "/learn/projects/" + encodeURIComponent(projectId) + "?" + params.toString();
}
