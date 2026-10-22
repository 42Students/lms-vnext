import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("chat-5 final sprint: teaching surface and discussion parity",()=>{
 it("FAC-courses-30 has exact composer hint, quick fills, new message notice, and reversible pin without a native confirmation",()=>{
  const discussion=src("src/components/courses/learner-course-discussion.tsx");
  for(const phrase of [
   "Write a message...","Enter to send · Shift+Enter for a new line",
   "Post a welcome message","Share this week","Delete this message?",
   "Students can post questions here anytime —"
  ])expect(discussion).toContain(phrase);
  expect(discussion).not.toContain('window.confirm((current.pinned?"Unpin":"Pin")+" this Section message?")');
  expect(discussion).toContain("countNewDiscussionMessages(");
 });
 it("FAC-courses-32 hides an unimplemented course notice board after verifying authorized delivery scope",()=>{
  const notice=src("src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx");
  expect(notice).toContain("getFacultySectionNotices(await getCurrentRequestContext()");
  expect(notice).toContain('"/discussions"');
  expect(notice).not.toContain("Notice board unavailable");
  const navigation=src("src/modules/courses/faculty-course-navigation.ts");
  expect(navigation).not.toContain('"notices"');
 });
 it("FAC-courses-33 redirects legacy cls deep links only to an assigned matching course and section",()=>{
  for(const path of [
    "src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx",
    "src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx",
  ]){
    const page=src(path);
    expect(page).toContain("listFacultyCourseDeliveries(context)");
    expect(page).toContain("item.courseId===current.courseId");
    expect(page).toContain("item.sectionId===");
    expect(page).toMatch(/if\(!target\)(?:\{|redirect\()/);
    expect(page).toContain('redirect("/teacher/courses/"+encodeURIComponent(');
    expect(page).toContain('"/teacher/courses/"+encodeURIComponent(target.deliveryId)');
  }
 });
 it("FAC-courses-35 groups lesson authoring in accessible details and describes a keyboard-operable summary",()=>{
  const blueprint=src("src/components/courses/faculty-course-workspace.tsx");
  expect(blueprint).toContain("<details");
  expect(blueprint).toContain('<summary className="min-h-11 cursor-pointer');
  expect(blueprint).toContain("+ Add content");
  expect(blueprint).toContain("<h2");
 });
 it("FAC-courses-R03 shows assigned Credits and Instructor in the course overview even when descriptive text is empty",()=>{
  const workspace=src("src/components/courses/faculty-course-workspace.tsx");
  expect(workspace).toContain('aria-label="In this Course"');
  expect(workspace).toContain('" Credits"');
  expect(workspace).toContain("Instructor: You");
  const intro=workspace.indexOf('aria-label="In this Course"');
  const display=workspace.indexOf("<CourseDisplayReadOnly");
  expect(intro).toBeGreaterThan(0);
  expect(intro).toBeGreaterThan(display);
 });
});