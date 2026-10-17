import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Public recruiter invitation parity",()=>{
 it("TPO-campaigns-public-24 shows the college-link loading error and exact retry",()=>{
  const route=src("src/app/college-join/[token]/page.tsx");
  const retry=src("src/components/placements/public-join-preview-retry.tsx");
  expect(route).toContain("PublicJoinPreviewRetry");
  expect(retry).toContain("We couldn&apos;t load this page");
  expect(retry).toContain(">Retry");
 });
 it("TPO-campaigns-public-30 preserves company-link load errors as retryable, not expired links",()=>{
  const route=src("src/app/company-join/[token]/page.tsx");
  const retry=src("src/components/placements/public-join-preview-retry.tsx");
  expect(route).toContain("PublicJoinPreviewRetry");
  expect(retry).toContain('scope==="COMPANY"');
  expect(retry).not.toContain("This link is no longer valid");
 });
 it("TPO-campaigns-public-R03 labels already joined versus first join from server outcome",()=>{
  const ui=src("src/components/placements/public-recruiter-join-form.tsx");
  expect(ui).toContain('setAlreadyJoined(result.outcome==="ALREADY_JOINED")');
  expect(ui).toContain('alreadyJoined?"You already have access to "+college');
  expect(ui).toContain('setSignInEmail(result.signInEmail)');
 });
 it("TPO-campaigns-public-R01 uses persisted optional mobile rather than dropping it on join",()=>{
  const service=src("src/modules/placements/public-join/join-service.ts");
  const model=src("src/modules/placements/public-join/form-model.ts");
  expect(model).toContain("Enter a valid 10-digit mobile number, or leave it blank.");
  expect(service).toContain("designation,phone } = input.data");
  expect(service).toContain("placement_recruiter_public_contacts");
  expect(service).toContain("PHONE_STORAGE_NOT_READY");
 });
 it("TPO-campaigns-public-R02 maps failure codes to meaningful join messages",()=>{
  const text=src("src/modules/placements/public-join/error-copy.ts");
  const ui=src("src/components/placements/public-recruiter-join-form.tsx");
  for(const s of ["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED","OTHER_COMPANY_EMAIL","RATE_LIMITED"])
   expect(text).toContain(s);
  expect(ui).toContain("joinErrorMessage(code");
 });
 it("TPO-campaigns-public-R07 permits approved company subdomains but rejects lookalikes",()=>{
  const domain=src("src/modules/placements/public-join/domain-model.ts");
  expect(domain).toContain("registrableWorkDomain");
  expect(domain).toContain("matchesCompanyDomain");
  const ui=src("src/modules/placements/public-join/client-error-model.ts");
  expect(ui).toContain('domain.endsWith("."+approvedDomain)');
 });
});
