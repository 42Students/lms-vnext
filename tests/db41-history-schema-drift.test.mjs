import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {auditDb41} from "../scripts/db41-history-schema-drift.mjs";

const staged=fs.readFileSync("src/db/schema/db06-history-staged.ts","utf8");
const sql=fs.readFileSync("docs/planning/sql/db06-assessment-attendance-history-candidate.sql","utf8");
const original=()=>auditDb41(staged,sql);

test("DB41 grade and attendance history sources are structurally aligned but unverified",()=>{
  const r=original();
  assert.equal(r.status,"STRUCTURALLY_ALIGNED_UNVERIFIED");
  assert.equal(r.fieldDifferences,0);
  for(const table of ["assignment_grade_events","attendance_record_events"]){
    assert.deepEqual(r.tables[table].missingSqlColumns,[]);
    assert.deepEqual(r.tables[table].missingStagedColumns,[]);
    assert.deepEqual(r.tables[table].missingSqlChecks,[]);
    assert.deepEqual(r.tables[table].missingStagedChecks,[]);
  }
  assert.equal(r.readyForPromotion,false);
  assert.equal(r.verifiedPostgreSQL,false);
});

test("DB41 repaired staged TypeScript has no malformed sql.raw literals",()=>{
  assert.deepEqual(original().malformedRawSqlLiterals,[]);
  // The current staged contract has 13 SQL CHECK expressions; require at least
  // that complete set, but do not freeze a superseded count of 14.
  assert.ok((staged.match(new RegExp("sql\\.raw\\("+String.fromCharCode(96),"g"))||[]).length>=13);
  assert.doesNotMatch(staged,/sql\.raw\(""/);
});

test("DB45 staged history imports attendanceRecords exactly once",()=>{
  assert.equal(
    (staged.match(/import \{ attendanceRecords \} from "\.\/attendance";/g)||[]).length,
    1,
  );
});

test("DB41 both event ledgers persist actor role with aligned CHECK names",()=>{
  const r=original();
  assert.ok(!r.errors.some(error=>/does not persist actor_role/.test(error)));
  assert.equal(r.tables.assignment_grade_events.missingSqlChecks.length,0);
  assert.equal(r.tables.attendance_record_events.missingSqlChecks.length,0);
});

test("DB41 grade completeness trigger now captures feedback-only mutations",()=>{
  assert.doesNotMatch(original().errors.join("\n"),/ignores feedback-only edits/);
  assert.match(sql.slice(sql.indexOf("CREATE FUNCTION db06_require_assignment_grade_event()")),/NEW\.feedback\s+IS\s+NOT\s+DISTINCT\s+FROM\s+OLD\.feedback/);
  assert.match(sql,/e\.previous_feedback\s+IS\s+NOT\s+DISTINCT\s+FROM\s+OLD\.feedback/);
  assert.match(sql,/e\.new_feedback\s+IS\s+NOT\s+DISTINCT\s+FROM\s+NEW\.feedback/);
});

test("DB41 new staged field absent from SQL is detected",()=>{
  const modified=staged.replace(/actorRole: varchar\("actor_role"/,
    'extraUnmapped: text("injected_unmapped"),\n    actorRole: varchar("actor_role"');
  const r=auditDb41(modified,sql);
  assert.ok(r.tables.assignment_grade_events.missingSqlColumns.includes("injected_unmapped"));
  assert.equal(r.fieldDifferences,1);
});

test("DB41 extra SQL-only field not present in staged schema is detected",()=>{
  const modified=sql.replace("CREATE TABLE assignment_grade_events (",
    "CREATE TABLE assignment_grade_events (\n  injected_rogue_column uuid,");
  const r=auditDb41(staged,modified);
  assert.ok(r.tables.assignment_grade_events.missingStagedColumns.includes("injected_rogue_column"));
});

test("DB41 parses a final nested CHECK closure without swallowing the next statement",()=>{
  assert.match(sql, /attendance_record_events_shape_ck[\s\S]*\)\);\s*\nCREATE UNIQUE INDEX attendance_record_events_record_version_uq/);
  const aligned=original();
  assert.ok(aligned.tables.attendance_record_events,
    "a valid final CHECK closing as )); must be recognized as a complete SQL table");
  const truncated=sql.replace(
    /\)\);\s*\nCREATE UNIQUE INDEX attendance_record_events_record_version_uq/,
    ")\nCREATE UNIQUE INDEX attendance_record_events_record_version_uq",
  );
  assert.notEqual(truncated,sql);
  assert.match(auditDb41(staged,truncated).errors.join("\n"),
    /attendance_record_events: missing SQL CREATE TABLE/,
    "unterminated DDL must remain fail-closed");
});

