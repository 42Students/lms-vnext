import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Recruiter REQUEST draft conversion",()=>{
 it("TPO-requests-verification-37 uses one safe draft creation transaction for TPO reviews and autoapproval",()=>{
  const code=src("src/modules/placements/recruiter-approved-draft-job-service.ts");
  const tpo=src("src/modules/placements/tpo-drive-request-decision-service.ts");
  const recruiter=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain("export async function createRecruiterApprovedDraftJob(");
  expect(tpo).toContain("createRecruiterApprovedDraftJob(tx,request,context.user.id)");
  expect(recruiter).toContain("createRecruiterApprovedDraftJob(tx,created,context.user.id)");
  expect(code).toContain("request.companyRelationshipId");
  expect(code).toContain("hrDriveDraftSchema.parse(request.draft)");
  expect(code).toContain('status:"DRAFT"');
  expect(code).toContain("placementJobRoleOptions");
  expect(code).toContain("placementJobRounds");
  expect(code).toContain("placementJobEligibilityPolicies");
 });
 it("TPO-requests-verification-37 cannot publish or choose a made-up preference/URL in the shared conversion",()=>{
  const code=src("src/modules/placements/recruiter-approved-draft-job-service.ts");
  expect(code).toContain('draft.workMode==="NO_PREFERENCE"');
  expect(code).toContain('draft.driveMode==="OFF_CAMPUS"&&!draft.externalApplicationUrl');
  expect(code).toContain('seasons.length!==1');
  expect(code).toContain("WORK_MODE_REVIEW_REQUIRED");
 });
});
