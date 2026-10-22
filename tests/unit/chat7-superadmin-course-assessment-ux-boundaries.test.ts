import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";
import {parseSuperAdminAssignmentQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("SA-academics-people-64/65 Super Admin assessment privacy and phone states",()=>{
 it("SA-academics-people-64 rejects quiz-only result publication filters rather than throwing after fetching",()=>{
  const page=read("src/app/(authenticated)/admin/assignments/page.tsx");
  expect(page).toContain("parseSuperAdminAssignmentQuery(raw)");
  expect(page).toContain('Invalid assignment filters');
  expect(page.indexOf("parseSuperAdminAssignmentQuery(raw)")).toBeLessThan(page.indexOf("getCurrentRequestContext()"));
  expect(parseSuperAdminAssignmentQuery({results:"PUBLISHED"}).success).toBe(false);
  expect(parseSuperAdminAssignmentQuery({status:"CLOSED"}).success).toBe(false);
  const valid=adminAssessmentQuerySchema.parse({scope:"SECTION",results:"ALL",status:"PUBLISHED"});
  expect(valid.scope).toBe("SECTION");
  expect(valid.results).toBe("ALL");
 });
 it("SA-academics-people-64 offers 44px Section, Publish grades and retry actions",()=>{
  const grading=read("src/components/courses/college-assignment-review.tsx");
  expect(grading).toContain('"Only this selected Section is included."');
  expect(grading).toContain("Ungraded submissions remain unchanged.");
  expect(grading).toContain("grades remain. Continue or retry.");
  expect(grading).toContain("min-h-11");
  expect(grading).not.toContain("min-h-10");
  expect(grading).toContain("router.refresh()");
 });
 it("SA-academics-people-65 keeps private quiz attempts within keyboard-readable 44px controls and contained list",()=>{
  const attempts=read("src/components/courses/college-quiz-attempts.tsx");
  expect(attempts).toContain('role="region"');
  expect(attempts).toContain('aria-label="Quiz submissions"');
  expect(attempts).toContain('aria-label="Quiz submission pages"');
  expect(attempts).toContain("up to 25 attempts per page");
  expect(attempts).toContain('<Disclosure title={"View answers ("+item.answers.length+")"}');
  expect(attempts).toContain('page===1?"No submissions yet":"No further submissions on this page."');
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
