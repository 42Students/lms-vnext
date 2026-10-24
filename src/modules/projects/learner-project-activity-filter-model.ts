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
  if (["projects.sprint.","projects.release."].some(prefix => eventType.startsWith(prefix))) return "SPRINT";
  if (["projects.task.","projects.task_comment."].some(prefix => eventType.startsWith(prefix))) return "TASK";
  if (["projects.team.", "projects.team_member.", "projects.member.", "projects.mentor.", "projects.meeting."].some(prefix => eventType.startsWith(prefix))) return "TEAM";
  if (["projects.resource.", "projects.resource_file.", "projects.file."].some(prefix => eventType.startsWith(prefix))) return "RESOURCE";
  if (["projects.project.", "projects.readiness.", "projects.evaluation.", "projects.mentor_update."].some(prefix => eventType.startsWith(prefix))) return "PROJECT";
  return "OTHER";
}

/** Filters only an already-authorized Project feed; never accepts a project/actor selector.
 * Legacy eventType/sourceTab remain scoped; category names are display labels.
 */
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
  subjectId:z.string().uuid().optional(),
  sprintId:z.string().uuid().optional(),
  actorUserId:z.string().uuid().optional(),
  // Old /activity/feed supported bounded page/size and exact event type.
  // New cursor clients continue to default to page 1 / 100 events.
  eventType:z.string().trim().max(120).regex(/^[a-z0-9_.-]+$/i).optional(),
  // Only decimal query values are accepted. Number coercion would admit
  // hex/exponent formats that were not valid old-LMS page/size parameters.
  page:z.union([z.number().int(),z.string().regex(/^[0-9]+$/).transform(Number)])
    .pipe(z.number().int().min(1).max(1000)).default(1),
  size:z.union([z.number().int(),z.string().regex(/^[0-9]+$/).transform(Number)])
    .pipe(z.number().int().min(1).max(100)).default(100),
}).strict().refine(value => Boolean(value.beforeTime) === Boolean(value.beforeId), {
  message: "Activity cursor requires both timestamp and event ID", path: ["beforeId"],
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  message: "Start date must be on or before end date", path: ["to"],
});
export type LearnerProjectActivityFilters = z.infer<typeof learnerProjectActivityFilterSchema>;

export function parseLearnerProjectActivityFilters(input: {
  category?:unknown;from?:unknown;to?:unknown;fromDate?:unknown;toDate?:unknown;
  beforeTime?:unknown;beforeId?:unknown;
  eventType?:unknown;page?:unknown;size?:unknown;
  sourceTab?:unknown;search?:unknown;subjectId?:unknown;actorUserId?:unknown;sprintId?:unknown;
}) {
  const categoryText=typeof input.category==="string"?input.category.toUpperCase():input.category;
  const aliases:Record<string,LearnerProjectActivityCategory>={
    TASKS:"TASK",SPRINTS:"SPRINT",TEAM_MEMBERS:"TEAM",MEETINGS:"TEAM",
    RESOURCES:"RESOURCE",SUBMISSIONS:"SUBMISSION",DELIVERY:"SUBMISSION",WORKSPACE:"PROJECT",
  };
  const category=typeof categoryText==="string"?aliases[categoryText]??categoryText:categoryText;
  return learnerProjectActivityFilterSchema.safeParse({
    category: category === "" ? undefined : category,
    from: (input.fromDate || input.from) || undefined,
    to: (input.toDate || input.to) || undefined,
    beforeTime: input.beforeTime,beforeId:input.beforeId,
    eventType:input.eventType||undefined,
    page:input.page==="0"||input.page===0?1:input.page||undefined,
    sourceTab:input.sourceTab||undefined,search:input.search||undefined,
    subjectId:input.subjectId||undefined,
    sprintId:input.sprintId||undefined,
    actorUserId:input.actorUserId||undefined,
    size:input.size||undefined,
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
    case "SPRINT": return ["projects.sprint.", "projects.release."];
    case "TASK": return ["projects.task.", "projects.task_comment."];
    case "TEAM": return ["projects.team.", "projects.team_member.", "projects.member.", "projects.mentor.", "projects.meeting."];
    case "RESOURCE": return ["projects.resource.", "projects.resource_file.", "projects.file."];
    case "SUBMISSION": return ["projects.delivery.", "projects.submission."];
    case "PROJECT": return ["projects.project.", "projects.readiness.", "projects.evaluation.", "projects.mentor_update."];
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
  if (next.sprintId) params.set("activitySprintId", next.sprintId);
  if (next.search) params.set("activitySearch", next.search);
  if (next.eventType) params.set("activityEventType", next.eventType);
  if (next.page > 1) params.set("activityPage", String(next.page));
  if (next.size !== 100) params.set("activitySize", String(next.size));
  return "/learn/projects/" + encodeURIComponent(projectId) + "?" + params.toString();
}
