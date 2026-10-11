import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = (path) => readFileSync(join(root, path), "utf8");
const parent = text("scripts/sql/db05-course-parent-graph-guard.draft.sql");
const facets = text("scripts/sql/db05-course-parent-facets.draft.sql");
const manifest = JSON.parse(text("docs/planning/db05-migration-readiness-manifest.json"));
const course = manifest.artifacts.find((item) => item.id === "db05-parent-facets");

test("DB05 parent graph guard is explicitly unregistered and companion only", () => {
  assert.ok(course);
  assert.equal(manifest.artifacts.length, 7);
  assert.equal(course.registered, false);
  assert.equal(course.executedAgainstPostgres, false);
  assert.equal(course.companionIntegrityDraft?.registered, false);
  assert.equal(course.companionIntegrityDraft?.postgresExecuted, false);
  assert.match(parent, /UNREGISTERED SOURCE-REVIEW COMPANION SQL/);
  assert.match(parent, /NOT an eighth independent DB05 migration/);
  assert.match(facets, /ADD COLUMN IF NOT EXISTS parent_course_id uuid/);
  assert.doesNotMatch(parent, /ALTER TABLE courses[\s\S]*ADD COLUMN/);
});

test("DB05 guard checks both parent college and existing child reparent safety", () => {
  assert.match(parent, /SELECT department.college_id INTO child_college_id/);
  assert.match(parent, /SELECT department.college_id INTO parent_college_id/);
  assert.match(parent, /parent_college_id IS DISTINCT FROM child_college_id/);
  assert.match(parent, /existing_child.parent_course_id = NEW.id/);
  assert.match(parent, /child_department.college_id IS DISTINCT FROM child_college_id/);
  assert.match(parent, /offering.course_id = NEW.id/);
  assert.match(parent, /period.college_id IS DISTINCT FROM child_college_id/);
});

test("DB05 graph guard detects multi-hop ancestry and rejects malformed cycles", () => {
  assert.match(parent, /WITH RECURSIVE ancestors/);
  assert.match(parent, /ARRAY\[candidate.id\]/);
  assert.match(parent, /candidate.id = ANY\(ancestors.visited\)/);
  assert.match(parent, /WHERE NOT ancestors.cycle/);
  assert.match(parent, /id = NEW.id OR cycle/);
  assert.match(parent, /ERRCODE = '23514'/);
});

test("DB05 parent concurrency and upstream reparent gates remain unverified", () => {
  assert.match(parent, /pg_advisory_xact_lock\(605008001::bigint\)/);
  assert.match(parent, /transaction_isolation.*read committed/);
  assert.match(parent, /ERRCODE = '25001'/);
  assert.ok(course.prereqs.includes("COURSE_PARENT_UPSTREAM_COLLEGE_MOVE_INTEGRITY") ||
    course.prereqs.includes("COURSE_DEPARTMENT_AND_PERIOD_UPSTREAM_REPARENT_POLICY"));
  assert.ok(manifest.gates.some((g) => g.id === "COURSE_PARENT_GRAPH_SAME_COLLEGE_AND_MULTI_HOP_CYCLES" && g.status === "BLOCKED"));
  assert.ok(manifest.gates.some((g) => g.id === "COURSE_PARENT_UPSTREAM_COLLEGE_MOVE_INTEGRITY" && g.status === "NOT_RUN"));
});