test("DB41 fails closed on missing SQL history table",()=>{
  const modified=sql.replace("CREATE TABLE attendance_record_events (",
    "CREATE TABLE renamed_attendance_record_events (");
  const r=auditDb41(staged,modified);
  assert.match(r.errors.join("\n"),/attendance_record_events: missing SQL CREATE TABLE/);
  assert.equal(r.readyForPromotion,false);
});

test("DB41 fails closed on missing staged history table",()=>{
  const modified=staged.replace('"attendance_record_events"','"renamed_attendance_record_events"');
  const r=auditDb41(modified,sql);
  assert.match(r.errors.join("\n"),/attendance_record_events: missing staged pgTable/);
});

test("DB41 source alignment cannot be mistaken for PostgreSQL verification",()=>{
  const r=original();
  assert.equal(r.readyForPromotion,false);
  assert.equal(r.verifiedPostgreSQL,false);
  assert.doesNotMatch(r.status,/DONE_VERIFIED|PG_PASS|READY_FOR_RELEASE/);
  assert.equal(r.requiredEvidence.length,4);
});

test("DB41 rejects reintroduced malformed string quoting",()=>{
  const backtick=String.fromCharCode(96);
  const modified=staged.replace("sql.raw("+backtick+'"actor_role"', 'sql.raw(""actor_role"');
  const r=auditDb41(modified,sql);
  assert.ok(r.malformedRawSqlLiterals.length>=1);
  assert.match(r.errors.join("\n"),/Malformed TypeScript sql.raw/);
});

test("DB41 grade and attendance actor CHECK parity is closed",()=>{
  const r=original();
  assert.equal(r.tables.assignment_grade_events.missingSqlChecks.length,0);
  assert.equal(r.tables.assignment_grade_events.missingStagedChecks.length,0);
  assert.equal(r.tables.attendance_record_events.missingSqlChecks.length,0);
  assert.equal(r.tables.attendance_record_events.missingStagedChecks.length,0);
});

test("DB41 grade actor role is checked against its real membership grant",()=>{
  const guard=sql.slice(sql.indexOf("CREATE FUNCTION db06_grade_event_scope_guard()"),
    sql.indexOf("CREATE FUNCTION db06_attendance_event_scope_guard()"));
  assert.match(guard,/NEW\.actor_role = 'COLLEGE_ADMIN'/);
  assert.match(guard,/NEW\.actor_role = 'FACULTY'/);
  assert.match(guard,/mr\.role = 'COLLEGE_ADMIN'/);
  assert.match(guard,/mr\.role = 'FACULTY'/);
  assert.match(guard,/DB06 grade event tenant actor role invalid/);
});


test("DB41 attendance completeness captures exact marker and mark-time snapshots",()=>{
  const r=original();
  assert.doesNotMatch(r.errors.join("\n"),/Attendance completeness trigger ignores/);
  const trigger=sql.slice(sql.indexOf("CREATE FUNCTION db06_require_attendance_event()"));
  for(const field of [
    "previous_marked_by_user_id","new_marked_by_user_id",
    "previous_marked_at","new_marked_at",
  ]){
    assert.match(trigger,new RegExp(field));
  }
  assert.match(sql,/DB06 attendance record identity is immutable/);
  assert.match(sql,/DB06 attendance event actor must equal current marker/);
});

