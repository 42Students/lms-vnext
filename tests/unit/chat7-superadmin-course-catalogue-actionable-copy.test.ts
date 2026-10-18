import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("Super Admin course catalogue action and copy parity",()=>{
 it("SA-academics-people-56 does not describe an actionable Lessons directory as read-only",()=>{
  const page=read("src/app/(authenticated)/admin/lessons/page.tsx");
  expect(page).not.toContain("Read-only authored lesson catalogue");
  expect(page).toContain("<SuperAdminLessonCreate");
  expect(page).toContain("<LessonActions");
  expect(page).toContain("<CollegeLessonReorderActions");
  expect(page).toContain("Open offering to add lessons");
 });
 it("SA-academics-people-64 exposes existing assignment builder and grading actions without falsely labeling them read-only",()=>{
  const page=read("src/app/(authenticated)/admin/assignments/page.tsx");
  const directory=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(page).toContain("<CollegeAssignmentCreate");
  expect(directory).toContain("<CollegeAssignmentReview");
  expect(directory).toContain("<CollegeAssignmentActions");
  expect(directory).not.toContain("Read-only ${title.toLowerCase()}");
 });
 it("SA-academics-people-65 exposes quiz builder, attempts and results action without a read-only heading",()=>{
  const page=read("src/app/(authenticated)/admin/quizzes/page.tsx");
  const directory=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(page).toContain("<CollegeQuizCreate");
  expect(directory).toContain("<CollegeQuizAttempts");
  expect(directory).toContain("<AdminQuizResultsActions");
  expect(directory).not.toContain("Read-only ${title.toLowerCase()}");
 });
});
