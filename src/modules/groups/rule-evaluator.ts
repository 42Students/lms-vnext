import { z } from "zod";

/** V1 supported subset: reject unsupported legacy JSON criteria rather than silently ignoring them. */
export const groupRuleCriteriaSchema = z.object({
  allowedProgramIds: z.array(z.string().uuid()).max(100).default([]),
  allowedCohortIds: z.array(z.string().uuid()).max(200).default([]),
  minCgpa: z.number().min(0).max(10).nullable().default(null),
  maxActiveBacklogs: z.number().int().min(0).nullable().default(null),
  allowedPassingYears: z.array(z.number().int().min(1900).max(2150)).max(50).default([]),
}).strict().refine(
  c => c.allowedProgramIds.length > 0 || c.allowedCohortIds.length > 0 ||
    c.minCgpa !== null || c.maxActiveBacklogs !== null || c.allowedPassingYears.length > 0,
  { message: "Empty catch-all rules require an explicit, separate design" },
);
export type GroupRuleCriteria = z.infer<typeof groupRuleCriteriaSchema>;

export type GroupRuleCandidate = {
  programId: string;
  cohortId: string;
  cgpaHundredths: number | null;
  activeBacklogs: number | null;
  passingYear: number | null;
};

export function matchesGroupRuleCandidate(c: GroupRuleCriteria, r: GroupRuleCandidate) {
  if (c.allowedProgramIds.length > 0 && !c.allowedProgramIds.includes(r.programId)) return false;
  if (c.allowedCohortIds.length > 0 && !c.allowedCohortIds.includes(r.cohortId)) return false;
  if (c.minCgpa !== null && (r.cgpaHundredths === null ||
      r.cgpaHundredths < Math.round(c.minCgpa * 100))) return false;
  if (c.maxActiveBacklogs !== null && (r.activeBacklogs === null ||
      r.activeBacklogs > c.maxActiveBacklogs)) return false;
  if (c.allowedPassingYears.length > 0 &&
      (r.passingYear === null || !c.allowedPassingYears.includes(r.passingYear))) return false;
  return true;
}
