/** Advance the persisted read snapshot by elapsed time, independently of the device wall clock. */
export function learnerAssessmentClock(snapshotNowMs: number, elapsedMs: number): number {
  return snapshotNowMs + (Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0);
}
