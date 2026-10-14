import {describe,expect,it} from "vitest";
import {buildHrCalendarCsv,HR_CALENDAR_EXPORT_CAP} from "@/modules/placements/hr-calendar-export-model";
describe("HR authorized calendar CSV projection",()=>{
 const round={kind:"ROUND",title:"  =Panel",jobTitle:"Engineer",startsAt:new Date("2026-10-15T10:00:00Z"),
  status:"SCHEDULED",jobId:"job-a"};
 const deadline={...round,kind:"APPLICATION_DEADLINE",title:"Applications close"};
 const due={id:"due",jobTitle:"Engineer",roundName:"Results due",dueAt:new Date("2026-10-16T10:00:00Z"),jobId:"job-a"};
 it("separates recorded categories and escapes spreadsheet formulas",()=>{
  expect(buildHrCalendarCsv([round,deadline],[due],"ROUNDS").csv).toContain("'  =Panel");
  expect(buildHrCalendarCsv([round,deadline],[due],"ROUNDS").csv).not.toContain("RESULTS_DUE");
  expect(buildHrCalendarCsv([round,deadline],[due],"RESULTS_DUE").csv).toContain("Results due");
  expect(buildHrCalendarCsv([round,deadline],[due],"DEADLINES").exported).toBe(1);
 });
 it("bounds export without fabricating more appointments",()=>{
  const result=buildHrCalendarCsv(Array.from({length:HR_CALENDAR_EXPORT_CAP+1},()=>round),[],"ALL");
  expect(result.exported).toBe(200);
  expect(result.omitted).toBe(1);
 });
});
