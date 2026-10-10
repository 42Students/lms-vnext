import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const draft = read("../scripts/sql/db05-version-progress-attempts.draft.sql");
const contract = read("../docs/planning/db05-progress-deletion-attempt-contract.md");
const schema = read("../src/db/schema/courses.ts");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));

test("DB05 progress draft retains attempts plus source-backed tombstone without activation", () => {
  assert.match(draft, /NOT A REGISTERED MIGRATION/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS first_completed_at timestamptz/);
  assert.match(draft, /ADD COLUMN IF NOT EXISTS deleted_at timestamptz/);
  assert.match(draft, /learner_content_progress_membership_content_attempt_uq/);
  assert.match(draft, /db05_progress_first_completion_guard/);
});

test("latest attempt selected before soft-delete filtering avoids historical resurrection", () => {
  assert.match(contract, /MAX attempt/);
  assert.match(contract, /after.*deletion/);
  assert.match(contract, /attempt 1/);
  assert.match(contract, /attempt 2/);
  assert.match(contract, /incorrectly resurrect/);
  assert.match(draft, /Do NOT compute MAX\(attempt\)/);
});

test("vNext still has legacy-disjoint progress identity; no false parity promotion", () => {
  assert.match(schema, /export const learnerContentProgress = pgTable/);
  assert.match(schema, /learner_content_progress_membership_content_uq/);
  const row = review.fields.find((field) => field.source === "learner_content_progress.is_deleted");
  assert.ok(row);
  assert.equal(row.semanticVerification, "NOT_VERIFIED");
  assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
  assert.ok(["MISSING_OR_UNPROVEN", "UNREGISTERED_DRAFT"].includes(row.classification));
});

test("contract gates tenant, history, race and migration acceptance", () => {
  for (const term of [
    "cross-college", "first_completed_at", "startNewAttempt",
    "PostgreSQL replay", "Chat 1", "distinct parity decisions",
  ]) {
    assert.ok(contract.includes(term), term);
  }
});
