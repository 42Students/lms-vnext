import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/page.tsx"),"utf8");
describe("/college/placements UX",()=>{
 it("UX-college-placements-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain("min-h-11"));
 it("UX-college-placements-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain("focus-visible:outline-2"));
});
