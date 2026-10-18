import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx"),"utf8");
describe("/college/placements/jobs/[jobId]/settings UX",()=>{
 it("UX-college-placements-jobs-settings-01 keeps audited user-visible behavior",()=>expect(source).toContain("aria-label=\"Legacy drive settings\""));
 it("UX-college-placements-jobs-settings-02 keeps audited user-visible behavior",()=>expect(source).toContain("className=\"min-w-0 space-y-3\""));
});
