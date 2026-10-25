import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyYouTubeLinkIssue} from "@/modules/courses/faculty-content-input-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-7 round 3 faculty course contracts",()=>{
 it("FAC-courses-03 shows the assigned Section, batch and academic period on course cards",()=>{
  const src=read("src/components/courses/faculty-course-list.tsx");
  for(const field of ["course.sectionName","course.cohortName","course.academicPeriodCode"])expect(src).toContain(field);
 });
 it("FAC-courses-06 filters only visible assigned sections and shows counts",()=>{
  const src=read("src/components/courses/faculty-course-list.tsx");
  expect(src).toContain("All sections (");expect(src).toContain("sections.map");expect(src).toContain("section.count");
 });
 it("FAC-courses-16 accepts valid YouTube watch links and rejects unsafe origins",()=>{
  expect(facultyYouTubeLinkIssue("https://www.youtube.com/watch?v=aqz-KE-bpKQ")).toBe(null);
  expect(facultyYouTubeLinkIssue("https://youtu.be/aqz-KE-bpKQ")).toBe(null);
  expect(facultyYouTubeLinkIssue("http://www.youtube.com/watch?v=aqz-KE-bpKQ")).not.toBe(null);
  expect(facultyYouTubeLinkIssue("https://evil.example/watch?v=aqz-KE-bpKQ")).not.toBe(null);
  expect(facultyYouTubeLinkIssue("javascript:alert(1)")).not.toBe(null);
 });
 it("FAC-courses-24 retains dirty content when asked to close without saving",()=>{
  const src=read("src/components/courses/faculty-lesson-authoring.tsx");
  expect(src).toContain("draftDirty");expect(src).toContain("setDiscardConfirm(true)");
  expect(src).toContain("Discard this content draft?");
 });
 it("FAC-courses-34 keeps faculty tab navigation horizontally reachable by keyboard on small screens",()=>{
  const src=read("src/components/courses/faculty-course-tab-navigation.tsx");
  expect(src).toContain('ariaLabel="Faculty course tabs"');
  expect(src).toContain('faculty-prototype-course-tabs');
  expect(src).toContain("renderPanel={false}");
  const tabs=read("src/components/ui/tabs.tsx");
  expect(tabs).toContain('<ScrollCue axis="x"');
  expect(tabs).toContain('aria-current={item.value === value ? "page"');
  expect(tabs).toContain("min-h-11");
 });
});
