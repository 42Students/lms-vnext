import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/readiness/page.tsx"),"utf8");
describe("/college/projects/readiness UX",()=>{
 it("UX-college-projects-readiness-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminReadinessPage"));
 it("UX-college-projects-readiness-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminMissingCollege"));
});
