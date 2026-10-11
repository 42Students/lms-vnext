import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const draft = read("../scripts/sql/db05-lesson-active-enabled.draft.sql");
const cascade = read("../scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));
const courses = read("../src/db/schema/courses.ts");

test("legacy lesson active and enabled are distinct staged booleans", () => {
  assert.match(draft, /UNREGISTERED SOURCE-ONLY COMPANION/);
  assert.match(draft, /ALTER TABLE course_lessons/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS legacy_active boolean/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS legacy_enabled boolean/);
  assert.match(draft, /on CREATE active\/enabled default true/);
  assert.match(draft, /on UPDATE only mutate independently/);
  assert.match(courses, /status: courseLessonStatusEnum/);
});

test("lesson restore does not auto-enable flags or resurrect content", () => {
  assert.match(draft, /Restore lesson tombstone does not auto-enable disabled flags or children/);
  assert.match(cascade, /NO reverse cascade when a lesson is restored/);
  assert.ok(review.fields.filter(row => ["lesson.active","lesson.enabled"].includes(row.source)).every(row =>
    row.classification === "REMODELED_NEEDS_PROOF" && row.semanticVerification === "NOT_VERIFIED"));
});

test("legacy Java long sequence versus vNext integer remains an explicit release gate", () => {
  assert.match(draft, /Legacy long sequence vs vNext integer requires explicit range decision/);
  assert.match(courses, /sequence: integer\("sequence"\)/);
  assert.match(draft, /no silent truncation/);
});
