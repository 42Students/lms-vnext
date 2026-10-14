import { z } from "zod";
import { parseActivityDateBoundary } from "./date-boundary";
import { ACTIVITY_MODULES, ACTIVITY_IMPORTANCE } from "./taxonomy";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  try { parseActivityDateBoundary(value, "from"); return true; }
  catch { return false; }
}, "Use a valid YYYY-MM-DD date");

export const collegeActivityQuerySchema = z.strictObject({
  module: z.enum(ACTIVITY_MODULES).optional(),
  importance: z.enum(ACTIVITY_IMPORTANCE).optional(),
  eventType: z.string().trim().min(1).max(120).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  actorUserId: z.string().uuid().optional(),
  subjectType: z.string().trim().min(1).max(80).optional(),
  subjectId: z.string().uuid().optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  beforeOccurredAt: z.string().datetime({ offset: true }).optional(),
  beforeId: z.string().uuid().optional(),
}).superRefine((query, ctx) => {
  if (Boolean(query.beforeOccurredAt) !== Boolean(query.beforeId)) {
    ctx.addIssue({
      code: "custom", path: ["beforeId"],
      message: "Both pagination cursor values are required",
    });
  }
  if (query.from && query.to &&
      parseActivityDateBoundary(query.from, "from").getTime() >
      parseActivityDateBoundary(query.to, "to").getTime()) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "Invalid date range" });
  }
});

export type CollegeActivityQuery = z.infer<typeof collegeActivityQuerySchema>;

export function collegeActivityHref(
  filter: CollegeActivityQuery,
  cursor: { beforeOccurredAt: Date; beforeId: string } | null = null,
) {
  const params = new URLSearchParams();
  if (filter.module) params.set("module", filter.module);
  if (filter.importance) params.set("importance", filter.importance);
  if (filter.eventType) params.set("eventType", filter.eventType);
  if (filter.q) params.set("q", filter.q);
  if (filter.actorUserId) params.set("actorUserId", filter.actorUserId);
  if (filter.subjectType) params.set("subjectType", filter.subjectType);
  if (filter.subjectId) params.set("subjectId", filter.subjectId);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (cursor) {
    params.set("beforeOccurredAt", cursor.beforeOccurredAt.toISOString());
    params.set("beforeId", cursor.beforeId);
  }
  return "/college/activity" + (params.size ? "?" + params.toString() : "");
}

export function activitySearchParams(
  raw: Record<string, string | string[] | undefined>,
): unknown {
  // Keep unknown/duplicate parameters so strict Zod can reject them.
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined && value !== ""));
}
