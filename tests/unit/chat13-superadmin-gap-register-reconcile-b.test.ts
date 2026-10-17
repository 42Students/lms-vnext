import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("chat-13 Super Admin Projects reconciliation contracts",()=>{
 it("SA-placements-projects-55 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/project-admin-collection-controls.tsx");
  expect(file).toContain("name=\"pageSize\"");
  expect(file).toContain("name={legacyWorkspaces ? \"search\" : \"q\"}");
 });
 it("SA-placements-projects-56 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/class-team-workspace-creator.tsx");
  expect(file).toContain("One workspace per student");
  expect(file).toContain("already covered");
 });
 it("SA-placements-projects-58 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/project-admin-reassign-mentor-page.tsx");
  expect(file).toContain("isProjectMentorOverloaded");
  expect(file).toContain("listCollegeProjectMentorWorkload");
 });
 it("SA-placements-projects-66 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/project-admin-readiness-page.tsx");
  expect(file).toContain("listCollegeReadinessReleases");
  expect(file).toContain(">Releases</h3>");
 });
 it("SA-placements-projects-67 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/project-readiness-override-form.tsx");
  expect(file).toContain("<ConfirmDialog");
  expect(file).toContain("setConfirmOpen");
 });
 it("SA-placements-projects-68 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/project-workspace-readiness.tsx");
  expect(file).toContain("Releases shipped");
  expect(file).toContain("finalSubmission");
 });
 it("SA-placements-projects-87 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/super-admin-template-college-bulk.tsx");
  expect(file).toContain("Assign selected");
  expect(file).toContain("Remove selected");
 });
 it("SA-placements-projects-93 preserves scoped Super Admin Projects source behavior",()=>{
  const file=read("src/components/projects/college-project-student-roster-dialog.tsx");
  expect(file).toContain("Manage students");
  expect(file).toContain("learnerMembershipIds:selected");
 });
});
