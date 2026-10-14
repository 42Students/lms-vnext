import { z } from "zod";
export const adminAuditTextFilterSchema = z.strictObject({
  actorName: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
/** Literal substring matching: %, _ and backslash must not broaden the query. */
export function auditLiteralLikePattern(raw: string) {
  const value = z.string().trim().min(1).max(100).parse(raw);
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}
