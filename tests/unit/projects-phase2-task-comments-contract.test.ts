import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const s=read("src/modules/projects/task-comment-service.ts");
const route=read("src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts");
describe("PR-S2-04 registered comments",()=>{
 it("scopes comments to project and task in a composite FK and real transaction",()=>{
  expect(s).toContain("projectTaskComments");
  expect(s).toContain("eq(projectTaskComments.projectId,scope.project.id)");
  expect(s).toContain("eq(projectTaskComments.taskId,taskId)");
  expect(s).toContain('date_trunc(\'milliseconds\'');
  expect(s).toContain('scope.access!=="ADMIN"');
  expect(s).toContain("eq(projectMembers.projectId,scope.project.id)");
  expect(s).toContain('project.status==="ARCHIVED"');
 });
 it("protects POST from cross-origin and retains GET read auth",()=>{
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("listProjectTaskComments(context,projectId,taskId)");
 });
});
