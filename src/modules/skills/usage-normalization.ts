import { z } from "zod";

/**
 * Legacy SkillUsageTracker.recordUsage lowercases its raw name WITHOUT trim.
 * "Java" and " Java" are distinct persisted counters. The historical
 * whitespace-only exception is deliberately NOT enabled by the current
 * PostgreSQL nonblank constraint; this policy choice still needs approval.
 *
 * Do not apply catalog/search-query trimming to this usage-key boundary.
 */
export const skillUsageNameSchema = z.string().min(1).max(200)
  .refine(value => value.trim().length > 0, "Whitespace-only usage names are unsupported");

export function normalizeSkillUsageKey(value: string): string {
  return skillUsageNameSchema.parse(value).toLocaleLowerCase("en-US");
}
