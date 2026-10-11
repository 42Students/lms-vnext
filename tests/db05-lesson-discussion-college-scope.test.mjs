import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p), "utf8");
const manifest = JSON.parse(read("docs/planning/db05-migration-readiness-manifest.json"));
const draft = read("scripts/sql/db05-lesson-discussions-same-college.draft.sql");
const canonical = read("scripts/sql/db05-lesson-content-discussions.draft.sql");
const record = manifest.artifacts.find(a => a.id === "db05-discussions");

test("DB05 lesson discussion same-college guard is only a replacement function", () => {
  assert.ok(record);
  assert.equal(manifest.artifacts.length, 7);
  assert.equal(record.registered, false);
  assert.equal(record.companionIntegrityDraft?.registered, false);
  assert.equal(record.companionIntegrityDraft?.postgresExecuted, false);
  assert.equal(record.companionIntegrityDraft.path, "scripts/sql/db05-lesson-discussions-same-college.draft.sql");
  assert.match(draft, /CREATE OR REPLACE FUNCTION db05_lesson_discussions_tenant_guard/);
  assert.match(canonical, /CREATE TRIGGER db05_lesson_discussions_tenant_before_write/);
  assert.doesNotMatch(draft, /CREATE TRIGGER db05_lesson_discussions_tenant_before_write/);
  assert.doesNotMatch(draft, /CREATE TABLE IF NOT EXISTS lesson_content_discussions/);
});

test("DB05 guard follows all required author/content/college/optional-delivery paths", () => {
  assert.match(draft, /JOIN course_offerings offering ON offering.id = path.offering_id/);
  assert.match(draft, /JOIN departments department ON department.id = course_row.department_id/);
  assert.match(draft, /JOIN academic_periods offering_period/);
  assert.match(draft, /LEFT JOIN course_section_deliveries delivery/);
  assert.match(draft, /LEFT JOIN sections section_row/);
  assert.match(draft, /LEFT JOIN academic_periods section_period/);
  assert.match(draft, /content_period_college_id IS DISTINCT FROM course_department_college_id/);
  assert.match(draft, /content_period_college_id IS DISTINCT FROM author_college_id/);
  assert.match(draft, /content_period_college_id IS DISTINCT FROM NEW.college_id/);
  assert.match(draft, /delivery_offering_id IS DISTINCT FROM content_offering_id/);
  assert.match(draft, /delivery_section_period_college_id IS DISTINCT FROM content_period_college_id/);
  assert.match(draft, /resolver_college_id IS DISTINCT FROM NEW.college_id/);
});

test("DB05 discussions upstream reparenting and actual PG proof remain open", () => {
  assert.ok(record.prereqs.includes("LESSON_DISCUSSIONS_UPSTREAM_REPARENT_PROOF"));
  assert.ok(manifest.gates.some(g => g.id === "LESSON_DISCUSSIONS_SAME_COLLEGE_FULL_PATH_GUARD" && g.status === "BLOCKED"));
  assert.ok(manifest.gates.some(g => g.id === "LESSON_DISCUSSIONS_UPSTREAM_REPARENT_GUARD" && g.status === "NOT_RUN"));
  assert.match(draft, /Tests NOT RUN/);
});
