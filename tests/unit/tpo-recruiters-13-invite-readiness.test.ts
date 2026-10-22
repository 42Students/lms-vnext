import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations",()=>{
 it("requires a linked company before token rotation and avoids claiming delivery without a verified work email",()=>{
  const service=readFileSync("src/modules/placements/tpo-recruiter-invite-service.ts","utf8");
  // Both persisted requirements must be enforced before a credential is rotated.
  const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelationshipId)");
  expect(pivot).toBeGreaterThan(-1);
  expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
  expect(service).toContain("TPO_RECRUITER_INVITE_NOT_ALLOWED");
  // The invite link can be shared manually; emailing is a separate action.
  // No verified address means no provider attempt and no claimed delivery.
  expect(service).toContain("if (!delivery?.sendEmail) return issued;");
  expect(service).toContain("if (!issued.emailAvailable) return { ...issued, emailed: false };");
  expect(service).toContain("emailed: accepted, deliveryAuditRecorded");
 });
 it("shows the requirement in both row and detail actions",()=>{
  for(const filename of ["recruiter-leads-workspace.tsx","recruiter-lead-detail-workspace.tsx"]){
   const ui=readFileSync("src/components/tpo/"+filename,"utf8");
   expect(ui).toContain("Add a work email and link a company before inviting.");
  }
 });
 it("cannot override the verified OTP with an unrelated raw details object",()=>{
  const service=readFileSync("src/modules/placements/public-recruiter-invite-accept-service.ts","utf8");
  expect(service).toContain("code:rawCode})");
 });
});
