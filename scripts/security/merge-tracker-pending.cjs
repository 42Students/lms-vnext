#!/usr/bin/env node
// Merges docs/security/tracker-updates-pending.json into docs/tracker.json AFTER a passing CI run exists.
//   node scripts/security/merge-tracker-pending.cjs --sha <40 hex> --run-url <actions run url>          (dry run)
//   node scripts/security/merge-tracker-pending.cjs --sha ... --run-url ... --apply                     (writes)
// Only IMPLEMENTED_UNVERIFIED and PARTIAL_EVIDENCE are merged. GAP_CONFIRMED needs its own traceable proof and
// stays in the draft and in the assessment documents. Nothing here can produce VERIFIED.
const fs = require("fs");
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const sha = arg("--sha");
const runUrl = arg("--run-url");
const apply = args.includes("--apply");
if (!/^[a-f0-9]{40}$/.test(sha || "")) { console.error("--sha must be a full 40-character commit SHA"); process.exit(2); }
if (!/^https:\/\/github\.com\/42Students\/lms-vnext\/actions\/runs\/[0-9]+$/.test(runUrl || "")) { console.error("--run-url must be https://github.com/42Students/lms-vnext/actions/runs/<id>"); process.exit(2); }

const trackerPath = "docs/tracker.json";
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const pending = JSON.parse(fs.readFileSync("docs/security/tracker-updates-pending.json", "utf8"));
const RANK = { UNASSESSED: 0, PARTIAL_EVIDENCE: 1, IMPLEMENTED_UNVERIFIED: 2 };
let merged = 0, skippedGap = 0, skippedLower = 0;
const today = new Date().toISOString().slice(0, 10);

for (const [id, rec] of Object.entries(pending.controls)) {
  const control = tracker.security.controls[id];
  if (!control) throw new Error("control not in tracker: " + id);
  if (!(rec.proposedState in RANK)) { skippedGap += 1; continue; }
  const current = control.state;
  if (current === "VERIFIED" || current === "GAP_CONFIRMED" || current === "NOT_APPLICABLE") continue;
  if ((RANK[current] ?? 0) > RANK[rec.proposedState]) { skippedLower += 1; continue; }
  const evidence = Array.isArray(control.evidence) ? [...control.evidence] : [];
  evidence.push({
    type: "EXECUTED_SCOPED_TEST",
    commitSha: sha,
    runUrl,
    scope: "Security-focused workflow run at this commit (critical authentication and authorization boundary; the same commit also passed explicit selected-role isolation, supply chain, governance files and headers, machine scheduler and scanner boundaries). Not the full CI run and not the RLS policy auditor workflow (red on its own fixture before this work). This run does not by itself prove " + id + "; the assessment and the reviewer decide that. Assessment: " + rec.source + ". " + rec.finding.slice(0, 400),
  });
  const next = { ...control, state: rec.proposedState, assessedAt: today, evidence };
  next.nextProof = "Independent review of the assessment " + rec.source + " and the control-specific checks it lists; dev probes are recorded in docs/security/evidence/.";
  if (rec.proposedState === "IMPLEMENTED_UNVERIFIED") {
    next.remainingChecks = rec.remainingChecks && rec.remainingChecks.length ? rec.remainingChecks : ["Independent review", "Control-specific missing proof listed in the source assessment"];
  } else {
    delete next.remainingChecks;
  }
  tracker.security.controls[id] = next;
  merged += 1;
}
console.log(`${apply ? "applied" : "dry run"}: merged ${merged}, skipped gaps ${skippedGap}, skipped (tracker already further along) ${skippedLower}`);
if (apply) fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
