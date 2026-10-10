import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  readFileSync(
    join(root, "docs/planning/db-pass4-columns-db05_courses_and_content.json"),
    "utf8",
  ),
);
const review = JSON.parse(
  readFileSync(
    join(root, "docs/planning/db05-chat06-source-semantic-review.json"),
    "utf8",
  ),
);
const draft = readFileSync(
  join(root, "scripts/sql/db05-lesson-content-discussions.draft.sql"),
  "utf8",
);

const primaryRuntimeColumns = new Set([
  "id",
  "created_at",
  "updated_at",
  "content_text",
  "lesson_content_id",
  "profile_name",
  "sequence",
  "user_id",
  "user_name",
]);

const preservationOnlyColumns = new Set([
  "is_deleted",
  "parent_discussion_id",
  "discussion_status",
  "is_faculty_answer",
  "resolved_at",
  "resolved_by",
  "attachment_url",
]);

test("DB05 canonical inventory preserves discussion source evidence without verification inflation", () => {
  const discussions = inventory.tables.find((table) => table.table === "discussions");
  assert.ok(discussions);
  assert.equal(discussions.rows.length, 16);
  assert.equal(inventory.db008DiscussionEvidence.discussionFields, 16);
  assert.equal(inventory.db008DiscussionEvidence.primaryRuntimeSourceConfirmed, 9);
  assert.equal(inventory.db008DiscussionEvidence.preservationOnlyRuntimeUsageUnproven, 7);
  assert.equal(inventory.db008DiscussionEvidence.verifiedMappings, 0);

  for (const row of discussions.rows) {
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS", row.legacyColumn);
    assert.equal(row.verifiedMapping, null, row.legacyColumn);
    assert.match(row.proposedSemanticMapping, /db05-lesson-content-discussions\.draft\.sql/);
    if (primaryRuntimeColumns.has(row.legacyColumn)) {
      assert.equal(
        row.db008SourceDisposition,
        "CURRENT_PRIMARY_RUNTIME_SOURCE_CONFIRMED_STAGED_UNREGISTERED",
        row.legacyColumn,
      );
    } else {
      assert.ok(preservationOnlyColumns.has(row.legacyColumn), row.legacyColumn);
      assert.equal(
        row.db008SourceDisposition,
        "HISTORICAL_PERSISTED_COLUMN_STAGED_PRESERVATION_ONLY_RUNTIME_USAGE_UNPROVEN",
        row.legacyColumn,
      );
    }
  }
});

test("DB05 semantic review maps all discussion columns only to an unregistered draft", () => {
  const fields = review.fields.filter((field) => field.source.startsWith("discussions."));
  assert.equal(fields.length, 16);
  for (const field of fields) {
    assert.equal(field.classification, "UNREGISTERED_DRAFT", field.source);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", field.source);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", field.source);
    assert.match(field.targetProposal, /lesson_content_discussions/);
  }
});

test("DB05 lesson discussion draft remains isolated and tenant-guarded", () => {
  assert.match(draft, /NOT A REGISTERED DRIZZLE MIGRATION/);
  assert.match(draft, /CREATE TABLE IF NOT EXISTS lesson_content_discussions/);
  assert.match(draft, /db05_lesson_discussions_tenant_guard/);
  assert.match(draft, /author_membership_id/);
  assert.match(draft, /lesson_content_id/);
  assert.match(draft, /lesson discussion scope violates college boundary/);
  assert.match(draft, /DIFFERENT chat feature/);
});
