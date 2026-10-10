import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(
  join(root, "src/db/schema/lesson-content-discussions-staged.ts"),
  "utf8",
);
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

const primaryDiscussionFields = [
  "id",
  "created_at",
  "is_deleted",
  "updated_at",
  "content_text",
  "lesson_content_id",
  "profile_name",
  "sequence",
  "user_id",
  "user_name",
];

const snapshotOnlyUnprovenFields = [
  "parent_discussion_id",
  "discussion_status",
  "is_faculty_answer",
  "resolved_at",
  "resolved_by",
  "attachment_url",
];

test("DB05 keeps lesson-content discussions separate from classroom chat", () => {
  assert.match(schema, /lesson_content_discussions/);
  assert.match(schema, /lesson_content_id/);
  assert.match(schema, /author_membership_id/);
  assert.match(schema, /author_handle_snapshot/);
  assert.match(schema, /author_display_name_snapshot/);
  assert.match(schema, /is_deleted/);
  assert.match(schema, /between 1 and 5000/);
  assert.doesNotMatch(schema, /course_discussion_messages/);
  assert.doesNotMatch(schema, /delivery_id/);
});

test("DB05 discussion source review preserves staged-vs-verified distinction", () => {
  const table = inventory.tables.find((item) => item.table === "discussions");
  assert.ok(table);
  const byColumn = new Map(table.rows.map((row) => [row.legacyColumn, row]));

  for (const column of primaryDiscussionFields) {
    const row = byColumn.get(column);
    assert.ok(row, column);
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS", column);
    assert.equal(row.verifiedMapping, null, column);
    assert.equal(
      row.runtimeEvidenceStatus,
      "PRIMARY_LEGACY_RUNTIME_CONFIRMED_STAGED_VNEXT_UNREGISTERED",
      column,
    );
    assert.ok(row.proposedSemanticMapping?.includes("lesson_content_discussions"), column);
  }

  for (const column of snapshotOnlyUnprovenFields) {
    const row = byColumn.get(column);
    assert.ok(row, column);
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS", column);
    assert.equal(row.verifiedMapping, null, column);
    assert.equal(row.proposedSemanticMapping, null, column);
    assert.equal(
      row.runtimeEvidenceStatus,
      "SNAPSHOT_COLUMN_NO_PRIMARY_RUNTIME_CONSUMER_FOUND_RETIREMENT_UNAPPROVED",
      column,
    );
  }
});

test("DB05 semantic review does not retire unproven discussion extensions", () => {
  const fields = new Map(review.fields.map((field) => [field.source, field]));
  for (const column of primaryDiscussionFields) {
    const field = fields.get(`discussions.${column}`);
    assert.ok(field, column);
    assert.equal(field.classification, "UNREGISTERED_DRAFT", column);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", column);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", column);
  }
  for (const column of snapshotOnlyUnprovenFields) {
    const field = fields.get(`discussions.${column}`);
    assert.ok(field, column);
    assert.equal(field.classification, "MISSING_OR_UNPROVEN", column);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", column);
    assert.match(field.producerConsumerVerification, /RETIREMENT_NOT_APPROVED/);
  }
});
