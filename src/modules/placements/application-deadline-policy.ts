/**
 * Application deadlines are exclusive instants, checked by both learner job
 * cards and the application writer. At the exact deadline do not render Apply
 * as enabled; it would be rejected by the server on the same timestamp.
 *
 * Caller must still check published/archived status, paid module, learner
 * participation and job-specific eligibility. This predicate alone is not
 * authorization.
 */
export function isPlacementApplicationDeadlinePassed(
  deadline: Date | null,
  now: Date,
): boolean {
  return deadline !== null && now.getTime() >= deadline.getTime();
}
