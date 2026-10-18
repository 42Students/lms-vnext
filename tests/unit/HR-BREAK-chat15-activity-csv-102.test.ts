import {describe,expect,it} from "vitest";
import {buildHrActivityCsv,HR_ACTIVITY_CSV_CAP}
 from "@/modules/placements/hr-activity-csv-model";
const row={id:"event",jobId:"job",title:"Engineer",status:"Published",
 occurredAt:new Date("2099-05-01T18:30:00Z")};
describe("HR-ACTIVITY-CSV-102 persisted employer activity export",()=>{
 it("handles an unreadable timestamp with a truthful placeholder",()=>{
  const result=buildHrActivityCsv([{...row,occurredAt:new Date(Number.NaN)}],false);
  expect(result.exported).toBe(1);
  expect(result.csv).toContain("Date unavailable");
  expect(result.csv).not.toContain("Invalid Date");
 });
 it("marks truncated data even if the caller omitted the external additionalRows flag",()=>{
  const rows=Array.from({length:HR_ACTIVITY_CSV_CAP+2},(_,i)=>({...row,id:"event-"+i}));
  const result=buildHrActivityCsv(rows,false);
  expect(result.exported).toBe(HR_ACTIVITY_CSV_CAP);
  expect(result.capped).toBe(true);
  expect(result.csv).toContain("Additional authorized events omitted");
 });
 it("also announces downstream pagination truncation when current page is below cap",()=>{
  const result=buildHrActivityCsv([row],true);
  expect(result.capped).toBe(true);
  expect(result.csv).toContain("Export capped");
 });
 it("escapes spreadsheet formula-prefixed role titles without exporting contacts",()=>{
  const result=buildHrActivityCsv([{...row,title:" =HYPERLINK(1,2)"}],false);
  expect(result.csv).toContain("' =HYPERLINK");
  expect(result.csv).not.toContain("private@example.test");
 });
});