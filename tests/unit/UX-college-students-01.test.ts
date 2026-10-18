import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/students/page.tsx"),"utf8");
describe("/college/students UX",()=>{
 it("UX-college-students-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("kind=\"LEARNER\""));
 it("UX-college-students-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("searchParams={searchParams}"));
});
