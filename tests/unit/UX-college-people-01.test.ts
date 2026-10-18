import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/people/page.tsx"),"utf8");
describe("/college/people UX",()=>{
 it("UX-college-people-01 retains safe route or shared-workspace UX",()=>expect(source).toContain("redirect(\"/college/contacts\")"));
 it("UX-college-people-02 retains safe route or shared-workspace UX",()=>expect(source).toContain("Legacy People Directory"));
});
