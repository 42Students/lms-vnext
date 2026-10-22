import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin course in-tab entry points",()=>{
 it("SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace",()=>{
  for(const path of ["src/app/(authenticated)/admin/lessons/page.tsx",
   "src/app/(authenticated)/admin/course-progress/page.tsx",
   "src/components/courses/admin-assessment-read-directory.tsx"]){
   const code=source(path);
   expect(code).toContain("/admin/courses/offerings/");
   expect(code).toMatch(/Open offering(?: to add lessons| builder \/ submissions)?(?: →)?/);
   expect(code).toContain("focus-visible:outline");
  }
 });
 it("SA-academics-people-57 lessons have course filter CSV and bulk visibility controls",()=>{
  const code=source("src/app/(authenticated)/admin/lessons/page.tsx");
  expect(code).toContain("SuperAdminLessonBulkVisibility");
  expect(code).toContain("/api/admin/lessons/export?");
  expect(code).toContain("SuperAdminLearningFilterFields");
  expect(source("src/components/courses/super-admin-lesson-bulk-visibility.tsx")).toContain("Show selected");
 });
});
