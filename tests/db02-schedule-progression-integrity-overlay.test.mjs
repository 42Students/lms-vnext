import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// These are static guardrails for UNREGISTERED SQL, not PostgreSQL acceptance.
const read = (name) => readFileSync(
  new URL("../scripts/sql/" + name, import.meta.url),
  "utf8",
);
const base = read("db02-academic-progression-and-rooms-staging.sql");
// The overlay is now integrated into the single canonical staging SQL.
const overlay = base;
const acceptance = read("db02-schedule-progression-integrity-acceptance-unregistered.sql");

test("consolidated DB02 draft has paired trigger functions", () => {
  const functions = [...overlay.matchAll(/CREATE FUNCTION db02_[a-z_]+\(\)/g)].length;
  const opens = [...overlay.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length;
  const quotes = [...overlay.matchAll(/\$\$/g)].length;
  assert.ok(functions >= 40, "Expected canonical + merged DB02 guards");
  assert.equal(opens, functions);
  assert.equal(quotes, functions * 2);
  assert.doesNotMatch(overlay, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
});

test("newer canonical SQL exclusively owns audit-actor deletion semantics", () => {
  assert.match(base, /CREATE FUNCTION db02_guard_cohort_progression_state\(\)/);
  assert.match(base, /CREATE FUNCTION db02_record_cohort_progression_event\(\)/);
  assert.match(base, /updated_by_user_id uuid REFERENCES users\(id\) ON DELETE SET NULL/);
  assert.match(base, /pg_trigger_depth\(\) >= 2/);
  assert.match(base, /NEW\.updated_by_user_id IS NULL/);
  assert.match(
    base,
    /CREATE TRIGGER db02_cohort_progression_history\s+AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version/,
  );
});

test("FK-driven actor cleanup has no academic event; acceptance checks full history", () => {
  assert.match(base, /OLD\.updated_by_user_id IS NOT NULL/);
  assert.match(base, /NEW\.current_term_number IS NOT DISTINCT FROM OLD\.current_term_number/);
  assert.match(base, /NEW\.version IS NOT DISTINCT FROM OLD\.version/);
  assert.match(acceptance, /DELETE FROM users WHERE id=actor_id/);
  assert.match(acceptance, /Audit actor cleanup forged an academic event/);
});

test("canonical progression identity cannot be reassigned, deleted or truncated", () => {
  assert.match(overlay, /NEW\.cohort_id IS DISTINCT FROM OLD\.cohort_id/);
  assert.match(overlay, /BEFORE UPDATE OF cohort_id OR DELETE ON cohort_progression_state/);
  assert.match(overlay, /BEFORE TRUNCATE ON cohort_progression_state/);
  assert.match(acceptance, /UPDATE cohort_progression_state SET cohort_id=gen_random_uuid\(\)/);
  assert.match(acceptance, /DELETE FROM cohort_progression_state/);
  assert.match(acceptance, /TRUNCATE cohort_progression_state/);
});

test("timestamp-only schedule changes still validate active future room and locking", () => {
  assert.match(overlay, /CREATE TRIGGER db02_schedule_future_hall_lifecycle_guard/);
  assert.match(overlay, /BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id/);
  assert.match(overlay, /NEW\.ends_at <= statement_timestamp\(\)/);
  assert.match(overlay, /NEW\.status <> 'SCHEDULED'/);
  assert.match(overlay, /FROM lecture_halls[\s\S]*?FOR SHARE/);
  assert.match(overlay, /current_hall_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(base, /CREATE TRIGGER db02_lecture_hall_archive_guard/);
  assert.match(acceptance, /SET starts_at=future_start, ends_at=future_end/);
  assert.match(acceptance, /UPDATE lecture_halls SET status='ARCHIVED'/);
});

test("acceptance runs inside a rollback-only disposable PostgreSQL transaction", () => {
  assert.match(acceptance, /^BEGIN;\s/m);
  assert.match(acceptance, /^ROLLBACK;\s*$/m);
  assert.match(acceptance, /WHEN check_violation/);
  assert.match(acceptance, /DB02 integrity overlay acceptance PASS/);
});
