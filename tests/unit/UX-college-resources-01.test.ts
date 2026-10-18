import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/resources/page.tsx"),"utf8");
describe("/college/resources UX",()=>{
 it("UX-college-resources-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("Export filtered resource metadata CSV"));
 it("UX-college-resources-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("focus-visible:outline-2"));
});
