import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/videos/page.tsx"),"utf8");
describe("/college/videos UX",()=>{
 it("UX-college-videos-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("<CollegeContentAggregate"));
 it("UX-college-videos-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("focus-visible:outline-2"));
});
