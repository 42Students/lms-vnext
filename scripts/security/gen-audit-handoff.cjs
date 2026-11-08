// Generates docs/security/AUDIT-HANDOFF.md: the pack given to the independent reviewer. Run from the repository root.
const fs = require("fs");
const tracker = require("../../docs/tracker.json").security.controls;
const pending = require("../../docs/security/tracker-updates-pending.json").controls;
const cat = fs.readFileSync("docs/security/control-catalog.md", "utf8").split(/\r?\n/);
const title = {};
for (const l of cat) {
  const m = l.match(/\*\*(SEC-\d\d-\d{3})\*\*\s*[—-]\s*(.*)/);
  if (m) title[m[1]] = m[2].slice(0, 140);
}
const sha = require("child_process").execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const rows = Object.entries(pending)
  .filter(([, r]) => r.proposedState === "IMPLEMENTED_UNVERIFIED")
  .sort(([a], [b]) => a.localeCompare(b));
const byGroup = {};
for (const [id, r] of rows) (byGroup[id.slice(0, 6)] ??= []).push([id, r]);
const counts = Object.values(tracker).reduce((o, c) => ((o[c.state] = (o[c.state] || 0) + 1), o), {});

let out = `# Independent review pack (generated ${new Date().toISOString().slice(0, 10)} at ${sha.slice(0, 10)})

For the reviewer. You should not have seen the author's reasoning: read the control text, the evidence named below and the code, and form your own view. Report per control: ACCEPT, REJECT (with the failing case) or INSUFFICIENT EVIDENCE.

**Tracker state now:** ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}. Nothing is VERIFIED; only your acceptance (plus the deployed-configuration review) can move a control there (\`docs/security/tracker-integration.md\`).

## What to reproduce first

| Check | Command | Expect |
|---|---|---|
| Unauthenticated gate (every route, no credentials) | \`SWEEP_BASE=<local or dev origin> node scripts/verify/unauth-gate.mjs\` | only the baseline of public routes answers; no 5xx |
| Role-by-route matrix | \`SWEEP_BASE=... SWEEP_OTP=<dev test code> node scripts/verify/role-route-matrix.mjs\` | no role gains a route versus \`docs/security/role-matrix-baseline*.json\` |
| Row-level security acceptance (needs a disposable PostgreSQL) | \`node scripts/rls-tenant-acceptance.mjs\` | 34 checks pass as a non-superuser role |
| Runtime database principal | \`node scripts/security/pg-runtime-principal-probe.mjs\` | not superuser, no BYPASSRLS, owns nothing, cannot TRUNCATE |
| Central ratchets | \`npm run security:central\` | all counters at or below the baseline |
| Built output carries no secrets | \`npm run build && node scripts/security/scan-built-bundles.mjs\` | no findings |

Tenant isolation was also probed on the dev deployment (cross-college: 120 routes, same-college: 144 requests): see \`docs/security/evidence/\`.

## Claims to review (IMPLEMENTED_UNVERIFIED), grouped

`;
for (const [group, list] of Object.entries(byGroup)) {
  out += `### ${group}\n\n| Control | Requirement | Evidence and finding |\n|---|---|---|\n`;
  for (const [id, r] of list) out += `| ${id} | ${(title[id] || "").replace(/\|/g, "/")} | ${r.finding.replace(/\|/g, "/").slice(0, 330)} (${r.source}) |\n`;
  out += "\n";
}
out += `## Out of scope for this pass

Controls marked GAP in \`docs/security/tracker-updates-pending.json\` are known open items, not claims. Production was not touched by this program. The owner decisions are in \`docs/security/OWNER-ACTIONS.md\`.
`;
fs.writeFileSync("docs/security/AUDIT-HANDOFF.md", out);
console.log("controls to review:", rows.length, "groups:", Object.keys(byGroup).length);
