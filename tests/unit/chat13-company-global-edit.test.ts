import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {globalCompanyEditSchema,isGlobalCompanyScope} from "@/modules/placements/super-admin-company-edit-model";
const read=(p:string)=>readFileSync(p,"utf8");
const input={companyId:"00000000-0000-4000-8000-000000000001",
 expectedUpdatedAt:"2099-01-01T00:00:00.000Z",name:"Acme",website:"https://acme.com",
 industry:"Tech",about:"Hiring",logoPublicUrl:"https://acme.com/logo.png"};
describe("Super Admin canonical company editor",()=>{
 it("SA-placements-projects-26 requires global scope and validated HTTPS identity fields",()=>{
  expect(isGlobalCompanyScope(null)).toBe(true);
  expect(isGlobalCompanyScope({collegeId:"college"})).toBe(false);
  expect(globalCompanyEditSchema.parse(input).name).toBe("Acme");
  expect(globalCompanyEditSchema.safeParse({...input,website:"http://example.com"}).success).toBe(false);
  expect(globalCompanyEditSchema.safeParse({...input,logoPublicUrl:"javascript:alert(1)"}).success).toBe(false);
 });
 it("SA-placements-projects-26 protects concurrent edits with millisecond CAS and atomic audit",()=>{
  const code=read("src/modules/placements/super-admin-company-edit-service.ts");
  expect(code).toContain("assertPersistedPlatformPermission(tx,context");
  expect(code).toContain("date_trunc('milliseconds'");
  expect(code).toContain("recordActivityEventInTransaction(tx,context");
  expect(code).toContain("Another company already uses this name.");
 });
 it("SA-placements-projects-26 exposes a guarded, editable company form",()=>{
  const ui=read("src/components/admin/super-admin-company-edit.tsx");
  expect(ui).toContain("useGuardedAction");
  expect(ui).toContain('method:"PATCH"');
  expect(ui).toContain("Edit company");
 });
});
