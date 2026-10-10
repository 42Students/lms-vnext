import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../scripts/sql/db05-classroom-chat-parity.draft.sql", import.meta.url),
  "utf8",
);
const review = JSON.parse(
  readFileSync(
    new URL("../docs/planning/db05-chat06-source-semantic-review.json", import.meta.url),
    "utf8",
  ),
);
const runtimeSchema = readFileSync(
  new URL("../src/db/schema/discussions.ts", import.meta.url),
  "utf8",
);
const contract = readFileSync(
  new URL("../docs/planning/db05-classroom-message-parity-contract.md", import.meta.url),
  "utf8",
);

test("DB05 classroom source coverage stays distinct from lesson content discussion", () => {
  assert.match(sql, /ALTER TABLE course_discussion_messages/);
  assert.match(runtimeSchema, /course_discussion_messages/);
  assert.match(contract, /lesson_content_discussions/);
  assert.doesNotMatch(sql, /ALTER TABLE lesson_content_discussions/);
});

test("sender snapshot and soft deletion are staged additively, not activated", () => {
  assert.match(sql, /UNREGISTERED/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS sender_name_snapshot varchar\(255\)/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS deleted_at timestamptz/);
  assert.match(sql, /WHERE deleted_at IS NULL/);
  assert.doesNotMatch(sql, /DELETE FROM course_discussion_messages/i);
});

test("same-college guard covers sender, course, offering and section paths", () => {
  for (const required of [
    "course_section_deliveries",
    "course_offerings",
    "courses",
    "departments",
    "academic_periods",
    "sections",
    "college_memberships",
    "NEW.delivery_id",
    "NEW.sender_membership_id",
    "course_college_id IS DISTINCT FROM offering_college_id",
    "course_college_id IS DISTINCT FROM section_college_id",
    "course_college_id IS DISTINCT FROM sender_college_id",
    "BEFORE INSERT OR UPDATE OF delivery_id, sender_membership_id",
    "23514",
  ]) {
    assert.ok(sql.includes(required), `missing SQL scope term: ${required}`);
  }
});

test("DB05 review remains unverified until actual consumers and PostgreSQL gates", () => {
  for (const source of [
    "classroom_messages.sender_name",
    "classroom_messages.is_deleted",
  ]) {
    const row = review.fields.find((field) => field.source === source);
    assert.ok(row, source);
    assert.equal(row.semanticVerification, "NOT_VERIFIED");
    assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
    assert.equal(row.classification, "MISSING_OR_UNPROVEN");
  }
  assert.match(contract, /No live DB introspection/);
});
