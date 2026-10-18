import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/people";
const read=(file:string)=>readFileSync(join(process.cwd(),base,file),"utf8");
describe("/college/people loading and error accessibility",()=>{
 it("UX-college-people-loading-01 reserves the row layout",()=>expect(read("loading.tsx")).toContain('variant="row"'));
 it("UX-college-people-loading-02 uses shared accessible skeletons",()=>expect(read("loading.tsx")).toContain("Skeleton"));
 it("UX-college-people-error-01 shows shared error state instead of raw errors",()=>expect(read("error.tsx")).toContain("ErrorState"));
 it("UX-college-people-error-02 provides a 44px retry control",()=>expect(read("error.tsx")).toContain("<Button"));
});
