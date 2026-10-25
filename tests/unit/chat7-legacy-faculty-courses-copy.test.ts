import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultyCourseTabs} from "@/modules/courses/faculty-course-navigation";
describe("Faculty My Courses and course tab copy from dev legacy",()=>{
 it("uses exact My Courses heading in both normal and error states",()=>{
  const src=readFileSync("src/app/(authenticated)/teacher/courses/page.tsx","utf8");
  expect(src.match(/title="My Courses"/g)).toHaveLength(2);
  expect(src).toContain("FacultyPrototypeCourseDirectory");
  expect(src).toContain('<ErrorState title="Failed to load courses. Please try again."');
  expect(src).not.toContain('eyebrow="Faculty"');
  expect(src).not.toContain("Search the courses and exact Sections assigned to you.");
 });
 it("uses the newest Faculty prototype course tab order",()=>{
  expect(facultyCourseTabs.map(tab=>tab.label)).toEqual([
   "Overview","Blueprint","Students","Attendance","Discussions",
  ]);
 });
});
