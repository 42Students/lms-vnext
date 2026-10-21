const ENVIRONMENTS = new Set(["PRODUCTION", "DEVELOPMENT", "UAT"]);
export const WINDOW_MINUTES = 5;

/** The backend serializes LocalDateTime as [y, m, d, h, mi, s, nanos] on the server clock, which is UTC. */
export function trackerDateMs(value) {
  if (!value) return null;
  const ms = Array.isArray(value)
    ? Date.UTC(value[0], (value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0, value[5] || 0)
    : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * The slice of logs worth looking at for a tester's report: a few minutes either side of when it
 * was filed, in the environment they named. Null when the issue gives us nothing to look up
 * (unknown environment, no timestamp, or a moment still in the future).
 */
export function issueLogWindow(issue, nowMs = Date.now()) {
  if (!issue || !ENVIRONMENTS.has(issue.environment)) return null;
  const at = trackerDateMs(issue.createdAt);
  if (at == null || at > nowMs) return null;
  const span = WINDOW_MINUTES * 60_000;
  return {
    environment: issue.environment,
    at,
    since: new Date(at - span).toISOString(),
    until: new Date(Math.min(at + span, nowMs)).toISOString(),
  };
}

/** "+2m 10s" / "-45s": how far an entry is from the moment the issue was filed. */
export function formatOffset(entryMs, atMs) {
  const diff = Math.round((entryMs - atMs) / 1000);
  const sign = diff < 0 ? "-" : "+";
  const abs = Math.abs(diff);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  return `${sign}${minutes ? `${minutes}m ` : ""}${seconds}s`;
}

/** Errors first, then warnings, nearest to the report first within each. */
export function rankNearbyEntries(entries, atMs) {
  const weight = (e) => (String(e.severity).toUpperCase() === "ERROR" || ["CRITICAL", "ALERT", "EMERGENCY"].includes(String(e.severity).toUpperCase()) ? 0 : 1);
  return [...entries]
    .filter((e) => !(e.httpPath || "").startsWith("/api/v1/superadmin/logs"))
    .sort((a, b) => weight(a) - weight(b) || Math.abs(new Date(a.timestamp).getTime() - atMs) - Math.abs(new Date(b.timestamp).getTime() - atMs));
}
