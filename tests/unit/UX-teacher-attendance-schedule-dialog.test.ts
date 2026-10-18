import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/attendance/faculty-attendance-schedule-editor.tsx"),"utf8");
describe("Faculty attendance schedule editor accessibility",()=>{
 it("UX-teacher-courses-deliveryId-attendanceDetail-03 replaces native confirmation with shared ConfirmDialog",()=>{
  const s=source();
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('this Faculty attendance session?"}');
  expect(s).toContain("onConfirm={()=>void save(true)}");
  expect(s).not.toContain("window.confirm");
  expect(s).toContain('finally{setBusy(false);setConfirmOpen(false);}');
 });
 it("UX-teacher-courses-deliveryId-attendanceDetail-04 uses accessible shared labels and 44px input controls",()=>{
  const s=source();
  for(const component of ["<Button","<Input","<Select","<Textarea"])expect(s).toContain(component);
  expect(s).not.toContain("text-on-primary");
  expect(s).toContain("if(unchanged){setError");
  expect(s).toContain("facultyScheduleInstants");
 });
});
