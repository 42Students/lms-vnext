import {describe,expect,it} from "vitest";
import {
  capFacultyQuizCsvRows,facultyQuizCsvNotice,FACULTY_QUIZ_CSV_MAX_ROWS,
} from "@/modules/courses/faculty-quiz-csv-cap";
import {facultyReportCsv} from "@/modules/courses/faculty-report-csv";

describe("Faculty quiz export row cap",()=>{
 it("always bounds combined result and nonattempt rows",()=>{
  const attempts=Array.from({length:420},(_,i)=>({id:i}));
  const missing=Array.from({length:150},(_,i)=>({id:i+420}));
  const c=capFacultyQuizCsvRows(attempts,missing);
  expect(c.selectedAttempts).toHaveLength(420);
  expect(c.selectedMissing).toHaveLength(80);
  expect(c.omittedRows).toBe(70);
  expect(c.complete).toBe(false);
  expect(FACULTY_QUIZ_CSV_MAX_ROWS).toBe(500);
  expect(facultyQuizCsvNotice(c.omittedRows)).toContain("70 additional");
 });
 it("preserves actual empty, nontruncated results",()=>{
  expect(capFacultyQuizCsvRows([],[])).toEqual({
    selectedAttempts:[],selectedMissing:[],omittedRows:0,complete:true,
  });
  expect(facultyQuizCsvNotice(0)).toBeNull();
 });
 it("keeps formula-neutralization for the capped selection",()=>{
  const rows=[{name:"=HYPERLINK(1)",email:"+919999999999",
    status:"ATTEMPTED" as const,score:"4/5",percent:80,
    submittedAt:"2026-10-14T09:00:00.000Z",note:"@IMPORTXML(1,2)"}];
  const c=capFacultyQuizCsvRows(rows,[]);
  const csv=facultyReportCsv({kind:"quiz",title:"x",sectionName:"A",rows:c.selectedAttempts});
  expect(csv).toContain('"\'=HYPERLINK(1)"');
  expect(csv).not.toContain("+919999999999");
  expect(csv).toContain('"\'@IMPORTXML(1,2)"');
 });
});
