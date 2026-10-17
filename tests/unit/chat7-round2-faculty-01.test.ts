import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-7 faculty course listing and roster contracts",()=>{
it("FAC-courses-01 faculty course back-link has legacy label and destination",()=>{
 const source=readFileSync("src/components/courses/faculty-course-tab-navigation.tsx","utf8");
 expect(source).toContain("Back to courses");
 expect(source).toContain("href=\"/teacher/courses\"");
});
it("FAC-courses-04 only secondary teaching roles show role badge",()=>{
 const source=readFileSync("src/components/courses/faculty-course-list.tsx","utf8");
 expect(source).toContain("course.teachingRole!==\"PRIMARY\"");
 expect(source).toContain("Your role:");
});
it("FAC-courses-05 course list exposes assignment and section metrics",()=>{
 const source=readFileSync("src/components/courses/faculty-course-list.tsx","utf8");
 expect(source).toContain("Teaching assignment(s)");
 expect(source).toContain("Section(s)");
});
it("FAC-courses-08 empty/filter-miss messages distinguish conditions",()=>{
 const source=readFileSync("src/components/courses/faculty-course-list.tsx","utf8");
 expect(source).toContain("No teaching assignments found. Please contact your administrator.");
 expect(source).toContain("No courses match “");
 expect(source).toContain("No teaching assignments in this section.");
});
it("FAC-courses-29 roster empty messaging matches class enrollment reality",()=>{
 const source=readFileSync("src/components/courses/faculty-course-roster.tsx","utf8");
 expect(source).toContain("No students yet");
 expect(source).toContain("Students will appear here once they are enrolled in this class.");
});
});
