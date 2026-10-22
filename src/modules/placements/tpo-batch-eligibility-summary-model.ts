import { resolvePlacementParticipation, type PlacementScopeDecision } from "./batch-eligibility-policy";

export type BatchEligibilitySource = {
  membershipId: string;
  sectionIds: readonly string[];
};
export type BatchDecisionLookups = {
  learner: ReadonlyMap<string, PlacementScopeDecision>;
  section: ReadonlyMap<string, PlacementScopeDecision>;
  cohort: PlacementScopeDecision | null;
};
export function summarizeBatchEligibility(
  learners: readonly BatchEligibilitySource[],
  decisions: BatchDecisionLookups,
  limited: boolean,
) {
  let eligible = 0;
  let ineligible = 0;
  let undecided = 0;
  let needsReview = 0;
  for (const learner of learners) {
    if (learner.sectionIds.length > 1) {
      needsReview++;
      continue;
    }
    const sectionId = learner.sectionIds[0];
    const result = resolvePlacementParticipation({
      learner: decisions.learner.get(learner.membershipId) ?? null,
      section: learner.sectionIds.length === 1 && sectionId !== undefined
        ? decisions.section.get(sectionId) ?? null : null,
      cohort: decisions.cohort,
    });
    if (result.status === "ELIGIBLE") eligible++;
    else if (result.status === "INELIGIBLE") ineligible++;
    else undecided++;
  }
  return {
    eligible, ineligible, undecided, needsReview,
    assessed: learners.length,
    complete: !limited,
  };
}
export function batchEligibilityNextAction(summary: ReturnType<typeof summarizeBatchEligibility>, finished: boolean) {
  if (finished) return "VIEW" as const;
  if (!summary.complete || summary.needsReview > 0) return "REVIEW" as const;
  if (summary.undecided > 0) return "DECIDE" as const;
  return "INVITE" as const;
}

/** Percentages are conditional on a complete, scoped batch summary. */
export function batchEligibilityShare(count: number, assessed: number): number {
  return assessed > 0 ? Math.round((count / assessed) * 10000) / 100 : 0;
}
