import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const registeredConfig = readFileSync(new URL("../vitest.db.registered.config.ts", import.meta.url), "utf8");

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
