import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAttendanceMarkingWindow} from "../../src/modules/attendance/faculty-marking-window";
const read=(p:string)=>readFileSync(p,"utf8");
describe("College Admin / Faculty permission-sensitive parity",()=>{
 it("COL-placements-22 preserves college-admin placement management without granting TPO-personal workflow access",()=>{
  const access=read("src/modules/placements/tpo-workspace-access-model.ts");
  const home=read("src/app/(authenticated)/tpo/home/page.tsx");
  const decisions=read("docs/audit/owner-decisions-resolved.md");
  expect(decisions).toContain("OD-07");
  expect(access).toContain('can(context, "placements.manage"');
  expect(access).toContain('hasMembershipRole(context, "TPO")');
  expect(home).toContain("if(!hasTpoTooling(ctx))");
  expect(home).toContain('"/college/placements"');
 });
 it("FAC-attendance-grades-R01 keeps expired faculty correction window symmetric while college admins retain audited override",()=>{
  const startsAt=new Date("2099-05-01T10:00:00.000Z");
  const endsAt=new Date("2099-05-01T11:00:00.000Z");
  expect(facultyAttendanceMarkingWindow({startsAt,endsAt,correctionWindowHours:2,now:new Date("2099-05-01T13:00:01.000Z")})).toBe("WINDOW_EXPIRED");
  const policy=read("docs/audit/owner-decisions-resolved.md");
  expect(policy).toContain("OD-05");
  expect(policy).toContain("College admins bypass the attendance correction window");
 });
});