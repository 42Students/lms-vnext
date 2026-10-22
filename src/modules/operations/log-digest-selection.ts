/** Legacy log-digest selection parity.
 * Source: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogDigestService.java
 * Repository callers must supply signatures scoped to the requested environment,
 * ordered by lastSeenAt descending (including muted and fixed signatures).
 */
export type LogDigestSignature = {
  id: string;
  muted: boolean;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  regressedAt: Date | null;
  fixedAt: Date | null;
  fixStatus: string | null;
  occurrenceCount: number;
};

export type LogDigestSelection<T extends LogDigestSignature> = {
  newErrors: T[];
  regressions: T[];
  fixed: T[];
  stillActive: number;
  quiet: boolean;
};

/** Use one captured `until` instant for all three lists and the active count. */
export function selectLogDigestSignatures<T extends LogDigestSignature>(
  signatures: readonly T[],
  since: Date,
  until: Date,
): LogDigestSelection<T> {
  if (!Number.isFinite(since.getTime()) || !Number.isFinite(until.getTime()) ||
      since.getTime() > until.getTime()) {
    throw new RangeError("INVALID_DIGEST_WINDOW");
  }
  const within = (value: Date | null): boolean =>
    value instanceof Date && Number.isFinite(value.getTime()) &&
    value.getTime() >= since.getTime() && value.getTime() <= until.getTime();
  // The legacy repository supplies lastSeenAt descending; explicitly sort
  // here to avoid depending on the calling adapter's implicit SQL order.
  const ordered = [...signatures].sort((a, b) =>
    (b.lastSeenAt?.getTime() ?? -Infinity) -
    (a.lastSeenAt?.getTime() ?? -Infinity));
  const newErrors = ordered
    .filter(row => !row.muted && within(row.firstSeenAt))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 10);
  const regressions = ordered.filter(row => within(row.regressedAt)).slice(0, 10);
  const fixed = ordered.filter(row =>
    row.fixStatus === "FIXED" && row.regressedAt === null &&
    within(row.fixedAt)).slice(0, 10);
  const stillActive = ordered.filter(row =>
    !row.muted && row.fixStatus !== "FIXED" && within(row.lastSeenAt)).length;
  return {
    newErrors, regressions, fixed, stillActive,
    quiet: newErrors.length === 0 && regressions.length === 0,
  };
}

/** Bounded Telegram text delivery: never split a batch beyond 3,800 chars. */
export function boundLogDigestMessage(message: string): string {
  const limit = 3800;
  return message.length <= limit ? message : message.slice(0, limit - 4) + "\n...";
}
