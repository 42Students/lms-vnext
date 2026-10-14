import {describe,expect,it} from "vitest";
import {learnerAttendanceHistoryCsv} from "@/modules/attendance/learner-attendance-history-csv-model";
const r={title:'=HYPERLINK("x")',courseCode:"CS101",startsAt:"2026-10-15T10:00:00Z",
 status:"NOT_MARKED",facultyName:null,location:"-cmd"};
describe("learner attendance scoped history export",()=>{
 it("neutralizes formulas, quotes and keeps the actual unmarked state",()=>{
  const result=learnerAttendanceHistoryCsv([r]);
  expect(result.content).toContain('"'+"'"+'=HYPERLINK(""x"")"');
  expect(result.content).toContain('"-cmd"'.replace('"-','"\'-'));
  expect(result.content).toContain('"NOT_MARKED"');
  expect(result.content).not.toContain("Student email");
 });
 it("caps export and explicitly reports truncation",()=>{
  const result=learnerAttendanceHistoryCsv(Array.from({length:201},()=>r));
  expect(result.truncated).toBe(true);
  expect(result.content.split("\r\n").filter(Boolean)).toHaveLength(201);
 });
});
