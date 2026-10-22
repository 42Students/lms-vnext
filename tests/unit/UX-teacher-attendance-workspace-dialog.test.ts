import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=()=>readFileSync(join(process.cwd(),"src/components/attendance/faculty-attendance-workspace.tsx"),"utf8");
describe("Faculty attendance draft protection and scheduling",()=>{
 it("UX-teacher-courses-deliveryId-attendanceDetail-05 protects unsaved marks across date, session and mode navigation",()=>{
  const source=read();
  expect(source).toContain("confirmDiscardMarks(next:()=>void)");
  expect(source).toContain("nextAfterDiscard.current=next;setDiscardOpen(true)");
  expect(source).toContain('title="Discard your unsaved attendance changes?"');
  expect(source).not.toContain("window.confirm");
 });
 it("UX-teacher-courses-deliveryId-attendanceDetail-06 shows the IST time confirmation before posting session",()=>{
  const source=read();
  expect(source).toContain("const timing = facultyScheduleInstants(startsAt, endsAt)");
  expect(source).toContain("if(!confirmed){setConfirmScheduleOpen(true);return;}");
  expect(source).toContain("onConfirm={()=>void createSession(null,true)}");
  expect(source).toContain("if(confirmed){scheduleLock.current=false;setScheduling(false);setConfirmScheduleOpen(false);}");
 });
});
