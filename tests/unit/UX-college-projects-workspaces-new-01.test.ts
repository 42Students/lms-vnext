import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/workspaces/new/page.tsx"),"utf8");
describe("/college/projects/workspaces/new UX",()=>{
 it("UX-college-projects-workspaces-new-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain("No published Project template is assigned to this college."));
 it("UX-college-projects-workspaces-new-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain("href=\"/college/projects/templates\""));
});
