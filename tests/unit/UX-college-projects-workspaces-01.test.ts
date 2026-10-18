import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/workspaces/page.tsx"),"utf8");
describe("/college/projects/workspaces UX",()=>{
 it("UX-college-projects-workspaces-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("redirect(\"/college/projects\")"));
 it("UX-college-projects-workspaces-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("Canonical College Admin Workspaces"));
});
