import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// These are static guardrails for UNREGISTERED SQL, not PostgreSQL acceptance.
const read = (name) => readFileSync(
  new URL("../scripts/sql/" + name, import.meta.url),
  "utf8",
);
const base = read("db02-academic-progression-and-rooms-staging.sql");
const overlay = read("db02-schedule-progression-integrity-overlay.draft.sql");
const acceptance = read("db02-schedule-progression-integrity-acceptance-unregistered.sql");

test("audit and schedule overlay is syntactically dollar-quote paired", () => {
  const functions = [...overlay.matchAll(/CREATE (?:OR REPLACE )?FUNCTION db02_[a-z_]+\(\)/g)].length;
  const opens = [...overlay.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length;
  const quotes = [...overlay.matchAll(/\$\$/g)].length;
  assert.equal(functions, 4);
  assert.equal(opens, 4);
  assert.equal(quotes, 8);
  assert.doesNotMatch(overlay, /LANGUAGE plpgsql AS \$(?:\r?\n)/);
});

test("overlay works against the canonical exact function identities", () => {
  for (const name of [
    "db02_guard_cohort_progression_state",
    "db02_record_cohort_progression_event",
  ]) {
    assert.match(base, new RegExp("CREATE FUNCTION " + name + "\\(\\)"));
    assert.match(overlay, new RegExp("CREATE OR REPLACE FUNCTION " + name + "\\(\\)"));
  }
  assert.match(base, /updated_by_user_id uuid REFERENCES users\(id\) ON DELETE SET NULL/);
  assert.match(base, /CREATE TRIGGER db02_cohort_progression_history/);
});

test("FK-driven actor pseudonymization cannot forge academic progression history", () => {
  const filter = /\bpg_trigger_depth\(\) >= 2[\s\S]*?OLD\.updated_by_user_id IS NOT NULL[\s\S]*?NEW\.updated_by_user_id IS NULL[\s\S]*?to_jsonb\(NEW\) - 'updated_by_user_id'/;
  const occurrences = [...overlay.matchAll(new RegExp(filter.source, "g"))];
  assert.equal(occurrences.length, 2, "one exception each in guard/history");
  assert.match(overlay, /to_jsonb\(OLD\) - 'updated_by_user_id'/);
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