test("DB41 canonical attendance model uses stable record versions, not delete-recreate revision ids",()=>{
  const table=sql.slice(
    sql.indexOf("CREATE TABLE attendance_record_events ("),
    sql.indexOf("-- Tenant/actor validation"),
  );
  for(const field of [
    "attendance_record_id","record_version_before","record_version_after",
    "delivery_id","actor_role",
  ]){
    assert.match(table,new RegExp("\\b"+field+"\\b"));
  }
  assert.doesNotMatch(
    table,
    /\brevision\b|previous_attendance_record_id|new_attendance_record_id/,
  );
});


test("DB45 semantic preflight requires non-null composite schedule-delivery identity",()=>{
  const nullable=sql.replace(
    "delivery_id uuid NOT NULL\n    REFERENCES course_section_deliveries",
    "delivery_id uuid\n    REFERENCES course_section_deliveries",
  );
  assert.match(
    auditDb41(staged,nullable).errors.join("\n"),
    /delivery_id must be NOT NULL/,
  );

  const noNullGuard=sql.replace(
    "IF linked_delivery IS NULL THEN",
    "IF false THEN",
  );
  assert.match(
    auditDb41(staged,noNullGuard).errors.join("\n"),
    /without a delivery link/,
  );

  const noCanonicalLink=sql.replace(
    "IF NEW.delivery_id IS DISTINCT FROM linked_delivery THEN",
    "IF false THEN",
  );
  assert.match(
    auditDb41(staged,noCanonicalLink).errors.join("\n"),
    /required canonical schedule delivery link/,
  );

  const noDeliveryFk=sql.replace(
    "attendance_record_events_delivery_identity_fk",
    "removed_delivery_identity_fk",
  );
  assert.match(
    auditDb41(staged,noDeliveryFk).errors.join("\n"),
    /attendance_record_events_delivery_identity_fk/,
  );

  const noBridgeUnique=sql.replace(
    "section_schedule_event_courses_event_delivery_uq",
    "removed_event_delivery_uq",
  );
  assert.match(
    auditDb41(staged,noBridgeUnique).errors.join("\n"),
    /section_schedule_event_courses_event_delivery_uq/,
  );
});

test("DB45 semantic preflight rejects obsolete delete-recreate attendance identity",()=>{
  const modified=staged.replace(
    'recordVersionBefore: integer("record_version_before"),',
    'revision: integer("revision"),\n    recordVersionBefore: integer("record_version_before"),',
  );
  assert.match(
    auditDb41(modified,sql).errors.join("\n"),
    /obsolete session-revision field reintroduced: revision/,
  );
});

test("DB45 semantic preflight requires marker snapshots and marked_at versioning",()=>{
  const noMarkedAtVersion=sql.replace(
    "     OR NEW.marked_at IS DISTINCT FROM OLD.marked_at THEN",
    " THEN",
  );
  assert.match(
    auditDb41(staged,noMarkedAtVersion).errors.join("\n"),
    /version guard ignores marked_at/,
  );

  const attendanceTriggerStart = sql.indexOf("CREATE FUNCTION db06_require_attendance_event()");
  assert.ok(attendanceTriggerStart >= 0);
  const noPreviousMarker = sql.slice(0, attendanceTriggerStart) +
    sql.slice(attendanceTriggerStart).replaceAll(
      "previous_marked_by_user_id", "removed_marker_snapshot"
    );
  assert.notEqual(noPreviousMarker, sql, "Mutation must actually modify the trigger");
  assert.match(
    auditDb41(staged,noPreviousMarker).errors.join("\n"),
    /ignores marker snapshot: previous_marked_by_user_id/,
  );
});

test("DB45 current source has no semantic preflight errors",()=>{
  const r=original();
  assert.deepEqual(r.errors,[]);
  assert.equal(r.status,"STRUCTURALLY_ALIGNED_UNVERIFIED");
  assert.equal(r.fieldDifferences,0);
  assert.equal(r.readyForPromotion,false);
  assert.equal(r.verifiedPostgreSQL,false);
});
