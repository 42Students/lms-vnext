import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseSuperAdminTenantSetupQuery,selectedSuperAdminTenantSetupTab} from "@/modules/admin-ui/tenant-setup-query-model";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";

const tenant="11111111-1111-4111-8111-111111111111";
describe("SA-tenants-modules-SETUP-08 tenant setup role and journey",()=>{
 it("rejects repeated, forged, and unknown tenant setup query values",()=>{
  for(const input of [
   {tab:"OTHER"},{tab:["STRUCTURE","LAUNCH"]},{tab:""},
   {collegeId:tenant},{organizationId:tenant},{tab:"LAUNCH",owner:"outsider"},
  ])expect(parseSuperAdminTenantSetupQuery(input).success).toBe(false);
  const empty=parseSuperAdminTenantSetupQuery({});
  expect(empty.success).toBe(true);
  if(empty.success){
   expect(selectedSuperAdminTenantSetupTab(empty.data,true)).toBe("LAUNCH");
   expect(selectedSuperAdminTenantSetupTab(empty.data,false)).toBe("STRUCTURE");
  }
  const valid=parseSuperAdminTenantSetupQuery({tab:"STRUCTURE"});
  expect(valid.success).toBe(true);
  if(valid.success)expect(selectedSuperAdminTenantSetupTab(valid.data,true)).toBe("STRUCTURE");
 });
 it("denies unauthorised roles before revealing malformed-filter guidance or loading tenant counts",()=>{
  const source=readFileSync("src/app/(authenticated)/admin/tenants/setup/page.tsx","utf8");
  const context=source.indexOf("getCurrentRequestContext()");
  const gate=source.indexOf('!isSuperAdmin(context)||!can(context,"admin-scope.select")');
  const parse=source.indexOf("parseSuperAdminTenantSetupQuery(await searchParams)");
  const read=source.indexOf("getSuperAdminTenantLifecycleDirectory(context");
  expect(context).toBeGreaterThan(-1);
  expect(context).toBeLessThan(gate);
  expect(gate).toBeLessThan(parse);
  expect(parse).toBeLessThan(read);
  expect(source).toContain('import {can,requirePermission} from "@/modules/permissions/policy"');
  expect(source).toContain('requirePermission(context,"college.read",{');
  expect(source).toContain('organizationId:college.organizationId,collegeId:college.id');
 });
 it("links to distinct tenant-specific branding, sign-in, module and readiness checks",()=>{
  const steps=superAdminTenantSetupSteps(tenant);
  expect(steps.map(step=>step.id)).toEqual([
   "brand","login","host","academics","people","features","readiness",
  ]);
  for(const step of steps)expect(step.href.startsWith("/admin/")).toBe(true);
  expect(steps.find(step=>step.id==="brand")?.href).toBe("/admin/colleges/"+tenant+"/branding");
  expect(steps.find(step=>step.id==="login")?.href).toBe("/admin/colleges/"+tenant+"/signin");
  expect(steps.find(step=>step.id==="features")?.href).toBe("/admin/features/"+tenant);
  expect(steps.find(step=>step.id==="readiness")?.href).toBe("/admin/colleges/"+tenant+"/readiness");
 });
});
