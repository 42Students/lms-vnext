import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("T-S2-09 verified evidence never launders prior self claims",()=>{
 it("explicitly clears mutable self-supplied fields not reviewed in Education",()=>{
  const src=readFileSync(join(process.cwd(),
   "src/modules/profile-verification/academic-publication.ts"),"utf8");
  for(const key of ["activeBacklogs:null","pastBacklogs:null",
    "gapYears:null","isLateralEntry:false"])
   expect(src).toContain(key);
  expect(src).toContain('source:"VERIFIED" as const');
  expect(src).toContain("set:percentages");
 });
 it("the eligibility service reads published evidence from the database each time",()=>{
  const src=readFileSync(join(process.cwd(),
   "src/modules/placements/eligibility-service.ts"),"utf8");
  const start=src.indexOf("export async function evaluatePlacementEligibility(");
  expect(start).toBeGreaterThan(0);
  expect(src.slice(start)).toContain(".from(placementCandidateAcademicEvidence)");
  expect(src.slice(start)).toContain("placementCandidateAcademicEvidence.membershipId");
  expect(src).not.toContain("cachedEligibilityDecision");
 });
});
