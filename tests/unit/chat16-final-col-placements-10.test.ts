import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("COL-placements-10 needs attention",()=>{
 it("COL-placements-10 retains four legacy attention categories and stage-specific drilldowns",()=>{
  const source=read("src/components/placements/super-admin-needs-attention.tsx");
  for(const kind of ["STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","OFFERED_NO_LETTER","CLOSING_SOON_LOW_CONVERSION"]){
   expect(source).toContain(kind);
  }
  expect(source).toContain('tab:"APPLIED"');
  expect(source).toContain('tab:"INTERVIEW"');
  expect(source).toContain('tab:"ALL"');
  expect(source).toContain('encodeURIComponent(item.jobId)+"/applications?stage="+category.tab');
 });
 it("COL-placements-10 keeps an explicit no-attention state without manufacturing flagged drives",()=>{
  const panel=read("src/components/placements/super-admin-needs-attention.tsx");
  const overview=read("src/components/placements/placement-operations-overview.tsx");
  expect(panel).toContain("No drives currently flagged in this view.");
  expect(panel).toContain("items.filter(item=>item.code===category.code)");
  expect(overview).toContain("operations.workQueue");
 });
});