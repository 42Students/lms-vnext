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
  const retry=readFileSync(join(process.cwd(),"src/components/courses/learner-course-state-retry.tsx"),"utf8");
  expect(retry).toContain('type="button"');
  expect(retry).toContain('className="mt-3 min-h-11 md:min-h-9"');
  expect(retry).toContain('disabled={pending}');
  expect(retry).toContain('router.refresh()');
 });
 it("shows an accessible book illustration and class assignment guidance",()=>{
  const code=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx"),"utf8");
  expect(code).toContain('aria-hidden="true" width="28" height="28"');
  expect(code).toContain("Please contact your administrator to check your course and class assignment.");
 });
});
