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

test("DB035 history model is explicitly exported without independently registering staged SQL", () => {
  assert.match(schema, /DB-035 \/ DB06 SOURCE-ONLY staging/);
  assert.match(barrel, /export \{assignmentGradeEventsStaged\} from "\.\/db06-history-staged"/);
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
    "HIDE_GRADE",
    "PUBLISH_GRADE",
  ]) {
    assert.ok(sql.includes(token), token);
  }
  assert.match(
    contract,
    /can be executed later by another authorized user/i,
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
  assert.match(
    sql,
    /NEW\.graded_by_user_id IS NOT DISTINCT FROM OLD\.graded_by_user_id/,
  );
  assert.match(
    sql,
    /NEW\.graded_at IS NOT DISTINCT FROM OLD\.graded_at/,
  );
  assert.match(
    sql,
    /expected_action IN \('PUBLISH_GRADE','HIDE_GRADE'\)[\s\S]*e\.actor_user_id = NEW\.graded_by_user_id/,
  );
  assert.doesNotMatch(
    sql,
    /CREATE CONSTRAINT TRIGGER db06_assignment_grade_event_required[\s\S]{0,100}UPDATE OF/,
  );
});

test("DB035 HIDE_GRADE is a restricted reverse publication, not a regrade",()=>{
  const hideShape=sql.split("(action = 'HIDE_GRADE'")[1]
    ?.split("CREATE UNIQUE INDEX assignment_grade_events_submission_version_uq")[0]??"";
  assert.match(sql,/CHECK \(action IN \('GRADE','REGRADE','HIDE_GRADE','PUBLISH_GRADE'\)\)/);
  assert.match(hideShape,/previous_grade_published = true/);
  assert.match(hideShape,/new_grade_published = false/);
  assert.match(hideShape,/previous_points IS NOT DISTINCT FROM new_points/);
  assert.match(hideShape,/previous_feedback IS NOT DISTINCT FROM new_feedback/);
  assert.match(hideShape,/previous_graded_by_user_id IS NOT DISTINCT FROM new_graded_by_user_id/);
  assert.match(hideShape,/previous_graded_at IS NOT DISTINCT FROM new_graded_at/);
  assert.match(sql,/THEN 'HIDE_GRADE'/);
  assert.match(sql,/expected_action IN \('PUBLISH_GRADE','HIDE_GRADE'\)/);
  assert.match(sql,/drizzle\/0205_lane15_assignment_grade_events\.sql/);
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
    "grade event actor lacks grading scope",
    "tenant grade event requires actor membership",
    "attendance event schedule/learner tenant mismatch",
    "attendance event actor membership mismatch",
    "attendance actor without membership must be SUPER_ADMIN",
    "attendance SUPER_ADMIN role is missing",
    "attendance event actor must equal current marker",
    "attendance event does not match current row post-state",
  ]) {
    assert.ok(sql.includes(message), message);
  }
  assert.ok(
    (sql.match(/role = 'SUPER_ADMIN'/g) ?? []).length >= 2,
  );
  assert.match(
    sql,
    /mr\.role = 'COLLEGE_ADMIN'/,
  );
  assert.match(
    sql,
    /mr\.role = 'FACULTY'[\s\S]*cta\.delivery_id = linked_delivery[\s\S]*cta\.ended_at IS NULL/,
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


test("DB035 canonical attendance events use stable record versions and optional delivery snapshots", () => {
  const stagedStart = schema.indexOf(
    "export const attendanceRecordEventsStaged",
  );
  const staged = schema.slice(stagedStart);
  for (const token of [
    'attendanceRecordId: uuid("attendance_record_id").notNull()',
    'recordVersionBefore: integer("record_version_before")',
    'recordVersionAfter: integer("record_version_after").notNull()',
    'actorRole: varchar("actor_role"',
    'previousMarkedByUserId: uuid("previous_marked_by_user_id")',
    'newMarkedByUserId: uuid("new_marked_by_user_id")',
    'previousMarkedAt: timestamp("previous_marked_at"',
    'newMarkedAt: timestamp("new_marked_at"',
  ]) {
    assert.ok(staged.includes(token), token);
  }
  assert.doesNotMatch(
    staged,
    /\brevision\b|previousAttendanceRecordId|newAttendanceRecordId/,
  );
  assert.match(
    sql,
    /NEW\.delivery_id IS DISTINCT FROM linked_delivery/,
  );
  assert.match(sql, /DO \$db06_history_preflight\$/);
});
