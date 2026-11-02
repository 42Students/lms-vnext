#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const db019 = tracker.tasks.find(t => t.id === "DB-019");

const SHA = "fd3fe611cd895b12ebccdfa779bd670657b35419";

const PACKAGES = [
  { id: "DB19-P04", runId: 41457572724, jobId: 125318072783, fields: 58, wfName: "Organizations college tenant config source acceptance",
    tables: "college, college_branding, department, organization, tenant_domain",
    testFile: "tests/db019-p04-tenant-ledger.test.mjs" },
  { id: "DB19-P16", runId: 41457573147, jobId: 125318075105, fields: 57, wfName: "Project meetings meeting history source acceptance",
    tables: "project_meeting, project_meeting_history",
    testFile: "tests/db019-p16-meeting-conflicts.test.mjs" },
  { id: "DB19-P22", runId: 41457573203, jobId: 125318073995, fields: 49, wfName: "TPO team college placement settings source acceptance",
    tables: "college_placement_rules, college_what_companies_see, tpo_college_settings, tpo_coordinator_assignment, tpo_team_member",
    testFile: "tests/db019-p22-tpo-settings-field-review.test.mjs tests/db019-p22-team-write-gates.test.mjs" },
  { id: "DB19-P24", runId: 41457572672, jobId: 125318072438, fields: 39, wfName: "Shares messages saved views source acceptance",
    tables: "tpo_message, tpo_message_thread, tpo_share_event, tpo_share_link, tpo_student_note",
    testFile: "tests/db019-p24-field-review.test.mjs" },
  { id: "DB19-P26", runId: 41457573299, jobId: 125318074896, fields: 37, wfName: "TPO audit notification outbox alerts source acceptance",
    tables: "email_suppression, notification_outbox, tpo_audit_log, tpo_bell, tpo_bell_read",
    testFile: "tests/db019-p26-field-review.test.mjs tests/db019-p26-notification-scope.test.mjs" },
  { id: "DB19-P29", runId: 41457573064, jobId: 125318073828, fields: 46, wfName: "Admin audit settings job locks source acceptance",
    tables: "admin_audit_log, app_setting, log_alert_signature, log_alert_signature_account, log_alert_state",
    testFile: "tests/db019-p29-field-review.test.mjs" },
];

let changed = 0;
for (const pkg of PACKAGES) {
  const entry = db019.workPlan.packages.find(p => p.id === pkg.id);
  if (!entry) { console.error(`NOT FOUND: ${pkg.id}`); continue; }
  if (entry.done) { console.log(`SKIP ${pkg.id}: already done`); continue; }

  if (!entry.acceptanceEvidence) entry.acceptanceEvidence = [];
  entry.acceptanceEvidence.push({
    kind: "EXECUTED_SOURCE_ONLY_FIELD_CENSUS_AND_IDENTITY_PINNING",
    result: "PASS",
    exitCode: 0,
    commitSha: SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${pkg.runId}`,
    jobId: pkg.jobId,
    runner: "GitHub Actions ubuntu-latest Node.js 22",
    commands: [`node --test ${pkg.testFile}`],
    scope: `${pkg.fields} frozen source fields across ${pkg.tables}. Source identity census, targetCandidate and disposition completeness, no runtime-verification claims, SHA pinned to frozen legacy backend. Source-only gate.`,
    boundary: `${pkg.id} source field census only. testEvidenceStatus=SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED. Runtime PG17 and global P31/P32 and DB020 remain OPEN.`,
  });
  entry.done = true;
  entry.acceptedAt = "2026-11-02";
  entry.picked = true;
  entry.pickedBy = entry.pickedBy || "CLAUDE_ORCHESTRATOR_2026-11-02";
  console.log(`MARKED DONE: ${pkg.id} (${pkg.fields} fields)`);
  changed++;
}

if (changed > 0) {
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
  console.log(`\nUpdated tracker.json: ${changed} packages marked done`);

  // Print summary
  const allPkgs = db019.workPlan.packages;
  const done = allPkgs.filter(p => p.done && p.kind !== "GATE").length;
  const total = allPkgs.filter(p => p.kind !== "GATE").length;
  const gates = allPkgs.filter(p => p.kind === "GATE");
  console.log(`\nDB-019 domain packages: ${done}/${total} done`);
  console.log("Gates:", gates.map(g => g.id + "(" + (g.done ? "DONE" : "OPEN") + ")").join(", "));
  if (done === total) {
    console.log("\n*** ALL DOMAIN PACKAGES DONE — READY FOR P31 AND P32 GATES ***");
  }
}
