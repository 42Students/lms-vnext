import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Mentor concurrency contracts",()=>{
 it("MEN-projects-meetings-R07 requires version tokens for resource edit and archive",()=>{
  const source=read("src/modules/projects/resource-service.ts");
  const ui=read("src/components/projects/project-resource-controls.tsx");
  expect(source).toContain('scope.access==="MENTOR" && !input.expectedUpdatedAt');
  expect(source).toContain("PROJECT_RESOURCE_STALE_VERSION");
  expect(source).toContain("resource.updatedAt.getTime()");
  expect(ui).toContain("expectedUpdatedAt:new Date(resource.updatedAt).toISOString()");
 });
 it("MEN-projects-meetings-R07 prevents stale new scheduling and existing meeting overwrite",()=>{
  const source=read("src/modules/projects/meeting-service.ts");
  const ui=read("src/components/projects/project-meeting-controls.tsx");
  expect(source).toContain("PROJECT_MEETING_STALE_VERSION");
  expect(source).toContain('scope.access==="MENTOR"');
  expect(source).toContain("input.expectedProjectUpdatedAt");
  expect(source).toContain("existing.updatedAt.getTime()");
  expect(ui).toContain("expectedProjectUpdatedAt: new Date(projectUpdatedAt).toISOString()");
  expect(ui).toContain("expectedUpdatedAt:new Date(meeting.updatedAt).toISOString()");
 });
 it("MEN-projects-meetings-R07 checks release ship and unship against the locked row",()=>{
  const source=read("src/modules/projects/lifecycle-service.ts");
  const ui=read("src/components/projects/project-lifecycle-actions.tsx");
  expect(source).toContain('scope.access==="MENTOR"&&!expected');
  expect(source).toContain("release.updatedAt.getTime()");
  expect(ui).toContain('projectMutation("/api/projects/"+projectId+"/releases/"+releaseId+"/"+action,"POST",{expectedUpdatedAt})');
 });
});
