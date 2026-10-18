import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../../src/components/courses/"+name+".tsx",import.meta.url),"utf8");

describe("UX-courses-progress-report-tables-01",()=>{
 it("college learner progress offers a scroll-cued shared table with measured progress and explicit empty state",()=>{
  const src=read("college-learner-progress-report");
  expect(src).toContain("<DataTable");
  expect(src).toContain('caption="Course Progress by learner"');
  expect(src).toContain('mobilePriority:"primary"');
  expect(src).toContain('mobilePriority:"secondary"');
  expect(src).toContain("No active learner enrollments for this Class and Course.");
  expect(src).toContain("aria-label={row.name+\" progress\"}");
  expect(src).toContain("report.totalAssignments");
  expect(src).toContain("report.totalQuizzes");
  expect(src).toContain("report.itemsMeasured===0");
  expect(src).not.toContain("<table");
  expect(src).toContain("Export per-learner CSV");
 });
 it("faculty grade report retains score, timestamp, search and pagination on one responsive DataTable",()=>{
  const src=read("faculty-report-student-table");
  expect(src).toContain("<DataTable");
  expect(src).toContain("rows={result.rows}");
  expect(src).toContain("facultyReportStudentPage(rows, search, requestedPage)");
  expect(src).toContain("facultyReportIstTimestamp");
  expect(src).toContain("No students match this search.");
  expect(src).toContain("Not graded");
  expect(src).toContain('aria-label="Report student pages"');
  expect(src).toContain("min-h-11");
  expect(src).not.toContain("<table");
 });
});
