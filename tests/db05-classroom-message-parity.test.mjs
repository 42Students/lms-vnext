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
const integrityPreflight = read("../scripts/sql/db05-classroom-message-integrity-preflight.readonly.sql");
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
  assert.equal(item.companionIntegrityDraft.path, "scripts/sql/db05-classroom-chat-parity.draft.sql");
  assert.equal(item.companionIntegrityDraft.registered, false);
  assert.equal(item.companionIntegrityDraft.postgresExecuted, false);
  assert.ok(item.prereqs.includes("CLASSROOM_SAME_COLLEGE_GUARD_MERGED_ONCE"));
  assert.ok(item.prereqs.includes("CLASSROOM_UPSTREAM_REPARENTING_SAFETY"));
  assert.ok(readiness.gates.some((g) => g.id === "CLASSROOM_MESSAGE_SAME_COLLEGE_GUARD" && g.status === "BLOCKED"));
  assert.ok(readiness.gates.some((g) => g.id === "CLASSROOM_MESSAGE_UPSTREAM_REPARENT_PROOF" && g.status === "NOT_RUN"));
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

test("classroom draft validates program tenant, exact cohort+period and shares DB05 ancestry lock", () => {
  const required = [
    "section_program_department.college_id",
    "INNER JOIN cohorts section_cohort",
    "INNER JOIN programs section_program",
    "INNER JOIN departments section_program_department",
    "course_college_id IS DISTINCT FROM section_program_college_id",
    "offering_cohort_id IS DISTINCT FROM section_cohort_id",
    "offering_period_id IS DISTINCT FROM section_period_id",
    "pg_advisory_xact_lock(605008003::bigint)",
    "current_setting('transaction_isolation') <> 'read committed'",
    "25001",
    "23514",
  ];
  for (const phrase of required) {
    assert.ok(guardSql.includes(phrase), `missing classroom invariant: ${phrase}`);
  }
  assert.doesNotMatch(guardSql, /ALTER TABLE course_discussion_messages/);
});

test("read-only classroom drift probe inventories every missing join and scope mismatch", () => {
  const codes = [
    "MISSING_DELIVERY",
    "MISSING_OFFERING",
    "MISSING_COURSE",
    "MISSING_COURSE_DEPARTMENT",
    "MISSING_OFFERING_PERIOD",
    "MISSING_SECTION",
    "MISSING_SECTION_PERIOD",
    "MISSING_SECTION_COHORT",
    "MISSING_SECTION_PROGRAM",
    "MISSING_SECTION_PROGRAM_DEPARTMENT",
    "MISSING_SENDER_MEMBERSHIP",
    "COURSE_OFFERING_PERIOD_COLLEGE_MISMATCH",
    "COURSE_SECTION_PERIOD_COLLEGE_MISMATCH",
    "COURSE_SECTION_PROGRAM_COLLEGE_MISMATCH",
    "COURSE_SENDER_COLLEGE_MISMATCH",
    "OFFERING_SECTION_COHORT_MISMATCH",
    "OFFERING_SECTION_PERIOD_MISMATCH",
  ];
  for (const code of codes) {
    assert.ok(integrityPreflight.includes("'" + code + "'"), code);
  }
  assert.match(integrityPreflight, /LEFT JOIN course_discussion_messages|FROM course_discussion_messages AS message/);
  assert.match(integrityPreflight, /CROSS JOIN LATERAL unnest/);
  assert.match(integrityPreflight, /count\(violations.failure_code\)::bigint/);
  assert.doesNotMatch(integrityPreflight, /\b(?:UPDATE|DELETE|INSERT|ALTER|CREATE|TRUNCATE|DROP)\s+(?:TABLE\s+)?(?:course_discussion_messages|course_offerings|courses|sections|college_memberships)\b/i);
});

test("staged classroom canonical history rejects hard DELETE while retaining soft-delete update", () => {
  assert.match(historySql, /CREATE OR REPLACE FUNCTION db05_classroom_message_hard_delete_fence/);
  assert.match(historySql, /CREATE TRIGGER db05_classroom_message_prevent_hard_delete/);
  assert.match(historySql, /BEFORE DELETE ON course_discussion_messages/);
  assert.match(historySql, /RAISE EXCEPTION 'classroom history must use soft deletion'/);
  assert.match(historySql, /USING ERRCODE = '23514'/);
  assert.match(historySql, /ADD COLUMN IF NOT EXISTS deleted_at timestamptz/);
  assert.doesNotMatch(historySql, /DELETE FROM course_discussion_messages/i);
  assert.doesNotMatch(guardSql, /CREATE TRIGGER db05_classroom_message_prevent_hard_delete/);
  assert.ok(readiness.gates.some(g =>
    g.id === "CLASSROOM_HARD_DELETE_FENCE_API_CUTOVER" &&
    g.status === "BLOCKED"), "hard-delete fence must fail closed before cutover");
});
