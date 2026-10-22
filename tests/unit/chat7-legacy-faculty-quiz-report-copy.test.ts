import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Faculty QuizReportContent.jsx dev legacy headings and empty states",()=>{
 const src=readFileSync("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx","utf8");
 it("preserves dynamic report title and exact legacy section names",()=>{
  expect(src).toContain("<PageHeader title={quiz.title}");
  for(const label of ["Score distribution","Question accuracy","Student scores","Worst-answered first."]){
   expect(src).toContain(label);
  }
  expect(src).not.toContain('eyebrow="Faculty · Quiz Report"');
  expect(src).toContain("<FacultyReportBackButton");
 });
 it("uses exact empty text without claiming unreleased question results are visible",()=>{
  expect(src).toContain("This quiz has no questions yet.");
  expect(src).toContain('emptyMessage="No one has submitted this quiz yet."');
  expect(src).toContain("quiz.resultsPublished");
  expect(src).toContain("latestAttempts.map((attempt) =>");
 });
});
