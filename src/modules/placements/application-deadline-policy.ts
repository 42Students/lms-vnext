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

/**
 * Lifecycle decision (G2-19-011-001): application closure is derived from
 * the persisted deadline, not an overnight job-status mutation. A PUBLISHED
 * drive stays visible for history while applications close at the exact
 * deadline. A manual CLOSED/ARCHIVED drive remains closed independently.
 *
 * Every application write must recheck this server-side; client disabled
 * buttons and scheduled workers are not authorization checks. Do not turn
 * a deadline into the manual close transition: that transition has separate
 * effects on rounds, offers and drive history.
 */
export function canAcceptPlacementApplications(
  jobStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED",
  deadline: Date | null,
  now: Date,
): boolean {
  return jobStatus === "PUBLISHED" &&
    !isPlacementApplicationDeadlinePassed(deadline, now);
}

// The old scheduled expiry sweep required a *strictly past* deadline.
// Keep the exact-time >= deny for an application writer; do not introduce
// a premature persisted CLOSED transition at equality.
export function wasPublishedDriveExpiredForLegacySweep(status:string,deadline:Date|null,now:Date):boolean{
 return status==="PUBLISHED"&&deadline instanceof Date&&deadline.getTime()<now.getTime();
}
