import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("chat-5 final sprint faculty course list and core lesson contracts",()=>{
 it("FAC-courses-02 keeps an accessible non-upload initial fallback while real thumbnail persistence remains unavailable",()=>{
  const list=src("src/components/courses/faculty-course-list.tsx");
  const card=src("src/components/courses/learner-course-card-image.tsx");
  expect(list).toContain("course.courseName.trim().slice(0,2).toUpperCase()");
  expect(card).toContain("learnerCourseCardMediaAfterError(thumbnailUrl,failed)");
  expect(card).toContain('alt=""');
  // No persisted faculty thumbnail exists; do NOT claim full legacy image parity.
  expect(src("docs/audit/acceptance/faculty-courses-verification.md")).toContain("FAC-courses-02");
 });
 it("FAC-courses-07 debounces course search and immediately submits assigned-period, section and role filters via scoped GET",()=>{
  const list=src("src/components/courses/faculty-course-list.tsx");
  const auto=src("src/components/courses/faculty-course-filter-auto-submit.tsx");
  expect(list).toContain("FacultyCourseFilterAutoSubmit");
  expect(list).toContain('placeholder="Course, code, Section or academic period"');
  expect(list).toContain('action="/teacher/courses" method="get"');
  expect(auto).toContain('target.name==="q"?350:0');
  expect(auto).toContain("form.requestSubmit()");
  for(const name of ["q","period","section","role"])expect(auto).toContain('"'+name+'"');
 });
 it("FAC-courses-10 collapses the lesson blueprint into accessible native accordions with the first lesson initially expanded",()=>{
  const course=src("src/components/courses/faculty-course-workspace.tsx");
  expect(course).toContain("<details");
  expect(course).toContain("<summary");
  expect(course).toContain('open={selectedLessonId?true:lessonIndex===0?true:undefined}');
  expect(course).toContain('Expand or collapse lesson');
 });
 it("FAC-courses-17 is NOT-A-GAP: lesson live editor gives an explicit IST timezone contract",()=>{
  const editor=src("src/components/courses/faculty-live-class-editor.tsx");
  expect(editor).toContain("Enter meeting times in IST (Asia/Kolkata)");
  expect(editor).toContain('type="datetime-local"');
  expect(src("docs/audit/pages/faculty/courses-review.md")).toContain("WRONG (mostly)");
 });
 it("FAC-courses-28 is NOT-A-GAP for a missing contacts metric: actual authorized roster computes contact availability and uses safe initials instead of leaking a private photo",()=>{
  const roster=src("src/components/courses/faculty-course-roster.tsx");
  expect(roster).toContain("const contacts = learners.filter(");
  expect(roster).toContain('"Contact available"');
  expect(roster).toContain("function initials(value: string)");
  expect(roster).toContain("rollNumber");
  expect(src("docs/audit/pages/faculty/courses-review.md")).toContain("WRONG (partly)");
 });
});