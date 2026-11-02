#!/usr/bin/env node
/**
 * Records CI run acceptance evidence for packages that have passing CI runs
 * and marks them as done=true in docs/tracker.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const db019 = tracker.tasks.find(t => t.id === "DB-019");

// Evidence data from GitHub Actions CI runs verified passing on 2026-11-02
const EVIDENCE = [
  {
    id: "DB19-P03",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P03_AUTH_SESSION_REVOCATION",
      result: "PASS",
      exitCode: 0,
      commitSha: "b37489c33b5562ae36de220a0634a8e1da4f7b33",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41315378843",
      jobId: 124874248774,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "node --test tests/db019-p03-auth-source-quality.test.mjs",
        "npm run db:journal:verify",
        "npm run db:test:prepare (DATABASE_URL cleared, registered PG17 zero-to-head)",
        "npm run db:migrate (idempotent replay)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/db019-p03-auth-session-pg.test.ts",
        "npx vitest run tests/unit/chat6-auth-session-service-behaviour.test.ts tests/unit/chat6-auth-logout-revocation.test.ts",
      ],
      scope: "P03 auth session revocation, credential retirement, email-link ownership, preuser proof binding, scoped account verification, OTP field compat, account-lock and login-consume semantics. Registered PG17 zero-to-head replay; source quality gate included.",
      boundary: "P03 scoped authentication and session revocation evidence only. Remaining DB19 domain packages, global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P17",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P17_PLACEMENT_JOBS_APPLICATIONS_OFFERS",
      result: "PASS",
      exitCode: 0,
      commitSha: "65e6d14bc49e17056f2d7b1053a0ac92d079718d",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41315100803",
      jobId: 124873773567,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/placements-p3*.test.ts",
      ],
      scope: "P17 placement jobs, applications and offers lifecycle. Registered PG17 zero-to-head. Credential-bearing letter URL rejection and safe-URL preservation verified.",
      boundary: "P17 scoped placement job/application/offer evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P18",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P18_SCREENING_DEBARMENT",
      result: "PASS",
      exitCode: 0,
      commitSha: "f8f2296fd1a5adfb5f3259c395c6a93663d20d33",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41407076314",
      jobId: 125151614528,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "node --test tests/db019-p18-field-review.test.mjs",
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/placements-p2*.test.ts",
      ],
      scope: "P18 placement screening, eligibility and debarment. Disabled-target and in-flight learner revocation. Source field review test included. Registered PG17 full zero-to-head.",
      boundary: "P18 scoped screening/debarment evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P19",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P19_DRIVE_DAY_ATTENDANCE",
      result: "PASS",
      exitCode: 0,
      commitSha: "62dd6d6fc9fbd1f4ba1e98121f9388b8bc3c1486",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41346012131",
      jobId: 124965860443,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/placements-p4*.test.ts",
      ],
      scope: "P19 interviews, round attendance and results, drive-day attendance, persisted-role PostgreSQL17. College Admin privilege cannot substitute revoked learner role. Registered PG17 zero-to-head.",
      boundary: "P19 scoped drive-day attendance and interview round evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P20",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P20_AFTER_COLLEGE_PLACEMENT_REGISTRATION",
      result: "PASS",
      exitCode: 0,
      commitSha: "fbc1920518235dac0364313e7abffa5d3c3afca9",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41401396448",
      jobId: 125133772409,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/placements-p1*.test.ts",
      ],
      scope: "P20 placement registration, batches and seasons. After-college registered PG17 acceptance. Registered PG17 zero-to-head replay and idempotence.",
      boundary: "P20 scoped placement registration/batch/season evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P21",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P21_SAVED_JOBS_EXTERNAL_OFFERS",
      result: "PASS",
      exitCode: 0,
      commitSha: "177db3b847b0152aed01b90c515cc3eb368a5b6a",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41410468080",
      jobId: 125162492502,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/placements-saved-*.test.ts",
      ],
      scope: "P21 saved jobs, preferences and external placements. Registered tenant guard SQLSTATE and explicit consent. External offer authorization PG17 acceptance. Registered PG17 zero-to-head.",
      boundary: "P21 scoped saved-jobs/external-offer evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
  {
    id: "DB19-P28",
    evidence: {
      kind: "EXECUTED_EXACT_SHA_REGISTERED_PG17_P28_TRACKER_PRIVACY_RACE",
      result: "PASS",
      exitCode: 0,
      commitSha: "7890360893dc12165d8efe980f3e61a9d9a786fc",
      runUrl: "https://github.com/42Students/lms-vnext/actions/runs/41314677497",
      jobId: 124872095154,
      runner: "GitHub Actions ubuntu-latest Node.js 22 and disposable PostgreSQL17-alpine",
      commands: [
        "node --test tests/db019-p28-tracker-field-review.test.mjs",
        "npm run db:journal:verify",
        "npm run db:test:prepare (registered PG17 zero-to-head)",
        "npm run db:migrate (idempotence)",
        "npx vitest run --config vitest.db.registered.config.ts tests/integration/tracker-*.test.ts",
      ],
      scope: "P28 bug tracker, sessions and attachments. Tracker privacy, race and registered PostgreSQL acceptance. PG17 parent-lock screenshot capacity under two concurrent writers. Registered PG17 zero-to-head.",
      boundary: "P28 scoped tracker/attachment evidence only. Global P31/P32 and DB020 remain OPEN.",
    },
  },
];

let changed = 0;
for (const { id, evidence } of EVIDENCE) {
  const pkg = db019.workPlan.packages.find(p => p.id === id);
  if (!pkg) {
    console.error(`Package ${id} not found in tracker`);
    continue;
  }
  if (pkg.done) {
    console.log(`SKIP ${id}: already done`);
    continue;
  }
  if (!pkg.acceptanceEvidence) pkg.acceptanceEvidence = [];
  pkg.acceptanceEvidence.push(evidence);
  pkg.done = true;
  pkg.acceptedAt = "2026-11-02";
  pkg.picked = true;
  pkg.pickedBy = pkg.pickedBy || `CLAUDE_ORCHESTRATOR_2026-11-02`;
  console.log(`MARKED DONE: ${id} — evidence recorded at ${evidence.runUrl}`);
  changed++;
}

if (changed > 0) {
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
  console.log(`\nUpdated tracker.json: ${changed} packages marked done`);
} else {
  console.log("No changes needed");
}
