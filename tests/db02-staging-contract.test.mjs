import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The disposable DB02 overlay is deliberately replayable. PostgreSQL accepts
// CREATE OR REPLACE for either object; normalize that equivalent DDL spelling
// for source-shape checks while retaining the complete trigger/guard bodies.
const sql = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");

const acceptanceSql = readFileSync(
  new URL("../scripts/sql/db02-postgres-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

const concurrencyShell = readFileSync(
  new URL("../scripts/sql/db02-postgres-concurrency-unregistered.sh", import.meta.url),
  "utf8",
);

test("DB02 draft has paired PL/pgSQL dollar-quoted function bodies", () => {
  const functions = [...sql.matchAll(/\bCREATE (?:OR REPLACE )?FUNCTION\s+db02_[a-z_]+\s*\(/g)];
  const openings = [...sql.matchAll(/\bRETURNS trigger LANGUAGE plpgsql AS \$\$/g)];
  const delimiters = [...sql.matchAll(/\$\$/g)];
  assert.ok(functions.length >= 8, "Expected DB02 tenant and lifecycle guards");
  assert.equal(openings.length, functions.length);
  assert.equal(delimiters.length, functions.length * 2);
  assert.doesNotMatch(sql, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
  assert.doesNotMatch(sql, /^\$;$/m);
});

test("DB02 draft persists canonical cohort term, period, year, and history", () => {
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?cohort_progression_state\s*\(/);
  assert.match(sql, /current_term_number integer NOT NULL DEFAULT 1/);
  assert.match(sql, /current_academic_year_start integer/);
  assert.match(sql, /current_period_id uuid REFERENCES academic_periods/);
  assert.match(sql, /version bigint NOT NULL DEFAULT 0/);
  assert.match(sql, /CREATE TRIGGER db02_cohort_progression_initialize\s+AFTER INSERT ON cohorts/);
  assert.match(sql, /NEW\.current_term_number <> OLD\.current_term_number \+ 1/);
  assert.match(sql, /NEW\.version <> OLD\.version \+ 1/);
  assert.match(
    sql,
    /CREATE TRIGGER db02_cohort_progression_history\s+AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version\s+ON cohort_progression_state/,
  );
  assert.match(sql, /CREATE TRIGGER db02_cohort_progression_events_immutable\s+BEFORE INSERT OR UPDATE OR DELETE/);
  assert.match(sql, /pg_trigger_depth\(\)/);
  assert.match(sql, /UNIQUE \(cohort_id, state_version\)/);
});

test("DB02 draft preserves program-scoped term curriculum and same-college courses", () => {
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?program_terms\s*\(/);
  assert.match(sql, /UNIQUE \(program_id, term_number\)/);
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?program_term_courses\s*\(/);
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
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?lecture_halls\s*\(/);
  assert.match(sql, /ADD COLUMN (?:IF NOT EXISTS )?lecture_hall_id uuid REFERENCES lecture_halls/);
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
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?faculty_course_associations\s*\(/);
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

  uniqueNames(/\bCREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)/gi, "tables");
  uniqueNames(/\bCREATE (?:OR REPLACE )?FUNCTION\s+([a-z_][a-z0-9_]*)\s*\(/gi, "functions");
  uniqueNames(/\bCREATE TRIGGER\s+([a-z_][a-z0-9_]*)/gi, "triggers");

  assert.equal([...sql.matchAll(/ADD COLUMN (?:IF NOT EXISTS )?description text/g)].length, 1);
  assert.equal([...sql.matchAll(/ADD COLUMN minimum_capacity integer/g)].length, 1);
  assert.equal([...sql.matchAll(/cohorts_lifecycle_date_order_ck/g)].length, 1);
  assert.doesNotMatch(sql, /ADD COLUMN lifecycle_start_date/);
  assert.doesNotMatch(sql, /ADD COLUMN lifecycle_end_date/);
});

test("DB02 preserves reversible INACTIVE state with transaction-safe enum replacement", () => {
  assert.doesNotMatch(sql, /ALTER TYPE cohort_status ADD VALUE/);
  assert.match(sql, /ALTER TABLE cohorts ALTER COLUMN status DROP DEFAULT/);
  assert.match(sql, /ALTER TYPE cohort_status RENAME TO cohort_status_pre_db02/);
  assert.match(
    sql,
    /CREATE TYPE cohort_status AS ENUM \([\s\S]*'PLANNED'[\s\S]*'ACTIVE'[\s\S]*'INACTIVE'[\s\S]*'COMPLETED'[\s\S]*'ARCHIVED'[\s\S]*\)/,
  );
  assert.match(
    sql,
    /ALTER COLUMN status TYPE cohort_status\s+USING status::text::cohort_status/,
  );
  assert.match(sql, /ALTER COLUMN status SET DEFAULT 'PLANNED'::cohort_status/);
  assert.match(sql, /DROP TYPE cohort_status_pre_db02/);
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


test("DB02 concurrency harness preserves all seventeen race families", () => {
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
    "Race 6A:",
    "Race 6B:",
    "Race 7A:",
    "Race 7B:",
    "Race 8A:",
    "Race 8B:",
    "Race 9A:",
    "Race 9B:",
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
    "PASS curriculum race A",
    "PASS curriculum race B",
    "PASS period race A",
    "PASS period race B",
    "PASS cohort delete race A",
    "PASS cohort delete race B",
    "PASS curriculum type race A",
    "PASS curriculum type race B",
  ]) {
    assert.ok(concurrencyShell.includes(pass), "missing concurrency witness: " + pass);
  }

  assert.match(concurrencyShell, /set -euo pipefail/);
  assert.match(concurrencyShell, /DB02 concurrency acceptance PASS/);
});


test("CORE offering locks curriculum and materialized curriculum cannot be deleted", () => {
  const offeringGuardStart = sql.indexOf("CREATE FUNCTION db02_guard_course_offering_program_term_scope()");
  const offeringGuardEnd = sql.indexOf("CREATE TRIGGER db02_course_offering_program_term_guard", offeringGuardStart);
  assert.ok(offeringGuardStart !== -1 && offeringGuardEnd > offeringGuardStart);
  const offeringGuard = sql.slice(offeringGuardStart, offeringGuardEnd);
  assert.match(sql, /ADD COLUMN program_term_course_id uuid[\s\S]*REFERENCES program_term_courses\(id\) ON DELETE RESTRICT/);
  assert.match(sql, /course_offerings_curriculum_ref_ck/);
  assert.match(sql, /type = 'CORE' AND program_term_course_id IS NOT NULL/);
  assert.match(sql, /type = 'ELECTIVE' AND program_term_course_id IS NULL/);
  assert.match(offeringGuard, /ptc\.id = NEW\.program_term_course_id/);
  assert.match(offeringGuard, /ptc\.program_term_id = NEW\.program_term_id/);
  assert.match(offeringGuard, /ptc\.course_id = NEW\.course_id/);
  assert.match(offeringGuard, /ptc\.type = 'CORE'/);
  assert.match(offeringGuard, /Elective course offering must not claim a fixed curriculum row/);
  assert.match(offeringGuard, /FROM program_term_courses ptc[\s\S]*FOR SHARE/);
  assert.match(sql, /CREATE TRIGGER db02_program_term_course_identity_guard/);
  assert.match(sql, /CREATE TRIGGER db02_program_term_course_delete_guard/);
  assert.match(sql, /Program-term course cannot be removed after an offering exists/);
  assert.match(acceptanceSql, /program_term_course_id/);
  assert.match(acceptanceSql, /materialized curriculum row was deleted/);
  assert.match(acceptanceSql, /program-term course identity was rewritten/);
  assert.match(acceptanceSql, /ELECTIVE offering claimed a fixed curriculum row/);
  assert.match(concurrencyShell, /TERM_COURSE_RACE_A_ID/);
  assert.match(concurrencyShell, /program_term_course_id/);
});


test("referenced academic period dates are stable and child validators lock periods", () => {
  assert.match(sql, /CREATE FUNCTION db02_guard_academic_period_date_history\(\)/);
  assert.match(sql, /CREATE TRIGGER db02_academic_period_date_history_guard/);
  assert.match(sql, /Academic period dates cannot change after academic state references the period/);
  assert.match(sql, /WHERE ap\.id = NEW\.start_period_id[\s\S]*FOR SHARE OF ap/);
  assert.match(sql, /WHERE ap\.id = NEW\.expected_end_period_id[\s\S]*FOR SHARE OF ap/);
  assert.match(sql, /WHERE ap\.id = NEW\.academic_period_id[\s\S]*FOR SHARE OF ap/);
  assert.match(sql, /WHERE ap\.id = NEW\.current_period_id[\s\S]*FOR SHARE OF ap/);
  assert.match(acceptanceSql, /referenced academic period dates were mutable/);
});


test("cohort expected-end edits cannot exclude materialized academic state", () => {
  const guardStart = sql.indexOf("CREATE FUNCTION db02_guard_cohort_period_scope()");
  const guardEnd = sql.indexOf("CREATE TRIGGER db02_cohort_period_scope_guard", guardStart);
  assert.ok(guardStart !== -1 && guardEnd > guardStart);
  const guard = sql.slice(guardStart, guardEnd);
  assert.match(guard, /NEW\.expected_end_period_id IS DISTINCT FROM OLD\.expected_end_period_id/);
  assert.match(guard, /FROM sections s[\s\S]*ap\.end_date > expected_end_day/);
  assert.match(guard, /FROM course_offerings co[\s\S]*ap\.end_date > expected_end_day/);
  assert.match(guard, /FROM cohort_progression_state cps[\s\S]*ap\.end_date > expected_end_day/);
  assert.match(sql, /WHERE c\.id = NEW\.cohort_id[\s\S]*FOR SHARE OF c/);
  assert.match(acceptanceSql, /cohort expected-end shrink excluded existing academic state/);
});


test("history-free cohort hard delete cascades only initializer state", () => {
  assert.match(
    sql,
    /cohort_id uuid PRIMARY KEY REFERENCES cohorts\(id\) ON DELETE CASCADE/,
  );
  assert.match(
    sql,
    /cohort_id uuid NOT NULL REFERENCES cohorts\(id\) ON DELETE RESTRICT/,
  );
  const guardStart = sql.indexOf("CREATE FUNCTION db02_guard_progression_state_identity()");
  const guardEnd = sql.indexOf("CREATE TRIGGER db02_progression_state_identity_guard", guardStart);
  assert.ok(guardStart !== -1 && guardEnd > guardStart);
  const guard = sql.slice(guardStart, guardEnd);
  assert.match(guard, /TG_OP = 'DELETE'/);
  assert.match(guard, /pg_trigger_depth\(\) >= 2/);
  assert.match(guard, /not directly deletable/);
  assert.match(acceptanceSql, /history-free cohort delete did not cascade initializer state/);
  assert.match(acceptanceSql, /cohort with progression history was deleted/);
  assert.match(concurrencyShell, /PASS cohort delete race A/);
  assert.match(concurrencyShell, /PASS cohort delete race B/);
});


test("curriculum display order remains non-unique for legacy parity", () => {
  const start = sql.indexOf("CREATE TABLE IF NOT EXISTS program_term_courses");
  const end = sql.indexOf("CREATE INDEX IF NOT EXISTS program_term_courses_course_idx", start);
  assert.ok(start !== -1 && end > start);
  const table = sql.slice(start, end);
  assert.match(table, /UNIQUE \(program_term_id, course_id\)/);
  assert.doesNotMatch(table, /UNIQUE \(program_term_id, display_order\)/);
  assert.match(table, /CHECK \(display_order >= 1\)/);
  assert.match(acceptanceSql, /duplicate curriculum display_order was unexpectedly rejected/);
});


test("cohort archive lifecycle stays separate from reversible legacy statuses", () => {
  assert.match(sql, /CREATE (?:OR REPLACE )?FUNCTION db02_guard_cohort_status_lifecycle\(\)/);
  assert.match(sql, /CREATE TRIGGER db02_cohort_status_lifecycle_guard/);
  assert.match(sql, /Cohort cannot be created already archived/);
  assert.match(sql, /Archived cohort status is terminal/);
  assert.match(sql, /Cohort may archive only from PLANNED or COMPLETED/);
  assert.match(acceptanceSql, /cohort INACTIVE -> ACTIVE reactivation did not persist/);
  assert.match(acceptanceSql, /cohort was created directly in ARCHIVED state/);
  assert.match(acceptanceSql, /ACTIVE cohort bypassed archive lifecycle/);
  assert.match(acceptanceSql, /ARCHIVED cohort was resurrected/);
});


test("materialized CORE curriculum row cannot change type", () => {
  const start = sql.indexOf("CREATE FUNCTION db02_guard_program_term_course_type_history()");
  const end = sql.indexOf(
    "CREATE TRIGGER db02_program_term_course_type_history_guard",
    start,
  );
  assert.ok(start !== -1 && end > start);
  const guard = sql.slice(start, end);
  assert.match(guard, /NEW\.type IS DISTINCT FROM OLD\.type/);
  assert.match(guard, /co\.program_term_course_id = OLD\.id/);
  assert.match(guard, /co\.type = 'CORE'/);
  assert.match(
    guard,
    /Mapped curriculum cannot change type after CORE offering materialization/,
  );
  assert.match(
    sql,
    /BEFORE UPDATE OF type ON program_term_courses/,
  );
  assert.doesNotMatch(
    sql,
    /db02_program_term_course_identity_guard\s+BEFORE UPDATE OF program_term_id, course_id, type/,
  );
  assert.match(acceptanceSql, /materialized CORE curriculum row changed type/);
  assert.match(concurrencyShell, /PASS curriculum type race A/);
  assert.match(concurrencyShell, /PASS curriculum type race B/);
});


test("shared DB02 harnesses satisfy promotion readiness before progression assertions", () => {
  assert.match(
    acceptanceSql,
    /INSERT INTO program_term_courses\(program_term_id, course_id, type, credits, display_order\)\s+VALUES \(term_a2, course_core_a, 'CORE', 0, 1\)/,
  );
  assert.match(concurrencyShell, /PROMOTION_TERM2_ID="\$\(new_uuid\)"/);
  assert.match(concurrencyShell, /PROMOTION_MAP_ID="\$\(new_uuid\)"/);
  assert.match(
    concurrencyShell,
    /promotion_map_id[\s\S]*program_term_courses[\s\S]*promotion_term2_id/,
  );
  assert.match(
    concurrencyShell,
    /Race 1: two promotions with the same expected version -> exactly one winner/,
  );
});
