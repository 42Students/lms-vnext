import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

const historySql = read("../scripts/sql/db05-classroom-message-history.draft.sql");
const guardSql = read("../scripts/sql/db05-classroom-chat-parity.draft.sql");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));
const readiness = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));
const runtimeSchema = read("../src/db/schema/discussions.ts");
const contract = read("../docs/planning/db05-classroom-message-parity-contract.md");

test("DB05 classroom stream remains separate from content discussions", () => {
  assert.match(historySql, /ALTER TABLE course_discussion_messages/);
  assert.match(runtimeSchema, /course_discussion_messages/);
  assert.match(contract, /lesson_content_discussions/);
  assert.doesNotMatch(guardSql, /lesson_content_discussions/);
});

test("one canonical unregistered draft owns classroom history columns and active index", () => {
  assert.match(historySql, /NOT REGISTERED/);
  assert.match(historySql, /ADD COLUMN IF NOT EXISTS sender_name_snapshot text/);
  assert.match(historySql, /ADD COLUMN IF NOT EXISTS deleted_at timestamptz/);
  assert.match(historySql, /WHERE deleted_at IS NULL/);
  assert.doesNotMatch(guardSql, /ALTER TABLE course_discussion_messages/);
  assert.doesNotMatch(guardSql, /ADD COLUMN IF NOT EXISTS sender_name_snapshot/);
  assert.doesNotMatch(guardSql, /CREATE INDEX IF NOT EXISTS db05_class_chat_active_delivery_created_idx/);
  assert.doesNotMatch(historySql, /DELETE FROM course_discussion_messages/i);
});

test("companion-only tenant guard covers sender and all three delivery college paths", () => {
  for (const required of [
    "COMPANION-ONLY",
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
    assert.ok(guardSql.includes(required), `missing scope guard: ${required}`);
  }
});

test("migration manifest lists canonical classroom draft once, never companion", () => {
  const canonical = "scripts/sql/db05-classroom-message-history.draft.sql";
  assert.equal(readiness.artifacts.filter((a) => a.path === canonical).length, 1);
  assert.equal(
    readiness.artifacts.filter((a) => a.path === "scripts/sql/db05-classroom-chat-parity.draft.sql").length,
    0,
  );
  const item = readiness.artifacts.find((a) => a.path === canonical);
  assert.equal(item.registered, false);
  assert.equal(item.executedAgainstPostgres, false);
});

test("classroom sender and deletion fields remain unverified until runtime proof", () => {
  for (const source of ["classroom_messages.sender_name", "classroom_messages.is_deleted"]) {
    const row = review.fields.find((field) => field.source === source);
    assert.ok(row, source);
    assert.equal(row.semanticVerification, "NOT_VERIFIED");
    assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
    assert.equal(row.classification, "UNREGISTERED_DRAFT");
  }
  assert.match(contract, /No live DB introspection/);
});
