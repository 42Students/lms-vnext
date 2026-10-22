import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/drives/page.tsx"),"utf8");
describe("/college/placements/drives UX",()=>{
 it("UX-college-placements-drives-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain("caption=\"College placement jobs\""));
 it("UX-college-placements-drives-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain("mobilePriority:\"action\""));
 it("UX-college-placements-drives-03 preserves the new accessible state and responsive contract",()=>expect(source).toContain("No drives match these filters in this college."));
});
