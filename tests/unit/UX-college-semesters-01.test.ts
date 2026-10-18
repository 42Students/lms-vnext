import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/semesters/page.tsx"),"utf8");
describe("/college/semesters UX",()=>{
 it("UX-college-semesters-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("ACADEMIC_EXPORT_CAP"));
 it("UX-college-semesters-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("focus-visible:outline-2"));
});
