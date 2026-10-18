import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/submissions/page.tsx"),"utf8");
describe("/college/projects/submissions UX",()=>{
 it("UX-college-projects-submissions-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminSubmissionsPage"));
 it("UX-college-projects-submissions-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminMissingCollege"));
});
