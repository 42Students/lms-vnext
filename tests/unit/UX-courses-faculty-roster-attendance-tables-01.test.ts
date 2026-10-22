import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("UX-courses-faculty-roster-attendance-tables-01",()=>{
 it("faculty roster preserves authorized avatar preview, contacts, search and pagination in one DataTable",()=>{
  const source=read("src/components/courses/faculty-course-roster.tsx");
  expect(source).toContain("<DataTable");
  expect(source).toContain('caption="Students in this class"');
  expect(source).toContain("rows={rows}");
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain('mobilePriority:"secondary"');
  expect(source).toContain('aria-label={"View "+nameOf(learner)+" profile photo"}');
  expect(source).toContain("setPreview(learner)");
  expect(source).toContain('<Dialog open={preview!==null}');
  expect(source).toContain("facultyRosterPhotoPreview");
  expect(source).toContain("View student details →");
  expect(source).toContain("Student roster pages");
  expect(source).not.toContain("<table");
 });
 it("learner attendance history keeps month/status filtering, complete metadata and IST dates through DataTable",()=>{
  const source=read("src/components/attendance/learner-attendance-workspace.tsx");
  expect(source).toContain("<DataTable");
  expect(source).toContain('caption="Attendance history"');
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain("learnerAttendanceStatusTone(row.status)");
  expect(source).toContain("statusLabel(row.status)");
  expect(source).toContain("row.facultyName,row.location");
  expect(source).toContain('timeZone:"Asia/Kolkata"');
  expect(source).toContain("No sessions match this status");
  expect(source).toContain("Download attendance CSV");
  expect(source).not.toContain("<table");
 });
});
