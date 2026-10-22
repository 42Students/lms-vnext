import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/semester-courses/page.tsx"),"utf8");
describe("/college/semester-courses UX",()=>{
 it("UX-college-semester-courses-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("CollegeTermMappingRetained"));
 it("UX-college-semester-courses-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("min-h-11"));
});
