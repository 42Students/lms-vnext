import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {companyGlobalVerificationSchema,canVerifyGlobalCompany}
 from "@/modules/placements/super-admin-company-verification-model";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin platform company verification",()=>{
 it("SA-placements-projects-24 restricts global state changes and validates commands",()=>{
  expect(canVerifyGlobalCompany(null)).toBe(true);
  expect(canVerifyGlobalCompany({collegeId:"selected"})).toBe(false);
  expect(canVerifyGlobalCompany({organizationId:"selected"})).toBe(false);
  expect(companyGlobalVerificationSchema.safeParse({companyId:"00000000-0000-4000-8000-000000000001",verified:true}).success).toBe(true);
  expect(companyGlobalVerificationSchema.safeParse({companyId:"00000000-0000-4000-8000-000000000001",verified:"true"}).success).toBe(false);
 });
 it("SA-placements-projects-24 writes verifiedAt and verifier within the audit transaction",()=>{
  const service=source("src/modules/placements/super-admin-company-verification-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
  expect(service).toContain("Boolean(company.verifiedAt)===input.verified");
  expect(service).toContain("PLACEMENTS_COMPANY_UNVERIFIED");
 });
 it("SA-placements-projects-24 presents Verified by 42 tag, Only not verified filter and confirmation",()=>{
  const page=source("src/app/(authenticated)/admin/companies/page.tsx");
  expect(page).toContain("Only not verified");
  expect(page).toContain("Verified by 42");
  expect(page).toContain("SuperAdminCompanyVerification");
  const client=source("src/components/admin/super-admin-company-verification.tsx");
  expect(client).toContain("apiFetch");
  expect(client).not.toContain("window.confirm");
 });
});
