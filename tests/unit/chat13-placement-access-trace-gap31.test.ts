import {describe,expect,it} from "vitest";
import {resolvePlacementParticipationFromDecisions} from "@/modules/placements/access-service";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
const m="00000000-0000-4000-8000-000000000001",s="00000000-0000-4000-8000-000000000002",c="00000000-0000-4000-8000-000000000003";
const chain=[{scopeType:"MEMBERSHIP" as const,scopeId:m},{scopeType:"SECTION" as const,scopeId:s},{scopeType:"COHORT" as const,scopeId:c}];
describe("SA-tenants-modules-31 placement-cell decision trace",()=>{
 it("SA-tenants-modules-31 respects student, class and batch precedence rather than module state",()=>{
  const rows=[
   {scopeType:"COHORT",scopeId:c,status:"ELIGIBLE",reason:null,note:null},
   {scopeType:"SECTION",scopeId:s,status:"INELIGIBLE",reason:"Missing evidence",note:null},
  ];
  const result=resolvePlacementParticipationFromDecisions(chain,rows);
  expect(result.status).toBe("INELIGIBLE");
  expect(result.level).toBe("SECTION");
  expect(result.reason).toBe("Missing evidence");
  expect(resolvePlacementParticipationFromDecisions(chain,[]).status).toBe("NOT_DECIDED");
  const direct=resolvePlacementParticipationFromDecisions(chain,[
   ...rows,{scopeType:"MEMBERSHIP",scopeId:m,status:"ELIGIBLE",reason:null,note:null}]);
  expect(direct.level).toBe("MEMBERSHIP");
 });
 it("SA-tenants-modules-31 reads only the authorized learner chain and the exact college",()=>{
  const src=read("src/modules/module-access/admin-trace-service.ts");
  expect(src).toContain("resolvePlacementParticipationFromDecisions(chain,participationRows)");
  expect(src).toContain("eq(placementEligibilityDecisions.collegeId,college.id)");
  expect(src).toContain("eq(placementEligibilityDecisions.scopeType,scope.scopeType)");
  expect(src).toContain("eq(placementEligibilityDecisions.scopeId,scope.scopeId!)");
  expect(src).toContain("decidedByUserId");
 });
 it("SA-tenants-modules-31 renders eligible, ineligible, undecided and actor date",()=>{
  const page=read("src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx");
  for(const label of ["Placement cell decision","Not decided yet","Eligible","Ineligible","Decided by","Asia/Kolkata"])
   expect(page).toContain(label);
  expect(page).toContain("selected.placementParticipation");
 });
});
