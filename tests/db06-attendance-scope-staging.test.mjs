import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "docs/planning/sql/db06-attendance-scope-candidate.sql",
  "utf8",
);
const contract = readFileSync(
  "docs/planning/database-parity-db06-attendance-scope-contract.md",
  "utf8",
);

test("DB042 event-delivery bridge proves section and college alignment", () => {
  assert.match(sql, /CREATE FUNCTION db06_attendance_event_context/);
  assert.match(sql, /d\.section_id = e\.section_id/);
  assert.match(sql, /course_dep\.college_id = section_dep\.college_id/);
  assert.match(sql, /CREATE TRIGGER db06_attendance_event_delivery_scope_guard/);
  assert.match(sql, /v_delivery_section IS DISTINCT FROM v_event_section/);
  assert.match(sql, /v_course_college IS DISTINCT FROM v_event_college/);
});

test("DB042 roster handles normal and elective deliveries without archived fallback", () => {
  assert.match(sql, /CREATE FUNCTION db06_attendance_membership_on_roster/);
  assert.match(sql, /mr\.role = 'LEARNER'/);
  assert.match(sql, /u\.platform_status = 'ACTIVE'/);
  assert.match(sql, /WHERE eo\.backed_delivery_id = ctx\.delivery_id[\s\S]*LIMIT 1/);
  assert.match(sql, /eo\.status = 'ACTIVE'/);
  assert.match(sql, /es\.status = 'ACTIVE'/);
  assert.match(sql, /g\.kind = 'ELECTIVE'/);
  assert.match(sql, /g\.status = 'ACTIVE'/);
  assert.match(sql, /gm\.member_type = 'LEARNER'/);
  assert.match(sql, /gm\.state = 'ACTIVE'/);
  assert.match(sql, /se\.section_id = ctx\.section_id/);
  assert.match(sql, /se\.academic_period_id = ctx\.academic_period_id/);
  assert.match(sql, /se\.status = 'ACTIVE'/);
  assert.match(sql, /lpe\.status = 'ACTIVE'/);
  assert.match(
    contract,
    /existence[^\n]*elective offering[\s\S]*archived[\s\S]*rejects a new attendance write/i,
  );
});

test("DB042 marker scope is superadmin, same-college admin, or assigned faculty only", () => {
  assert.match(sql, /CREATE FUNCTION db06_attendance_actor_kind/);
  assert.match(sql, /sr\.role = 'SUPER_ADMIN'/);
  assert.match(sql, /mr\.role = 'COLLEGE_ADMIN'/);
  assert.match(sql, /mr\.role = 'FACULTY'/);
  assert.match(sql, /course_teaching_assignments cta/);
  assert.match(sql, /cta\.delivery_id = ctx\.delivery_id/);
  assert.match(sql, /cta\.ended_at IS NULL/);
  assert.doesNotMatch(
    sql,
    /mr\.role IN \([^)]*'TPO'/,
    "TPO role must not become an attendance marking principal",
  );
});

test("DB042 preserves source start-time and faculty correction-window semantics", () => {
  assert.match(sql, /CREATE FUNCTION db06_attendance_assert_write_timing/);
  assert.match(sql, /ctx\.event_status <> 'SCHEDULED'/);
  assert.match(sql, /clock_timestamp\(\) < ctx\.starts_at/);
  assert.match(sql, /p_marked_at < ctx\.starts_at/);
  assert.match(sql, /p_marked_at > clock_timestamp\(\) \+ interval '5 minutes'/);
  assert.match(sql, /v_actor_kind = 'FACULTY'/);
  assert.match(sql, /attendance_policies/);
  assert.match(sql, /COALESCE\(v_window, 24\)/);
  assert.match(sql, /ctx\.ends_at \+ make_interval\(hours => v_window\)/);
  assert.match(
    contract,
    /admin corrections intentionally bypass that post-class cutoff but do \*\*not\*\* bypass the future-session rule/i,
  );
});

test("DB042 current record must be roster-scoped, authorized and identity-stable", () => {
  assert.match(sql, /CREATE TRIGGER db06_attendance_record_scope_guard/);
  assert.match(sql, /NEW\.schedule_event_id IS DISTINCT FROM OLD\.schedule_event_id/);
  assert.match(sql, /NEW\.membership_id IS DISTINCT FROM OLD\.membership_id/);
  assert.match(sql, /db06_attendance_membership_on_roster/);
  assert.match(sql, /db06_attendance_assert_write_timing/);
  assert.match(sql, /NEW\.updated_at < NEW\.marked_at/);
});

test("DB042 attendance record requires final MARKED session at transaction commit", () => {
  assert.match(sql, /CREATE CONSTRAINT TRIGGER db06_attendance_record_requires_marked_session/);
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(sql, /s\.status = 'MARKED'/);
  assert.match(sql, /s\.marked_at IS NOT NULL/);
  assert.match(sql, /s\.marked_by_user_id IS NOT NULL/);
});

test("DB042 session mark lifecycle cannot be erased or time-reversed", () => {
  assert.match(sql, /CREATE TRIGGER db06_attendance_session_scope_guard/);
  assert.match(sql, /OLD\.status = 'MARKED'[\s\S]*NEW\.status <> 'MARKED'/);
  assert.match(sql, /OLD\.marked_at IS NOT NULL[\s\S]*NEW\.marked_at < OLD\.marked_at/);
  assert.match(sql, /NEW\.schedule_event_id IS DISTINCT FROM OLD\.schedule_event_id/);
});

test("DB042 stays separate from DB035 immutable history ownership", () => {
  assert.match(contract, /DB-035 stages immutable grade\/attendance history/i);
  assert.match(contract, /does \*\*not\*\* register or redefine[^\n]*attendance_record_events/i);
  assert.doesNotMatch(sql, /CREATE TABLE attendance_record_events/);
  assert.doesNotMatch(sql, /ALTER TABLE attendance_records\s+ADD COLUMN version/i);
});

test("DB042 candidate has no duplicate CREATE object declarations", () => {
  const objects = [];
  for (const [type, re] of [
    ["FUNCTION", /CREATE FUNCTION\s+([A-Za-z0-9_]+)/g],
    ["TRIGGER", /CREATE TRIGGER\s+([A-Za-z0-9_]+)/g],
    ["TABLE", /CREATE TABLE\s+([A-Za-z0-9_]+)/g],
    ["INDEX", /CREATE (?:UNIQUE )?INDEX\s+([A-Za-z0-9_]+)/g],
  ]) {
    for (const match of sql.matchAll(re)) objects.push(type + ":" + match[1]);
  }
  assert.equal(new Set(objects).size, objects.length);
  assert.doesNotMatch(sql, /<<<<<<<|=======|>>>>>>>/);
});

test("DB042 proof state remains source-only until PostgreSQL executes", () => {
  assert.match(contract, /not registered, not PostgreSQL verified/i);
  assert.match(contract, /No disposable PostgreSQL/);
  assert.match(contract, /must not become[^\n]*DONE_VERIFIED/);
});
