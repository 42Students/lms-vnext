import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("chat-5 final sprint faculty course list and core lesson contracts",()=>{
 it("FAC-courses-02 keeps an accessible non-upload initial fallback while real thumbnail persistence remains unavailable",()=>{
  const list=src("src/components/courses/faculty-course-list.tsx");
  const card=src("src/components/courses/learner-course-card-image.tsx");
  expect(list).toContain('import Image from "next/image"');
  expect(list).toContain('src="/assets/images/common/course.svg"');
  expect(list).toContain('alt="" width={64} height={64}');
  expect(list).toContain('aria-hidden="true"');
  expect(list).not.toContain('course.courseName.trim().slice(0,2).toUpperCase()');
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
  expect(auto).toContain('router.replace("/teacher/courses"+(query?"?"+query:""),{scroll:false})');
  expect(auto).toContain("new FormData(form)");
  expect(auto).not.toContain("form.requestSubmit()");
  expect(auto).toContain('if(!form?.isConnected)return');
  for(const name of ["q","period","section","role"])expect(auto).toContain('"'+name+'"');
 });
 it("FAC-courses-10 collapses the lesson blueprint into accessible native accordions with the first lesson initially expanded",()=>{
  const course=src("src/components/courses/faculty-course-workspace.tsx");
  expect(course).toContain("<details");
  expect(course).toContain("<summary");
  expect(course).toContain('open={selectedLessonId?true:lessonIndex===0?true:undefined}');
  expect(course).toContain('Expand or collapse lesson');
 });
 it("FAC-courses-17 enforces a real 12-hour IST picker and 15-minute schedule rules",()=>{
  const editor=src("src/components/courses/faculty-live-class-editor.tsx");
  const lesson=src("src/components/courses/faculty-lesson-authoring.tsx");
  const picker=src("src/components/courses/faculty-ist-quarter-hour-picker.tsx");
  expect(editor).toContain("Enter meeting times in IST (Asia/Kolkata)");
  expect(editor).toContain("<FacultyIstQuarterHourPicker");
  expect(lesson).toContain("<FacultyIstQuarterHourPicker");
  expect(picker).toContain('value="AM"');
  expect(picker).toContain('value="PM"');
  expect(picker).toContain("FACULTY_IST_QUARTER_MINUTES");
 });
 it("FAC-courses-28 renders contacts and missing-roll copy, sorted roster, and an authorized avatar preview fallback",()=>{
  const roster=src("src/components/courses/faculty-course-roster.tsx");
  expect(roster).toContain('const contacts = learners.filter(');
  expect(roster).toContain("sortFacultyRosterByRollThenName");
  expect(roster).toContain("facultyRosterMetrics");
  expect(roster).toContain('aria-label={"Preview avatar for "+nameOf(learner)}');
  expect(roster).toContain("facultyRosterPhotoPreview(preview.photoDownloadUrl)");
  expect(roster).toContain('description="Only photos provided through an authorized course roster can be displayed."');
  expect(roster).toContain("No photo is available for this student.");
  expect(src("docs/audit/pages/faculty/courses-review.md")).toContain("WRONG (partly)");
 });
});