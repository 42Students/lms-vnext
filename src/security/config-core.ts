/**
 * Central secret and configuration validation (docs/security/central-security-architecture.md, layer L11).
 *
 * Pure: takes the environment as a plain object. One registry (`secret-registry.ts`) names every machine secret
 * and key the platform reads, so a weak, placeholder, reused or malformed value is found in one place instead
 * of at the first request that happens to use it. Messages never contain the secret value.
 */

export type SecretSpec = {
  name: string;
  /** What reads it, for the operator reading the report. */
  purpose: string;
  /** "secret": at least `minBytes` of text. "base64-key": base64 decoding to exactly `bytes` bytes. */
  kind: "secret" | "base64-key";
  minBytes?: number;
  bytes?: number;
  /** Required when NODE_ENV is production; optional (but validated when present) elsewhere. */
  requiredInProduction: boolean;
  /** Must differ from every other secret that sets this flag (a shared value defeats isolation). */
  distinct?: boolean;
};

export type ConfigIssue = { name: string; code: "MISSING" | "TOO_SHORT" | "PLACEHOLDER" | "BAD_KEY" | "REUSED"; message: string };

const PLACEHOLDER = /^(?:changeme|change-me|change_me|secret|password|test|dummy|example|placeholder|todo|xxx+|0+|1+|a+)$/i;

export function checkSecrets(env: Record<string, string | undefined>, specs: readonly SecretSpec[], production: boolean): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const seen = new Map<string, string>();
  for (const spec of specs) {
    const raw = env[spec.name];
    if (raw === undefined || raw.trim() === "") {
      if (production && spec.requiredInProduction) issues.push({ name: spec.name, code: "MISSING", message: `${spec.name} is required in production (${spec.purpose}).` });
      continue;
    }
    const value = raw.trim();
    if (PLACEHOLDER.test(value) || /^(?:your[-_ ]|replace[-_ ]|<.*>$)/i.test(value)) {
      issues.push({ name: spec.name, code: "PLACEHOLDER", message: `${spec.name} looks like a placeholder.` });
      continue;
    }
    if (spec.kind === "secret") {
      const min = spec.minBytes ?? 32;
      if (Buffer.byteLength(value, "utf8") < min) {
        issues.push({ name: spec.name, code: "TOO_SHORT", message: `${spec.name} must be at least ${min} bytes.` });
        continue;
      }
    } else {
      const bytes = spec.bytes ?? 32;
      const ok = /^[A-Za-z0-9+/_-]+={0,2}$/.test(value) && Buffer.from(value, "base64").length === bytes;
      if (!ok) {
        issues.push({ name: spec.name, code: "BAD_KEY", message: `${spec.name} must be base64 for exactly ${bytes} bytes.` });
        continue;
      }
    }
    if (spec.distinct) {
      const other = seen.get(value);
      if (other) issues.push({ name: spec.name, code: "REUSED", message: `${spec.name} reuses the value of ${other}.` });
      else seen.set(value, spec.name);
    }
  }
  return issues;
}
