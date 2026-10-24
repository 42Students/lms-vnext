import {describe,expect,it} from "vitest";
import {mentorCsvRows,mentorXlsxTrialSummary}
 from "@/modules/projects/mentor-xlsx-trial-summary-model";
describe("Mentor delivery XLSX first-sheet read-only trial summary",()=>{
 it("counts worksheet rows and numeric columns without interpreting scores",()=>{
  const result=mentorXlsxTrialSummary('"Trial","Run","Points"\r\n"alpha","1","10.5"\r\n"beta","2","12"\r\n');
  expect(result.totalDataRows).toBe(2);
  expect(result.headers).toEqual(["Trial","Run","Points"]);
  expect(result.numericTotals).toEqual([
   {header:"Run",count:2,total:3},{header:"Points",count:2,total:22.5},
  ]);
 });
 it("handles comma-separated quoted cells and newlines without HTML rendering",()=>{
  expect(mentorCsvRows('"Trial","Note"\r\n"1","Say ""hi"", <script>"\r\n'))
   .toEqual([["Trial","Note"],["1",'Say "hi", <script>']]);
 });
 it("does not sum missing or mixed numeric column content",()=>{
  const summary=mentorXlsxTrialSummary('"Name","Score"\n"a","10"\n"b","not submitted"\n');
  expect(summary.numericTotals).toEqual([]);
 });
 it("bounds inline cell, header and row sizes",()=>{
  const csv='"Long name","x"\n'+Array.from({length:15},(_,i)=>'"'+i+'","'+
   "A".repeat(260)+'"').join("\n");
  const output=mentorXlsxTrialSummary(csv);
  expect(output.rows).toHaveLength(12);
  expect(output.rows[0]?.[1]).toHaveLength(240);
  expect(()=>mentorCsvRows('"Header"\n"1"\n"2"',2)).toThrow("XLSX_PREVIEW_TOO_MANY_ROWS");
 });
});
