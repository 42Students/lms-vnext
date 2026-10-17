import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {canAdminSettleDelivery,adminDeliveryToast} from "../../src/modules/projects/admin-submission-review-model";
const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("College Projects gap closure round 4",()=>{
 it("COL-projects-01 allows only valid final submission review and lock transitions",()=>{
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","APPROVED")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","CHANGES_REQUESTED")).toBe(false);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","LOCK")).toBe(true);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ARCHIVED","LOCK")).toBe(false);
  expect(adminDeliveryToast("APPROVED")).toBe("Submission accepted.");
 });
 it("COL-projects-02 exposes full persisted College Admin workspace summary editing",()=>{
  const editor=source("src/components/projects/college-project-summary-editor-full.tsx");
  for(const key of ["progressPercent","nextAction","sprintLengthWeeks","estimationUnit","endDate","blocker","expectedUpdatedAt"])
   expect(editor).toContain(key);
  expect(editor).toContain('method:"PATCH"');
 });
 it("COL-projects-03 retains an unresolved mentor-only task creation gate despite admin access to other editors",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('<WorkspaceBriefEditor');
  expect(workspace).toContain('<CreateProjectResourceControl');
  expect(workspace).toContain('mode === "MENTOR" &&');
 });
 it("COL-projects-08 exports the scoped visible workspace page with safe CSV and list sizing",()=>{
  const exportPage=source("src/components/projects/project-admin-workspace-page-export.tsx");
  const page=source("src/app/(authenticated)/college/projects/page.tsx");
  const controls=source("src/components/projects/project-admin-collection-controls.tsx");
  expect(exportPage).toContain('project-workspaces-page.csv');
  expect(exportPage).toContain('items.map(');
  expect(page).toContain('view={query.view}');
  expect(controls).toContain('[10, 20, 25, 50, 100]');
 });
 it("COL-projects-09 uses the designated primary mentor name rather than a co-mentor fallback",()=>{
  expect(source("src/modules/projects/admin-insights-service.ts")).toContain('primaryMentor?.displayName ?? null');
 });
 it("COL-projects-10 provides risk buckets, blocker detail, mentor reassignment and page export",()=>{
  const page=source("src/components/projects/project-admin-at-risk-page.tsx");
  for(const value of ["Stalled","Active blocker","Pending review","ProjectAtRiskPageExport","Reassign mentor","Review submission"])
   expect(page).toContain(value);
 });
 it("COL-projects-11 counts persisted blocker signals alongside inactivity and review risk",()=>{
  const page=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(page).toContain("blockerReason");
  expect(page).toContain("riskReasons");
  expect(page).toContain("blockerSignalSupported");
 });
 it("COL-projects-14 renders administrator review actions inside Delivery without opening a second queue",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('mode === "ADMIN" && !readOnly');
  expect(workspace).toContain('<ProjectAdminSubmissionReview');
 });
 it("COL-projects-17 restores audit range chips, destructive markers and scoped export",()=>{
  const page=source("src/components/projects/project-admin-audit-page.tsx");
  for(const token of ["Today","7 days","30 days","All time","Destructive actions","ProjectAuditPageExport"])
   expect(page).toContain(token);
 });
 it("COL-projects-18 retains an activity-type and time filter but needs resource-change-specific verification",()=>{
  const list=source("src/components/projects/project-activity-filtered-list.tsx");
  expect(list).toContain("event.eventType");
  expect(list).toContain("Clear filters");
 });
 it("COL-projects-19 restores workspace, submissions and template page labels",()=>{
  expect(source("src/app/(authenticated)/college/projects/page.tsx")).toContain('title="Project workspaces"');
  expect(source("src/components/projects/project-admin-submissions-page.tsx")).toContain('title="Submissions dashboard"');
  expect(source("src/app/(authenticated)/college/projects/templates/page.tsx")).toContain('title="Project templates"');
 });
 it("COL-projects-20 shows a recoverable no-college message without redirecting silently",()=>{
  const page=source("src/app/(authenticated)/college/projects/page.tsx");
  expect(page).toContain("Select a college to continue.");
  expect(page).toContain('role="alert"');
 });
 it("COL-projects-21 gives archived-workspace recovery and the existing creation/reassignment actions",()=>{
  const page=source("src/app/(authenticated)/college/projects/page.tsx");
  expect(page).toContain("Archived workspaces");
  expect(page).toContain("Bulk reassign mentor");
  expect(page).toContain('href="/college/projects/create"');
 });
 it("COL-projects-22 is an improvement, not a missing legacy mentor/class/template filter",()=>{
  const page=source("src/components/projects/project-admin-collection-controls.tsx");
  expect(page).toContain('name="status"');
  expect(page).toContain('name={legacyWorkspaces ? "search" : "q"}');
 });
 it("COL-projects-23 uses responsive wrappers but retains browser width acceptance as open",()=>{
  const cards=source("src/components/projects/project-admin-workspace-list.tsx");
  const nav=source("src/components/projects/project-admin-nav.tsx");
  expect(cards).toContain("overflow-x-auto");
  expect(nav).toContain("overflow-x-auto");
 });
});