import {describe,it,expect} from "vitest";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";
describe("Super Admin tenant setup journey",()=>{
 it("preserves distinct links and the selected college",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const steps=superAdminTenantSetupSteps(id);
 expect(new Set(steps.map(x=>x.id)).size).toBe(steps.length);
 expect(steps.find(x=>x.id==="host")?.href).toBe(`/admin/colleges/${id}/subdomain`);
 expect(steps.find(x=>x.id==="readiness")?.href).toBe(`/admin/colleges/${id}/readiness`);
 });
});
