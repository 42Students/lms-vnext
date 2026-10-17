import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Recruiter REQUEST draft conversion",()=>{
 it("TPO-requests-verification-37 uses one safe draft creation transaction for TPO reviews and autoapproval",()=>{
  const code=src("src/modules/placements/tpo-drive-request-decision-service.ts");
  expect(code).toContain("export async function createDraftFromRecruiterRequest(");
  expect(code).toContain("request.companyRelationshipId,request.draft,context.user.id");
  expect(code).toContain('status:"DRAFT"');
  expect(code).toContain("placementJobRoleOptions");
  expect(code).toContain("placementJobRounds");
  expect(code).toContain("placementJobEligibilityPolicies");
 });
 it("TPO-requests-verification-37 cannot publish or choose a made-up preference/URL in the shared conversion",()=>{
  const code=src("src/modules/placements/tpo-drive-request-decision-service.ts");
  expect(code).toContain('draft.workMode==="NO_PREFERENCE"');
  expect(code).toContain('draft.driveMode==="OFF_CAMPUS"&&!draft.externalApplicationUrl');
  expect(code).toContain('seasons.length!==1');
  expect(code).toContain("WORK_MODE_REVIEW_REQUIRED");
 });
});
