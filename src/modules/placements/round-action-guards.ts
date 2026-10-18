/**
 * Compare the round revision supplied by a browser tab with the row locked
 * inside the same transaction as the ensuing write. A matching status alone
 * does not protect against another officer rescheduling and returning the
 * round to that status.
 */
export function roundActionSnapshotMatches(
  locked: { status: string; updatedAt: Date } | null | undefined,
  expectedStatus: string,
  expectedUpdatedAt?: string,
): boolean {
  if (!locked || locked.status !== expectedStatus) return false;
  if (!Number.isFinite(locked.updatedAt.getTime())) return false;
  if (expectedUpdatedAt === undefined) return true;
  return locked.updatedAt.toISOString() === expectedUpdatedAt;
}

/** Reject writes after a college closes or archives its job. */
export function roundActionJobMutable(
  locked: { status: string } | null | undefined,
): boolean {
  return Boolean(locked && locked.status !== "CLOSED" && locked.status !== "ARCHIVED");
}
