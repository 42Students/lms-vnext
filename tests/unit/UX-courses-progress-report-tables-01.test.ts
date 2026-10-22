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
  expect(src).toContain('<MetricBar label={row.name+" progress" }');
  expect(src).toContain('role="progressbar" value={row.progress} maximum={100}');
  expect(src).toContain("report.totalAssignments");
  expect(src).toContain("report.totalQuizzes");
  expect(src).toContain("report.itemsMeasured===0");
  expect(src).not.toContain("<table");
  expect(src).toContain("Export per-learner CSV");
 });
 it("faculty grade report retains score, IST timestamp, search and accessible mobile cards",()=>{
  const src=read("faculty-report-student-table");
  expect(src).toContain("<DataTable");
  expect(src).toContain("rows={filtered}");
  expect(src).toContain("rows.filter(student=>!query||student.name.toLocaleLowerCase().includes(query))");
  expect(src).toContain('timeZone:"Asia/Kolkata"');
  expect(src).toContain('const missing="No students match “"+search+"”.');
  expect(src).toContain('student.percent===null?');
  expect(src).toContain('mobileMode="cards"');
  expect(src).toContain('aria-label="Search students"');
  expect(src).toContain("min-h-11");
  expect(src).not.toContain("<table");
 });
});
