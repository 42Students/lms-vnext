import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("SA-academics-people-64/65 Super Admin assessment privacy and phone states",()=>{
 it("SA-academics-people-64 rejects quiz-only result publication filters rather than throwing after fetching",()=>{
  const page=read("src/app/(authenticated)/admin/assignments/page.tsx");
  expect(page).toContain('query.data.results !== "ALL"');
  expect(page).toContain('Invalid assignment filters');
  expect(page.indexOf('query.data.results !== "ALL"')).toBeLessThan(page.indexOf("getCurrentRequestContext()"));
  const valid=adminAssessmentQuerySchema.parse({scope:"SECTION",results:"ALL",status:"PUBLISHED"});
  expect(valid.scope).toBe("SECTION");
  expect(valid.results).toBe("ALL");
 });
 it("SA-academics-people-64 offers 44px Section, Publish grades and retry actions",()=>{
  const grading=read("src/components/courses/college-assignment-review.tsx");
  expect(grading).toContain("Publish grades for every graded submission in this Section?");
  expect(grading).toContain("Review and retry the remaining grades");
  expect(grading).toContain("min-h-11");
  expect(grading).not.toContain("min-h-10");
  expect(grading).toContain("router.refresh()");
 });
 it("SA-academics-people-65 keeps private quiz attempts within keyboard-readable 44px controls and contained list",()=>{
  const attempts=read("src/components/courses/college-quiz-attempts.tsx");
  expect(attempts).toContain('aria-label="Quiz submissions, scroll for more attempts"');
  expect(attempts).toContain("tabIndex={0}");
  expect(attempts).toContain("overflow-y-auto overscroll-contain");
  expect(attempts).toContain("Scroll inside this panel to see more quiz submissions.");
  expect(attempts).toContain("No quiz submissions yet for this Section.");
  expect(attempts).toContain("min-h-11");
  expect(attempts).not.toContain("min-h-10");
 });
 it("SA-academics-people-64/65 stays in the current college and delegates mutations to authorized services",()=>{
  const pageA=read("src/app/(authenticated)/admin/assignments/page.tsx");
  const pageQ=read("src/app/(authenticated)/admin/quizzes/page.tsx");
  for(const page of [pageA,pageQ]){
   expect(page).toContain("context.adminScope?.collegeId");
   expect(page).toContain("Select a college to continue");
   expect(page).toContain("listCollegeAssessmentAggregate(context");
  }
  const dir=read("src/components/courses/admin-assessment-read-directory.tsx");
  expect(dir).toContain("<CollegeAssignmentReview");
  expect(dir).toContain("<CollegeQuizAttempts");
  expect(dir).toContain("<AdminQuizResultsActions");
 });
});
