import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Faculty shared surface mobile and focus rollout",()=>{
 it("UX-teacher-courses-shared-02 preserves course summary roles and 44px filter disclosures",()=>{
  const src=read("src/components/courses/faculty-course-list.tsx");
  expect(src).toContain('min-h-11 cursor-pointer items-center');
  expect(src).toContain("facultyCourseListHref(query)");
  expect(src).toContain("No teaching assignments found. Please contact your administrator.");
  expect(src).not.toContain("text-on-primary");
 });
 it("UX-teacher-contacts-shared-02 keeps explicit directory empty copy and accessible pagination",()=>{
  const src=read("src/components/courses/faculty-contacts-table.tsx");
  expect(src).toContain("No public directory members found");
  expect(src).toContain("min-h-11");
  expect(src).toContain('aria-label="Contacts pages"');
  expect(src).toContain("focus-visible:outline-2");
 });
 it("UX-teacher-reports-shared-02 uses both phone cards and desktop report rows with 44px paging",()=>{
  const src=read("src/components/courses/faculty-report-student-table.tsx");
  expect(src).toContain("<DataTable");
  const table=read("src/components/ui/data-table.tsx");
  expect(table).toContain("sm:table-row");
  expect(table).toContain("mobilePriority");
  expect(src).toContain("min-h-11 rounded-md");
  expect(src).toContain("emptyMessage");
 });
 it("UX-teacher-assessments-shared-02 has honest zero results and keyboard-size review links",()=>{
  const src=read("src/components/courses/faculty-assessment-overview.tsx");
  expect(src).toContain("EmptyState");
  expect(src).toContain("min-h-11");
  expect(src).not.toContain("text-primary-text");
 });
});
