import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const local = "postgresql://test_user:secret@127.0.0.1:5432/lms_vnext_test";
test("DB01 guard refuses missing TEST_DATABASE_URL", () => {
  assert.throws(() => assertSafeDb01TestTarget({ DATABASE_URL: local }), /TEST_DATABASE_URL must be explicitly set/);
});
test("DB01 guard allows a local isolated test target", () => {
  assert.deepEqual(assertSafeDb01TestTarget({ TEST_DATABASE_URL: local }),
    {host:"127.0.0.1",database:"lms_vnext_test",mode:"local"});
});
test("DB01 guard refuses a production database name", () => {
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL:"postgres://x:x@127.0.0.1/lms_production" }),
    /not explicitly a test database/);
});
test("DB01 guard rejects same app target with different credentials", () => {
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:local, DATABASE_URL:"postgres://other:pass@127.0.0.1/lms_vnext_test"
  }), /configured application database/);
});
test("DB01 guard rejects non-PostgreSQL URL schemes", () => {
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL:"https://127.0.0.1/lms_vnext_test" }),
    /PostgreSQL URL/);
});
test("DB01 guard rejects remote hosts without exact confirmation", () => {
  const TEST_DATABASE_URL="postgres://p:secret@pg.internal/lms_vnext_test";
  assert.throws(() => assertSafeDb01TestTarget({ TEST_DATABASE_URL }), /Remote test database requires/);
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL, DB01_REMOTE_TEST_DATABASE_CONFIRM:"RESET:other/lms_vnext_test"
  }), /Remote test database requires/);
});
test("DB01 guard permits only confirmed remote test host/name", () => {
  assert.deepEqual(assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://p:secret@pg.internal/lms_vnext_test",
    DB01_REMOTE_TEST_DATABASE_CONFIRM:"RESET:pg.internal/lms_vnext_test"
  }), {host:"pg.internal",database:"lms_vnext_test",mode:"explicit-remote"});
});
test("DB01 guard redacts secrets and rejects multiple path segments", () => {
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://p:secret@localhost/lms_vnext_test/schema"
  }), /simple database name/);
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL:"postgres://u:mySecret@pg.internal/test_db"
  }), error => !error.message.includes("mySecret"));
});


const dbLibSource = readFileSync("scripts/db-lib.ts", "utf8");
const dbTestPrepareSource = readFileSync(
  "scripts/db-test-prepare.ts",
  "utf8",
);
const independentVerifierSource = readFileSync(
  "scripts/db-independent-verify.mjs",
  "utf8",
);

test("DB25 shared helper never substitutes DATABASE_URL for TEST_DATABASE_URL", () => {
  const start = dbLibSource.indexOf(
    "export function requireDatabaseUrl",
  );
  const end = dbLibSource.indexOf(
    "export function migrationPoolConfigFromEnv",
    start,
  );
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const helper = dbLibSource.slice(start, end);

  assert.match(
    helper,
    /const value = process\.env\[variableName\]/,
  );
  assert.doesNotMatch(
    helper,
    /variableName === ["']TEST_DATABASE_URL["']/,
  );
  assert.doesNotMatch(helper, /process\.env\.DATABASE_URL/);
});

test("DB25 shared destructive entrypoint preflights before resolving or resetting a database", () => {
  const preflight = dbTestPrepareSource.indexOf(
    "assertDestructiveTestTargetPreflight();",
  );
  const resolveTarget = dbTestPrepareSource.indexOf(
    'requireDatabaseUrl("TEST_DATABASE_URL")',
  );
  const reset = dbTestPrepareSource.indexOf(
    "await resetDatabase(databaseUrl)",
  );

  assert.ok(preflight >= 0);
  assert.ok(resolveTarget > preflight);
  assert.ok(reset > resolveTarget);
  assert.match(
    dbTestPrepareSource,
    /db01-test-database-guard\.mjs/,
  );
});

test("DB25 guard subprocess refuses DATABASE_URL-only invocation without leaking credentials", () => {
  const secret = "valuableSecret";
  const result = spawnSync(
    process.execPath,
    ["scripts/db01-test-database-guard.mjs"],
    {
      encoding: "utf8",
      env: {
        DATABASE_URL:
          `postgresql://app:${secret}@127.0.0.1:5432/lms_vnext_test`,
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /TEST_DATABASE_URL must be explicitly set/,
  );
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB25 independent verifier still supplies an explicit test target before db:test:prepare", () => {
  assert.match(
    independentVerifierSource,
    /TEST_DATABASE_URL:\s*databaseUrl/,
  );
  assert.match(
    independentVerifierSource,
    /"db:test:prepare"/,
  );
});
