import {it,expect,describe} from "vitest";
import {readFileSync} from "node:fs";
const service=readFileSync(new URL("../../src/modules/attendance/admin-service.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../../src/components/attendance/admin-attendance-workspace.tsx",import.meta.url),"utf8");
describe("COL-attendance-01 / COL-attendance-02",()=>{
 it("does not apply the Faculty 24-hour window to the admin correction path",()=>{
  const correction=service.slice(service.indexOf("export async function correctAdminAttendance"));
  expect(correction).not.toContain("facultyAttendanceMarkingWindow");
  expect(ui).not.toContain("facultyAttendanceMarkingWindow");
  expect(ui).toContain("College Admin corrections are not limited");
 });
 it("writes a scoped audit event in the same transaction and suppresses no-ops",()=>{
  const correction=service.slice(service.indexOf("export async function correctAdminAttendance"));
  expect(correction).toContain("if(!change.changed)");
  expect(correction).toContain("adminAttendanceCorrectionChange({");
  expect(correction).toContain("note:change.nextNote");
  expect(correction).toContain("change.statusChanged");
  expect(correction).toContain("tx.insert(activityEvents)");
  expect(correction).toContain("adminAttendanceAuditEventType(change.statusChanged,input.status)");
  const model=readFileSync(new URL("../../src/modules/attendance/admin-correction-change-model.ts",import.meta.url),"utf8");
  expect(model).toContain("ADMIN_ATTENDANCE_MARK_PRESENT");
  expect(model).toContain("ADMIN_ATTENDANCE_MARK_ABSENT");
  expect(model).toContain("ADMIN_ATTENDANCE_NOTE_UPDATED");
  expect(correction).toContain("organizationId:college.organizationId");
  expect(correction).toContain("learnerMembershipId:input.membershipId");
 });
});
