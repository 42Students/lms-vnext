import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(
  join(root, "scripts/sql/db05-lesson-content-discussions.draft.sql"),
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

const primaryRuntimeFields = [
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

const preservationOnlyFields = [
  "parent_discussion_id",
  "discussion_status",
  "is_faculty_answer",
  "resolved_at",
  "resolved_by",
  "attachment_url",
];

test("DB05 keeps lesson-content discussions distinct from classroom chat", () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS lesson_content_discussions/);
  assert.match(sql, /lesson_content_id uuid NOT NULL/);
  assert.match(sql, /author_membership_id uuid NOT NULL/);
  assert.match(sql, /db05_lesson_discussions_tenant_guard/);
  assert.match(sql, /lesson discussion scope violates college boundary/);
  assert.match(sql, /NOT A REGISTERED DRIZZLE MIGRATION/);
  assert.match(sql, /DIFFERENT chat feature/);
});

test("DB05 inventory maps all historical discussion columns without false verification", () => {
  const table = inventory.tables.find((item) => item.table === "discussions");
  assert.ok(table);
  assert.equal(table.rows.length, 16);
  for (const row of table.rows) {
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS", row.legacyColumn);
    assert.equal(row.verifiedMapping, null, row.legacyColumn);
    assert.match(row.proposedSemanticMapping, /db05-lesson-content-discussions\.draft\.sql/);
    assert.ok(row.runtimeEvidenceStatus, row.legacyColumn);
  }
  assert.equal(inventory.db008Review.verifiedFields, 0);
  assert.equal(inventory.db008Review.primaryRuntimeFields, primaryRuntimeFields.length);
  assert.equal(inventory.db008Review.preservationOnlyFields, preservationOnlyFields.length);
});

test("DB05 primary runtime and preservation-only discussion evidence remain differentiated", () => {
  const fields = new Map(review.fields.map((field) => [field.source, field]));

  for (const column of primaryRuntimeFields) {
    const field = fields.get(`discussions.${column}`);
    assert.ok(field, column);
    assert.equal(field.classification, "UNREGISTERED_DRAFT", column);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", column);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", column);
    assert.match(field.producerConsumerVerification, /PRIMARY_LEGACY_RUNTIME/);
  }

  for (const column of preservationOnlyFields) {
    const field = fields.get(`discussions.${column}`);
    assert.ok(field, column);
    assert.equal(field.classification, "UNREGISTERED_DRAFT", column);
    assert.equal(field.semanticVerification, "NOT_VERIFIED", column);
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN", column);
    assert.match(field.producerConsumerVerification, /PRESERVATION_ONLY/);
    assert.match(field.producerConsumerVerification, /RETIREMENT_NOT_APPROVED/);
  }
});
