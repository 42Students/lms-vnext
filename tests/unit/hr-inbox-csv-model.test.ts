import {describe,expect,it} from "vitest";
import {buildHrInboxCsv,HR_INBOX_CSV_CAP} from "@/modules/placements/hr-inbox-csv-model";
const row={id:"n1",jobId:"j1",title:"  =HYPERLINK(1,2)",label:"Drive published",
 createdAt:new Date("2026-10-15T10:00:00Z"),unread:true};
describe("HR notification CSV",()=>{
 it("exports only safe labels and never raw stored notification bodies",()=>{
  const csv=buildHrInboxCsv([row],1).csv;
  expect(csv).toContain("'  =HYPERLINK");
  expect(csv).toContain("Drive published");
  expect(csv).not.toContain("private candidate details");
  expect(csv).toContain("Yes");
 });
 it("caps output with exact omitted count",()=>{
  const result=buildHrInboxCsv(Array.from({length:HR_INBOX_CSV_CAP+1},()=>row),225);
  expect(result.exported).toBe(200);
  expect(result.omitted).toBe(25);
 });
});
