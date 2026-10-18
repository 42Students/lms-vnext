import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx"),"utf8");
describe("/college/placements/jobs/[jobId]/interviews UX",()=>{
 it("UX-college-placements-jobs-interviews-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain("caption=\"Persisted interview rounds\""));
 it("UX-college-placements-jobs-interviews-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain("No rows on this page; select an earlier page."));
});
