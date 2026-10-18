import {describe,expect,it} from "vitest";
import {facultyReportCsv,facultyReportCsvFilename,facultyCsvIstTimestamp,
 neutralizeFacultyCsvCell,capFacultyReportCsvRows,facultyCsvLearnerLabel}
 from "@/modules/courses/faculty-report-csv";
import {facultyRosterCsv} from "@/modules/courses/faculty-roster-export";
import {facultyQuizQuestionAccuracyCsv} from "@/modules/courses/faculty-quiz-question-csv";
import {facultyResultsPageCsv} from "@/modules/courses/faculty-results-export";
import {facultyFollowUpPageCsv} from "@/modules/courses/faculty-followup-export";

const row={name:"Mira",status:"SUBMITTED" as const,score:"8 / 10",percent:80,
 submittedAt:"2026-10-18T18:29:00.000Z",note:"Reviewed"};

describe("COURSES-BREAK-FACULTY-04 hostile spreadsheet input, bounded exports and IST",()=>{
 it("FAC-attendance-grades-01 rejects oversized feedback, score and timestamp before export",()=>{
  for(const changes of [
   {note:"x".repeat(10001)},
   {score:"a".repeat(121)},
   {submittedAt:"z".repeat(81)},
  ]){
   expect(()=>facultyReportCsv({kind:"quiz",title:"A",sectionName:"B",
    rows:[{...row,...changes}]})).toThrow();
  }
  expect(()=>facultyReportCsv({kind:"assignment",title:"A",sectionName:"B",
   rows:Array.from({length:501},()=>({...row}))})).toThrow();
 });
 it("FAC-attendance-grades-01 neutralizes formula injection with hidden Unicode prefixes",()=>{
  for(const unsafe of ["=2+2","+SUM(A1)","-42","@NOW()",
   "\t=1+1","\uFEFF=1+1","\u200B=1+1","\u200E=1+1","\u200C=1+1","\u2060=1+1","\u202E=1+1","\u00AD=1+1"]){
   const safe=neutralizeFacultyCsvCell(unsafe);
   expect(safe.startsWith("'")).toBe(true);
   const csv=facultyReportCsv({kind:"quiz",title:"Safe",sectionName:"A",
    rows:[{...row,name:unsafe,note:unsafe}]});
   expect(csv).toContain('"' + safe + '"');
  }
 });
 it("FAC-attendance-grades-01 escapes quotes and preserves IST day rollover without locale drift",()=>{
  const csv=facultyReportCsv({kind:"quiz",title:"Midterm",sectionName:"A",
   rows:[{...row,name:'Mira "Test"',submittedAt:"2026-10-18T18:29:00.000Z"}]});
  expect(csv).toContain('"Mira ""Test"""');
  expect(csv).toContain('"2026-10-18 23:59:00 IST"');
  expect(facultyCsvIstTimestamp("2026-10-18T18:30:00.000Z"))
   .toBe("2026-10-19 00:00:00 IST");
  expect(()=>facultyCsvIstTimestamp("not-a-time")).toThrow();
 });
 it("FAC-attendance-grades-01 roster export excludes contact and membership identifiers",()=>{
  const csv=facultyRosterCsv([{displayName:"=2+2",rollNumber:"+2",
   email:"private@example.invalid",phoneE164:"+919999999999",
   membershipId:"secret-membership-id"}]);
  expect(csv).toContain("'=2+2");
  expect(csv).toContain("'+2");
  expect(csv).not.toContain("private@example.invalid");
  expect(csv).not.toContain("919999999999");
  expect(csv).not.toContain("secret-membership-id");
  expect(facultyCsvLearnerLabel(null)).toBe("Learner (name unavailable)");
 });
 it("FAC-attendance-grades-01 limits long rosters and large question reports with explicit omissions",()=>{
  const capped=capFacultyReportCsvRows(Array.from({length:503},(_,i)=>i));
  expect(capped).toMatchObject({omittedRows:3});
  expect(capped.rows).toHaveLength(500);
  const questions=facultyQuizQuestionAccuracyCsv(Array.from({length:502},(_,i)=>({
   prompt:i===0?"=HYPERLINK(\"evil\")":"Question "+i,
   points:1,answeredCount:1,correctCount:0,accuracyPercent:0,
  })));
  expect(questions.omittedRows).toBe(2);
  expect(questions.csv).toContain("'=HYPERLINK(");
  expect(questions.csv).toContain("2 more questions omitted by the 500-row cap");
  expect(questions.csv).not.toContain("Question 501");
 });
 it("FAC-attendance-grades-01 aggregate results and follow-ups never include individual learner data",()=>{
  const result=facultyResultsPageCsv([{kind:"QUIZ",status:"PUBLISHED",title:"=IMPORTXML(1)",
   courseName:"Course",sectionName:"A",eligible:10,responded:8,pending:2,averagePercent:80}]);
  expect(result).toContain("'=IMPORTXML(1)");
  expect(result).toContain("Response rate");
  for(const invalid of [
    {eligible:NaN,responded:1,pending:0},
    {eligible:5,responded:6,pending:0},
    {eligible:5,responded:1,pending:6},
    {eligible:5,responded:-1,pending:4},
    {eligible:5,responded:1.5,pending:3},
  ]){
    expect(()=>facultyResultsPageCsv([{
      kind:"QUIZ",status:"PUBLISHED",title:"A",courseName:"Course",
      sectionName:"A",averagePercent:null,...invalid,
    }])).toThrow("INVALID_FACULTY_RESULT_CSV_COUNTS");
  }
  const hiddenPrefix=String.fromCharCode(0x200b)+"=HYPERLINK(A1)";
  const hiddenResult=facultyResultsPageCsv([{kind:"QUIZ",status:"PUBLISHED",
   title:hiddenPrefix,courseName:"Course",sectionName:"A",
   eligible:1,responded:1,pending:0,averagePercent:100}]);
  expect(hiddenResult).toContain("'"+hiddenPrefix);
  const hiddenFollowup=facultyFollowUpPageCsv([{kind:"ASSIGNMENT",
   title:hiddenPrefix,courseName:"Course",sectionName:"A",
   dueAt:null,missingCount:1,hiddenCount:0}]);
  expect(hiddenFollowup).toContain("'"+hiddenPrefix);
  expect(()=>facultyResultsPageCsv(Array.from({length:11},()=>({
   kind:"QUIZ",status:"PUBLISHED",title:"A",courseName:"C",sectionName:"A",
   eligible:10,responded:8,pending:2,averagePercent:80,
  })))).toThrow();
  const followups=facultyFollowUpPageCsv([{kind:"ASSIGNMENT",title:"+SUM(1)",
   courseName:"A",sectionName:"B",dueAt:null,missingCount:5,hiddenCount:1}]);
  expect(followups).toContain("'+SUM(1)");
  expect(followups).not.toContain("membershipId");
  expect(()=>facultyFollowUpPageCsv([{kind:"ASSIGNMENT",title:"A",
   courseName:"B",sectionName:"C",dueAt:null,missingCount:1,hiddenCount:2}])).toThrow();
  expect(facultyReportCsvFilename("quiz","../=Danger","Sec")).not.toMatch(/[\\/]/);
 });
});
