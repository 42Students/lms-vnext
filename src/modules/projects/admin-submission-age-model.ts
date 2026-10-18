/** Robust, UTC-instant-based elapsed days for admin Projects dashboards.
 * Do not trust legacy stored timestamps enough to let NaN reach CSV/UI.
 * Negative elapsed time (future timestamps) is clamped to zero days.
 */
export function projectAdminElapsedDays(
  occurredAt:Date|null,
  observedAt:Date,
):number|null {
  if(!occurredAt)return null;
  const eventMs=occurredAt.getTime(),nowMs=observedAt.getTime();
  if(!Number.isFinite(eventMs)||!Number.isFinite(nowMs))return null;
  return Math.max(0,Math.floor((nowMs-eventMs)/86_400_000));
}
