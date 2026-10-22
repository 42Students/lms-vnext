import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {matchesCompanyDomain} from "@/modules/placements/public-join/domain-model";
import {companyJoinEmailCandidate} from "@/modules/placements/public-join/company-preview-policy";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-27 preserves verified functionality and safe failure states",()=>{
 expect(matchesCompanyDomain("person@company.example","company.example")).toBe(true);
 expect(matchesCompanyDomain("person@recruiting.company.example","company.example")).toBe(true);
 expect(matchesCompanyDomain("person@fakecompany.example","company.example")).toBe(false);
 expect(matchesCompanyDomain("person@gmail.com","company.example")).toBe(false);
 expect(companyJoinEmailCandidate("person@company.example","company.example")).toBe(true);
 const send=read("src/modules/placements/public-join/send-code-service.ts");
 const join=read("src/modules/placements/public-join/join-service.ts");
 expect(send).toContain('scope==="COMPANY"&&(!availableLink.companyId||');
 expect(join).toContain('!companyJoinEmailCandidate(email,[link.companyDomain');
 expect(join).toContain('return "OTHER_COMPANY_EMAIL"');
 });
});
