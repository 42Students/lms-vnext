import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Source contract only: these are NOT passing PostgreSQL/migration witnesses.
const sql = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const acceptance = readFileSync(
  new URL("../scripts/sql/db02-program-archive-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

test("DB02 prevents program archive while live academic cohorts remain", () => {
  assert.match(sql, /CREATE (?:OR REPLACE )?FUNCTION db02_guard_program_archive_with_live_cohorts\(\)/);
  assert.match(sql, /OLD\.status = 'ACTIVE' AND NEW\.status = 'ARCHIVED'/);
  assert.match(sql, /c\.program_id = OLD\.id\s+AND c\.status <> 'ARCHIVED'/);
  assert.match(sql, /Cannot archive program with nonarchived cohorts/);
  assert.match(sql, /CREATE TRIGGER db02_program_archive_cohort_dependency_guard\s+BEFORE UPDATE OF status ON programs/);
});

test("DB02 locks live parent program on both child create and status activation", () => {
  const cohortLifecycle = sql.slice(
    sql.indexOf("CREATE FUNCTION db02_guard_cohort_status_lifecycle()"),
    sql.indexOf("CREATE TRIGGER db02_cohort_status_lifecycle_guard"),
  );
  assert.match(cohortLifecycle, /FROM programs\s+WHERE id = NEW\.program_id FOR SHARE/);
  assert.match(cohortLifecycle, /v_program_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(cohortLifecycle, /Cannot activate or create a cohort under archived program/);
  const parentScope = sql.slice(
    sql.indexOf("CREATE FUNCTION db02_guard_cohort_period_scope()"),
    sql.indexOf("CREATE TRIGGER db02_cohort_period_scope_guard"),
  );
  assert.match(parentScope, /WHERE p\.id = NEW\.program_id\s+FOR SHARE OF p/);
});

test("DB02 program status and cohort status cannot be silently reactivated via unrelated column changes", () => {
  assert.match(sql, /BEFORE INSERT OR UPDATE OF status ON cohorts/);
  assert.match(sql, /BEFORE UPDATE OF status ON programs/);
  assert.match(sql, /Archived cohort status is terminal/);
});

test("rollback-only PG acceptance witnesses all three living child statuses and both commit orders", () => {
  assert.match(acceptance, /^BEGIN;/m);
  assert.match(acceptance, /^ROLLBACK;/m);
  for (const state of ["PLANNED", "ACTIVE", "COMPLETED"]) {
    assert.match(acceptance, new RegExp("program while " + state + " cohort|program with " + state + " historical cohort"));
  }
  for (const error of [
    "Cannot archive program with nonarchived cohorts",
    "Cannot activate or create a cohort under archived program",
    "Archived cohort status is terminal",
  ]) assert.ok(acceptance.includes(error), error);
  assert.match(acceptance, /IF SQLERRM NOT LIKE/);
  assert.match(acceptance, /DB02 program archive cohort dependencies PASS/);
});

test("two-session archive/candidate cohort race has guarded disposable preflight and both winning outcomes", () => {
  const race = readFileSync(
    new URL("../scripts/sql/db02-program-archive-concurrency-unregistered.sh", import.meta.url),
    "utf8",
  );
  const runner = readFileSync(
    new URL("../scripts/sql/db02-run-disposable-acceptance.sh", import.meta.url),
    "utf8",
  );
  assert.match(race, /DB02_DISPOSABLE_ACCEPTANCE/);
  assert.match(race, /DB02_EXPECTED_DATABASE/);
  assert.match(race, /SELECT current_database\(\)/);
  assert.match(race, /ARCHIVED:0/);
  assert.match(race, /ACTIVE:1/);
  assert.match(race, /Cannot archive program with nonarchived cohorts/);
  assert.match(race, /Cannot activate or create a cohort under archived program/);
  assert.match(race, /wait "\$PID_A"/);
  assert.ok(runner.includes("scripts/sql/db02-program-archive-concurrency-unregistered.sh"));
});
