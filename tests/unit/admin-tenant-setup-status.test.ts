import {describe,expect,it} from "vitest";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";
const counts=(passed:number,failed:number,unknown:number)=>({passed,failed,unknown,total:passed+failed+unknown});
describe("Super Admin tenant setup readiness",()=>{
 it("never treats absent, zero or inconsistent data as readiness",()=>{
  expect(summarizeTenantSetupReadiness(null).label).toBe("Unknown");
  expect(summarizeTenantSetupReadiness({overall:"READY",counts:counts(0,0,0)}).label).toBe("Unknown");
  expect(summarizeTenantSetupReadiness({overall:"READY",counts:{...counts(2,0,0),total:10}}).label).toBe("Unknown");
 });
 it("prefers confirmed failures then unknown evidence",()=>{
  expect(summarizeTenantSetupReadiness({overall:"NOT_READY",counts:counts(7,2,1)}).label).toBe("Not ready");
  expect(summarizeTenantSetupReadiness({overall:"INCOMPLETE",counts:counts(9,0,1)}).label).toBe("Incomplete evidence");
 });
 it("distinguishes persisted checklist pass from runtime approval",()=>{
  const result=summarizeTenantSetupReadiness({overall:"READY",counts:counts(10,0,0)});
  expect(result.label).toBe("Persisted checks pass");
  expect(result.detail).toContain("still separate gates");
 });
});
