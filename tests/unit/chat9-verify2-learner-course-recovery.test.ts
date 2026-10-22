import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("learner course recovery and missing class state",()=>{
 it("names the legacy roadmap loading failure distinctly and offers Retry",()=>{
  const code=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx"),"utf8");
  expect(code).toContain('const lessonReadFailed=activeTab==="roadmap"&&workspaceResult.status==="rejected"');
  expect(code).toContain('lessonReadFailed?"Lesson content could not be loaded":"Could not load course"');
  expect(code).toContain('<LearnerCourseStateRetry label="Retry" />');
  expect(code).toContain("Your progress has not been changed");
  expect(code).toContain('className="ml-2 inline-flex min-h-11');
 });
 it("shows an accessible book illustration and class assignment guidance",()=>{
  const code=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx"),"utf8");
  expect(code).toContain('aria-hidden="true" width="28" height="28"');
  expect(code).toContain("Please contact your administrator to check your course and class assignment.");
 });
});
