import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const draft = read("../scripts/sql/db05-course-soft-delete-guard.draft.sql");
const cascade = read("../scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql");
const schema = read("../src/db/schema/courses.ts");
const source = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));

test("DB05 course deletion is distinct from course status and is unregistered", () => {
  assert.match(draft, /UNREGISTERED SCHEMA\/INTEGRITY COMPANION/);
  assert.match(draft, /ALTER TABLE courses\s+ADD COLUMN IF NOT EXISTS legacy_deleted_at timestamptz/);
  assert.match(schema, /status: courseStatusEnum/);
  assert.match(draft, /courses\.status=ACTIVE\/ARCHIVED != legacy independent tombstone/);
});

test("DB05 course delete rejects any live lesson or live content but ignores tombstones", () => {
  assert.match(draft, /lesson\.legacy_deleted_at IS NULL/);
  assert.match(draft, /content\.legacy_deleted_at IS NULL/);
  assert.match(draft, /IF live_lesson OR live_content THEN/);
  assert.match(draft, /USING ERRCODE = '23514'/);
  assert.match(draft, /Already tombstoned lesson\+content do NOT block delete/);
});

test("DB05 new or moved lesson locks its owning course during parent tombstone", () => {
  assert.match(draft, /CREATE OR REPLACE FUNCTION db05_live_lesson_parent_course_guard/);
  assert.match(draft, /FOR SHARE OF course_row/);
  assert.match(draft, /NEW\.learning_path_id/);
  assert.match(draft, /IF NOT FOUND OR course_deleted_at IS NOT NULL/);
  assert.match(draft, /BEFORE INSERT OR UPDATE OF learning_path_id/);
  assert.match(draft, /concurrent lesson insert while deleting course/);
});

test("DB05 course restore never restores lesson or content or private receipts", () => {
  assert.match(draft, /Restoring course removes ONLY course tombstone/);
  assert.match(draft, /not lesson\/content flags/);
  assert.match(cascade, /NO reverse cascade when a lesson is restored/);
  assert.match(draft, /upstream guard and independent PG races/);
});

test("DB05 source column is still formally unverified until PostgreSQL acceptance", () => {
  const row=source.fields.find(x=>x.source==="course.is_deleted");
  assert.ok(row);
  assert.equal(row.semanticVerification,"NOT_VERIFIED");
  assert.equal(row.runtimeDatabaseVerification,"NOT_RUN");
  assert.match(row.targetProposal, /db05-course-soft-delete-guard\.draft\.sql/);
});
