import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/[projectId]/page.tsx"),"utf8");
describe("/college/projects/[projectId] UX",()=>{
 it("UX-college-projects-detail-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("\"/summary\""));
 it("UX-college-projects-detail-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("encodeURIComponent(projectId)"));
});
