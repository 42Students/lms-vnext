/** GR-COURSES-BULK-01: per-record failures returned to the browser must
 * never include raw provider, DB, permissions or SQL exception messages.
 * Service-specific diagnostic detail belongs in server-side logs only. */
export function safeCourseVisibilityFailure(_cause:unknown):string {
  return "This content could not be updated. Refresh the page and retry.";
}
