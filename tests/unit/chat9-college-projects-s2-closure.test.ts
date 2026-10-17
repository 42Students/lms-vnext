import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College Admin Projects S2 legacy gap closure",()=>{
 it("COL-projects-03 confirms admin Overview and Resources editors but leaves Sprint/Task plan parity open",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('mode==="ADMIN"&&!readOnly?<WorkspaceBriefEditor');
  expect(workspace).toContain("<CreateProjectResourceControl");
  expect(workspace).toContain('mode === "MENTOR" &&');
 });
 it("COL-projects-06 creates one workspace per student only after scoped cohort preflight and confirmation",()=>{
  const editor=source("src/components/projects/class-team-workspace-creator.tsx");
  expect(editor).toContain('mode==="INDIVIDUAL"');
  expect(editor).toContain("cohort-preflight?");
  expect(editor).toContain("alreadyCovered");
  expect(editor).toContain("Before creating: one workspace per student");
  expect(editor).toContain('cohortMode:mode==="INDIVIDUAL"');
 });
 it("COL-projects-07 permits primary mentor, class, ACTIVE status and learner selection at creation",()=>{
  const editor=source("src/components/projects/project-create-control.tsx");
  expect(editor).toContain("Primary mentor");
  expect(editor).toContain("primaryMentorMembershipId");
  expect(editor).toContain('Class');
  expect(editor).toContain('value="ACTIVE"');
  expect(editor).toContain("learnerMembershipIds");
 });
 it("COL-projects-12 exposes active readiness overrides with CSV and workspace management",()=>{
  const page=source("src/components/projects/project-admin-readiness-page.tsx");
  expect(page).toContain("Active overrides");
  expect(page).toContain("Export overrides CSV");
  expect(page).toContain("Manage override");
  expect(page).toContain("listCollegeActiveReadinessOverrides");
 });
 it("COL-projects-13 restores submission summary counters, revision fields and direct review controls",()=>{
  const page=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(page).toContain("Submissions dashboard");
  expect(page).toContain("getProjectAdminSubmissionSummary");
  expect(page).toContain("Needs student action");
  expect(page).toContain("Revisions");
  expect(page).toContain("<ProjectAdminSubmissionReview");
 });
});
