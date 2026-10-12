import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const draft = read("scripts/sql/db05-classroom-message-ancestor-retention.draft.sql");
const writeGuard = read("scripts/sql/db05-classroom-chat-parity.draft.sql");
const history = read("scripts/sql/db05-classroom-message-history.draft.sql");
const manifest = JSON.parse(read("docs/planning/db05-migration-readiness-manifest.json"));
const preflight = read("scripts/sql/db05-classroom-message-integrity-preflight.readonly.sql");
const tableTriggers = new Map([
  ["course_section_deliveries", ["db05_classroom_delivery_reparent_guard", "db05_classroom_delivery_delete_guard"]],
  ["course_offerings", ["db05_classroom_offering_reparent_guard"]],
  ["sections", ["db05_classroom_section_reparent_guard"]],
  ["courses", ["db05_classroom_course_reparent_guard"]],
  ["departments", ["db05_classroom_department_reparent_guard"]],
  ["academic_periods", ["db05_classroom_period_reparent_guard"]],
  ["cohorts", ["db05_classroom_cohort_reparent_guard"]],
  ["programs", ["db05_classroom_program_reparent_guard"]],
  ["college_memberships", ["db05_classroom_sender_membership_move_guard"]],
]);

test("classroom history ancestry proposal remains unregistered and does not duplicate canonical columns", () => {
  assert.match(draft, /UNREGISTERED/);
  assert.match(history, /sender_name_snapshot text/);
  assert.doesNotMatch(draft, /ALTER TABLE course_discussion_messages/);
  assert.doesNotMatch(draft, /CREATE (?:UNIQUE )?INDEX/i);
  assert.doesNotMatch(draft, /\bDELETE FROM course_discussion_messages/i);
  assert.match(draft, /CREATE OR REPLACE FUNCTION db05_classroom_message_ancestor_retention_guard/);
});

test("each of nine ancestor entities has one trigger, delivery has extra retention-on-delete", () => {
  for (const [table, triggers] of tableTriggers) {
    assert.ok(draft.includes("TG_TABLE_NAME = '" + table + "'"), "missing ancestor branch " + table);
    for (const trigger of triggers) {
      const expression = new RegExp("CREATE TRIGGER " + trigger + "[\\s\\S]*? ON " + table + "\\b");
      assert.match(draft, expression, "missing trigger " + trigger);
      assert.equal(draft.split("CREATE TRIGGER " + trigger).length, 2, "duplicate trigger " + trigger);
    }
  }
  assert.equal((draft.match(/CREATE TRIGGER db05_classroom_/g) ?? []).length, 10);
  assert.match(draft, /BEFORE DELETE ON course_section_deliveries/);
  assert.match(draft, /IF TG_OP = 'DELETE' THEN RETURN OLD/);
});

test("retained messages block scoped ancestor moves, not unrelated status/profile edits", () => {
  const transitions = new Map([
    ["course_section_deliveries", ["offering_id", "section_id"]],
    ["course_offerings", ["course_id", "cohort_id", "academic_period_id"]],
    ["sections", ["cohort_id", "academic_period_id"]],
    ["courses", ["department_id"]],
    ["departments", ["college_id"]],
    ["academic_periods", ["college_id"]],
    ["cohorts", ["program_id"]],
    ["programs", ["department_id"]],
    ["college_memberships", ["college_id", "user_id"]],
  ]);
  for (const [table, columns] of transitions) {
    const check = draft.indexOf("TG_TABLE_NAME = '" + table + "'");
    assert.ok(check >= 0, table);
    const until = draft.indexOf("ELSIF TG_TABLE_NAME =", check + 1);
    const segment = draft.slice(check, until < 0 ? undefined : until);
    for (const column of columns) {
      assert.ok(segment.includes("NEW." + column + " IS DISTINCT FROM OLD." + column), table + "." + column);
    }
  }
  assert.match(draft, /IF NOT is_changing THEN\s+RETURN NEW/);
  assert.match(draft, /IF has_messages THEN\s+RAISE EXCEPTION/);
  assert.match(draft, /23514/);
});

test("both child and ancestor guards use one transaction-level ancestry lock, reject unproved isolation", () => {
  assert.match(draft, /current_setting\('transaction_isolation'\) <> 'read committed'/);
  assert.match(draft, /pg_advisory_xact_lock\(605008003::bigint\)/);
  assert.match(writeGuard, /pg_advisory_xact_lock\(605008003::bigint\)/);
  assert.match(draft, /25001/);
});

test("ancestor joins retain soft-deleted messages on both classroom paths and actor path", () => {
  for (const relation of ["course_section_deliveries", "course_offerings", "sections", "courses",
    "departments", "academic_periods", "cohorts", "programs", "college_memberships"]) {
    assert.ok(draft.includes("TG_TABLE_NAME = '" + relation + "'"), relation);
  }
  assert.match(draft, /JOIN programs program_row ON program_row.id = cohort.program_id/);
  assert.match(draft, /WHERE message.sender_membership_id = OLD.id/);
  assert.match(draft, /WHERE delivery.section_id = OLD.id/);
  assert.match(draft, /WHERE offering.academic_period_id = OLD.id/);
  assert.match(draft, /WHERE section_row.academic_period_id = OLD.id/);
  assert.doesNotMatch(draft, /WHERE message.deleted_at IS NULL|AND message.deleted_at IS NULL/);
});

test("migration and PostgreSQL proof remain fail closed with a read-only drift preflight", () => {
  const entry = manifest.crossDomainCompanions.find(x => x.id === "DB05_CLASSROOM_MESSAGE_ANCESTOR_RETENTION");
  assert.equal(entry.path, "scripts/sql/db05-classroom-message-ancestor-retention.draft.sql");
  assert.equal(entry.registered, false);
  assert.equal(entry.postgresExecuted, false);
  assert.equal(entry.readyForProduction, false);
  assert.equal(entry.advisoryKey, "605008003");
  assert.match(preflight, /COURSE_SECTION_PROGRAM_COLLEGE_MISMATCH/);
  const gate = manifest.gates.find(x => x.id === "CLASSROOM_MESSAGE_ANCESTOR_RETENTION_CL01_CL18");
  assert.ok(gate && gate.status === "NOT_RUN");
  for (let i = 1; i <= 18; i += 1) {
    assert.match(draft, new RegExp("CL-" + String(i).padStart(2, "0") + "\\b"));
  }
});
