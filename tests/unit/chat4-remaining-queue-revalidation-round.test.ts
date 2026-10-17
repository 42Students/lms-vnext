import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-4 remaining source contracts after final-sprint split",()=>{
 it("SA-placements-projects-91 preserves existing authorized sprint and task mutation controls",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain("<MentorSprintCreate");
  expect(workspace).toContain("<MentorTaskCreate");
  expect(workspace).toContain("TaskLifecycleActions");
  expect(workspace).toContain('mode === "ADMIN"');
 });
 it("SA-placements-projects-53 retains table facts but still needs a real missing-template mutation",()=>{
  const list=source("src/components/projects/project-admin-workspace-list.tsx");
  expect(list).toContain('view==="table"');
  for(const name of ["Workspace","Mentor","Status","Progress","Members"])
   expect(list).toContain(name);
  expect(list).toContain("No template — attach one");
  // Presence of a label is not proof that a Change template action exists.
  expect(list).not.toContain("Change template");
 });
 it("SA-placements-projects-75 shows persisted audit summary, export, and event details",()=>{
  const audit=source("src/components/projects/project-admin-audit-page.tsx");
  for(const label of ["Actions shown","People who made changes","Destructive actions",
    "ProjectAuditPageExport","<ActivityCenter"])
   expect(audit).toContain(label);
  expect(audit).toContain("listActivityEvents(");
 });
 it("COL-course-tabs-26 keeps resource visibility state distinct from assessment publish/archive",()=>{
  const content=source("src/components/courses/college-content-aggregate.tsx");
  const assessments=source("src/components/courses/college-assessment-aggregate.tsx");
  expect(content).toContain("visible");
  expect(assessments).toContain("<CollegeAssignmentActions");
  expect(assessments).toContain("<CollegeQuizActions");
  // No claim that publish/archive by themselves are per-item visibility toggles.
 });
 it("COL-verification-misc-13 retains readable names and a System fallback in activity sentences",()=>{
  const center=source("src/components/activity/activity-center.tsx");
  expect(center).toContain("activityEventSentence(");
  expect(center).toContain("displayName");
  expect(center).toContain('"System"');
  expect(center).toContain("subjectLabel");
  expect(center).toContain("item.event.summary");
 });
 it("SA-placements-projects-71 keeps pending-age, reviewer evidence, scoped export, and mentor reassignment",()=>{
  const page=source("src/components/projects/project-admin-submissions-page.tsx");
  const exportComponent=source("src/components/projects/project-submissions-page-export.tsx");
  expect(page).toContain("pendingDays:");
  expect(page).toContain("reviewedBy");
  expect(page).toContain("Reassign mentor");
  expect(exportComponent).toContain("Export CSV");
  expect(exportComponent).toContain("Revisions");
  expect(exportComponent).toContain("Reviewed by");
 });
 it("SA-placements-projects-88 requires selected historical version, optimistic expected version and confirmation for rollback",()=>{
  const rollback=source("src/components/projects/super-admin-template-rollback-control.tsx");
  expect(rollback).toContain('status!=="ARCHIVED"');
  expect(rollback).toContain('selectedVersion.version!==currentVersion');
  expect(rollback).toContain("expectedTemplateVersion:currentVersion");
  expect(rollback).toContain("confirmed:true");
  expect(rollback).toContain("Roll back");
  expect(rollback).toContain("Review the compared changes above.");
 });

});
