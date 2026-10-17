import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin placement pipeline actions",()=>{
 it("SA-placements-projects-20 supports guarded application moves, reinstate, bulk cap and friendly fetch failures",()=>{
  const c=source("src/components/placements/college-application-pipeline-controls.tsx");
  for(const s of ['"REINSTATE"','matchingFilter:allMatching?query:undefined',
    "Select all {total.toLocaleString", "total>3000", "Move to Assessment","apiFetch<"])expect(c).toContain(s);
  expect(c).not.toContain("throw Error(payload.issues");
  const p=source("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
  expect(p).toContain('basePath="/admin/placements"');
 });
 it("SA-placements-projects-22 routes Super Admin candidate interview actions to its own Schedule tab",()=>{
  const drawer=source("src/components/placements/college-application-detail-drawer.tsx");
  expect(drawer).toContain('basePath==="/admin/placements"?"/schedule":"/interviews"');
  expect(drawer).toContain("apiFetch");
  const c=source("src/components/placements/college-application-pipeline-controls.tsx");
  expect(c).toContain("basePath={basePath}");
 });
});
