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
test("DB051 canonical guard collapses local host aliases before application target check", () => {
  for (const appHost of ["localhost", "[::1]"]) {
    assert.throws(
      () => assertSafeDb01TestTarget({
        TEST_DATABASE_URL: local,
        DATABASE_URL: `postgresql://app:other-secret@${appHost}:5432/lms_vnext_test`,
      }),
      /configured application database/,
      appHost,
    );
  }
  assert.throws(
    () => assertSafeDb01TestTarget({
      TEST_DATABASE_URL: "postgresql://test:secret@localhost/lms_vnext_test",
      DATABASE_URL: "postgresql://app:secret@127.0.0.1:5432/lms_vnext_test",
    }),
    /configured application database/,
  );
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
test("DB01 guard rejects query parameters that can redirect the PostgreSQL target", () => {
  for (const key of ["host", "hostaddr", "port", "database", "dbname"]) {
    assert.throws(
      () =>
        assertSafeDb01TestTarget({
          TEST_DATABASE_URL:
            `postgresql://test_user:secret@127.0.0.1:5432/lms_vnext_test?${key}=pg.internal`,
        }),
      new RegExp(`query parameter "${key}" may redirect the destructive target`),
    );
  }
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
  assert.doesNotMatch(
    dbE2EPrepareSource,
    /delete guardEnv\.DATABASE_URL/,
    "E2E must preserve the current application target for alias detection",
  );
  assert.match(
    dbE2EPrepareSource,
    /TEST_DATABASE_URL: databaseUrl/,
  );
  assert.match(
    dbE2EPrepareSource,
    /process\.env\.DATABASE_URL === databaseUrl/,
  );
  assert.match(
    dbE2EPrepareSource,
    /process\.env\.TEST_DATABASE_URL === databaseUrl/,
  );
  assert.match(
    dbE2EPrepareSource,
    /DATABASE_URL: dedicatedE2EAlias \? undefined : process\.env\.DATABASE_URL/,
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
  assert.match(helper, /resetTarget\(databaseUrl\)/);
  const targetStart = dbLibSource.indexOf("function resetTarget(databaseUrl: string)");
  assert.ok(targetStart >= 0, "shared reset uses the canonical target parser");
  const targetParser = dbLibSource.slice(targetStart, start);
  assert.match(targetParser, /postgresql:/);
  assert.match(targetParser, /postgres:/);
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


test("DB48 reset URL cannot redirect a locally approved authority through query parameters", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB48 process regression");

  const secret = "redirectSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-reset.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          `postgresql://admin:${secret}@127.0.0.1:5432/lms_vnext_test?host=pg.internal`,
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /query parameter "host" may redirect the destructive target/);
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});


test("DB48 default PostgreSQL port is part of the exact confirmation token", () => {
  const helperStart = dbLibSource.indexOf(
    "export function assertResetAllowed",
  );
  const helperEnd = dbLibSource.indexOf(
    "export async function migrateDatabase",
    helperStart,
  );
  const helper = dbLibSource.slice(helperStart, helperEnd);

  assert.match(
    dbLibSource,
    /port:\s*parsed\.port \|\| ["']5432["']/,
  );
  assert.match(
    helper,
    /RESET:\$\{target\.host\}:\$\{target\.port\}\/\$\{target\.name\}/,
  );
  assert.match(
    helper,
    /process\.env\.DB_RESET_CONFIRM !== expectedConfirmation/,
  );
});

test("DB48 independent verifier preserves remote reset confirmation gates for destructive prepare", () => {
  const destructiveStart = independentVerifierSource.indexOf(
    "const destructiveEnv = { ...env };",
  );
  const prepareStep = independentVerifierSource.indexOf(
    '"db:test:prepare"',
    destructiveStart,
  );
  assert.ok(destructiveStart >= 0);
  assert.ok(prepareStep > destructiveStart);

  const setup = independentVerifierSource.slice(
    Math.max(0, destructiveStart - 500),
    prepareStep + 220,
  );
  assert.doesNotMatch(
    setup,
    /delete destructiveEnv\.(ALLOW_DB_RESET|DB_RESET_CONFIRM|DB01_REMOTE_TEST_DATABASE_CONFIRM)/,
  );
  assert.match(
    setup,
    /delete destructiveEnv\.DATABASE_URL/,
  );
});

test("DB48 browser E2E reset inherits exact remote confirmation instead of synthesizing one", () => {
  assert.match(
    dbE2EPrepareSource,
    /const guardEnv(?::\s*NodeJS\.ProcessEnv)?\s*=\s*\{\s*\.\.\.process\.env,/,
  );
  assert.doesNotMatch(
    dbE2EPrepareSource,
    /DB_RESET_CONFIRM\s*=/,
  );
  assert.doesNotMatch(
    dbE2EPrepareSource,
    /ALLOW_DB_RESET\s*=/,
  );
  assert.match(
    dbE2EPrepareSource,
    /await dbLib\.resetDatabase\(databaseUrl\)/,
  );
});


test("DB48 protected PostgreSQL database names are case-insensitive", () => {
  const helperStart = dbLibSource.indexOf(
    "export function assertResetAllowed",
  );
  const helperEnd = dbLibSource.indexOf(
    "export async function migrateDatabase",
    helperStart,
  );
  const helper = dbLibSource.slice(helperStart, helperEnd);

  assert.match(
    helper,
    /target\.name\.toLowerCase\(\)/,
  );
  for (const name of ["postgres", "template0", "template1"]) {
    assert.ok(helper.includes(`"${name}"`));
  }
});


test("DB51 localhost non-test db:reset requires exact confirmation before network access", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB51 process regression");

  const secret = "proxyResetSecret";
  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-reset.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          `postgresql://admin:${secret}@127.0.0.1:1/lms_vnext`,
        ALLOW_DB_RESET: "true",
        DB_RESET_CONFIRM: "",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /DB_RESET_CONFIRM=RESET:127\.0\.0\.1:1\/lms_vnext/,
  );
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB51 local disposable-name bypass is limited to explicit test/E2E names", () => {
  const helperStart = dbLibSource.indexOf(
    "export function assertResetAllowed",
  );
  const helperEnd = dbLibSource.indexOf(
    "export async function migrateDatabase",
    helperStart,
  );
  const helper = dbLibSource.slice(helperStart, helperEnd);

  assert.match(helper, /explicitlyDisposableName/);
  assert.match(
    helper,
    /\(\?:test\|e2e\).*\(\?:test\|e2e\)/,
  );
  assert.match(
    helper,
    /if \(isLocal && explicitlyDisposableName\) \{\s*return;/,
  );
  assert.doesNotMatch(
    helper,
    /if \(localHosts\.has\(target\.host\)\) \{\s*return;/,
  );
});

test("DB51 wrong localhost confirmation refuses before any connection", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB51 process regression");

  const result = spawnSync(
    process.execPath,
    [tsx, "scripts/db-reset.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://admin:redacted@localhost:1/lms_vnext",
        DB_RESET_CONFIRM:
          "RESET:localhost:1/lms_vnext_other",
      },
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /DB_RESET_CONFIRM=RESET:localhost:1\/lms_vnext/,
  );
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
});


test("DB51 explicit local test/E2E names remain on the frictionless branch", () => {
  const start = dbLibSource.indexOf(
    "export function assertResetAllowed",
  );
  const end = dbLibSource.indexOf(
    "export async function migrateDatabase",
    start,
  );
  const helper = dbLibSource.slice(start, end);

  assert.match(
    helper,
    /if \(isLocal && explicitlyDisposableName\) \{\s*return;/,
  );
  for (const name of [
    "lms_vnext_test",
    "lms_vnext_test_4242",
    "lms_vnext_e2e",
    "test_lms_vnext",
  ]) {
    assert.match(name, /^(?:(?:test|e2e)_[a-z0-9_]+|[a-z0-9_]+_(?:test|e2e)(?:_[a-z0-9]+)*)$/i);
  }
});


test("DB55 deterministic seed checks authorization before constructing PostgreSQL Pool", () => {
  const seedStart = dbLibSource.indexOf("export async function seedDatabase(databaseUrl: string)");
  const body = dbLibSource.slice(seedStart);
  assert.ok(seedStart >= 0);
  const guard = body.indexOf("assertSeedAllowed(databaseUrl);");
  const pool = body.indexOf("new Pool(");
  assert.ok(guard >= 0 && pool > guard);
  const guardStart = dbLibSource.indexOf("export function assertSeedAllowed(databaseUrl: string)");
  assert.ok(guardStart >= 0);
  const guardEnd = dbLibSource.indexOf("\n}\n", guardStart);
  assert.ok(guardEnd > guardStart, "seed authorization helper closes before database pool setup");
  const helper = dbLibSource.slice(guardStart, guardEnd + 2);
  assert.match(helper, /DB_SEED_CONFIRM/);
  assert.match(helper, /ALLOW_DB_SEED/);
  assert.match(helper, /DB_RESET_CONFIRM/);
  assert.match(helper, /assertResetAllowed\(databaseUrl\)/);
  assert.match(helper, /resetTarget\(databaseUrl\)/);
  assert.doesNotMatch(helper, /new Pool\(/);
});

test("DB55 direct local development seed refuses absent confirmation without connecting", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB55 process regression");
  const secret = "sensitiveLocalSeedSecret";
  const result = spawnSync(process.execPath, [tsx, "scripts/db-seed.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: `postgresql://admin:${secret}@localhost:1/lms_vnext`,
      DB_SEED_CONFIRM: "",
      DB_RESET_CONFIRM: "",
      ALLOW_DB_SEED: "",
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /DB_SEED_CONFIRM=SEED:localhost:1\/lms_vnext/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB55 direct remote seed requires explicit opt-in even with exact SEED token", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB55 process regression");
  const result = spawnSync(process.execPath, [tsx, "scripts/db-seed.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://admin:hiddenRemoteSeed@pg.internal:5444/lms_vnext_test",
      DB_SEED_CONFIRM: "SEED:pg.internal:5444/lms_vnext_test",
      DB_RESET_CONFIRM: "",
      ALLOW_DB_SEED: "",
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /ALLOW_DB_SEED=true/);
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused|hiddenRemoteSeed/i);
});

test("DB55 local fake test target cannot redirect through host query parameter", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB55 process regression");
  const result = spawnSync(process.execPath, [tsx, "scripts/db-seed.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://admin:doNotPrint@localhost:1/lms_vnext_test?host=production.internal",
      DB_SEED_CONFIRM: "",
      DB_RESET_CONFIRM: "",
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /query parameter "host" may redirect the destructive target/);
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused|doNotPrint/i);
});

test("DB55 reset-authorized seed still requires remote reset opt-in", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB55 process regression");
  const result = spawnSync(process.execPath, [tsx, "scripts/db-seed.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://admin:hiddenPassword@pg.internal:5444/lms_vnext_test",
      DB_RESET_CONFIRM: "RESET:pg.internal:5444/lms_vnext_test",
      DB_SEED_CONFIRM: "",
      ALLOW_DB_RESET: "",
      ALLOW_DB_SEED: "",
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /ALLOW_DB_RESET=true/);
  assert.doesNotMatch(output, /ENOTFOUND|ECONNREFUSED|connection refused|hiddenPassword/i);
});

// DB-004: The staged authentication triggers are deliberately unregistered.
// Catch SQL lexer failures BEFORE promoting them into a numbered migration.
// An earlier code-generation edit silently turned "AS $$" into "AS $":
// JavaScript string replacement interprets "$$" in replacement arguments.
const authLifecycleSqlPaths = [
  "docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql",
  "docs/planning/sql/db01-auth-handoff-lifecycle-guard-staging.sql",
];

function assertPairedDb01AuthFunctionQuotes(sql) {
  const declarations = [...sql.matchAll(
    /\bRETURNS\s+trigger\s+LANGUAGE\s+plpgsql\s+AS\s+(\$\$|\$[A-Za-z_][A-Za-z_0-9]*\$|\$)(?=\s|$)/gi,
  )];
  assert.equal(declarations.length, 1, "exactly one PL/pgSQL trigger function must be declared");
  const delimiter = declarations[0][1];
  assert.notEqual(delimiter, "$", "lone-dollar PL/pgSQL opener is invalid PostgreSQL syntax");
  assert.match(sql.slice(declarations[0].index), /\bBEGIN\b[\s\S]*?\bEND;\s*\$\$;/);
  assert.equal(sql.split(delimiter).length - 1, 2,
    "exactly one paired SQL function body delimiter required");
}

test("DB004 auth PL/pgSQL guards require paired dollar delimiters", () => {
  for (const sqlPath of authLifecycleSqlPaths) {
    const sql = readFileSync(sqlPath, "utf8");
    assertPairedDb01AuthFunctionQuotes(sql);
    assert.match(sql, /BEFORE INSERT OR UPDATE ON identity_auth_(?:attempts|handoffs)/);
  }
});

test("DB004 auth SQL preflight detects a malformed lone-dollar function opener", () => {
  const sql = readFileSync(authLifecycleSqlPaths[0], "utf8");
  const mutated = sql.replace("LANGUAGE plpgsql AS $$", "LANGUAGE plpgsql AS $");
  assert.notEqual(mutated, sql);
  assert.throws(() => assertPairedDb01AuthFunctionQuotes(mutated),
    /lone-dollar PL\/pgSQL opener/);
});

test("DB004 auth SQL preflight detects an unpaired function-body terminator", () => {
  const sql = readFileSync(authLifecycleSqlPaths[1], "utf8");
  const mutated = sql.replace("END;\n$$;", "END;\n$;");
  assert.notEqual(mutated, sql);
  assert.throws(() => assertPairedDb01AuthFunctionQuotes(mutated),
    /END|paired SQL function body delimiter/);
});

test("DB051 hostless PostgreSQL URLs never inherit a socket or PGHOST target", () => {
  for (const scheme of ["postgres", "postgresql"]) {
    const url = scheme + ":///lms_vnext_test";
    assert.throws(() => assertSafeDb01TestTarget({
      TEST_DATABASE_URL: url,
      PGHOST: "production.internal",
      DB01_REMOTE_TEST_DATABASE_CONFIRM: "RESET:/lms_vnext_test",
    }), /explicit PostgreSQL host/);
  }
});

test("DB051 hostless application URL is refused before comparing destructive aliases", () => {
  assert.throws(() => assertSafeDb01TestTarget({
    TEST_DATABASE_URL: local,
    DATABASE_URL: "postgresql:///lms_vnext_test",
  }), /explicit PostgreSQL host/);
});

test("DB28 browser E2E preparation refuses an alias of the configured application DB", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB28 process regression");
  const secret = "doNotLeakE2EAliasSecret";
  const result = spawnSync(process.execPath, [tsx, "scripts/db-e2e-prepare.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      E2E_DATABASE_URL: `postgresql://e2e:${secret}@127.0.0.1:1/lms_vnext_e2e`,
      DATABASE_URL: "postgresql://app:other-secret@localhost:1/lms_vnext_e2e",
      TEST_DATABASE_URL: "",
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /Refusing to reset the configured application database/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB28 only exempts an exactly triple-bound explicitly named E2E test database", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx));
  const secret = "doNotLeakNonE2ESecret";
  const target = `postgresql://test:${secret}@127.0.0.1:1/lms_vnext_test`;
  const result = spawnSync(process.execPath, [tsx, "scripts/db-e2e-prepare.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: target,
      TEST_DATABASE_URL: target,
      E2E_DATABASE_URL: target,
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /Refusing to reset the configured application database/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("DB28 accepts the intentional disposable E2E triple URL preflight", () => {
  const tsx = "node_modules/tsx/dist/cli.mjs";
  assert.ok(existsSync(tsx), "tsx must be installed before running DB28 process regression");
  const url = "postgresql://e2e:private-disposable-test@127.0.0.1:1/lms_vnext_e2e";
  const result = spawnSync(process.execPath, [tsx, "scripts/db-e2e-prepare.ts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: url,
      TEST_DATABASE_URL: url,
      E2E_DATABASE_URL: url,
    },
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.match(output, /DB01 test-target preflight PASS: local 127\.0\.0\.1\/lms_vnext_e2e/);
  assert.doesNotMatch(output, /Refusing to reset the configured application database/);
  assert.doesNotMatch(output, /private-disposable-test/);
});
