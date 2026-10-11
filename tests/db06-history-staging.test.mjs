import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schema = fs.readFileSync(
  "src/db/schema/db06-history-staged.ts",
  "utf8",
);
const sql = fs.readFileSync(
  "docs/planning/sql/db06-assessment-attendance-history-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-history-contract.md",
  "utf8",
);
const barrel = fs.readFileSync(
  "src/db/schema/index.ts",
  "utf8",
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);

test("DB035 history models remain source-only and unregistered", () => {
  assert.match(schema, /DB-035 \/ DB06 SOURCE-ONLY staging/);
  assert.doesNotMatch(barrel, /db06-history-staged/);
  assert.equal(
    journal.entries.some((entry) =>
      /db06.*history|grade.*attendance.*history/i.test(entry.tag),
    ),
    false,
  );
  assert.match(sql, /DO NOT register independently/);
});

test("DB035 stages exact grade and attendance history parent identities", () => {
  for (const token of [
    "assignment_grade_events_submission_identity_fk",
    "assignment_submissions_event_identity_uq",
    "attendance_record_events_record_identity_fk",
    "attendance_records_event_identity_uq",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    sql,
    /FOREIGN KEY \(\s*assignment_submission_id, assignment_id, delivery_id, learner_membership_id\s*\)/,
  );
  assert.match(
    sql,
    /FOREIGN KEY \(attendance_record_id, schedule_event_id, membership_id\)/,
  );
});

test("DB035 grade history is versioned, tenant scoped and publisher-aware", () => {
  for (const token of [
    "assignment_grade_events_submission_version_uq",
    "submission_version_before",
    "submission_version_after",
    "db06_grade_event_scope_guard",
    "actor_membership_id",
    "role = 'SUPER_ADMIN'",
    "GRADE",
    "REGRADE",
    "PUBLISH_GRADE",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    contract,
    /publisher may differ from the original grader/i,
  );
  assert.match(
    contract,
    /publisher, not the original grader/i,
  );
});

test("DB035 grading mutations require matching immutable events at commit", () => {
  assert.match(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_assignment_grade_event_required/,
  );
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(
    sql,
    /DB06 grading mutation missing immutable audit event/,
  );
  assert.doesNotMatch(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_assignment_grade_event_required[\s\S]{0,100}UPDATE OF/,
  );
});

test("DB035 attendance corrections use optimistic versions and deferred event completeness", () => {
  for (const token of [
    "ADD COLUMN version integer NOT NULL DEFAULT 0",
    "attendance_records_version_ck",
    "attendance_record_events_record_version_uq",
    "record_version_before",
    "record_version_after",
    "db06_attendance_record_version_guard",
    "DB06 attendance correction requires next version",
    "DB06 attendance version cannot change without correction",
    "db06_attendance_event_required",
    "DB06 attendance mark missing immutable audit event",
    "DB06 attendance correction missing immutable audit event",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_attendance_event_required[\s\S]*DEFERRABLE INITIALLY DEFERRED/,
  );
  assert.doesNotMatch(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_attendance_event_required[\s\S]{0,100}UPDATE OF/,
  );
});

test("DB035 event histories reject mutation and protect attendance retention", () => {
  for (const trigger of [
    "db06_grade_events_no_mutation",
    "db06_attendance_events_no_mutation",
    "db06_grade_events_no_truncate",
    "db06_attendance_events_no_truncate",
  ]) {
    assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger}`));
  }
  assert.match(
    sql,
    /schedule_event_id uuid NOT NULL[\s\S]*section_schedule_events\(id\) ON DELETE RESTRICT/,
  );
  assert.match(contract, /hard schedule-event delete.*RESTRICT/i);
});

test("DB035 tenant actor checks require matching membership or persisted superadmin", () => {
  for (const message of [
    "grade event submission/learner tenant mismatch",
    "grade event actor membership mismatch",
    "tenant grade event requires actor membership",
    "attendance event schedule/learner tenant mismatch",
    "attendance event actor membership mismatch",
    "tenant attendance event requires actor membership",
  ]) {
    assert.ok(sql.includes(message), message);
  }
  assert.ok(
    (sql.match(/role = 'SUPER_ADMIN'/g) ?? []).length >= 2,
  );
});

test("DB035 contract retains exact legacy action provenance without copying it as target state", () => {
  for (const sourceAction of [
    "UPDATE_POINTS",
    "ADD_DESCRIPTIVE_POINTS",
    "PUBLISH_GRADE",
  ]) {
    assert.ok(contract.includes(sourceAction), sourceAction);
  }
  assert.match(
    contract,
    /source action names remain documented provenance/i,
  );
});
