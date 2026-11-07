/**
 * Small in-process detector over the audit stream (SEC-19). It counts events per key in a sliding window and reports
 * the first time a threshold is crossed in that window, so one burst produces one finding, not thousands.
 * Per instance and in memory by design: it is a tripwire for the log and the audit trail, not an enforcement point.
 */
export type AnomalyRule = {
  name: string;
  /** Returns the counting key for an event, or null when the rule does not apply. */
  key: (event: { event: string; outcome: string; userId?: string | null; ipTag?: string | null }) => string | null;
  threshold: number;
  windowMs: number;
};

export const ANOMALY_RULES: readonly AnomalyRule[] = [
  { name: "repeated_denials", key: (e) => (e.event === "api.denied" && e.outcome === "denied" && e.userId ? `u:${e.userId}` : null), threshold: 20, windowMs: 5 * 60_000 },
  { name: "login_probing", key: (e) => (e.event === "auth.login_rejected" && e.ipTag ? `ip:${e.ipTag}` : null), threshold: 10, windowMs: 5 * 60_000 },
  { name: "bulk_export", key: (e) => (e.event === "api.export" && e.userId ? `u:${e.userId}` : null), threshold: 10, windowMs: 10 * 60_000 },
];

type Bucket = { start: number; count: number; flagged: boolean };

export function createAnomalyDetector(rules: readonly AnomalyRule[] = ANOMALY_RULES, now: () => number = Date.now, maxKeys = 5_000) {
  const buckets = new Map<string, Bucket>();
  return function observe(event: { event: string; outcome: string; userId?: string | null; ipTag?: string | null }): { rule: string; key: string; count: number }[] {
    const findings: { rule: string; key: string; count: number }[] = [];
    const t = now();
    for (const rule of rules) {
      const key = rule.key(event);
      if (!key) continue;
      const id = `${rule.name}|${key}`;
      let bucket = buckets.get(id);
      if (!bucket || t - bucket.start > rule.windowMs) {
        if (!bucket && buckets.size >= maxKeys) {
          const oldest = buckets.keys().next().value;
          if (oldest !== undefined) buckets.delete(oldest);
        }
        bucket = { start: t, count: 0, flagged: false };
        buckets.set(id, bucket);
      }
      bucket.count += 1;
      if (!bucket.flagged && bucket.count >= rule.threshold) {
        bucket.flagged = true;
        findings.push({ rule: rule.name, key, count: bucket.count });
      }
    }
    return findings;
  };
}
