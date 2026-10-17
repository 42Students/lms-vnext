import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {summarizeTpoOwnOverrides} from "@/modules/placements/tpo-batch-own-decision-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("TPO own eligibility decisions",()=>{
 it("TPO-batches-24 counts direct learner overrides against inherited decisions and filters the entire cohort",()=>{
  expect(summarizeTpoOwnOverrides([
   {direct:"ELIGIBLE",parent:"ELIGIBLE"},
   {direct:"INELIGIBLE",parent:"ELIGIBLE"},
   {direct:"ELIGIBLE",parent:"NOT_DECIDED"},
   {direct:"ELIGIBLE",parent:null},
  ])).toEqual({total:4,same:1,different:2,uncertain:1});
  const service=read("src/modules/placements/tpo-batch-own-decision-service.ts");
  expect(service).toContain('eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP")');
  expect(service).toContain('eq(sectionEnrollments.status,"ACTIVE")');
  expect(service).toContain("summarizeTpoOwnOverrides(facts)");
  const loader=read("src/modules/placements/tpo-batch-workspace-read-service.ts");
  expect(loader).toContain("onlyDirect?exists(");
  expect(loader.indexOf("onlyDirect?exists(")).toBeLessThan(loader.indexOf(".limit(26).offset"));
  expect(read("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx"))
   .toContain('view.data.source==="LEARNER"');
  expect(read("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx"))
   .toContain('students?source=LEARNER');
 });
});
