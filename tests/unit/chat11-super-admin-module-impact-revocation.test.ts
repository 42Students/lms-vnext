import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {moduleDisableImpactSummary} from "@/modules/module-access/admin-module-impact-model";

const unavailable="Impact counts unavailable. Recheck this college before changing module access.";
describe("SA-tenants-modules-MOD-IMPACT-06 module disabling cannot leak or fabricate risk counts",()=>{
 it("explains valid Projects impact with nonnegative exact mentor count",()=>{
  expect(moduleDisableImpactSummary("projects",[0])).toContain("0 active primary-mentor assignments");
  expect(moduleDisableImpactSummary("projects",[12])).toContain("12 active primary-mentor assignments");
  expect(moduleDisableImpactSummary("projects",[12])).toContain("not a safety check");
 });
 it("explains all three separate placement dimensions without merging populations",()=>{
  const summary=moduleDisableImpactSummary("placements",[3,9,2]);
  expect(summary).toContain("3 active drives");
  expect(summary).toContain("9 in-progress applications");
  expect(summary).toContain("2 pending offers");
  expect(summary).toContain("Existing data is retained");
 });
 it("fails closed on missing, negative, fractional, nonfinite or unsafe counts",()=>{
  for(const module of ["projects","placements"] as const){
   for(const value of [-2,0.75,Number.NaN,Number.NEGATIVE_INFINITY,Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER+1]){
    const values=module==="projects"?[value]:[1,value,3];
    expect(moduleDisableImpactSummary(module,values)).toBe(unavailable);
   }
   expect(moduleDisableImpactSummary(module,[])).toBe(unavailable);
  }
  expect(moduleDisableImpactSummary("placements",[1,2])).toBe(unavailable);
 });
 it("retains historical electives message without claiming student counts",()=>{
  expect(moduleDisableImpactSummary("electives",[])).toContain("No deletion is performed");
 });
 it("rechecks selected live college and active Super Admin role after queries and before returning any count",()=>{
  const source=readFileSync("src/modules/module-access/admin-module-impact-service.ts","utf8");
  expect(source).toContain('eq(colleges.status,"ACTIVE")');
  expect(source).toContain('.for("share")');
  expect(source).toContain('assertPersistedPlatformPermission(tx,ctx,"college.read",{collegeId,organizationId})');
  expect(source).toContain("if(!isSuperAdmin(live))");
  expect(source).toContain("college.organizationId!==organizationId");
  expect(source.match(/await assertCurrentImpactScope\(ctx,collegeId,college.organizationId\);/g)).toHaveLength(3);
  expect(source).toContain("eq(projectInstances.collegeId,collegeId)");
  expect(source).toContain("eq(placementJobs.collegeId,collegeId)");
 });
});
