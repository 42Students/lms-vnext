import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin recruiter identity and college grant expiry",()=>{
 it("SA-academics-people-108 provides structured recruiter name, designation, new company and multi-college creation",()=>{
  const form=read("src/components/admin/super-admin-hr-account-dialog.tsx");
  const service=read("src/modules/placements/super-admin-hr-service.ts");
  for(const s of ["First Name","Last Name","Designation · optional","setFirstName","setLastName","companyRelationshipIds","newCompany","Create a company by name"])expect(form).toContain(s);
  expect(service).toContain("input.newCompany");
  expect(service).toContain("input.companyRelationshipIds");
 });
 it("SA-academics-people-110 preserves grant expiry and scoped active revoked expired history",()=>{
  const service=read("src/modules/placements/super-admin-hr-service.ts");
  const drawer=read("src/components/admin/super-admin-hr-detail-drawer.tsx");
  expect(service).toContain("includeHistory = false");
  expect(service).toContain("includeHistory ? undefined : eq(");
  expect(service).toContain("loadAccountGrants(context,[userId],true)");
  expect(service).toContain("grantHistory:grantHistory.filter");
  expect(service).toContain("GRANT_EXPIRY_INVALID");
  for(const phrase of ["College access history","Revoked","Expired","Until (optional)","Choose a future access expiration date."])expect(drawer).toContain(phrase);
 });
});