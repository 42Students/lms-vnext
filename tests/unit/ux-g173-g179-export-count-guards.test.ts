import {describe,expect,it} from "vitest";
import {capFacultyQuizCsvRows,FACULTY_QUIZ_CSV_MAX_ROWS} from
 "@/modules/courses/faculty-quiz-csv-cap";
import {buildHrCompanyReportCsv,HR_REPORT_EXPORT_CAP} from
 "@/modules/placements/hr-company-report-export-model";

const report={id:"job-1",title:"Engineer",status:"PUBLISHED",
 applications:1,submittedApplications:1,withdrawnApplications:0,
 outstandingOffers:0,acceptedOffers:0,declinedOffers:0,joinedOffers:0};

describe("UX-G173/G179 nonfinite CSV limit and count recovery",()=>{
 it("preserves visible quiz results when internal row limit is NaN",()=>{
  const out=capFacultyQuizCsvRows([{id:1}],[{id:2}],Number.NaN);
  expect(out.selectedAttempts).toHaveLength(1);
  expect(out.selectedMissing).toHaveLength(1);
  expect(out.omittedRows).toBe(0);
  expect(out.complete).toBe(true);
 });
 it("bounds infinite internal quiz limits to the documented 500 rows",()=>{
  const attempted=Array.from({length:FACULTY_QUIZ_CSV_MAX_ROWS+3},(_,id)=>({id}));
  const out=capFacultyQuizCsvRows(attempted,[],Infinity);
  expect(out.selectedAttempts).toHaveLength(FACULTY_QUIZ_CSV_MAX_ROWS);
  expect(out.omittedRows).toBe(3);
  expect(out.complete).toBe(false);
 });
 it("does not display NaN/Infinity as recruiter report omitted counts",()=>{
  for(const total of [Number.NaN,Infinity,-1]){
   const result=buildHrCompanyReportCsv([report] as never,total);
   expect(result.exported).toBe(1);
   expect(result.omitted).toBe(0);
   expect(result.csv).not.toContain('"NaN"');
   expect(result.csv).not.toContain('"Infinity"');
  }
 });
 it("reports capped recruiter rows with a human-readable notice",()=>{
  const rows=Array.from({length:HR_REPORT_EXPORT_CAP+2},()=>report);
  const result=buildHrCompanyReportCsv(rows as never,rows.length);
  expect(result.exported).toBe(HR_REPORT_EXPORT_CAP);
  expect(result.omitted).toBe(2);
  expect(result.csv).toContain("Export capped");
  expect(result.csv).toContain("2 additional drives");
 });
});
