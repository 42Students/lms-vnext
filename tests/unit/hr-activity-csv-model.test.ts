import {describe,expect,it} from "vitest";
import {buildHrActivityCsv,HR_ACTIVITY_CSV_CAP} from "@/modules/placements/hr-activity-csv-model";
describe("HR activity CSV",()=>{
 const row={id:"e",jobId:"job",title:"  =HYPERLINK(1,2)",status:"Published",
   occurredAt:new Date("2026-10-15T10:00:00Z")};
 it("neutralizes formulas without raw metadata or contact",()=>{
  const csv=buildHrActivityCsv([row],false).csv;
  expect(csv).toContain("'  =HYPERLINK");
  expect(csv).toContain("Published");
  expect(csv).not.toContain("privateContact");
 });
 it("caps at 200 with explicit caveat",()=>{
  const result=buildHrActivityCsv(Array.from({length:HR_ACTIVITY_CSV_CAP+1},
   (_,i)=>({...row,id:String(i)})),true);
  expect(result.exported).toBe(200);
  expect(result.capped).toBe(true);
  expect(result.csv).toContain("Additional authorized events omitted");
 });
});
