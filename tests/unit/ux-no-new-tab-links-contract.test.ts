import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
const externalLinkSurfaces=[
 "src/app/(authenticated)/hr/company/page.tsx",
 "src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx",
 "src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx",
 "src/app/(authenticated)/tpo/announcements/page.tsx",
 "src/components/announcements/announcement-admin-workspace.tsx",
 "src/components/announcements/announcement-feed.tsx",
 "src/components/courses/assignment-submission-links.tsx",
 "src/components/courses/college-content-authoring-control.tsx",
 "src/components/courses/faculty-assignment-review.tsx",
 "src/components/placements/learner-career-rounds-workspace.tsx",
 "src/components/placements/learner-career-rounds.tsx",
 "src/components/placements/learner-placement-job-detail.tsx",
 "src/components/placements/learner-placement-jobs.tsx",
 "src/components/placements/placement-drive-controls.tsx",
 "src/components/placements/tpo-general-requests-panel.tsx",
 "src/components/projects/learner-board-task-detail-dialog.tsx",
 "src/components/projects/mentor-board-task-detail-dialog.tsx",
 "src/components/projects/project-admin-submissions-page.tsx",
 "src/components/projects/project-resource-open-link.tsx",
 "src/components/projects/project-workspace.tsx",
 "src/components/projects/super-admin-template-subview-page.tsx",
 "src/components/tpo/tpo-selected-review-queue.tsx",
 "src/components/tracker/tracker-workflow-panel.tsx",
 "src/components/verification/VerificationReviewDrawer.tsx",
] as const;
describe("UX anti-drift new-tab remediation",()=>{
 it("keeps reviewed links navigable without spawning _blank tabs",()=>{
  for(const path of externalLinkSurfaces)
    expect(src(path),path).not.toMatch(/\btarget=["_']_blank["_']/);
 });
 it("separates custom component domain targets from link target attributes",()=>{
  const batch=src("src/components/tpo/tpo-bulk-action-panel.tsx");
  expect(batch).toContain("bulkTarget:target");
  expect(batch).toContain("const next:PreviewPlan={");
  expect(batch).toContain("target,...(target==");
  for(const p of [
   "src/app/(authenticated)/tpo/students/page.tsx",
   "src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx",
   "src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx",
  ])expect(src(p)).toMatch(/bulkTarget="(?:STUDENTS|APPLICATIONS)"/);
  expect(src("src/components/placements/learner-career-rounds-workspace.tsx"))
   .toContain("withdrawalRequest={withdrawalTarget}");
  expect(src("src/components/placements/learner-interview-withdrawal-request.tsx"))
   .toContain("withdrawalRequest:target");
 });
});
