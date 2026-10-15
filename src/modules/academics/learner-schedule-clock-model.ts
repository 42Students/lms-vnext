/** Same timestamp for all Class Schedule time-dependent summaries and filters. */
export function learnerScheduleClock(snapshotMs:number):Date {
  if (!Number.isFinite(snapshotMs) || snapshotMs<0) throw new Error("Invalid schedule clock");
  return new Date(snapshotMs);
}
