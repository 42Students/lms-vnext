import { z } from "zod";
import { matchesGroupRuleCandidate, type GroupRuleCandidate, type GroupRuleCriteria } from "./rule-evaluator";

import { zUuid } from "@/lib/schema-primitives";
export const collegeRulePreviewInputSchema = z.object({
  groupId: zUuid,
}).strict();

export const GROUP_RULE_PREVIEW_MAX_CANDIDATES = 1000;

export type RulePreviewCandidate = GroupRuleCandidate & { membershipId: string };

export function projectCollegeGroupRulePreview(
  criteria: GroupRuleCriteria,
  candidates: readonly RulePreviewCandidate[],
  currentActiveMembers: ReadonlySet<string>,
  incomplete: boolean,
) {
  let matched = 0;
  let alreadyActive = 0;
  for (const candidate of candidates) {
    if (!matchesGroupRuleCandidate(criteria, candidate)) continue;
    matched++;
    if (currentActiveMembers.has(candidate.membershipId)) alreadyActive++;
  }
  return {
    examined: candidates.length,
    matched,
    alreadyActive,
    potentiallyNew: matched - alreadyActive,
    incomplete,
  };
}
