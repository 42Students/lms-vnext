import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/attendance/faculty-attendance-workspace.tsx"),"utf8");
describe("Faculty attendance safe API feedback",()=>{
 it("UX-teacher-courses-deliveryId-attendanceDetail-07 maps named failures without exposing raw API strings",()=>{
  const s=source();
  for(const code of ["ATTENDANCE_CORRECTION_NO_CHANGE","ATTENDANCE_CORRECTION_REASON_REQUIRED","ATTENDANCE_STALE_VERSION","SCHEDULE_EVENT_CONFLICT"])expect(s).toContain(code);
  expect(s).not.toContain("return body?.message || body?.error || fallback");
  expect(s).toContain("return fallback;");
 });
});
