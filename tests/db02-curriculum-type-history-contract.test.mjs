import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// These are only static guardrails for UNREGISTERED SQL. They do not run PG.
const read = (name) => readFileSync(
  new URL("../scripts/sql/" + name, import.meta.url), "utf8",
);
const base = read("db02-academic-progression-and-rooms-staging.sql")
  .replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
// The guard and its trigger are now within canonical DB02 staging.
const typeStart = base.indexOf("CREATE FUNCTION db02_guard_program_term_course_type_history()");
const typeEnd = base.indexOf("-- Legacy semester-course credits", typeStart);
const guard = base.slice(typeStart, typeEnd);
const acceptance = read("db02-curriculum-type-history-acceptance-unregistered.sql");
const races = read("db02-curriculum-type-history-concurrency-unregistered.sh");

test("consolidated curriculum-type guard has one paired trigger", () => {
  assert.match(guard, /CREATE FUNCTION db02_guard_program_term_course_type_history\(\)/);
  assert.match(guard, /CREATE TRIGGER db02_program_term_course_type_history_guard/);
  assert.equal([...guard.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)].length, 1);
  assert.equal([...guard.matchAll(/\$\$/g)].length, 2);
  assert.match(base, /CREATE TRIGGER db02_program_term_course_type_history_guard/);
});

test("only retyping a materialized CORE curriculum is blocked", () => {
  assert.match(guard, /NEW\.type IS DISTINCT FROM OLD\.type/);
  assert.match(guard, /co\.program_term_course_id = OLD\.id/);
  assert.match(guard, /co\.type = 'CORE'/);
  assert.match(guard, /BEFORE UPDATE OF type ON program_term_courses/);
  assert.match(guard, /RETURN NEW/);
  assert.doesNotMatch(guard, /BEFORE UPDATE OF credits|BEFORE UPDATE OF display_order/);
});

test("canonical CORE offering validates and locks the curriculum parent", () => {
  assert.match(base, /ADD COLUMN program_term_course_id uuid/);
  assert.match(base, /ptc\.program_term_id = NEW\.program_term_id/);
  assert.match(base, /ptc\.course_id = NEW\.course_id/);
  assert.match(base, /ptc\.type = 'CORE'/);
  assert.match(base, /Core course offering curriculum row must match selected term and course/);
  assert.match(base, /FOR SHARE/);
});

test("rollback acceptance exercises unused edits and materialized CORE immutability", () => {
  for (const snippet of [
    "UPDATE program_term_courses SET type='ELECTIVE' WHERE id=v_unused_mapping",
    "SET credits=3,display_order=3",
    "History-backed CORE curriculum was changed to ELECTIVE",
    "CORE offering historical curriculum association corrupted",
    "Inactive historical CORE offering lost fixed curriculum type",
  ]) assert.ok(acceptance.includes(snippet), "missing acceptance: " + snippet);
  assert.match(acceptance, /SET status='ARCHIVED' WHERE id=v_offering/);
  assert.match(acceptance, /^BEGIN;/m);
  assert.match(acceptance, /^ROLLBACK;/m);
});

test("two-session race checks both type-first and offering-first orderings", () => {
  assert.match(races, /PASS race A: curriculum reclassification won/);
  assert.match(races, /PASS race B: CORE offering won/);
  assert.match(races, /RACE_A_STATE/);
  assert.match(races, /RACE_B_STATE/);
  assert.match(races, /ELECTIVE:0/);
  assert.match(races, /CORE:1/);
});

test("concurrency harness checks exact expected errors, not arbitrary SQL failure", () => {
  assert.match(races, /INSERT_RC=\$\?/);
  assert.match(races, /CHANGE_RC=\$\?/);
  assert.match(races, /grep -Fq/);
  assert.match(races, /Core course offering curriculum row must match selected term and course/);
  assert.match(races, /Mapped curriculum cannot change type after CORE offering materialization/);
  assert.match(races, /DATABASE_URL/);
  assert.match(races, /disposable/);
});
