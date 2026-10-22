import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Academic Attendance",()=>{
 it("SA-academics-people-31 mounts the scoped writable attendance-policy editor",()=>{
  const page=read("src/app/(authenticated)/admin/attendance/page.tsx");
  expect(page).toContain("SuperAdminAttendanceSettingsEditor");
  expect(page).toContain("options.policy.correctionWindowHours");
  expect(page).toContain("options.policy.eligibilityThresholdPercent");
  const edit=read("src/components/admin/super-admin-attendance-settings-editor.tsx");
  expect(edit).toContain("/api/attendance/admin/policy");
  expect(edit).toContain("ConfirmDialog");
  expect(edit).not.toContain("window.confirm");
 });
 it("G2-5-006-008 distinguishes a saved default-valued college field from inherited policy",()=>{
  const edit=read("src/components/admin/super-admin-attendance-settings-editor.tsx");
  expect(edit).toContain('savedHours===DEFAULT_ATTENDANCE_POLICY.correctionWindowHours');
  expect(edit).toContain('savedThreshold===DEFAULT_ATTENDANCE_POLICY.eligibilityThresholdPercent');
  expect(edit).toContain('"Saved college value · matches default"');
  expect(edit).toContain('"Custom for this college"');
  expect(edit).toContain("Reset college policy to default");
  expect(edit).toContain("Platform/organization inheritance is not inferred");
 });
 it("SA-academics-people-32 preserves exact legacy attendance-policy copy and accessible errors",()=>{
  const edit=read("src/components/admin/super-admin-attendance-settings-editor.tsx");
  for(const value of ["Attendance policy","Late marking allowed for","Minimum attendance",
  "How long after a class ends attendance can be marked or corrected (hours).",
  "It does not block anyone from exams."]) expect(edit).toContain(value);
  expect(edit).toContain('<Alert tone={failed?"error":"success"}>');
  const alert=read("src/components/ui/alert.tsx");
  expect(alert).toContain('role={tone === "error" ? "alert" : role ?? "status"}');
 });
});
