import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const integration = fs.readFileSync(
  "tests/integration/db06-assessment-parent-scope.test.ts",
  "utf8",
);
const verifier = fs.readFileSync(
  "scripts/db-independent-verify.mjs",
  "utf8",
);
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("DB030 PostgreSQL witness suite preserves the minimum PG01-PG16 matrix", () => {
  for (let n = 1; n <= 16; n += 1) {
    const marker = "PG" + String(n).padStart(2, "0");
    assert.ok(integration.includes(marker), "missing " + marker);
  }
});

test("DB030 0042 hardening witnesses remain authored", () => {
  for (const marker of [
    "PG15B",
    "PG16B",
    "PG17",
    "PG18",
    "PG19",
    "PG19B",
    "PG20",
    "PG21",
    "PG22",
  ]) {
    assert.ok(integration.includes(marker), "missing " + marker);
  }
  assert.match(integration, /bindElective/);
  assert.match(integration, /course_teaching_assignments/);
  assert.match(integration, /DB06_ISOLATED_TEST_DATABASE/);
});

test("DB030 independent verifier enables the isolated DB06 witness suite", () => {
  assert.match(
    verifier,
    /DB06_ISOLATED_TEST_DATABASE:\s*"1"/,
  );
  assert.match(
    verifier,
    /"PostgreSQL integration \/ negative witnesses"/,
  );
  assert.match(
    verifier,
    /\["run", "test:db"\]/,
  );
});

test("DB030 has a targeted disposable-Postgres command for assessment witnesses", () => {
  assert.equal(
    pkg.scripts["test:db06:pg"],
    "vitest run --config vitest.db.config.ts tests/integration/db06-assessment-parent-scope.test.ts",
  );
});
