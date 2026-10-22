import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("UX-courses-scroll-motion-01 accessible overflow cues",()=>{
 it("the content preview and learner roadmap modal inherit responsive, accessible scroll and focus behaviour",()=>{
  const dialog=read("src/components/ui/dialog.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  const preview=read("src/components/courses/college-content-preview.tsx");
  const roadmap=read("src/components/courses/learner-roadmap-item-dialog.tsx");
  expect(preview).toMatch(/<Dialog\s+open=\{open\}/);
  expect(roadmap).toContain("<Dialog open={open}");
  expect(dialog).toContain('<ScrollCue axis="y"');
  expect(dialog).toContain("opener.current?.focus()");
  expect(dialog).toContain("safe-area-inset-bottom");
  expect(cue).toContain("overscroll-contain");
  expect(cue).toContain("data-scroll-fade");
  expect(cue).toContain("tabIndex={edges.scrollable ? 0 : -1}");
 });
 it("attendance history provides DataTable mobile priorities and horizontal edge cues",()=>{
  const source=read("src/components/courses/learner-course-attendance.tsx");
  const dataTable=read("src/components/ui/data-table.tsx");
  expect(source).toContain('<DataTable');
  expect(source).toContain('caption="Attendance History"');
  expect(source).toContain('mobilePriority:"primary"');
  expect(source).toContain('mobilePriority:"secondary"');
  expect(source).toContain('empty={<EmptyState');
  expect(dataTable).toContain('<ScrollCue axis="x"');
  expect(dataTable).toContain('mobilePriority');
  expect(source).not.toContain('<table className=');
 });
 it("motion uses global tokens with reduced-motion support rather than local hard-coded timings",()=>{
  const global=read("src/app/globals.css");
  expect(global).toContain("--lms-motion-fast");
  expect(global).toContain("--lms-motion-base");
  expect(global).toContain("prefers-reduced-motion");
  for(const file of ["college-content-preview","learner-roadmap-item-dialog","learner-course-attendance"]){
   const source=read("src/components/courses/"+file+".tsx");
   expect(source).not.toMatch(/duration-(?:75|100|150|200|300|500|700|1000)\b/);
  }
 });
});
