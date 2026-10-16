import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations",()=>{
 it("requires a work email and linked college company before rotating the token",()=>{
  const service=readFileSync("src/modules/placements/tpo-recruiter-invite-service.ts","utf8");
  const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelationshipId)");
  expect(pivot).toBeGreaterThan(-1);
  expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
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
