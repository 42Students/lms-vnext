import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx"),"utf8");
describe("/college/placements/jobs/[jobId]/overview UX",()=>{
 it("UX-college-placements-jobs-overview-01 keeps verified pipeline metrics and unknown counts distinct",()=>{
  expect(source).toContain("pipelineStages.map((stage,index)=>");
  expect(source).toContain("funnel?.cumulativeTotals.HIRED??null");
  expect(source).toContain('value===null?"—"');
 });
 it("UX-college-placements-jobs-overview-02 keeps audited user-visible behavior",()=>expect(source).toContain("View hired candidates"));
});
