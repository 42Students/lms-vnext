import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/page.tsx"),"utf8");
describe("/college/projects UX",()=>{
 it("UX-college-projects-01 keeps audited user-visible behavior",()=>expect(source).toContain("aria-label=\"Project workspace tools\""));
 it("UX-college-projects-02 keeps audited user-visible behavior",()=>expect(source).toContain("aria-label=\"Workspace display and archive\""));
});
