import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static guardrails for UNREGISTERED DB02 SQL, not PostgreSQL acceptance.
const canonical = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const acceptance = readFileSync(
  new URL("../scripts/sql/db02-schedule-progression-integrity-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

test("progression actor deletion semantics are owned by canonical DB02", () => {
  assert.match(canonical, /CREATE FUNCTION db02_guard_cohort_progression_state\(\)/);
  assert.match(canonical, /updated_by_user_id uuid REFERENCES users\(id\) ON DELETE SET NULL/);
  assert.match(canonical, /pg_trigger_depth\(\) >= 2/);
  assert.match(canonical, /OLD\.updated_by_user_id IS NOT NULL/);
  assert.match(canonical, /NEW\.updated_by_user_id IS NULL/);
  assert.match(
    canonical,
    /CREATE TRIGGER db02_cohort_progression_history\s+AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version/,
  );
});

test("FK-driven actor cleanup has no academic event and acceptance checks history", () => {
  assert.match(canonical, /NEW\.current_term_number IS NOT DISTINCT FROM OLD\.current_term_number/);
  assert.match(canonical, /NEW\.version IS NOT DISTINCT FROM OLD\.version/);
  assert.match(acceptance, /DELETE FROM users WHERE id=actor_id/);
  assert.match(acceptance, /Audit actor cleanup forged an academic event/);
});

test("canonical progression state cannot be reassigned, directly deleted, or truncated", () => {
  assert.match(canonical, /CREATE FUNCTION db02_guard_progression_state_identity\(\)/);
  assert.match(canonical, /cohort_id uuid PRIMARY KEY REFERENCES cohorts\(id\) ON DELETE CASCADE/);
  assert.match(canonical, /pg_trigger_depth\(\) >= 2/);
  assert.match(canonical, /not directly deletable/);
  assert.match(canonical, /NEW\.cohort_id IS DISTINCT FROM OLD\.cohort_id/);
  assert.match(canonical, /BEFORE UPDATE OF cohort_id OR DELETE ON cohort_progression_state/);
  assert.match(canonical, /BEFORE TRUNCATE ON cohort_progression_state/);
  assert.match(acceptance, /UPDATE cohort_progression_state SET cohort_id=gen_random_uuid\(\)/);
  assert.match(acceptance, /DELETE FROM cohort_progression_state/);
  assert.match(acceptance, /TRUNCATE cohort_progression_state/);
});

test("timestamp-only schedule changes validate active future room and locking", () => {
  assert.match(canonical, /CREATE FUNCTION db02_guard_future_schedule_room_lifecycle\(\)/);
  assert.match(canonical, /CREATE TRIGGER db02_schedule_future_hall_lifecycle_guard/);
  assert.match(canonical, /BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id/);
  assert.match(canonical, /NEW\.ends_at <= statement_timestamp\(\)/);
  assert.match(canonical, /NEW\.status <> 'SCHEDULED'/);
  assert.match(canonical, /FROM lecture_halls[\s\S]*?FOR SHARE/);
  assert.match(canonical, /current_hall_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(canonical, /CREATE TRIGGER db02_lecture_hall_archive_guard/);
  assert.match(acceptance, /SET starts_at=future_start, ends_at=future_end/);
  assert.match(acceptance, /UPDATE lecture_halls SET status='ARCHIVED'/);
});

test("historic schedule section is immutable after delivery or attendance history", () => {
  assert.match(canonical, /CREATE FUNCTION db02_guard_historic_event_section\(\)/);
  assert.match(canonical, /section_schedule_event_courses ec WHERE ec\.schedule_event_id = OLD\.id/);
  assert.match(canonical, /attendance_sessions a WHERE a\.schedule_event_id = OLD\.id/);
  assert.match(canonical, /attendance_records a WHERE a\.schedule_event_id = OLD\.id/);
  assert.match(canonical, /CREATE TRIGGER db02_historic_event_section_guard/);
});

test("attendance/event history insertion locks schedule parent", () => {
  assert.match(canonical, /CREATE FUNCTION db02_lock_event_for_attendance_history\(\)/);
  assert.match(canonical, /FROM section_schedule_events WHERE id = NEW\.schedule_event_id FOR SHARE/);
  assert.match(canonical, /CREATE TRIGGER db02_attendance_session_event_serialization/);
  assert.match(canonical, /CREATE TRIGGER db02_attendance_record_event_serialization/);
});

test("specialized acceptance remains rollback-only and failure-oriented", () => {
  assert.match(acceptance, /^BEGIN;\s/m);
  assert.match(acceptance, /^ROLLBACK;\s*$/m);
  assert.match(acceptance, /WHEN check_violation/);
  assert.match(acceptance, /DB02 integrity overlay acceptance PASS/);
});
