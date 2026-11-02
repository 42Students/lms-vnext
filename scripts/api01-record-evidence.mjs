#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const api01 = tracker.tasks.find(t => t.id === "API-01");
if (!api01) { console.error("API-01 not found"); process.exit(1); }

const P01_SHA = "813263f757a6f4bab3e4e6dbf36f81e91a61d4ae"; // P01 crosswalk commit
const P01_RUN_ID = 41464740906;
const P01_JOB_ID = 125342549504;
const P02_SHA = "085e520c7dea55307247e9ec0ec4915af0b41417";
const P02_RUN_ID = 41465297130;
const P02_JOB_ID = 125344449800;
const TODAY = "2026-11-02";

// Mark P01 done
const p01 = api01.workPlan.packages.find(p => p.id === "API-01-P01");
if (p01 && !p01.done) {
  p01.acceptanceEvidence = [{
    kind: "EXECUTED_SOURCE_ONLY_API_ENDPOINT_CROSSWALK",
    result: "PASS",
    exitCode: 0,
    commitSha: P01_SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${P01_RUN_ID}`,
    jobId: P01_JOB_ID,
    runner: "GitHub Actions ubuntu-latest Node.js 22",
    commands: ["node --test tests/api01-endpoint-crosswalk.test.mjs"],
    scope: "124 legacy endpoints across 22 controllers: 7 MAPPED, 68 REDESIGNED, 2 RETIRED, 47 MISSING (documented). Source-only gate.",
    boundary: "API-01-P01 endpoint crosswalk only. Integration gate (P02), runtime PG17, and API-02..API-10 remain OPEN.",
  }];
  p01.done = true;
  p01.acceptedAt = TODAY;
  p01.picked = true;
  console.log("Marked API-01-P01 done");
} else {
  console.log("API-01-P01 already done or not found");
}

// Mark P02 done
const p02 = api01.workPlan.packages.find(p => p.id === "API-01-P02");
if (p02 && !p02.done) {
  p02.acceptanceEvidence = [{
    kind: "EXECUTED_SOURCE_ONLY_API_INTEGRATION_GUARD_AND_MISSING_CATALOGUE",
    result: "PASS",
    exitCode: 0,
    commitSha: P02_SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${P02_RUN_ID}`,
    jobId: P02_JOB_ID,
    runner: "GitHub Actions ubuntu-latest Node.js 22",
    commands: ["node --test tests/api01-integration.test.mjs"],
    scope: "9 tests: crosswalk summary integrity, endpoint classification completeness, MAPPED file existence, REDESIGNED vNextPath+notes, MISSING gap documentation, gap cluster coverage, frozen SHA, admin auth guard coverage (104 routes), HTTP method exports.",
    boundary: "API-01-P02 source-only integration gate. Runtime PG17 producer/consumer and API-02..API-10 remain OPEN.",
  }];
  p02.done = true;
  p02.acceptedAt = TODAY;
  p02.picked = true;
  console.log("Marked API-01-P02 done");
} else {
  console.log("API-01-P02 already done or not found");
}

// Mark API-01 task itself done (both packages done)
if (!api01.done) {
  api01.done = true;
  api01.acceptedAt = TODAY;
  api01.acceptanceEvidence = [{
    kind: "TASK_CLOSURE_API01_P01_P02_BOTH_PASSED",
    result: "PASS",
    commitSha: P02_SHA,
    runUrl: `https://github.com/42Students/lms-vnext/actions/runs/${P02_RUN_ID}`,
    note: "API-01-P01 (endpoint crosswalk, 124 endpoints) and API-01-P02 (integration guard + missing catalogue, 9 tests) both passed. 47 MISSING endpoints formally documented as gaps for future work. Auth/admin/shared-infra milestone engineering acceptance complete.",
    acceptedAt: TODAY,
    missingGapCount: 47,
    missingGapNote: "Documented gaps: tenant settings (9), superadmin user-admin/impersonation (7), tenant domain CRUD (6), module-access granular ops (5), log context/digest/deploys (5), auth switch/handoff (4), org CRUD (3), client-settings/error-report (2), feature modules (1), public e2e auth (1), logs-access verify (1), per-user feature flags (1).",
  }];
  console.log("Marked API-01 done");
}

tracker.updatedOn = TODAY;
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
console.log("tracker.json updated");

const apiTasks = tracker.tasks.filter(t => t.id?.startsWith("API-"));
const done = apiTasks.filter(t => t.done).length;
console.log(`\nAPI tasks: ${done}/${apiTasks.length} done`);
