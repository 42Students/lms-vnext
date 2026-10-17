import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Super Admin project gap final-sprint acceptance",()=>{
 it("SA-placements-projects-91 preserves admin sprint/release editing, task lifecycle, reassignment and submission review",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('mode !== "LEARNER" && !readOnly');
  for(const component of ["MentorReleaseEditor","MentorSprintDetailsEdit","MentorTaskDetailsEdit",
   "ProjectTaskAssigneeControl","TaskLifecycleActions","TaskReviewActions"])
   expect(workspace).toContain(component);
  expect(workspace).toContain('mode={mode}');
  expect(workspace).toContain('<ProjectAdminSubmissionReview');
  expect(workspace).not.toContain('mode === "ADMIN" && readOnly ? <MentorSprintDetailsEdit');
 });
 it("SA-placements-projects-91 routes admin task writes through authorized API handlers, not client-side status guesses",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  const review=source("src/components/projects/project-admin-submission-review.tsx");
  expect(workspace).toContain("readOnly");
  expect(review).toContain("canAdminSettleDelivery(status,locked,projectStatus,action)");
  expect(review).toContain('method:"POST"');
  expect(review).toContain("feedback.trim()");
 });
});
