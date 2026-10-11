import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
test("DB25 guard accepts verifier-style disposable local database names", () => {
  const url = "postgresql://test_user:secret@127.0.0.1:5432/lms_vnext_test_4242";
  assert.deepEqual(assertSafeDb01TestTarget({ TEST_DATABASE_URL: url }),
    {host:"127.0.0.1",database:"lms_vnext_test_4242",mode:"local"});
});
test("DB28 guard allows an explicitly named local E2E database", () => {
  const url = "postgresql://e2e_user:secret@127.0.0.1:5432/lms_vnext_e2e";
  assert.deepEqual(assertSafeDb01TestTarget({ TEST_DATABASE_URL: url }),
    {host:"127.0.0.1",database:"lms_vnext_e2e",mode:"local"});
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
const dbE2EPrepareSource = readFileSync(
  "scripts/db-e2e-prepare.ts",
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

test("DB25 independent verifier isolates the destructive reset target", () => {
  assert.match(
    independentVerifierSource,
    /TEST_DATABASE_URL:\s*databaseUrl/,
  );
  assert.match(
    independentVerifierSource,
    /lms_vnext_test_\$\{process\.pid\}/,
  );
  const deleteAppAlias = independentVerifierSource.indexOf(
    "delete destructiveEnv.DATABASE_URL",
  );
  const prepareStep = independentVerifierSource.indexOf(
    '"db:test:prepare"',
  );
  assert.ok(deleteAppAlias >= 0);
  assert.ok(prepareStep > deleteAppAlias);
  assert.match(
    independentVerifierSource.slice(prepareStep, prepareStep + 180),
    /destructiveEnv/,
  );
});


test("DB25 destructive prepare refuses before any database connection when TEST_DATABASE_URL is absent", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB25 process regression");

  const secret = "valuableAppSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-test-prepare.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          `postgresql://app:${secret}@127.0.0.1:1/lms_vnext_test`,
        TEST_DATABASE_URL: "",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /TEST_DATABASE_URL must be explicitly set/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});


test("DB28 browser E2E preflight runs before DATABASE_URL assignment and reset", () => {
  const preflight = dbE2EPrepareSource.indexOf(
    "assertDestructiveE2ETargetPreflight(databaseUrl);",
  );
  const setApplicationUrl = dbE2EPrepareSource.indexOf(
    "process.env.DATABASE_URL = databaseUrl",
  );
  const imports = dbE2EPrepareSource.indexOf(
    "const [",
  );
  const reset = dbE2EPrepareSource.indexOf(
    "await dbLib.resetDatabase(databaseUrl)",
  );

  assert.ok(preflight >= 0);
  assert.ok(setApplicationUrl > preflight);
  assert.ok(imports > setApplicationUrl);
  assert.ok(reset > imports);
  assert.match(
    dbE2EPrepareSource,
    /delete guardEnv\.DATABASE_URL/,
  );
  assert.match(
    dbE2EPrepareSource,
    /db01-test-database-guard\.mjs/,
  );
});

test("DB28 browser E2E preparation refuses a production-like target before connecting", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB28 process regression");

  const secret = "e2eProductionSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-e2e-prepare.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        E2E_DATABASE_URL:
          `postgresql://app:${secret}@127.0.0.1:1/lms_production`,
        DATABASE_URL:
          "postgresql://valuable:do-not-use@127.0.0.1:1/lms_vnext",
        TEST_DATABASE_URL: "",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /not explicitly a test database or E2E database/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});


test("DB48 shared reset helper requires exact remote target confirmation", () => {
  const start = dbLibSource.indexOf(
    "export function assertResetAllowed",
  );
  const end = dbLibSource.indexOf(
    "export async function migrateDatabase",
    start,
  );
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const helper = dbLibSource.slice(start, end);

  assert.match(helper, /ALLOW_DB_RESET/);
  assert.match(helper, /DB_RESET_CONFIRM/);
  assert.match(helper, /target\.host/);
  assert.match(helper, /target\.port/);
  assert.match(helper, /target\.name/);
  assert.match(helper, /postgresql:/);
  assert.match(helper, /postgres:/);
  assert.match(helper, /\[::1\]/);
});

test("DB48 remote db:reset refuses missing exact confirmation before network access", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB48 process regression");

  const secret = "remoteResetSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-reset.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          `postgresql://admin:${secret}@pg.internal:5544/lms_vnext_test`,
        ALLOW_DB_RESET: "true",
        DB_RESET_CONFIRM: "",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /DB_RESET_CONFIRM=RESET:pg\.internal:5544\/lms_vnext_test/,
  );
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB48 remote db:reset rejects wrong target confirmation before network access", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB48 process regression");

  const secret = "wrongConfirmSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-reset.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          `postgresql://admin:${secret}@pg.internal:5544/lms_vnext_test`,
        ALLOW_DB_RESET: "true",
        DB_RESET_CONFIRM:
          "RESET:other.internal:5544/lms_vnext_test",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /DB_RESET_CONFIRM=RESET:pg\.internal:5544\/lms_vnext_test/,
  );
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});
