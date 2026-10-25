import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {issueCompanyShareAccessCode,validCompanyShareAccessCode,
 companyShareIssueSchema,companyShareTokenSchema,hashCompanyShareAccessCode} from "@/modules/placements/company-share/token-model";
import {safeCompanyShareColumns,projectCompanyShareRows,
 companyShareSelectedCsv} from "@/modules/placements/company-share/column-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-13 final sprint public company share",()=>{
 it("PUB-auth-public-50 requires a six-character salted access code and a server-side signed proof",()=>{
  const code=issueCompanyShareAccessCode();
  expect(code.code).toMatch(/^[A-Z2-9]{6}$/);
  expect(code.salt).toMatch(/^[a-f0-9]{32}$/);
  expect(code.hash).toMatch(/^[a-f0-9]{64}$/);
  expect(validCompanyShareAccessCode(code.code,code.salt,code.hash)).toBe(true);
  expect(validCompanyShareAccessCode(code.code.toLowerCase(),code.salt,code.hash)).toBe(true);
  const legacyCode="123456";
  const legacyHash=hashCompanyShareAccessCode(legacyCode,code.salt);
  expect(validCompanyShareAccessCode(legacyCode,code.salt,legacyHash)).toBe(true);
  expect(validCompanyShareAccessCode("invalid!",code.salt,code.hash)).toBe(false);
  expect(validCompanyShareAccessCode("wrong",code.salt,code.hash)).toBe(false);
  expect(companyShareTokenSchema.safeParse("x".repeat(43)).success).toBe(true);
  const publicService=read("src/modules/placements/company-share/public-service.ts");
  expect(publicService.indexOf("validCompanyShareAccessProof("))
   .toBeLessThan(publicService.indexOf("const selectionReady="));
  const csv=read("src/app/api/placements/company-share/[token]/export/route.ts");
  expect(csv).toContain('get("company_share_access")');
  const page=read("src/app/company-share/[token]/page.tsx");
  expect(page).toContain("Enter the six-character code the placement cell sent you.");
 });
 it("PUB-auth-public-52 locks at 10 wrong codes in 60 minutes and notifies the issuing TPO",()=>{
  const service=read("src/modules/placements/company-share/access-service.ts");
  expect(service).toContain('for("update",{of:shares})');
  expect(service).toContain("Math.min(10,");
  expect(service).toContain("3600000");
  expect(service).toContain('eventKind:"LOCKED"');
  expect(service).toContain('title:"SHARE_LOCKED"');
  const audit=read("src/modules/placements/company-share/audit-history-model.ts");
  const filter=read("src/modules/placements/company-share/audit-kind-model.ts");
  expect(audit).toContain("Locked after wrong codes");
  expect(filter).toContain('"LOCKED"');
  expect(service).not.toContain('metadata:{code:');
  const page=read("src/app/company-share/[token]/page.tsx");
  expect(page).toContain("That code did not work, or this share is no longer available.");
 });
 it("PUB-auth-public-53 filters every selected column and never exports an unselected phone or URL",()=>{
  expect(safeCompanyShareColumns(["EMAIL","NAME"])).toEqual(["APPLICATION_ID","EMAIL","NAME"]);
  expect(safeCompanyShareColumns(["PHONE","PHONE"])).toEqual(["APPLICATION_ID","PHONE"]);
  expect(safeCompanyShareColumns(Array(12).fill("PHONE"))).toEqual(["APPLICATION_ID","PHONE"]);
  const applicant={applicationId:"app-1",displayName:"Learner",email:"mail@example.com",
   phone:"+919999999999",rollNumber:"R01",profileDocument:null,branch:"CSE",stage:"SHORTLISTED"};
  const [selected]=projectCompanyShareRows([applicant],["NAME","ROLL_NUMBER","STAGE"]);
  expect(selected.cells).toEqual({APPLICATION_ID:"app-1",NAME:"Learner",ROLL_NUMBER:"R01",STAGE:"Shortlisted"});
  const csv=companyShareSelectedCsv([selected],["NAME","ROLL_NUMBER","STAGE"],false);
  expect(csv).not.toContain("mail@example.com");
  expect(csv).not.toContain("+919999999999");
  const page=read("src/app/company-share/[token]/page.tsx");
  // The signed-off UX uses the shared DataTable; it maps the approved columns
  // once and passes that same map to the responsive mobile/desktop renderer.
  expect(page).toContain("columns.map((key,index)=>");
  expect(page).toContain('const value=key==="APPLICATION_ID"?row.applicationId:row.cells[key]');
  expect(page).toContain('if(url.protocol==="https:"&&!url.username&&!url.password)');
  expect(page).toContain("<DataTable columns={tableColumns} rows={result.rows}");
 });
 it("PUB-auth-public-57 stores and renders the TPO's deadline without mixing it with link expiry",()=>{
  const issue=read("src/modules/placements/company-share/manage-service.ts");
  expect(issue).toContain("shortlistBy:parsed.shortlistBy?");
  const page=read("src/app/company-share/[token]/page.tsx");
  expect(page).toContain("Please shortlist by ");
  expect(page).toContain("result.shortlistBy");
  expect(companyShareIssueSchema.safeParse({jobId:"550e8400-e29b-41d4-a716-446655440000",
   expiresInDays:90,selectedColumns:["NAME"],shortlistBy:null}).success).toBe(true);
 });
});
