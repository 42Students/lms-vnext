import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));
const inventory = readJson("docs/planning/db-pass4-columns-db05_courses_and_content.json");
const review = readJson("docs/planning/db05-chat06-source-semantic-review.json");
const draft = readFileSync(join(root, "scripts/sql/db05-version-progress-attempts.draft.sql"), "utf8");

test("DB05 field review accounts for every historical snapshot column exactly once", () => {
  const original = inventory.tables.flatMap((t) => t.rows.map((r) => `${t.table}.${r.legacyColumn}`)).sort();
  const reviewed = review.fields.map((f) => f.source).sort();
  assert.equal(review.taskId, "DB-008");
  assert.equal(review.phase, "DATABASE");
  assert.equal(new Set(reviewed).size, reviewed.length);
  assert.deepEqual(reviewed, original);
  assert.equal(review.counts.sourceFields, original.length);
  assert.equal(review.counts.sourceTables, inventory.tables.length);
});

test("DB05 review does not mistake source candidates for verified behavior", () => {
  for (const field of review.fields) {
    assert.equal(field.semanticVerification, "NOT_VERIFIED", field.source);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", field.source);
    assert.equal(field.producerConsumerVerification, "NOT_VERIFIED", field.source);
    assert.ok(field.targetProposal.length > 5, field.source);
    assert.ok(field.classification.length > 5, field.source);
  }
  assert.ok(review.criticalOpenRisks.length >= 8);
});

test("DB05 draft records legacy concurrency and progress-history contracts", () => {
  assert.match(draft, /NOT A REGISTERED MIGRATION/);
  assert.match(draft, /ALTER TABLE courses\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  assert.match(draft, /ALTER TABLE course_lessons\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  assert.match(draft, /ALTER TABLE lesson_contents\s+ADD COLUMN IF NOT EXISTS version bigint/i);
  for (const field of ["attempt", "duration_seconds", "first_completed_at"]) {
    assert.ok(draft.includes(field), field);
  }
  assert.match(draft, /DROP INDEX IF EXISTS learner_content_progress_membership_content_uq/);
  assert.match(draft, /CREATE UNIQUE INDEX learner_content_progress_membership_content_attempt_uq/);
  assert.match(draft, /CREATE TRIGGER db05_progress_first_completion_before_write/);
  assert.match(draft, /first_completed_at is immutable/);
  assert.match(draft, /version-aware|version=version\+1/i);
});
