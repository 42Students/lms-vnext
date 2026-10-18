import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx"),"utf8");
describe("/college/projects/[projectId]/readiness UX",()=>{
 it("UX-college-projects-project-readiness-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectWorkspaceReadiness"));
 it("UX-college-projects-project-readiness-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("basePath=\"/college/projects\""));
});
