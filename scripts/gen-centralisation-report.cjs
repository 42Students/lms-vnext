// Writes docs/planning/centralisation-before-after-2026-11-14.md from the first committed baseline and the current one.
// Usage: node scripts/gen-centralisation-report.cjs <path-to-first-baseline.json>
const fs = require("fs");
const first = process.argv[2];
const a = JSON.parse(fs.readFileSync(first, "utf8")).counts;
const b = JSON.parse(fs.readFileSync("docs/security/baselines/centralisation.json", "utf8")).counts;
const labels = {};
for (const m of fs.readFileSync("scripts/centralisation-metrics.mjs", "utf8").matchAll(/id: "([^"]+)", audit: (\d+), label: ["']((?:[^"'\\]|\\.)*)["']/g)) labels[m[1]] = m[3];
const rows = Object.keys(a).map((k) => {
  const d = b[k] - a[k];
  return `| \`${k}\` | ${labels[k] ?? ""} | ${a[k]} | ${b[k]} | ${d > 0 ? "+" : ""}${d} |`;
});
const md = `# Centralisation: before and after (2026-11-14, overnight program)

Counts come from \`scripts/centralisation-metrics.mjs\`; "before" is the baseline committed in Phase 0, "after" is
\`docs/security/baselines/centralisation.json\` at the end of the run. 31 of 35 metrics are now enforced ratchets: CI fails if any
of them rises. The process.env row now excludes NODE_ENV (a build-time constant), so its drop overstates the change slightly.

| Metric | What it counts | Before | After | Change |
|---|---|---:|---:|---:|
${rows.join("\n")}

## What moved and what did not

Moved (central module built, call sites migrated): process.env reads and readiness flags (src/config), role literals (ROLE),
Asia/Kolkata literals (DEFAULT_TIME_ZONE and the clock), Cache-Control literals (src/security/responses), rate-limit and timeout
literals (src/security/limits), cookie writes (src/auth/cookies), request-body readers (src/lib/request-body), download headers
(src/security/downloads), CSV cell copies (spreadsheetCsvCell), uuid schemas (zUuid), PAGE_SIZE constants (src/lib/pagination),
machine-job credentials (src/security/jobs).

Built but call sites NOT migrated (the ratchet only holds the line): authorization (generated permission matrix, resource guards),
requireCurrentVersion, recordActivity, the error registry beyond the status table, the idempotency option, typed routes.

Not built: repositories (5.2), notification service (5.6), settings service (5.7), status registry (6.3), legacy table (6.5),
locale/currency/phone module (6.6), date and money inputs (6.7), copy catalogue (7.1), design-token reduction (7.2).
`;
fs.writeFileSync("docs/planning/centralisation-before-after-2026-11-14.md", md);
console.log("wrote report", rows.length);
