import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const source=(name:string)=>readFileSync(name,"utf8");
describe("legacy Learner My Courses copy — legacy-copy-A course listing and Header",()=>{
 it("keeps exact Courses title with no invented learner eyebrow or subtitle",()=>{
  const page=source("src/app/(authenticated)/learn/courses/page.tsx");
  expect(page).toContain('title="Courses"');
  expect(page).not.toContain('eyebrow="Learner"');
  expect(page).not.toContain("Your semester courses, electives, credits and learning progress.");
 });
 it("uses legacy Back to courses wording in the course workspace and recovery pages",()=>{
  for(const file of [
   "learn/courses/[deliveryId]/[...courseTab]/page.tsx",
   "learn/courses/error.tsx","learn/allQuizzes/error.tsx","learn/allAssignments/error.tsx",
  ]){
   const page=source("src/app/(authenticated)/"+file);
   expect(page).toContain("LEARNER_BACK_TO_COURSES");
   expect(page).not.toContain("Back to Courses");
  }
  expect(source("src/modules/courses/learner-course-copy-model.ts")).toContain('"Back to courses"');
 });
 it("uses the full legacy search hint without replacing the search control",()=>{
  const tools=source("src/components/shell/learner-topbar-tools.tsx");
  expect(tools).toContain("LEARNER_COURSE_SEARCH_PLACEHOLDER");
  expect(source("src/modules/courses/learner-course-copy-model.ts")).toContain("Search Courses (e.g., Java, Data Structures, CS...)");
 });
});
