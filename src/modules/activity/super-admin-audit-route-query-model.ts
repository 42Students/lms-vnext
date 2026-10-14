import { z } from "zod";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "@/modules/activity/taxonomy";
import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(value => value === "" ? undefined : value, schema.optional());
const date = (side: "from" | "to") => optional(z.string().refine(value => {
  try { parseActivityDateBoundary(value, side); return true; } catch { return false; }
}, "Use YYYY-MM-DD or an offset-aware ISO date"));

export const superAdminAuditRouteQuerySchema = z.strictObject({
  module: optional(z.enum(ACTIVITY_MODULES)),
  importance: optional(z.enum(ACTIVITY_IMPORTANCE)),
  collegeId: optional(z.uuid()),
  actorUserId: optional(z.uuid()),
  eventType: optional(z.string().trim().min(1).max(120)),
  subjectType: optional(z.string().trim().min(1).max(80)),
  subjectId: optional(z.string().trim().min(1).max(500)),
  actorName: optional(z.string().trim().min(1).max(100)),
  q: optional(z.string().trim().min(1).max(100)),
  from: date("from"),
  to: date("to"),
  beforeOccurredAt: optional(z.string().datetime({ offset: true })),
  beforeId: optional(z.uuid()),
}).superRefine((value, ctx) => {
  if (Boolean(value.beforeId) !== Boolean(value.beforeOccurredAt))
    ctx.addIssue({ code: "custom", path: ["beforeId"], message: "Cursor fields must be supplied together" });
  if (value.from && value.to &&
    parseActivityDateBoundary(value.from, "from").getTime() > parseActivityDateBoundary(value.to, "to").getTime())
    ctx.addIssue({ code: "custom", path: ["to"], message: "From must be before To" });
});

/** A single query value per field; reject forged arrays instead of choosing an arbitrary entry. */
export function validateSuperAdminAuditRouteQuery(raw: Record<string, string | string[] | undefined>) {
  const result = superAdminAuditRouteQuerySchema.safeParse(raw);
  return result.success ? result.data : null;
}
