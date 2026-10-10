/**
 * W04: a placement drive has a deliberate academic-cohort target list.
 * An unset/empty target list is not carte blanche to advertise to everyone.
 */
export function isPlacementJobTargetCohort(
  cohortId: string | null,
  targetedCohortIds: readonly string[],
): boolean {
  return cohortId !== null && targetedCohortIds.includes(cohortId);
}
