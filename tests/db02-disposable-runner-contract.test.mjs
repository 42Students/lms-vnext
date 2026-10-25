import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const runner = readFileSync(
  new URL("../scripts/sql/db02-run-disposable-acceptance.sh", import.meta.url),
  "utf8",
);

const sharedTargetGuard = readFileSync(
  new URL("../scripts/sql/db02-assert-disposable-target.sh", import.meta.url),
  "utf8",
);
const archiveRace = readFileSync(
  new URL("../scripts/sql/db02-program-archive-concurrency-unregistered.sh", import.meta.url),
  "utf8",
);

const concurrencyScripts = [
  "db02-postgres-concurrency-unregistered.sh",
  "db02-promotion-readiness-concurrency-unregistered.sh",
  "db02-curriculum-type-history-concurrency-unregistered.sh",
  "db02-role-reactivation-concurrency-unregistered.sh",
  "db02-active-parent-lifecycle-concurrency-unregistered.sh",
].map((name) => ({
  name,
  source: readFileSync(
    new URL(`../scripts/sql/${name}`, import.meta.url),
    "utf8",
  ),
}));

test("runner is opt-in and verifies exact disposable database identity", () => {
  assert.match(runner, /DB02_DISPOSABLE_ACCEPTANCE:-/);
  assert.match(runner, /DB02_EXPECTED_DATABASE/);
  assert.match(runner, /SELECT current_database\(\)/);
  assert.match(runner, /DB name mismatch/);
  assert.match(runner, /MUST NOT be run against production\/shared DB/);
});

test("runner validates the real URL through the shared fail-closed guard before psql", () => {
  assert.match(runner, /assertSafeDb01TestTarget/);
  assert.match(runner, /TEST_DATABASE_URL: process\.env\.DATABASE_URL/);
  assert.match(runner, /DATABASE_URL: process\.env\.DB02_APP_DATABASE_URL/);
  assert.match(runner, /DB01_REMOTE_TEST_DATABASE_CONFIRM: process\.env\.DB01_REMOTE_TEST_DATABASE_CONFIRM/);
  assert.match(runner, /target\.database !== process\.env\.DB02_EXPECTED_DATABASE/);
  assert.match(runner, /DB02 expected database does not match guarded URL target/);
  const guardStart = runner.indexOf("node --input-type=module");
  const databaseConnect = runner.indexOf('ACTUAL_DATABASE="$(psql');
  assert.ok(guardStart >= 0 && databaseConnect > guardStart,
    "test-target guard must run before any database connection");
  assert.match(runner, /Guarded|guarded/);
  assert.doesNotMatch(runner, /console\.log\([^)]*process\.env\.DATABASE_URL/);
});

test("runner derives and compares the exact canonical DB02 trigger manifest", () => {
  assert.match(runner, /EXPECTED_TRIGGER_NAMES/);
  assert.match(
    runner,
    /grep -Eo '\^CREATE \(OR REPLACE \)\?TRIGGER db02_\[a-z0-9_\]\+'/,
  );
  assert.match(runner, /REGISTERED_TRIGGER_NAMES/);
  assert.match(runner, /tgname LIKE 'db02_%'/);
  assert.match(runner, /ORDER BY tgname/);
  assert.match(runner, /canonical migration trigger manifest mismatch/);
  assert.match(runner, /EXPECTED_TRIGGER_COUNT/);
  assert.doesNotMatch(runner, /required trigger witnesses: 22/);
});

test("runner derives staged table and added-column manifests from canonical DB02 source", () => {
  assert.match(runner, /EXPECTED_TABLE_NAMES/);
  assert.match(runner, /grep -Eo '\^CREATE TABLE \(IF NOT EXISTS \)\?\[a-z0-9_\]\+'/);
  assert.match(runner, /information_schema\.tables/);
  assert.match(runner, /missing staged table: \$table/);
  assert.match(runner, /EXPECTED_TABLE_COUNT/);

  assert.match(runner, /EXPECTED_COLUMN_PAIRS/);
  assert.match(runner, /\^ALTER TABLE \[a-z0-9_\]\+/);
  assert.match(runner, /ADD COLUMN/);
  assert.match(runner, /information_schema\.columns/);
  assert.match(runner, /missing staged column: \$pair/);
  assert.match(runner, /EXPECTED_COLUMN_COUNT/);

  assert.doesNotMatch(runner, /required: 6, found/);
  assert.doesNotMatch(runner, /required: 9, found/);
  assert.match(runner, /enumlabel = 'INACTIVE'/);
});

test("runner inventory includes every DB02 rollback acceptance suite", () => {
  assert.match(runner, /tests\/db02-role-reactivation-contract\.test\.mjs/);
  assert.match(runner, /tests\/db02-active-parent-lifecycle-contract\.test\.mjs/);
  for (const path of [
    "db02-postgres-acceptance-unregistered.sql",
    "db02-schedule-progression-integrity-acceptance-unregistered.sql",
    "db02-historic-parent-reassignment-acceptance-unregistered.sql",
    "db02-promotion-readiness-acceptance-unregistered.sql",
    "db02-curriculum-type-history-acceptance-unregistered.sql",
    "db02-activation-role-lifecycle-acceptance-unregistered.sql",
    "db02-active-parent-lifecycle-acceptance-unregistered.sql",
  ]) {
    assert.ok(runner.includes(path), "missing rollback suite: " + path);
  }
});

