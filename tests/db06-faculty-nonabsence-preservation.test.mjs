import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const editor = readFileSync(
  "src/modules/attendance/faculty-attendance-edit-state.ts",
  "utf8",
);
const writer = readFileSync(
  "src/modules/attendance/faculty-service.ts",
  "utf8",
);

test("DB06 faculty editor interprets only explicit ABSENT records as absences", () => {
  assert.match(editor, /status: string/);
  assert.match(editor, /record\.scheduleEventId === scheduleEventId && record\.status === "ABSENT"/);
});

test("DB06 faculty correction never deletes an admin-coded non-absence as a side effect", () => {
  const presentStart = writer.indexOf("if (input.presentMembershipIds.length > 0)");
  const absentStart = writer.indexOf("if (input.absentMembershipIds.length > 0)", presentStart);
  assert.ok(presentStart >= 0 && absentStart > presentStart, "bulk present/absent writer branches exist");
  const presentBranch = writer.slice(presentStart, absentStart);
  assert.match(presentBranch, /\.delete\(attendanceRecords\)/);
  assert.match(presentBranch, /eq\(attendanceRecords\.status, "ABSENT"\)/);
  assert.match(presentBranch, /inArray\([\s\S]*input\.presentMembershipIds/);
  const absentBranch = writer.slice(absentStart, writer.indexOf("if (existingSession)", absentStart));
  assert.match(absentBranch, /status: "ABSENT"/);
});
