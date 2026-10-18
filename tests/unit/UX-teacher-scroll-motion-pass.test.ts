import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Faculty scroll and motion cues",()=>{
 it("UX-teacher-scroll-motion-01 shows vertical fade and accessible scroll in teaching and Section summaries",()=>{
  const s=read("src/components/courses/faculty-course-list.tsx");
  expect(s).toContain('<ScrollCue axis="y" label="Teaching assignments"');
  expect(s).toContain('<ScrollCue axis="y" label="Teaching Sections"');
  expect(s).toContain("motion-safe:duration-[var(--lms-motion-fast)]");
  expect(s).toContain("motion-reduce:transform-none");
 });
 it("UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column",()=>{
  const s=read("src/components/attendance/faculty-attendance-workspace.tsx");
  expect(s).toContain('<ScrollCue axis="x" label="Faculty attendance monthly grid"');
  expect(s).toContain('className="sticky left-0 z-10 bg-surface px-3 py-3"');
  expect(s).toContain("P = Present · A = Absent");
 });
 it("UX-teacher-scroll-motion-03 cues desktop roster scrolling while retaining phone cards",()=>{
  const s=read("src/components/courses/faculty-course-roster.tsx");
  expect(s).toContain('<DataTable');
  const table=read("src/components/ui/data-table.tsx");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(table).toContain('mobilePriority==="action"');
  expect(table).toContain("sm:table-row");
  expect(s).not.toContain("hidden overflow-x-auto rounded-xl");
 });
});