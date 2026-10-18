import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/reassign-mentor/page.tsx"),"utf8");
describe("/college/projects/reassign-mentor UX",()=>{
 it("UX-college-projects-reassign-mentor-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("ProjectAdminReassignMentorPage"));
 it("UX-college-projects-reassign-mentor-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("basePath=\"/college/projects\""));
});
