import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx"),"utf8");
describe("/college/projects/workspaces/[workspaceId] UX",()=>{
 it("UX-college-projects-workspace-detail-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("encodeURIComponent(workspaceId)"));
 it("UX-college-projects-workspace-detail-02 retains safe route or shared-workspace UX",()=>{
  expect(source).toContain('const next="/college/projects/"+encodeURIComponent(workspaceId)+"/summary"');
  expect(source).toContain('const suffix=legacyWorkspaceSummaryQuery(query)');
  expect(source).toContain('redirect(next+(suffix?"?"+suffix:""))');
 });
});
