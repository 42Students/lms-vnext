import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sql = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
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
