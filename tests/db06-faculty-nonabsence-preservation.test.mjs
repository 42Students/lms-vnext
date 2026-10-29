import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const editor = readFileSync(
  "src/modules/attendance/faculty-attendance-edit-state.ts", "utf8",
);
const faculty = readFileSync(
  "src/modules/attendance/faculty-service.ts", "utf8",
);
const admin = readFileSync(
  "src/modules/attendance/admin-service.ts", "utf8",
);
const planner = readFileSync(
  "src/modules/attendance/attendance-record-transitions.ts", "utf8",
);

test("DB06 faculty editor interprets only explicit ABSENT records as absences", () => {
  assert.match(editor, /status: string/);
  assert.match(editor, /record\.scheduleEventId === scheduleEventId && record\.status === "ABSENT"/);
});

test("DB06 faculty correction plans only changed records and retains immutable parent UUIDs", () => {
  assert.match(faculty, /planAttendanceRecordTransitions\(/);
  assert.match(faculty, /\.for\("update"\)/);
  assert.match(faculty, /changeToPresentRecordIds/);
  assert.match(faculty, /changeToAbsentRecordIds/);
  assert.match(faculty, /insertAbsentMembershipIds/);
  assert.match(faculty, /insertPresentMembershipIds/);
  assert.doesNotMatch(faculty, /\.delete\(attendanceRecords\)/);
  assert.match(planner, /existing\.status === "ABSENT"/);
  assert.match(planner, /existing\.status !== "ABSENT"/);
  assert.match(planner, /ATTENDANCE_DUPLICATE_CURRENT_RECORD/);
});

test("DB06 administrator corrections keep stable row identity and review-note edits", () => {
  assert.match(admin, /adminAttendanceCorrectionChange\(/);
  assert.match(admin, /if\(priorRecord\)/);
  assert.match(admin, /\.where\(eq\(attendanceRecords.id,priorRecord.id\)\)/);
  assert.match(admin, /note:change.nextNote/);
  assert.match(admin, /change.shouldNotifyAbsent/);
  assert.match(admin, /change.shouldNotifyCorrected/);
  assert.doesNotMatch(admin, /\.delete\(attendanceRecords\)/);
});

test("DB06 admin edits invalidate marked Faculty session tokens but never mark an unmarked class", () => {
  assert.match(admin, /markedSession\?\.status === "MARKED"/);
  assert.match(admin, /facultyAttendanceNextMarkedAt\(now, markedSession\.markedAt\)/);
  assert.match(admin, /\.update\(attendanceSessions\)/);
  assert.doesNotMatch(admin, /\.insert\(attendanceSessions\)/);
});

test("DB06 attendance course option titles use the canonical null-only legacy mapping", () => {
  assert.match(admin, /courseShortTitle: courses\.shortTitle/);
  assert.match(admin, /formalTitle: legacyFormalTitle\(/);
  assert.match(admin, /shortTitle: courses\.shortTitle/);
});
