import { z } from "zod";
import { parseActivityDateBoundary } from "./date-boundary";
import { ACTIVITY_MODULES, ACTIVITY_IMPORTANCE } from "./taxonomy";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  try { parseActivityDateBoundary(value, "from"); return true; }
  catch { return false; }
}, "Use a valid YYYY-MM-DD date");

export const collegeActivityQuerySchema = z.strictObject({
  view: z.enum(["IMPORTANT", "EVERYTHING"]).optional(),
  category: z.enum(["ACADEMIC_SETUP", "PEOPLE_ACCESS", "TEACHING", "PROJECTS"]).optional(),
  range: z.enum(["ALL"]).optional(),
  module: z.enum(ACTIVITY_MODULES).optional(),
  importance: z.enum(ACTIVITY_IMPORTANCE).optional(),
  eventType: z.string().trim().min(1).max(120).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  actorUserId: z.string().uuid().optional(),
  actorName: z.string().trim().min(1).max(100).optional(),
  subjectType: z.string().trim().min(1).max(80).optional(),
  subjectId: z.string().trim().min(1).max(500).optional(),
  pageSize: z.enum(["10","25","50"]).optional(),
  loaded: z.coerce.number().int().min(1).max(10).optional(),
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
  if (filter.view) params.set("view", filter.view);
  if (filter.range) params.set("range", filter.range);
  if (filter.category) params.set("category", filter.category);
  if (filter.module) params.set("module", filter.module);
  if (filter.importance) params.set("importance", filter.importance);
  if (filter.eventType) params.set("eventType", filter.eventType);
  if (filter.q) params.set("q", filter.q);
  if (filter.actorUserId) params.set("actorUserId", filter.actorUserId);
  if (filter.actorName) params.set("actorName", filter.actorName);
  if (filter.subjectType) params.set("subjectType", filter.subjectType);
  if (filter.subjectId) params.set("subjectId", filter.subjectId);
  if (filter.pageSize && filter.pageSize !== "50") params.set("pageSize",filter.pageSize);
  if ((filter.loaded ?? 1)>1 && !cursor) params.set("loaded",String(filter.loaded));
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (cursor) {
    params.set("beforeOccurredAt", cursor.beforeOccurredAt.toISOString());
    params.set("beforeId", cursor.beforeId);
  }
  return "/college/activity" + (params.size ? "?" + params.toString() : "");
}

/** IST calendar-day shortcuts keep all current filters but discard stale cursors. */
export function collegeActivityRecentHref(
  filter: CollegeActivityQuery, days: 7 | 30, asOf: Date,
) {
  if (Number.isNaN(asOf.getTime())) throw new RangeError("INVALID_DATE");
  const pieces = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year:"numeric", month:"2-digit", day:"2-digit",
  }).formatToParts(asOf);
  const value=(part: "year"|"month"|"day")=>pieces.find(entry=>entry.type===part)?.value ?? "";
  const year=Number(value("year")),month=Number(value("month")),day=Number(value("day"));
  const start=new Date(Date.UTC(year,month-1,day-days+1));
  const from=start.toISOString().slice(0,10);
  const to=`${value("year")}-${value("month")}-${value("day")}`;
  return collegeActivityHref({...filter,loaded:1,from,to});
}

export function activitySearchParams(
  raw: Record<string, string | string[] | undefined>,
): unknown {
  // Keep unknown/duplicate parameters so strict Zod can reject them.
  const entries: Record<string, string | string[] | undefined> =
    Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined && value !== ""));
  if (!entries.from && !entries.to && entries.range !== "ALL") {
    const query = new URL(collegeActivityRecentHref({}, 30, new Date()), "https://local.invalid").searchParams;
    entries.from = query.get("from") ?? undefined;
    entries.to = query.get("to") ?? undefined;
  }
  return entries;
}

/** COL-verification-misc-12: today follows the user's IST calendar, not UTC midnight. */
export function collegeActivityTodayHref(filter:CollegeActivityQuery,asOf:Date){
 const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(asOf);
 return collegeActivityHref({...filter,loaded:1,from:day,to:day});
}
export function collegeActivityAllTimeHref(filter:CollegeActivityQuery){
 return collegeActivityHref({...filter,loaded:1,from:undefined,to:undefined,range:"ALL"});
}

// Legacy category validation is explicit rather than a generic filter error.
export function invalidCollegeActivityCategory(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 80) return null;
  return ["ACADEMIC_SETUP", "PEOPLE_ACCESS", "TEACHING", "PROJECTS"].includes(raw)
    ? null : "Unknown activity category: " + raw;
}
