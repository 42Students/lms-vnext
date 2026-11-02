#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));

const api08 = tracker.tasks.find(t => t.id === "API-08");
const TODAY = "2026-11-02";
const SHA = "9a581e47359b125861e816acb1b7cafa4e8a70cd";
const RUN_ID = 41466788863;
const JOB_ID = 125349675479;

// Mark API-08-P02 done
const p02 = api08.workPlan.packages.find(p => p.id === "API-08-P02");
if (p02 && !p02.done) {
  p02.done = true;
  p02.acceptedAt = TODAY;
  p02.acceptanceEvidence = [{
    kind: "EXECUTED_SOURCE_ONLY_API_INTEGRATION_GUARD_AND_MISSING_CATALOGUE",
    result: "PASS",
    exitCode: 0,
    commitSha: SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${RUN_ID}`,
    jobId: JOB_ID,
    runner: "GitHub Actions ubuntu-latest Node.js 22",
    commands: ["node --test tests/api08-integration.test.mjs"],
    scope: "9 source-only tests: crosswalk summary integrity, 14 MAPPED files verified on disk, TPO/placement route auth guards scanned, TpoHub dashboard gaps (4) catalogued, LearnerEligibility gaps (3) catalogued, 28 MISSING total documented, frozen SHA pinned.",
    boundary: "API-08-P02 TPO/recruiter CRM source-only integration gate. No DB. API-09 and API-10 remain OPEN.",
  }];
  console.log("Marked API-08-P02 done");
}

// Check if both P01 and P02 are done → close API-08
const p01 = api08.workPlan.packages.find(p => p.id === "API-08-P01");
if (p01?.done && p02?.done && !api08.done) {
  api08.done = true;
  api08.acceptedAt = TODAY;
  api08.acceptanceEvidence = [{
    kind: "TASK_CLOSURE_API08_P01_P02_BOTH_PASSED",
    result: "PASS",
    commitSha: SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${RUN_ID}`,
    note: "API-08-P01 (endpoint crosswalk, 118 endpoints: 14 MAPPED, 76 REDESIGNED, 28 MISSING) and API-08-P02 (integration guard + gap catalogue, 9 tests) both passed CI. 28 gaps formally documented.",
    acceptedAt: TODAY,
  }];
  console.log("Closed API-08 (P01+P02 both done)");
}

tracker.updatedOn = TODAY;
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");

const apiDone = tracker.tasks.filter(t => t.id?.startsWith("API-") && t.done).length;
const apiTotal = tracker.tasks.filter(t => t.id?.startsWith("API-")).length;
const totalDone = tracker.tasks.filter(t => t.done).length;
console.log(`API tasks: ${apiDone}/${apiTotal} done`);
console.log(`Total tasks: ${totalDone}/${tracker.tasks.length} done`);
