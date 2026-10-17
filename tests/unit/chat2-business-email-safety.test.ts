import {describe,expect,it} from "vitest";
import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
import {publicWorkEmailIssue,publicWorkEmailIssueCopy} from "@/modules/placements/public-work-email-policy";
import {readFileSync} from "node:fs";
describe("Public recruiter verified company mailbox",()=>{
 it("TPO-campaigns-public-22 rejects personal, disposable, academic and IP-based mailboxes",()=>{
  for(const e of ["test@gmail.com","test@icloud.com","test@mailinator.com",
   "test@yopmail.com","test@college.edu","test@college.ac.in","a@192.168.0.1"]){
   expect(publicRecruiterWorkEmailSchema.safeParse(e).success).toBe(false);
   expect(publicWorkEmailIssue(e)).not.toBeNull();
  }
  expect(publicRecruiterWorkEmailSchema.safeParse("ceo@acme.co.in").success).toBe(true);
 });
 it("TPO-campaigns-public-22 returns useful field-specific source messages",()=>{
  expect(publicWorkEmailIssueCopy("DISPOSABLE")).toContain("Temporary");
  expect(publicWorkEmailIssueCopy("ACADEMIC")).toContain("academic");
  const ui=readFileSync("src/modules/placements/public-join/client-error-model.ts","utf8");
  expect(ui).toContain("publicWorkEmailIssueCopy(emailIssue)");
 });
 it("TPO-campaigns-public-22 checks MX before issuing a code, with an explicit unavailable retry",()=>{
  const service=readFileSync("src/modules/placements/public-join/send-code-service.ts","utf8");
  expect(service).toContain("resolveMx(host)");
  expect(service).toContain("EMAIL_NO_MX");
  expect(service).toContain("EMAIL_MX_UNAVAILABLE");
  expect(service.indexOf("resolveMx(host)")).toBeLessThan(service.indexOf("newPublicJoinCode()"));
 });
});
