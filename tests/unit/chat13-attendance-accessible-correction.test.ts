import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/components/attendance/admin-attendance-workspace.tsx","utf8");
describe("Super Admin attendance correction accessibility",()=>{
 it("SA-academics-people-R05 uses in-app correction actions, not native confirm",()=>{
  expect(source).not.toContain("window.confirm(");
  expect(source).toContain("<Modal");
  expect(source).toContain('title={');
  expect(source).toContain('onClick={()=>void correct("PRESENT")}');
   expect(source).toContain("onClick={()=>void correct(absenceReason)}");
  expect(source).toContain('useGuardedAction({busyLabel:');
  expect(source).toContain('disabled={correcting}');
  expect(source).toContain("This change is recorded.");
  expect(source).toContain('role="alert"');
  expect(source).toContain('setTarget(null)');
 });
});
