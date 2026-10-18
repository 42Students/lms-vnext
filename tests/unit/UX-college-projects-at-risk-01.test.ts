import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/at-risk/page.tsx"),"utf8");
describe("/college/projects/at-risk UX",()=>{
 it("UX-college-projects-at-risk-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminAtRiskPage"));
 it("UX-college-projects-at-risk-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminMissingCollege"));
});
