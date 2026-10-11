import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sql = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
);

const acceptanceSql = readFileSync(
  new URL("../scripts/sql/db02-postgres-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

const concurrencyShell = readFileSync(
  new URL("../scripts/sql/db02-postgres-concurrency-unregistered.sh", import.meta.url),
  "utf8",
);

test("DB02 draft has paired PL/pgSQL dollar-quoted function bodies", () => {
  const functions = [...sql.matchAll(/\bCREATE FUNCTION\s+db02_[a-z_]+\s*\(/g)];
  const openings = [...sql.matchAll(/\bRETURNS trigger LANGUAGE plpgsql AS \$\$/g)];
  const delimiters = [...sql.matchAll(/\$\$/g)];
  assert.ok(functions.length >= 8, "Expected DB02 tenant and lifecycle guards");
  assert.equal(openings.length, functions.length);
  assert.equal(delimiters.length, functions.length * 2);
  assert.doesNotMatch(sql, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
  assert.doesNotMatch(sql, /^\$;$/m);
});

test("DB02 draft persists canonical cohort term, period, year, and history", () => {
  assert.match(sql, /CREATE TABLE cohort_progression_state\s*\(/);
  assert.match(sql, /current_term_number integer NOT NULL DEFAULT 1/);
  assert.match(sql, /current_academic_year_start integer/);
  assert.match(sql, /current_period_id uuid REFERENCES academic_periods/);
  assert.match(sql, /version bigint NOT NULL DEFAULT 0/);
  assert.match(sql, /CREATE TRIGGER db02_cohort_progression_initialize\s+AFTER INSERT ON cohorts/);
  assert.match(sql, /NEW\.current_term_number <> OLD\.current_term_number \+ 1/);
  assert.match(sql, /NEW\.version <> OLD\.version \+ 1/);
  assert.match(sql, /CREATE TRIGGER db02_cohort_progression_history\s+AFTER UPDATE ON cohort_progression_state/);
  assert.match(sql, /CREATE TRIGGER db02_cohort_progression_events_immutable\s+BEFORE INSERT OR UPDATE OR DELETE/);
  assert.match(sql, /pg_trigger_depth\(\)/);
  assert.match(sql, /UNIQUE \(cohort_id, state_version\)/);
});

test("DB02 draft preserves program-scoped term curriculum and same-college courses", () => {
  assert.match(sql, /CREATE TABLE program_terms\s*\(/);
  assert.match(sql, /UNIQUE \(program_id, term_number\)/);
  assert.match(sql, /CREATE TABLE program_term_courses\s*\(/);
  assert.match(sql, /UNIQUE \(program_term_id, course_id\)/);
  assert.match(sql, /db02_program_term_bounds_guard/);
  assert.match(sql, /db02_program_term_course_tenant/);
  assert.match(sql, /program_college <> course_college/);
});

test("DB02 draft scopes schedule faculty even without any lecture hall", () => {
  const guardStart = sql.indexOf("CREATE FUNCTION db02_guard_schedule_hall_tenant()");
  const guardEnd = sql.indexOf("CREATE TRIGGER db02_schedule_hall_tenant_guard", guardStart);
  assert.ok(guardStart !== -1 && guardEnd > guardStart);
  const body = sql.slice(guardStart, guardEnd);
  assert.match(body, /faculty_college <> section_college/);
  assert.match(body, /faculty_membership_id IS NOT NULL/);
  assert.doesNotMatch(body, /IF NEW\.lecture_hall_id IS NULL THEN\s+RETURN NEW;/);
  assert.match(sql, /UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status/);
});

test("DB02 draft prevents overlapping faculty, section, and room bookings", () => {
  assert.match(sql, /CREATE TABLE lecture_halls\s*\(/);
  assert.match(sql, /ADD COLUMN lecture_hall_id uuid REFERENCES lecture_halls/);
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS btree_gist/);
  for (const resource of ["section", "faculty", "hall"]) {
    assert.match(sql, new RegExp("section_schedule_events_" + resource + "_no_overlap_excl"));
  }
  assert.match(sql, /tstzrange\(starts_at, ends_at, '\[\)'\) WITH &&/);
  assert.match(sql, /status = 'SCHEDULED'/);
});

test("term-bound course offerings are tenant and program scoped", () => {
  assert.match(sql, /ADD COLUMN program_term_id uuid NOT NULL/);
  assert.match(sql, /db02_course_offering_program_term_guard/);
  assert.match(sql, /term_program <> cohort_program/);
  assert.match(sql, /course_college <> cohort_college OR period_college <> cohort_college/);
  assert.match(sql, /NEW\.type = 'CORE'/);
});

test("faculty course pool is persisted and tenant scoped", () => {
  assert.match(sql, /CREATE TABLE faculty_course_associations\s*\(/);
  assert.match(sql, /db02_faculty_course_association_scope_guard/);
  assert.match(sql, /membership_college <> course_college/);
  assert.match(sql, /ended_at timestamptz/);
});

test("DB02 draft prevents reductions below configured or current terms", () => {
  assert.match(sql, /db02_program_duration_reduction_guard/);
  assert.match(sql, /current_term_number > NEW\.duration_terms/);
  assert.match(sql, /pt\.term_number > NEW\.duration_terms/);
  assert.match(sql, /FOR SHARE OF p/);
});

test("schedule instructor is active, authorized, and from the section college", () => {
  assert.match(sql, /faculty_membership_id AND status = 'ACTIVE'/);
  assert.match(sql, /mr\.role = 'FACULTY'/);
  assert.match(sql, /faculty_college <> section_college/);
});


test("DB02 draft has no duplicate created tables, functions, triggers, or compatibility column blocks", () => {
  const uniqueNames = (regex, label) => {
    const names = [...sql.matchAll(regex)].map((match) => match[1]);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    assert.deepEqual(duplicates, [], `Duplicate ${label}: ${duplicates.join(", ")}`);
  };

  uniqueNames(/\bCREATE TABLE\s+([a-z_][a-z0-9_]*)/gi, "tables");
  uniqueNames(/\bCREATE FUNCTION\s+([a-z_][a-z0-9_]*)\s*\(/gi, "functions");
  uniqueNames(/\bCREATE TRIGGER\s+([a-z_][a-z0-9_]*)/gi, "triggers");

  assert.equal([...sql.matchAll(/ADD COLUMN description text/g)].length, 1);
  assert.equal([...sql.matchAll(/ADD COLUMN minimum_capacity integer/g)].length, 1);
  assert.equal([...sql.matchAll(/cohorts_lifecycle_date_order_ck/g)].length, 1);
  assert.doesNotMatch(sql, /ADD COLUMN lifecycle_start_date/);
  assert.doesNotMatch(sql, /ADD COLUMN lifecycle_end_date/);
});

test("DB02 preserves reversible legacy INACTIVE cohort state and independent batch dates", () => {
  assert.match(sql, /ALTER TYPE cohort_status ADD VALUE IF NOT EXISTS 'INACTIVE'/);
  assert.match(sql, /ALTER TABLE cohorts\s+ADD COLUMN start_date date,\s+ADD COLUMN end_date date/);
  assert.match(sql, /cohorts_lifecycle_date_order_ck/);
});

test("DB02 user deletion scrubs progression actor references without creating academic history", () => {
  const guardStart = sql.indexOf("CREATE FUNCTION db02_guard_cohort_progression_state()");
  const guardEnd = sql.indexOf("CREATE TRIGGER db02_cohort_progression_state_guard", guardStart);
  assert.ok(guardStart !== -1 && guardEnd > guardStart);
  const guard = sql.slice(guardStart, guardEnd);

  assert.match(guard, /pg_trigger_depth\(\) >= 2/);
  assert.match(guard, /OLD\.updated_by_user_id IS NOT NULL/);
  assert.match(guard, /NEW\.updated_by_user_id IS NULL/);
  assert.match(guard, /NEW\.current_term_number IS NOT DISTINCT FROM OLD\.current_term_number/);
  assert.match(guard, /NEW\.version IS NOT DISTINCT FROM OLD\.version/);

  assert.match(
    sql,
    /CREATE TRIGGER db02_cohort_progression_history\s+AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version\s+ON cohort_progression_state/,
  );
  assert.doesNotMatch(
    sql,
    /db02_cohort_progression_history\s+AFTER UPDATE OF[^\n]*updated_by_user_id/,
  );

  assert.match(acceptanceSql, /DELETE FROM users WHERE id = user_progression_actor/);
  assert.match(acceptanceSql, /actor deletion mutated progression state/);
  assert.match(acceptanceSql, /actor deletion manufactured progression history/);
});


test("DB02 concurrency harness preserves all nine race families", () => {
  for (const label of [
    "Race 1:",
    "Race 2A:",
    "Race 2B:",
    "Race 3A:",
    "Race 3B:",
    "Race 4A:",
    "Race 4B:",
    "Race 5A:",
    "Race 5B:",
  ]) {
    assert.match(concurrencyShell, new RegExp("# " + label));
  }

  for (const pass of [
    "PASS promotion CAS race",
    "PASS hall race A",
    "PASS hall race B",
    "PASS section race A",
    "PASS section race B",
    "PASS offering race A",
    "PASS offering race B",
    "PASS event race A",
    "PASS event race B",
  ]) {
    assert.ok(concurrencyShell.includes(pass), "missing concurrency witness: " + pass);
  }

  assert.match(concurrencyShell, /set -euo pipefail/);
  assert.match(concurrencyShell, /DB02 concurrency acceptance PASS/);
});
