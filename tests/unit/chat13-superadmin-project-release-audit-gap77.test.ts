import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-placements-projects-77 project release event coverage",()=>{
 it("SA-placements-projects-77 has distinct audit events for release create, update and delete",()=>{
  const code=read("src/modules/projects/mentor-release-write-service.ts");
  for(const name of ["PROJECTS_RELEASE_CREATED","PROJECTS_RELEASE_UPDATED","PROJECTS_RELEASE_DELETED"])
   expect(code).toContain("ACTIVITY_EVENT_TYPES."+name);
  expect(code).toContain("recordActivityEventInTransaction(tx,context");
  expect(code).toContain("previousStatus:existing?.status??null");
 });
 it("SA-placements-projects-77 keeps change and audit in the same transaction and college scope",()=>{
  const code=read("src/modules/projects/mentor-release-write-service.ts");
  expect(code).toContain("getDb().transaction(async tx=>");
  expect(code).toContain("collegeId:scope.collegeId,organizationId:scope.organizationId");
  expect(code).toContain('subjectType:"project_release"');
 });
 it("SA-placements-projects-77 never uses a sprint audit kind for a release write",()=>{
  const code=read("src/modules/projects/mentor-release-write-service.ts");
  expect(code).not.toContain("ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED");
  const taxonomy=read("src/modules/activity/taxonomy.ts");
  expect(taxonomy).toContain('PROJECTS_RELEASE_CREATED: "projects.release.created"');
 });
});
