import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-15 learner company disclosures",()=>{
 it("LEARNER-placements-28 matches active selected-applicant employer shares, not the company directory",()=>{
  const service=source("src/modules/placements/learner-application-detail-service.ts");
  expect(service).toContain("placementCompanyApplicantShares");
  expect(service).toContain("placementCompanyShareSelections");
  expect(service).toContain("isNull(placementCompanyApplicantShares.revokedAt)");
  expect(service).toContain("gt(placementCompanyApplicantShares.expiresAt,new Date())");
  expect(service).toContain('application.applicationStatus==="SUBMITTED"');
  expect(service).toContain('screening?.status==="SHORTLISTED"');
  expect(service).toContain('limited.length===0||limited.includes(application.applicationId)');
  expect(service).toContain('fields:["Application ID","Learner","Email"] as const');
  expect(service).not.toContain("tokenHash:");
  const page=source("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx");
  expect(page).toContain('aria-label="What the company sees"');
  expect(page).toContain("not proof that a recruiter opened your record");
  expect(page).toContain("Short-lived or revoked employer links cannot reveal your application.");
 });
});
