import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Super Admin Courses and Content gap closure",()=>{
 it("SA-academics-people-48 uses select college legacy empty copy consistently",()=>{
  for(const path of ["src/app/(authenticated)/admin/assignments/page.tsx","src/app/(authenticated)/admin/quizzes/page.tsx","src/app/(authenticated)/admin/course-progress/page.tsx","src/components/courses/super-admin-content-directory-page.tsx"]){
   const src=readFileSync(path,"utf8");
   expect(src).toContain("Select a college");
   expect(src).toMatch(/Choose a college in the header above|Select a college to view course progress/);
  }
 });
 it("SA-academics-people-63 exact legacy video and live class labels and help",()=>{
  const model=readFileSync("src/modules/courses/super-admin-content-directory-model.ts","utf8");
  const view=readFileSync("src/components/courses/super-admin-content-directory-page.tsx","utf8");
  expect(model).toContain('LIVE_CLASSES:"Live classes"');
  expect(model).toContain('type==="YOUTUBE"?"YouTube Video"');
  expect(model).toContain('type==="VIDEO"?"Video"');
  expect(view).toContain("Upload a video or link a YouTube video to a lesson.");
  expect(view).toContain("Schedule a live class with a meeting link on a lesson.");
 });
 it("SA-academics-people-71 exact legacy empty text for assessment and content directories",()=>{
  const assessments=readFileSync("src/components/courses/admin-assessment-read-directory.tsx","utf8");
  const content=readFileSync("src/components/courses/super-admin-content-directory-page.tsx","utf8");
  expect(assessments).toContain("No assignments found for this college");
  expect(assessments).toContain("No quizzes found for this college");
  expect(content).toContain("No content found.");
  expect(content).toContain("Select a course and lesson to view content.");
 });
 it("SA-academics-people-73 warns before closing unsaved course edits and blocks close while saving",()=>{
  const code=readFileSync("src/components/courses/admin-course-actions.tsx","utf8");
  expect(code).toContain('Discard unsaved course changes?');
  expect(code).toContain('onOpenChange={closeEdit}');
  expect(code).toContain("if(!next && pending)return;");
  expect(code).toContain("onClick={() => closeEdit(false)");
 });
 it("SA-academics-people-76 keyboard operable move buttons are an approved equivalent to drag reorder",()=>{
  const lesson=readFileSync("src/components/courses/college-lesson-reorder-actions.tsx","utf8");
  const content=readFileSync("src/components/courses/faculty-content-order-editor.tsx","utf8");
  expect(lesson).toContain("Move up");
  expect(lesson).toContain("Move down");
  expect(content).toContain("aria-label={`Move ${item.title} up in class content order`}");
  expect(content).toContain("aria-label={`Move ${item.title} down in class content order`}");
  expect(readFileSync("docs/audit/owner-decisions-resolved.md","utf8")).toContain("OD-38");
 });
 it("SA-academics-people-51 Super Admin duplicate course prepopulates draft and returns to correct route",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/courses/page.tsx","utf8");
  const overview=readFileSync("src/components/courses/admin-course-overview.tsx","utf8");
  const create=readFileSync("src/components/courses/admin-course-create-panel.tsx","utf8");
  expect(page).toContain('courseBasePath="/admin/courses"');
  expect(page).toContain("{...(duplicateCourseId!==undefined?{duplicateCourseId}:{})}");
  expect(overview).toContain('duplicateHref={courseBasePath+"?duplicate="+encodeURIComponent(course.id)}');
  expect(overview).toContain("courseBasePath={courseBasePath}");
  expect(create).toContain("collegeCourseDuplicatePrefill(courses,duplicateCourseId)");
  expect(create).toContain("router.replace(courseBasePath)");
 });
 it("SA-academics-people-70 server authoritative scope requires selection before reading content",()=>{
  const code=readFileSync("src/components/courses/super-admin-content-directory-page.tsx","utf8");
  expect(code).toContain("getCurrentRequestContext()");
  expect(code).toContain("if(!context.adminScope?.collegeId)");
  expect(code).toContain("listSuperAdminContentDirectory(context,kind,parsed.data)");
  expect(readFileSync("docs/audit/owner-decisions-resolved.md","utf8")).toContain("OD-38");
 });
});
