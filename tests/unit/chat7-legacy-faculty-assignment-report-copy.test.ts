import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("AssignmentReportContent.jsx dev report headings and empty copy",()=>{
 const page=readFileSync("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx","utf8");
 const student=readFileSync("src/components/courses/faculty-report-student-table.tsx","utf8");
 it("keeps authoritative assignment title and legacy report sections",()=>{
  expect(page).toContain("<PageHeader title={assignment.title?.trim()||"Untitled assignment"}");
  for(const text of ["Submitted","Average score","Graded","Due date","Score distribution","Submission timing","Student scores","View submissions","See who submitted and grade their work."]){
   expect(page).toContain(text);
  }
  expect(page).not.toContain('eyebrow="Faculty · Assignment Report"');
 });
 it("uses legacy no-submissions empty only for assignment reports",()=>{
  expect(page).toContain('emptyMessage="No one has submitted this assignment yet."');
  expect(student).toContain('emptyMessage="No learners have submitted yet."');
  expect(student).toContain("<EmptyState title={emptyMessage}/>");
 });
});
