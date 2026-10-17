import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {validatePublicJoinClient} from "@/modules/placements/public-join/client-error-model";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Public join recruiter company identity",()=>{
 it("TPO-campaigns-public-R04 allows requesting an email code without inventing a company name",()=>{
  const base={email:"hr@acme.co.in",name:"Asha",phone:"",
   companyName:"",companyDomain:"",scope:"COLLEGE" as const};
  expect(validatePublicJoinClient({...base,stage:"SEND"})).toBeNull();
  expect(validatePublicJoinClient({...base,stage:"JOIN"})).toBe("Enter your company name");
  expect(validatePublicJoinClient({...base,companyName:"Acme",stage:"JOIN"})).toBeNull();
 });
 it("TPO-campaigns-public-R04 discloses existing company only after successful code delivery",()=>{
  const service=src("src/modules/placements/public-join/send-code-service.ts");
  const ui=src("src/components/placements/public-recruiter-join-form.tsx");
  expect(service.indexOf("if (!sent) throw")).toBeLessThan(service.indexOf("const domain=registrableWorkDomain(email)"));
  expect(service).toContain("companyName:known?.name??null");
  expect(ui).toContain("setKnownCompany(responseData?.companyName??null)");
  expect(ui).toContain("You are joining as {knownCompany}.");
  expect(ui).toContain('scope === "COLLEGE"&&!knownCompany&&sentTo');
 });
 it("TPO-campaigns-public-R04 preserves college/company token scoping and active employer status",()=>{
  const service=src("src/modules/placements/public-join/send-code-service.ts");
  expect(service).toContain('eq(placementCompanies.status,"ACTIVE")');
  expect(service).toContain("companyJoinEmailCandidate(email");
 });
});
