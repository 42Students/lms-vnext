import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const db19P21Workflow = readFileSync(new URL("../.github/workflows/db019-p21-external-offers-pg17.yml", import.meta.url), "utf8");
const registeredConfig = readFileSync(new URL("../vitest.db.registered.config.ts", import.meta.url), "utf8");
const db19P18Pg17 = readFileSync(new URL("../tests/integration/placements-db08-registration.test.ts", import.meta.url), "utf8");
const db19P18ScreeningPg17 = readFileSync(new URL("../tests/integration/placements-p6a-screening.test.ts", import.meta.url), "utf8");

const expectedSuites = {
  "db08-staged-acceptance": [
    "placements-db08-batches.test.ts",
    "placements-db08-registration.test.ts",
    "placements-db08-external-offers.test.ts",
    "placements-w04-company-drive-facts.test.ts",
    // These two isolated DB08 suites are also run by db08-staged-acceptance;
    // neither may be replayed in the registered-only PG job.
    "placements-phase2-learner-gates.test.ts",
    "tpo-batch-workspace-db08.test.ts",
  ],
  "db019-p21-external-offers-pg17": [
    "placements-p21-saved-jobs.test.ts",
  ],
  "db10-skills-acceptance": [
    "db10-skills-catalog.test.ts",
    "db10-log-alert-admin.test.ts",
  ],
  "db10-outbound-acceptance": [
    "db10-outbound-queue.test.ts",
    "db10-outbound-scope-fk.test.ts",
  ],
};

test("registered PG replay excludes exactly the independently exercised staged suites", () => {
  const excluded = [...registeredConfig.matchAll(/"tests\/integration\/([^"]+\.test\.ts)"/g)]
    .map((match) => match[1]).sort();
  const expected = Object.values(expectedSuites).flat().sort();
  assert.deepEqual(excluded, expected);
  assert.match(workflow, /npx vitest run --config vitest\.db\.registered\.config\.ts/);
  assert.match(registeredConfig, /from "\.\/vitest\.db\.config"/);
});

test("each staged PG suite has an independently running, real SQL-backed job", () => {
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  for (const [name, files] of Object.entries(expectedSuites)) {
    if (name === "db019-p21-external-offers-pg17") {
      assert.match(db19P21Workflow, /postgres:17-alpine/, "P21 requires PostgreSQL 17");
      assert.match(db19P21Workflow, /db:test:prepare/, "P21 requires destructive-test preflight");
      assert.match(db19P21Workflow, /npm run db:migrate/, "P21 requires registered replay");
      assert.match(db19P21Workflow, /DB08_ISOLATED_TEST_DATABASE: "1"/);
      assert.match(db19P21Workflow, /DB03_ISOLATED_TEST_DATABASE: "1"/);
      for (const suite of files) {
        assert.ok(db19P21Workflow.includes("tests/integration/" + suite),
          "excluded from registered replay without independent P21 PG17 witness: " + suite);
      }
      continue;
    }
    const start = workflow.indexOf("  " + name + ":\n");
    assert.ok(start >= 0, "missing CI job: " + name);
    const nextJob = workflow.slice(start + 1).search(/^  [a-z][\w-]*:\s*$/m);
    const body = nextJob === -1
      ? workflow.slice(start)
      : workflow.slice(start, start + 1 + nextJob);
    assert.match(body, /postgres:17-alpine/, "no PostgreSQL fixture: " + name);
    assert.match(body, /db:test:prepare/, "no destructive-test target preflight: " + name);
    assert.match(body, /psql "\$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1/, "missing real staged SQL: " + name);
    assert.match(body, /npx vitest run --config vitest\.db\.config\.ts/, "no real PostgreSQL suite: " + name);
    for (const suite of files) {
      assert.ok(body.includes("tests/integration/" + suite),
        "excluded from registered replay without independent witness: " + suite);
    }
  }
});

test("DB19-P18 learner revocation race stays in the registered disposable PG17 matrix", () => {
  const start = workflow.indexOf("  db08-staged-acceptance:\n");
  assert.ok(start >= 0, "DB08 PostgreSQL acceptance job is missing");
  const nextJob = workflow.slice(start + 1).search(/^  [a-z][\w-]*:\s*$/m);
  const job = nextJob === -1
    ? workflow.slice(start)
    : workflow.slice(start, start + 1 + nextJob);
  assert.match(job, /postgres:17-alpine/);
  assert.match(job, /tests\/integration\/placements-db08-registration\.test\.ts/);
  assert.match(db19P18Pg17, /rejects a revoked learner role before writing restriction or history/);
  assert.match(db19P18Pg17, /serializes a concurrent learner role revoke before debarment creation/);
  assert.match(db19P18Pg17, /SELECT membership_id FROM membership_roles[^\n]+FOR UPDATE/);
  assert.match(db19P18Pg17, /DB08_DEBARMENT_MEMBER_INVALID/);
  assert.match(db19P18Pg17, /restrictions\.rows\)\.toHaveLength\(0\)/);
});

test("DB19-P18 screening actor revocation and repair race use registered PG17", () => {
  // Unlike DB08 registration, screening is a journalled table and must run
  // against the registered zero-to-head PostgreSQL fixture, not a staged one.
  assert.doesNotMatch(registeredConfig, /"tests\/integration\/placements-p6a-screening\.test\.ts"/);
  const start = workflow.indexOf("  database:\n");
  assert.ok(start >= 0, "missing registered database job");
  const nextJob = workflow.slice(start + 1).search(/^  [a-z][\w-]*:\s*$/m);
  const job = nextJob === -1
    ? workflow.slice(start)
    : workflow.slice(start, start + 1 + nextJob);
  assert.match(job, /postgres:17-alpine/);
  assert.match(job, /npx vitest run --config vitest\.db\.registered\.config\.ts/);
  assert.match(db19P18ScreeningPg17, /rejects learner screening reads after a persisted LEARNER role revoke/);
  assert.match(db19P18ScreeningPg17, /rejects a stale screening read when the persisted learner account is disabled/);
  assert.match(db19P18ScreeningPg17, /blocks a decision when the persisted TPO role is revoked after authentication/);
  assert.match(db19P18ScreeningPg17, /blocks a decision when the persisted screening manager account is disabled/);
  assert.match(db19P18ScreeningPg17, /serializes screening decisions with an in-flight TPO grant revoke/);
  assert.match(db19P18ScreeningPg17, /denies candidate-contact queue, paged queue and private history after persisted staff role revoke/);
  assert.match(db19P18ScreeningPg17, /denies staff-only queue and history while persisted manager account is disabled/);
  assert.match(db19P18ScreeningPg17, /does not reveal the staff screening queue when a grant revoke wins the read race/);
  assert.match(db19P18ScreeningPg17, /cannot recreate a missing screening row after staff grant revocation/);
  assert.match(db19P18ScreeningPg17, /cannot repair a screening row for a withdrawn application/);
  assert.match(db19P18ScreeningPg17, /history\.rows\)\.toHaveLength\(0\)/);
});
