/** Preserve an intentional seek when renewing a signed URL, but use server
 * resume progress (plus the last page snapshot) on the first grant. */
export function resumePositionForGrant(
  currentSeconds: number, serverSeconds: number, initialSeconds: number, replacing: boolean,
) {
  const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  return replacing ? safe(currentSeconds) : Math.max(safe(initialSeconds), safe(serverSeconds));
}

/** Renew early enough that an active HTTP Range read is not interrupted. */
export function playbackGrantRefreshDelay(expiresAt: string, now: number) {
  const remaining = Date.parse(expiresAt) - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return 0;
  return Math.max(0, remaining - 30_000);
}
