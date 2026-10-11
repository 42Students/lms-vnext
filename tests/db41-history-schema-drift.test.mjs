import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {auditDb41} from "../scripts/db41-history-schema-drift.mjs";

const staged=fs.readFileSync("src/db/schema/db06-history-staged.ts","utf8");
const sql=fs.readFileSync("docs/planning/sql/db06-assessment-attendance-history-candidate.sql","utf8");
const original=()=>auditDb41(staged,sql);

test("DB41 grade ledger is aligned while attendance history remains structurally divergent",()=>{
  const r=original();
  assert.equal(r.status,"BLOCKED_SOURCE_DRIFT");
  assert.equal(r.fieldDifferences,12);
  assert.deepEqual(r.tables.assignment_grade_events.missingSqlColumns,[]);
  assert.deepEqual(r.tables.assignment_grade_events.missingStagedColumns,[]);
  assert.deepEqual(r.tables.assignment_grade_events.missingSqlChecks,[]);
  assert.deepEqual(r.tables.attendance_record_events.missingStagedColumns,[
    "attendance_record_id","record_version_after","record_version_before"
  ]);
  assert.equal(r.tables.attendance_record_events.missingSqlColumns.length,9);
});

test("DB41 repaired staged TypeScript has no malformed sql.raw literals",()=>{
  assert.deepEqual(original().malformedRawSqlLiterals,[]);
  assert.ok((staged.match(new RegExp("sql\\.raw\\("+String.fromCharCode(96),"g"))||[]).length>=14);
  assert.doesNotMatch(staged,/sql\.raw\(""/);
});

test("DB41 grade events now persist actor role, but attendance actor model remains unresolved",()=>{
  const r=original();
  assert.ok(!r.errors.includes("assignment_grade_events: SQL does not persist actor_role"));
  assert.ok(r.errors.includes("attendance_record_events: SQL does not persist actor_role"));
  assert.equal(r.tables.assignment_grade_events.missingSqlChecks.length,0);
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
  assert.equal(r.fieldDifferences,13);
});

test("DB41 extra SQL-only field not present in staged schema is detected",()=>{
  const modified=sql.replace("CREATE TABLE assignment_grade_events (",
    "CREATE TABLE assignment_grade_events (\n  injected_rogue_column uuid,");
  const r=auditDb41(staged,modified);
  assert.ok(r.tables.assignment_grade_events.missingStagedColumns.includes("injected_rogue_column"));
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

test("DB41 grade actor CHECK parity is closed; attendance actor CHECK parity is still open",()=>{
  const r=original();
  assert.equal(r.tables.assignment_grade_events.missingSqlChecks.length,0);
  assert.ok(r.tables.attendance_record_events.missingSqlChecks.some(x=>x.endsWith("_actor_role_ck")));
  assert.ok(r.tables.attendance_record_events.missingSqlChecks.some(x=>x.endsWith("_actor_shape_ck")));
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