test("runner inventory includes combined and focused concurrency suites", () => {
  for (const path of [
    "db02-postgres-concurrency-unregistered.sh",
    "db02-promotion-readiness-concurrency-unregistered.sh",
    "db02-curriculum-type-history-concurrency-unregistered.sh",
    "db02-role-reactivation-concurrency-unregistered.sh",
    "db02-active-parent-lifecycle-concurrency-unregistered.sh",
  ]) {
    assert.ok(runner.includes(path), "missing concurrency suite: " + path);
  }
});

test("runner executes source tests, rollback SQL, then race suites with fail-fast semantics", () => {
  assert.match(runner, /set -euo pipefail/);
  assert.match(runner, /node --test "\$\{source_tests\[@\]\}"/);
  assert.match(runner, /psql "\$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "\$path"/);
  assert.match(runner, /bash "\$path"/);
  assert.match(runner, /DB02 disposable acceptance all checks completed with exit code 0/);
});

test("direct concurrency scripts fail closed to the explicitly named disposable database", () => {
  for (const { name, source } of concurrencyScripts) {
    assert.match(source, /DB02_DISPOSABLE_ACCEPTANCE:-/, name);
    assert.match(source, /DB02_EXPECTED_DATABASE/, name);
    assert.match(source, /SELECT current_database\(\)/, name);
    assert.match(source, /DB name mismatch/, name);
    assert.match(source, /Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES/, name);

    const executableCheck = source.indexOf("command -v psql");
    const databaseCheck = source.indexOf('ACTUAL_DATABASE="$(psql');
    assert.ok(executableCheck >= 0, name + ": missing psql executable preflight");
    assert.ok(
      databaseCheck > executableCheck,
      name + ": database identity check must run only after psql availability is established",
    );
  }
});

test("all six direct DB02 race scripts source guarded URL validation before connecting", () => {
  assert.match(sharedTargetGuard, /assertSafeDb01TestTarget/);
  assert.match(sharedTargetGuard, /TEST_DATABASE_URL: process\.env\.DATABASE_URL/);
  assert.match(sharedTargetGuard, /DATABASE_URL: process\.env\.DB02_APP_DATABASE_URL/);
  assert.match(sharedTargetGuard, /DB01_REMOTE_TEST_DATABASE_CONFIRM/);
  assert.match(sharedTargetGuard, /target\.database !== process\.env\.DB02_EXPECTED_DATABASE/);
  const allScripts = [...concurrencyScripts, {
    name: "db02-program-archive-concurrency-unregistered.sh",
    source: archiveRace,
  }];
  assert.equal(allScripts.length, 6);
  for (const { name, source } of allScripts) {
    const shared = source.indexOf("source scripts/sql/db02-assert-disposable-target.sh");
    const firstConnect = source.indexOf('ACTUAL_DATABASE="$(psql');
    assert.ok(shared >= 0, name + ": missing shared safe-target verification");
    assert.ok(firstConnect > shared, name + ": unsafe direct PostgreSQL access");
  }
});

test("DB02 target guard rejects production names, redirects, remote ambiguity and app DB reuse", () => {
  const TEST_DATABASE_URL = "postgres://test:secret@127.0.0.1:5432/db02_acceptance_test";
  assert.equal(assertSafeDb01TestTarget({ TEST_DATABASE_URL }).database,
    "db02_acceptance_test");
  assert.throws(
    () => assertSafeDb01TestTarget({
      TEST_DATABASE_URL: "postgres://test:secret@127.0.0.1:5432/lms_production",
    }),
    /not explicitly a test database/,
  );
  assert.throws(
    () => assertSafeDb01TestTarget({
      TEST_DATABASE_URL: TEST_DATABASE_URL + "?host=production.internal",
    }),
    /may redirect the destructive target/,
  );
  assert.throws(
    () => assertSafeDb01TestTarget({
      TEST_DATABASE_URL: "postgres://test:secret@production.internal/db02_acceptance_test",
    }),
    /Remote test database requires/,
  );
  assert.throws(
    () => assertSafeDb01TestTarget({
      TEST_DATABASE_URL,
      DATABASE_URL: "postgres://different:secret@127.0.0.1:5432/db02_acceptance_test",
    }),
    /configured application database/,
  );
});

test("runner trigger preflight cannot drift behind later canonical hardening", () => {
  assert.match(
    runner,
    /scripts\/sql\/db02-academic-progression-and-rooms-staging\.sql/,
  );
  assert.match(runner, /sort -u/);
  assert.match(runner, /missing OR unexpected db02_\* trigger fails closed/i);
  assert.match(runner, /trigger manifest preflight PASS/);
});
