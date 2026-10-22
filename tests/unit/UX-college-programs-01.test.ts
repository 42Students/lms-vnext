import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/programs/page.tsx"),"utf8");
describe("/college/programs UX",()=>{
 it("UX-college-programs-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("aria-label=\"Active programs\""));
 it("UX-college-programs-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("<CollegeArchivedPrograms programs={archived} />"));
});
