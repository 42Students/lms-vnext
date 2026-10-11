import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const runner = readFileSync(
  new URL("../scripts/sql/db02-run-disposable-acceptance.sh", import.meta.url),
  "utf8",
);

const concurrencyScripts = [
  "db02-postgres-concurrency-unregistered.sh",
  "db02-promotion-readiness-concurrency-unregistered.sh",
  "db02-curriculum-type-history-concurrency-unregistered.sh",
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
  assert.match(runner, /Do not run against production\/shared DB/);
});

test("runner fails closed when canonical trigger witnesses are incomplete", () => {
  for (const trigger of [
    "db02_cohort_promotion_readiness_guard",
    "db02_program_term_course_type_history_guard",
    "db02_program_term_delete_history_guard",
    "db02_cohort_status_lifecycle_guard",
    "db02_academic_period_date_history_guard",
    "db02_cohort_progression_history",
    "db02_progression_state_no_truncate",
    "db02_lecture_hall_archive_guard",
    "db02_schedule_future_hall_lifecycle_guard",
    "db02_historic_offering_parent_guard",
    "db02_learner_program_enrollment_tenant",
    "db02_section_enrollment_cohort_period",
  ]) {
    assert.ok(runner.includes(trigger), "missing runner trigger witness: " + trigger);
  }
  assert.match(runner, /TRIGGER_WITNESSES/);
  assert.match(runner, /!= "12"/);
});

test("runner verifies core DB02 tables, columns and INACTIVE enum registration", () => {
  for (const table of [
    "program_terms",
    "program_term_courses",
    "cohort_progression_state",
    "cohort_progression_events",
    "lecture_halls",
    "faculty_course_associations",
  ]) {
    assert.ok(runner.includes("'" + table + "'"), "missing table witness: " + table);
  }
  for (const column of [
    "program_term_id",
    "program_term_course_id",
    "start_date",
    "end_date",
    "description",
    "minimum_capacity",
    "lecture_hall_id",
  ]) {
    assert.ok(runner.includes("'" + column + "'"), "missing column witness: " + column);
  }
  assert.match(runner, /COLUMN_WITNESSES/);
  assert.match(runner, /!= "9"/);
  assert.match(runner, /enumlabel = 'INACTIVE'/);
});

test("runner inventory includes every DB02 rollback acceptance suite", () => {
  for (const path of [
    "db02-postgres-acceptance-unregistered.sql",
    "db02-schedule-progression-integrity-acceptance-unregistered.sql",
    "db02-historic-parent-reassignment-acceptance-unregistered.sql",
    "db02-promotion-readiness-acceptance-unregistered.sql",
    "db02-curriculum-type-history-acceptance-unregistered.sql",
  ]) {
    assert.ok(runner.includes(path), "missing rollback suite: " + path);
  }
});

test("runner inventory includes combined and focused concurrency suites", () => {
  for (const path of [
    "db02-postgres-concurrency-unregistered.sh",
    "db02-promotion-readiness-concurrency-unregistered.sh",
    "db02-curriculum-type-history-concurrency-unregistered.sh",
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
  }
});
