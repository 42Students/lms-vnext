import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/verification/page.tsx"),"utf8");
describe("/college/verification UX",()=>{
 it("UX-college-verification-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("<ErrorState title=\"Profile verification\""));
 it("UX-college-verification-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("VerificationQueueLimitError"));
 it("UX-college-verification-03 preserves responsive or failure recovery contract",()=>expect(source).toContain('title="Could not load verification requests"'));
});
