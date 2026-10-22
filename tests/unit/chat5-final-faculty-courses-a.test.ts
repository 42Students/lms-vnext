import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("chat-5 final sprint faculty course list and core lesson contracts",()=>{
 it("FAC-courses-02 keeps an accessible non-upload initial fallback while real thumbnail persistence remains unavailable",()=>{
  const list=src("src/components/courses/faculty-course-list.tsx");
  const card=src("src/components/courses/learner-course-card-image.tsx");
  const cover=src("src/components/courses/faculty-course-cover.tsx");
  expect(list).toContain("<FacultyCourseCover");
  expect(cover).toContain('import Image from "next/image"');
  expect(cover).toContain('src="/assets/images/common/course.svg"');
  expect(cover).toContain('alt="" aria-hidden="true"');
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
  expect(list).toContain('placeholder="Search Courses..."');
  expect(list).toContain('action="/teacher/courses" method="get"');
  // Only text search is debounced; select filters navigate on the same event.
  expect(auto).toContain('target.name==="q"?120:0');
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
  expect(course).toContain('defaultOpen={Boolean(selectedLessonId || lessonIndex === 0)}');
  expect(course).toContain('Expand lesson');
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
  const metrics=src("src/modules/courses/faculty-roster-display-model.ts");
  expect(roster).toContain("facultyRosterMetrics(learners)");
  expect(metrics).toContain("const contacts=learners.filter(");
  expect(metrics).toContain("row.phoneE164?.trim()||row.email?.trim()");
  expect(metrics).toContain("const missingRoll=learners.filter(");
  expect(metrics).toContain('rollLabel:missingRoll?missingRoll+" without a roll number":"All have roll numbers"');
  expect(roster).toContain("sortFacultyRosterByRollThenName");
  expect(roster).toContain("facultyRosterMetrics");
  expect(roster).toContain('aria-label={"View "+nameOf(learner)+" profile photo"}');
  expect(roster).toContain("facultyRosterPhotoPreview(preview.photoDownloadUrl)");
  expect(roster).toContain('alt={"Profile photograph of "+nameOf(preview)}');
  expect(roster).toContain("initials(nameOf(preview))");
  expect(src("docs/audit/pages/faculty/courses-review.md")).toContain("WRONG (partly)");
 });
});